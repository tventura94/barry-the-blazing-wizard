import { DEBUG_CONFIG } from "../main.js";

export class CombatManager {
  constructor(scene) {
    this.scene = scene;
    this.combatNPCs = [];
    this.lineOfSightDistance = 150;
    this.encounterDistance = 80;
    this.isInCombat = false;
    this.currentCombatNPC = null;
  }

  // Create combat NPCs from level data
  createCombatNPCsFromLevelData(levelData) {
    if (!levelData.combatNPCs || !Array.isArray(levelData.combatNPCs)) {
      console.log("No combat NPCs found in level data");
      return [];
    }

    const createdNPCs = [];

    levelData.combatNPCs.forEach((npcData) => {
      const npc = this.createCombatNPC(npcData);
      if (npc) {
        createdNPCs.push(npc);
        this.combatNPCs.push(npc);
      }
    });

    console.log(`Created ${createdNPCs.length} combat NPCs`);
    return createdNPCs;
  }

  createCombatNPC(npcData) {
    try {
      // Create the NPC sprite with physics body
      const npc = this.scene.physics.add.sprite(
        npcData.x,
        npcData.y,
        npcData.texture
      );

      // Set the NPC ID and combat properties
      npc.npcId = npcData.id;
      npc.isCombatNPC = true;
      npc.hasEncountered = false;
      npc.combatData = npcData.combatData || {};
      npc.patrolData = npcData.patrolData || null;
      npc.lineOfSightAngle = npcData.lineOfSightAngle || 90; // degrees
      npc.lineOfSightDistance = npcData.lineOfSightDistance || 120;
      npc.facingDirection = npcData.facingDirection || "down";

      // Set collision behavior
      npc.hasCollision =
        npcData.hasCollision !== undefined ? npcData.hasCollision : false;

      // Apply scaling if specified
      if (npcData.scale !== undefined) {
        npc.setScale(npcData.scale);
      }

      // Set depth
      const depth = npcData.depth !== undefined ? npcData.depth : 50;
      npc.setDepth(depth);

      // Set up physics body
      if (npcData.physics && npcData.physics.bodySize) {
        npc.body.setSize(
          npcData.physics.bodySize.width,
          npcData.physics.bodySize.height
        );
        npc.body.setOffset(
          npcData.physics.bodyOffset.x,
          npcData.physics.bodyOffset.y
        );
      } else {
        npc.body.setSize(32, 32);
        npc.body.setOffset(0, 0);
      }

      // Make NPC immovable
      npc.body.setImmovable(true);

      // Set up patrol behavior if specified
      if (npc.patrolData) {
        this.setupPatrolBehavior(npc);
      }

      // Create line of sight visualization (debug)
      if (DEBUG_CONFIG.enabled) {
        this.createLineOfSightVisualization(npc);
      }

      console.log(
        `Created combat NPC: ${npcData.id} at (${npcData.x}, ${npcData.y})`
      );
      return npc;
    } catch (error) {
      console.error(`Failed to create combat NPC ${npcData.id}:`, error);
      return null;
    }
  }

  setupPatrolBehavior(npc) {
    if (!npc.patrolData || !npc.patrolData.waypoints) return;

    npc.patrolWaypoints = npc.patrolData.waypoints;
    npc.currentWaypointIndex = 0;
    npc.patrolSpeed = npc.patrolData.speed || 50;
    npc.patrolWaitTime = npc.patrolData.waitTime || 2000;
    npc.isWaiting = false;
    npc.waitTimer = null;

    // Start patrol
    this.startPatrol(npc);
  }

  startPatrol(npc) {
    if (!npc.patrolWaypoints || npc.patrolWaypoints.length === 0) return;

    const targetWaypoint = npc.patrolWaypoints[npc.currentWaypointIndex];
    const distance = Phaser.Math.Distance.Between(
      npc.x,
      npc.y,
      targetWaypoint.x,
      targetWaypoint.y
    );

    if (distance < 10) {
      // Reached waypoint, wait then move to next
      npc.isWaiting = true;
      npc.waitTimer = this.scene.time.delayedCall(npc.patrolWaitTime, () => {
        npc.currentWaypointIndex =
          (npc.currentWaypointIndex + 1) % npc.patrolWaypoints.length;
        npc.isWaiting = false;
        this.startPatrol(npc);
      });
    } else {
      // Move towards waypoint
      const angle = Phaser.Math.Angle.Between(
        npc.x,
        npc.y,
        targetWaypoint.x,
        targetWaypoint.y
      );
      npc.body.setVelocity(
        Math.cos(angle) * npc.patrolSpeed,
        Math.sin(angle) * npc.patrolSpeed
      );
    }
  }

  createLineOfSightVisualization(npc) {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(100);

    // Store reference for updating
    npc.lineOfSightGraphics = graphics;
    this.updateLineOfSightVisualization(npc);
  }

