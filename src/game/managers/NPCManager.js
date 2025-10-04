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

      // Create and play animation if specified
      if (npcData.animation) {
        this.createNPCAnimation(npcData.animation);
        npc.play(npcData.animation.key);
      }

      console.log(`Created NPC: ${npcData.id} at (${npcData.x}, ${npcData.y})`);
      return npc;
    } catch (error) {
      console.error(`Failed to create NPC ${npcData.id}:`, error);
      return null;
    }
  }

  createNPCAnimation(animationConfig) {
    // Create animation if it doesn't already exist
    if (!this.scene.anims.exists(animationConfig.key)) {
      this.scene.anims.create({
        key: animationConfig.key,
        frames: animationConfig.frames,
        frameRate: animationConfig.frameRate || 3,
        repeat:
          animationConfig.repeat !== undefined ? animationConfig.repeat : -1,
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
