export class NPCManager {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];
  }

  createNPCsFromLevelData(levelData) {
    if (!levelData.npcs || !Array.isArray(levelData.npcs)) {
      console.log("No NPCs found in level data");
      return [];
    }

    const createdNPCs = [];

    levelData.npcs.forEach((npcData) => {
      const npc = this.createNPC(npcData);
      if (npc) {
        createdNPCs.push(npc);
        this.npcs.push(npc);
      }
    });

    console.log(`Created ${createdNPCs.length} NPCs`);
    return createdNPCs;
  }

  createNPC(npcData) {
    try {
      // Create the NPC sprite
      const npc = this.scene.add.sprite(npcData.x, npcData.y, npcData.texture);

      // Set the NPC ID for reference
      npc.npcId = npcData.id;

      // Apply scaling if specified
      if (npcData.scale !== undefined) {
        npc.setScale(npcData.scale);
      }

      // Set initial depth
      npc.setDepth(50);

      // Create standing animation if it's Vincent
      if (npcData.id === "vincent") {
        this.createVincentAnimations();
        npc.play("vincent-standing");
      }

      console.log(`Created NPC: ${npcData.id} at (${npcData.x}, ${npcData.y})`);
      return npc;
    } catch (error) {
      console.error(`Failed to create NPC ${npcData.id}:`, error);
      return null;
    }
  }

  createVincentAnimations() {
    // Create Vincent's standing animation using top 3 frames in a natural sequence
    if (!this.scene.anims.exists("vincent-standing")) {
      this.scene.anims.create({
        key: "vincent-standing",
        frames: [
          { key: "vincent-standing", frame: 0 }, // Top-left (hands clasped)
          { key: "vincent-standing", frame: 1 }, // Top-middle (hands slightly less clasped)
          { key: "vincent-standing", frame: 0 }, // Back to top-left
          { key: "vincent-standing", frame: 1 }, // Top-right (right hand raised)
          { key: "vincent-standing", frame: 0 }, // Back to top-left
        ],
        frameRate: 2, // Slow, gentle animation
        repeat: -1, // Loop forever
      });
    }
  }

  clearNPCs() {
    // Destroy all NPCs
    this.npcs.forEach((npc) => {
      if (npc && npc.destroy) {
        npc.destroy();
      }
    });
    this.npcs = [];
  }

  getNPCs() {
    return this.npcs;
  }
}
