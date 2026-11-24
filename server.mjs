import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const configuredPort = process.env.RIFT_PORT;
let port = Number(configuredPort ?? 4173);
const root = new URL('./', import.meta.url);
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
]);
const modulePath = /^\/src\/(?:[a-z][a-z0-9-]*\/)*[a-z][a-z0-9-]*\.js$/;

const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const asset = assets.get(path) ?? (modulePath.test(path) ? [path.slice(1), 'text/javascript'] : null);
  if (!asset || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const [fileName, type] = asset;
    const file = await readFile(fileURLToPath(new URL(fileName, root)));
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : file);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      response.writeHead(404).end();
      return;
    }
    console.error(error.message);
    response.writeHead(500).end();
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && configuredPort === undefined && port !== 0) {
    console.log(`Port ${port} is busy. Trying an available port.`);
    port = 0;
    server.listen(port, host);
    return;
  }
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Set RIFT_PORT to use another port.` : error.message);
  process.exitCode = 1;
});
server.once('listening', () => {
  const address = `http://${host}:${server.address().port}`;
  console.log(`Rift Ruckus is ready at ${address}. Press Ctrl+C here to stop it.`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const browser = spawn('explorer.exe', [address], { detached: true, stdio: 'ignore' });
    browser.on('error', () => console.log(`Open ${address} in your browser.`));
    browser.unref();
  }
});
server.listen(port, host);
