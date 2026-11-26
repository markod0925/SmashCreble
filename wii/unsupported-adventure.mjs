function unsupportedAdventure() {
  throw new Error('Adventure modes are unavailable on Wii.');
}

export {
  unsupportedAdventure as advanceAdventure,
  unsupportedAdventure as advanceCampaign,
  unsupportedAdventure as adventureCamera,
  unsupportedAdventure as constrainToEncounter,
  unsupportedAdventure as drawAdventureTerrain,
  unsupportedAdventure as drawCampaign,
  unsupportedAdventure as encounterGate,
  unsupportedAdventure as hitSpikes,
};
