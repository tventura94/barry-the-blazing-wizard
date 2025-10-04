import { DEBUG_CONFIG } from "../main.js";

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
      // Create the NPC sprite with physics body
      const npc = this.scene.physics.add.sprite(
        npcData.x,
        npcData.y,
        npcData.texture
      );

      // Set the NPC ID for reference
      npc.npcId = npcData.id;

      // Apply scaling if specified
      if (npcData.scale !== undefined) {
        npc.setScale(npcData.scale);
      }

      // Set initial depth
      npc.setDepth(50);

      // Handle physics bodies if specified
      if (
        npcData.physics &&
        npcData.physics.bodies &&
        Array.isArray(npcData.physics.bodies)
      ) {
        // Find the first collision body to use as the main body
        const collisionBody = npcData.physics.bodies.find(
          (body) => body.type === "collision"
        );
        if (collisionBody) {
          npc.body.setSize(
            collisionBody.bodySize.width,
            collisionBody.bodySize.height
          );
          npc.body.setOffset(
            collisionBody.bodyOffset.x,
            collisionBody.bodyOffset.y
          );
        }

        // Create additional physics bodies for all bodies
        npc.additionalBodies = [];
        npc.passThroughBodies = [];

        npcData.physics.bodies.forEach((bodyData, index) => {
          if (bodyData.type === "collision" && bodyData === collisionBody) {
            // Skip the main collision body (already handled above)
            return;
          }

          const additionalBody = this.createAdditionalPhysicsBody(
            npc,
            bodyData,
            index
          );
          if (additionalBody) {
            if (bodyData.type === "pass-through") {
              npc.passThroughBodies.push(additionalBody);
            } else {
              npc.additionalBodies.push(additionalBody);
            }
          }
        });
      } else if (npcData.physics && npcData.physics.bodySize) {
        // Single physics body (legacy support)
        npc.body.setSize(
          npcData.physics.bodySize.width,
          npcData.physics.bodySize.height
        );
        npc.body.setOffset(
          npcData.physics.bodyOffset.x,
          npcData.physics.bodyOffset.y
        );
      } else {
        // Default collision body if no physics specified
        npc.body.setSize(32, 32);
        npc.body.setOffset(0, 0);
      }

      // Make NPC immovable (static)
      npc.body.setImmovable(true);

      // Create and play animation if specified
      if (npcData.animation) {
        this.createNPCAnimation(npcData.animation);
        npc.play(npcData.animation.key);
      }

      // Debug logging
      console.log(`NPC ${npcData.id} physics body:`, {
        immovable: npc.body.immovable,
        size: { width: npc.body.width, height: npc.body.height },
        offset: { x: npc.body.offset.x, y: npc.body.offset.y },
        position: { x: npc.x, y: npc.y },
      });

      if (npc.additionalBodies) {
        console.log(`  Additional bodies: ${npc.additionalBodies.length}`);
      }

      console.log(`Created NPC: ${npcData.id} at (${npcData.x}, ${npcData.y})`);
      return npc;
    } catch (error) {
      console.error(`Failed to create NPC ${npcData.id}:`, error);
      return null;
    }
  }

  createAdditionalPhysicsBody(npc, bodyData, index) {
    try {
      if (bodyData.type === "pass-through") {
        // For pass-through bodies, create a simple image (no physics) for z-index layering
        const passThroughBody = this.scene.add.image(
          npc.x + (bodyData.bodyOffset?.x || 0),
          npc.y + (bodyData.bodyOffset?.y || 0),
          "transparent"
        );

        // Set size
        passThroughBody.setDisplaySize(
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );

        // Store reference to parent NPC
        passThroughBody.parentNPC = npc;
        passThroughBody.bodyIndex = index;
        passThroughBody.bodyType = "pass-through";

        // Make it invisible
        passThroughBody.setVisible(false);

        // Set depth to be above player (higher z-index) when player is not in pass-through area
        passThroughBody.setDepth(200);

        // Debug visualization for pass-through bodies only if debug is enabled
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.showPassThroughBodies) {
          const debugGraphics = this.scene.add.graphics();
          debugGraphics.lineStyle(2, 0x00ff00, 1); // Green for pass-through bodies
          debugGraphics.strokeRect(
            passThroughBody.x - bodyData.bodySize.width / 2,
            passThroughBody.y - bodyData.bodySize.height / 2,
            bodyData.bodySize.width,
            bodyData.bodySize.height
          );
          passThroughBody.debugGraphics = debugGraphics;
        }

        console.log(`Pass-through body ${index} for NPC ${npc.npcId}:`, {
          size: {
            width: passThroughBody.displayWidth,
            height: passThroughBody.displayHeight,
          },
          position: { x: passThroughBody.x, y: passThroughBody.y },
          depth: passThroughBody.depth,
        });

        return passThroughBody;
      } else {
        // For collision bodies, create physics body as before
        const additionalBody = this.scene.physics.add.staticImage(
          npc.x + (bodyData.bodyOffset?.x || 0),
          npc.y + (bodyData.bodyOffset?.y || 0),
          "transparent"
        );

        // Set body size and offset
        additionalBody.body.setSize(
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );
        additionalBody.body.setOffset(0, 0);

        // Store reference to parent NPC
        additionalBody.parentNPC = npc;
        additionalBody.bodyIndex = index;
        additionalBody.bodyType = "collision";

        // Make the physics body invisible
        additionalBody.setVisible(false);

        // Add debug visualization for additional collision bodies only if debug is enabled
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.showCollisionBodies) {
          const debugGraphics = this.scene.add.graphics();
          debugGraphics.lineStyle(2, 0xff0000, 1); // Red for additional collision bodies
          debugGraphics.strokeRect(
            additionalBody.x - bodyData.bodySize.width / 2,
            additionalBody.y - bodyData.bodySize.height / 2,
            bodyData.bodySize.width,
            bodyData.bodySize.height
          );
          additionalBody.debugGraphics = debugGraphics;
        }

        console.log(
          `Additional collision body ${index} for NPC ${npc.npcId}:`,
          {
            immovable: additionalBody.body.immovable,
            size: {
              width: additionalBody.body.width,
              height: additionalBody.body.height,
            },
            offset: {
              x: additionalBody.body.offset.x,
              y: additionalBody.body.offset.y,
            },
            position: { x: additionalBody.x, y: additionalBody.y },
          }
        );

        return additionalBody;
      }
    } catch (error) {
      console.error(
        `Failed to create additional physics body ${index} for NPC ${npc.npcId}:`,
        error
      );
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
    // Destroy all NPCs and their additional physics bodies
    this.npcs.forEach((npc) => {
      if (npc) {
        // Destroy additional collision bodies first
        if (npc.additionalBodies) {
          npc.additionalBodies.forEach((additionalBody) => {
            if (additionalBody) {
              // Destroy debug graphics if they exist
              if (
                additionalBody.debugGraphics &&
                additionalBody.debugGraphics.destroy
              ) {
                additionalBody.debugGraphics.destroy();
              }
              // Destroy the additional body
              if (additionalBody.destroy) {
                additionalBody.destroy();
              }
            }
          });
        }

        // Destroy pass-through bodies
        if (npc.passThroughBodies) {
          npc.passThroughBodies.forEach((passThroughBody) => {
            if (passThroughBody) {
              // Destroy debug graphics if they exist
              if (
                passThroughBody.debugGraphics &&
                passThroughBody.debugGraphics.destroy
              ) {
                passThroughBody.debugGraphics.destroy();
              }
              // Destroy the pass-through body
              if (passThroughBody.destroy) {
                passThroughBody.destroy();
              }
            }
          });
        }

        // Then destroy the NPC itself (main physics body is destroyed with the NPC)
        if (npc.destroy) {
          npc.destroy();
        }
      }
    });
    this.npcs = [];
  }

  getNPCs() {
    return this.npcs;
  }
}