  updateLineOfSightVisualization(npc) {
    if (!npc.lineOfSightGraphics) return;

    npc.lineOfSightGraphics.clear();

    // Draw line of sight cone
    const startAngle =
      this.getFacingAngle(npc.facingDirection) - npc.lineOfSightAngle / 2;
    const endAngle =
      this.getFacingAngle(npc.facingDirection) + npc.lineOfSightAngle / 2;

    npc.lineOfSightGraphics.lineStyle(2, 0xff0000, 0.3);
    npc.lineOfSightGraphics.beginPath();
    npc.lineOfSightGraphics.moveTo(npc.x, npc.y);
    npc.lineOfSightGraphics.arc(
      npc.x,
      npc.y,
      npc.lineOfSightDistance,
      Phaser.Math.DegToRad(startAngle),
      Phaser.Math.DegToRad(endAngle)
    );
    npc.lineOfSightGraphics.closePath();
    npc.lineOfSightGraphics.strokePath();
  }

  getFacingAngle(direction) {
    switch (direction) {
      case "up":
        return -90;
      case "down":
        return 90;
      case "left":
        return 180;
      case "right":
        return 0;
      default:
        return 90;
    }
  }

  // Check for line of sight encounters
  checkLineOfSightEncounters() {
    if (this.isInCombat || !this.scene.player || !this.scene.player.sprite)
      return;

    const player = this.scene.player.sprite;

    for (const npc of this.combatNPCs) {
      if (npc.hasEncountered) continue;

      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        npc.x,
        npc.y
      );

      // Check if player is within line of sight distance
      if (distance <= npc.lineOfSightDistance) {
        // Check if player is within the line of sight cone
        if (this.isPlayerInLineOfSight(npc, player)) {
          this.triggerEncounter(npc);
          break; // Only trigger one encounter at a time
        }
      }
    }
  }

  isPlayerInLineOfSight(npc, player) {
    const angleToPlayer = Phaser.Math.Angle.Between(
      npc.x,
      npc.y,
      player.x,
      player.y
    );
    const npcFacingAngle = this.getFacingAngle(npc.facingDirection);
    const halfConeAngle = npc.lineOfSightAngle / 2;

    const angleDiff = Math.abs(
      Phaser.Math.Angle.ShortestBetween(
        Phaser.Math.RadToDeg(angleToPlayer),
        npcFacingAngle
      )
    );

    return angleDiff <= halfConeAngle;
  }

  triggerEncounter(npc) {
    console.log(`Encounter triggered with ${npc.npcId}!`);
    npc.hasEncountered = true;
    this.currentCombatNPC = npc;

    // Stop NPC movement
    npc.body.setVelocity(0, 0);
    if (npc.waitTimer) {
      npc.waitTimer.destroy();
    }

    // Start dialog that leads to combat
    this.startCombatDialog(npc);
  }

  startCombatDialog(npc) {
    // Create a simple combat dialog
    const combatDialog = {
      id: `combat-${npc.npcId}`,
      text: `${
        npc.combatData.name || npc.npcId
      } spots you! "Prepare for battle!"`,
      choices: [
        {
          text: "Fight!",
          actions: [
            {
              type: "startCombat",
              npcId: npc.npcId,
              combatData: npc.combatData,
            },
          ],
        },
        {
          text: "Run away",
          actions: [
            {
              type: "fleeCombat",
            },
          ],
        },
      ],
    };

    // Use the existing dialog system
    if (this.scene.sceneManager && this.scene.sceneManager.dialogManager) {
      this.scene.sceneManager.dialogManager.currentDialog = combatDialog;
      this.scene.sceneManager.dialogManager.showDialog();
    }
  }

  startCombat(combatData) {
    console.log("Starting combat with data:", combatData);
    this.isInCombat = true;

    // Transition to combat scene
    this.scene.scene.start("GuitarHeroCombat", {
      combatData: combatData,
      playerData: this.scene.player,
      returnScene: this.scene.scene.key,
    });
  }

  fleeCombat() {
    console.log("Player fled from combat");
    this.isInCombat = false;
    this.currentCombatNPC = null;

    // Reset the NPC's encountered status after a delay
    this.scene.time.delayedCall(5000, () => {
      if (this.currentCombatNPC) {
        this.currentCombatNPC.hasEncountered = false;
        this.currentCombatNPC = null;
      }
    });
  }

  // Update method to be called from scene update
  update() {
    if (!this.isInCombat) {
      this.checkLineOfSightEncounters();

      // Update patrol behavior for all NPCs
      this.combatNPCs.forEach((npc) => {
        if (npc.patrolData && !npc.isWaiting && !npc.hasEncountered) {
          this.startPatrol(npc);
        }
      });

      // Update line of sight visualization
      if (DEBUG_CONFIG.enabled) {
        this.combatNPCs.forEach((npc) => {
          this.updateLineOfSightVisualization(npc);
        });
      }
    }
  }

  // Clean up
  clearCombatNPCs() {
    this.combatNPCs.forEach((npc) => {
      if (npc) {
        if (npc.waitTimer) {
          npc.waitTimer.destroy();
        }
        if (npc.lineOfSightGraphics) {
          npc.lineOfSightGraphics.destroy();
        }
        if (npc.destroy) {
          npc.destroy();
        }
      }
    });
    this.combatNPCs = [];
  }

  getCombatNPCs() {
    return this.combatNPCs;
  }
}
