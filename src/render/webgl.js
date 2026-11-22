import { shapes } from './geometry.js';
import { multiply, transform, viewProjection, zero } from './math.js';

const shaderSource = {
  vertex: `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uView;
    uniform mat4 uModel;
    uniform vec4 uColor;
    uniform float uGlow;
    uniform float uZombie;
    varying vec4 vColor;
    void main() {
      mat3 basis = mat3(uModel);
      vec3 inverseScale = vec3(dot(basis[0], basis[0]), dot(basis[1], basis[1]), dot(basis[2], basis[2]));
      vec3 normal = normalize(basis * (aNormal / inverseScale));
      float sun = max(0.0, dot(normal, normalize(vec3(-0.42, 0.79, 0.47))));
      float rim = max(0.0, dot(normal, normalize(vec3(0.83, 0.31, -0.56))));
      vec3 lit = uColor.rgb * (0.50 + sun * 0.53 + rim * 0.19);
      lit += vec3(0.12, 0.062, 0.047) * rim;
      vec3 shaded = mix(lit, uColor.rgb, uGlow);
      float brightness = dot(shaded, vec3(0.299, 0.587, 0.114));
      vec3 undead = vec3(0.10, 0.21, 0.072) + brightness * vec3(0.69, 1.06, 0.46);
      vColor = vec4(mix(shaded, undead, uZombie), uColor.a);
      gl_Position = uView * uModel * vec4(aPosition, 1.0);
    }`,
  fragment: `
    precision mediump float;
    varying vec4 vColor;
    void main() { gl_FragColor = vColor; }`,
};

const colorCache = new Map();
function rgb(hex) {
  if (!colorCache.has(hex)) {
    const value = Number.parseInt(hex.slice(1), 16);
    colorCache.set(hex, [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]);
  }
  return colorCache.get(hex);
}

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!this.gl) throw new Error('WebGL could not start. Enable graphics acceleration and reopen the game.');
    const gl = this.gl;
    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, shaderSource.vertex], [gl.FRAGMENT_SHADER, shaderSource.fragment]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    this.position = gl.getAttribLocation(program, 'aPosition');
    this.normal = gl.getAttribLocation(program, 'aNormal');
    this.uniforms = Object.fromEntries(['uView', 'uModel', 'uColor', 'uGlow', 'uZombie'].map((name) => [name, gl.getUniformLocation(program, name)]));
    this.buffers = new Map();
    for (const [name, vertices] of Object.entries(shapes)) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      this.buffers.set(name, { buffer, count: vertices.length / 6 });
    }
    gl.enableVertexAttribArray(this.position);
    gl.enableVertexAttribArray(this.normal);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
  }

  begin(width, height, eye, target, fov = .67) {
    const gl = this.gl;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.boundShape = null;
    this.view = viewProjection(eye, target, width / height, fov);
    gl.uniformMatrix4fv(this.uniforms.uView, false, this.view);
  }

  mesh(shape, matrix, hex, glow = 0, alpha = 1) {
    const gl = this.gl;
    const { buffer, count } = this.buffers.get(shape);
    if (this.boundShape !== shape) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(this.position, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 24, 12);
      this.boundShape = shape;
    }
    gl.uniformMatrix4fv(this.uniforms.uModel, false, matrix);
    gl.uniform4f(this.uniforms.uColor, ...rgb(hex), alpha);
    gl.uniform1f(this.uniforms.uGlow, glow);
    if (alpha < 1) gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, count);
    if (alpha < 1) gl.depthMask(true);
  }

  object(shape, position, size, hex, rotation = zero, glow = 0, alpha = 1) {
    this.mesh(shape, transform(position, size, rotation), hex, glow, alpha);
  }

  parts(parts, root, flash) {
    for (const { shape, matrix, color, glow } of parts) {
      this.mesh(shape, multiply(root, matrix), flash ? '#ffffff' : color, flash ? .8 : glow);
    }
  }

  setZombie(strength) {
    this.gl.uniform1f(this.uniforms.uZombie, strength);
  }

  measure(pixelCap = 1.35) {
    const dpr = Math.min(devicePixelRatio || 1, pixelCap);
    return [Math.max(1, Math.round(this.canvas.clientWidth * dpr)), Math.max(1, Math.round(this.canvas.clientHeight * dpr))];
  }

  project(x, y, z) {
    const m = this.view;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    const horizontal = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w + 1) / 2;
    const vertical = (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w) / 2;
    return [horizontal * 100, vertical * 100];
  }
}
