import { DEBUG_CONFIG } from "../main.js";

export class BuildingManager {
  constructor(scene) {
    this.scene = scene;
  }

  createBuildingFromData(buildingData) {
    // Add building to the scene with physics body
    const building = this.scene.physics.add
      .staticImage(buildingData.x, buildingData.y, buildingData.texture)
      .setScale(buildingData.scale);

    // Set initial depth for the building (will be adjusted based on pass-through areas)
    building.setDepth(100);

    // Handle multiple physics bodies if specified
    if (
      buildingData.physics &&
      buildingData.physics.bodies &&
      Array.isArray(buildingData.physics.bodies)
    ) {
      // Find the first collision body to use as the main body
      const collisionBody = buildingData.physics.bodies.find(
        (body) => body.type === "collision"
      );
      if (collisionBody) {
        building.body.setSize(
          collisionBody.bodySize.width,
          collisionBody.bodySize.height
        );
        building.body.setOffset(
          collisionBody.bodyOffset.x,
          collisionBody.bodyOffset.y
        );
      }

      // Create additional physics bodies for all bodies
      building.additionalBodies = [];
      building.passThroughBodies = [];

      console.log(
        `Building ${buildingData.id} has ${buildingData.physics.bodies.length} bodies to process`
      );
      buildingData.physics.bodies.forEach((bodyData, index) => {
        if (bodyData.type === "collision" && bodyData === collisionBody) {
          // Skip the main collision body (already handled above)
          console.log(
            `Skipping main collision body ${index} for building ${buildingData.id}`
          );
          return;
        }

        console.log(
          `Creating additional body ${index} of type ${bodyData.type} for building ${buildingData.id}`
        );
        const additionalBody = this.createAdditionalPhysicsBody(
          building,
          bodyData,
          index
        );
        if (additionalBody) {
          if (bodyData.type === "pass-through") {
            building.passThroughBodies.push(additionalBody);
            console.log(
              `Added pass-through body to building ${buildingData.id}, total: ${building.passThroughBodies.length}`
            );
          } else {
            building.additionalBodies.push(additionalBody);
            console.log(
              `Added collision body to building ${buildingData.id}, total: ${building.additionalBodies.length}`
            );
          }
        }
      });
    } else if (buildingData.physics && buildingData.physics.bodySize) {
      // Single physics body (legacy support)
      building.body.setSize(
        buildingData.physics.bodySize.width,
        buildingData.physics.bodySize.height
      );
      building.body.setOffset(
        buildingData.physics.bodyOffset.x,
        buildingData.physics.bodyOffset.y
      );
    }

    // Add custom properties to track building state
    building.buildingId = buildingData.id;
    building.originalTexture = buildingData.texture;
    building.isDoorOpen = false;

    // Use door configuration from JSON if available
    if (buildingData.door) {
      building.doorEnabled = buildingData.door.enabled || false;
      building.doorOpenTexture = buildingData.door.openTexture;
      building.doorCloseDistance = buildingData.door.closeDistance || 120;

      // Create door trigger zone if configured (for door sprite switching)
      if (buildingData.door.triggerZone) {
        building.doorTriggerZone = this.createDoorTriggerZone(
          buildingData.x,
          buildingData.y,
          buildingData.door.triggerZone,
          building
        );
        console.log(
          `Created door trigger zone for building ${buildingData.id} at (${
            buildingData.x + buildingData.door.triggerZone.offsetX
          }, ${buildingData.y + buildingData.door.triggerZone.offsetY})`
        );
      }

      // Create door interaction zone if configured (for scene transitions)
      if (buildingData.door.interactionZone) {
        building.doorInteractionZone = this.createDoorInteractionZone(
          buildingData.x,
          buildingData.y,
          buildingData.door.interactionZone,
          buildingData.door.targetScene,
          buildingData.door.targetPosition
        );
        console.log(
          `Created door interaction zone for building ${buildingData.id} at (${
            buildingData.x + buildingData.door.interactionZone.offsetX
          }, ${buildingData.y + buildingData.door.interactionZone.offsetY})`
        );
      }
    }

    return building;
  }

  createAdditionalPhysicsBody(building, bodyData, index) {
    try {
      if (bodyData.type === "pass-through") {
        // For pass-through bodies, create a simple image (no physics) for z-index layering
        const passThroughBody = this.scene.add.image(
          building.x + (bodyData.bodyOffset?.x || 0),
          building.y + (bodyData.bodyOffset?.y || 0),
          "transparent"
        );

        // Set size
        passThroughBody.setDisplaySize(
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );

        // Store reference to parent building
        passThroughBody.parentBuilding = building;
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

        console.log(
          `Pass-through body ${index} for building ${building.buildingId}:`,
          {
            size: {
              width: passThroughBody.displayWidth,
              height: passThroughBody.displayHeight,
            },
            position: { x: passThroughBody.x, y: passThroughBody.y },
            depth: passThroughBody.depth,
          }
        );

        return passThroughBody;
      } else {
        // For collision bodies, create physics body as before
        const additionalBody = this.scene.physics.add.staticImage(
          building.x + (bodyData.bodyOffset?.x || 0),
          building.y + (bodyData.bodyOffset?.y || 0),
          "transparent"
        );

        // Set body size and offset
        additionalBody.body.setSize(
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );
        additionalBody.body.setOffset(0, 0);

        // Store reference to parent building
        additionalBody.parentBuilding = building;
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
          `Additional collision body ${index} for building ${building.buildingId}:`,
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
        `Failed to create additional physics body ${index} for building ${building.buildingId}:`,
        error
      );
      return null;
    }
  }

  createBuildingsFromLevelData(levelData) {
    const buildings = [];
    levelData.buildings.forEach((buildingData) => {
      const building = this.createBuildingFromData(buildingData);
      buildings.push(building);
    });
    return buildings;
  }

  clearBuildings(buildings) {
    if (buildings) {
      // Clear door interaction zones first
      this.clearDoorInteractionZones(buildings);

      buildings.forEach((building) => {
        if (building) {
          // Destroy additional collision bodies first
          if (building.additionalBodies) {
            building.additionalBodies.forEach((additionalBody) => {
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
          if (building.passThroughBodies) {
            building.passThroughBodies.forEach((passThroughBody) => {
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

          // Then destroy the building itself (main physics body is destroyed with the building)
          if (building.destroy) {
            building.destroy();
          }
        }
      });
    }
  }

  // Method to toggle door state for a building
  toggleDoorState(building) {
    if (building && building.buildingId) {
      building.isDoorOpen = !building.isDoorOpen;
      const newTexture = building.isDoorOpen
        ? building.doorOpenTexture
        : building.originalTexture;
      building.setTexture(newTexture);
      console.log(
        `Building ${building.buildingId} door is now ${
          building.isDoorOpen ? "open" : "closed"
        }`
      );
    }
  }

  // Method to check if a building can have its door toggled
  canToggleDoor(building) {
    return (
      building &&
      building.buildingId &&
      building.doorEnabled &&
      building.originalTexture === "building1"
    );
  }

  // Create door trigger zone for door sprite switching
  createDoorTriggerZone(buildingX, buildingY, triggerZoneData, building) {
    // Calculate the position of the trigger zone relative to the building
    const zoneX = buildingX + triggerZoneData.offsetX;
    const zoneY = buildingY + triggerZoneData.offsetY;

    // Create a simple image (not physics body) for the door trigger zone
    const doorTriggerZone = this.scene.add.image(zoneX, zoneY, null);

    // Set the size of the trigger zone
    doorTriggerZone.setDisplaySize(
      triggerZoneData.width,
      triggerZoneData.height
    );

    // Add properties for door triggering
    doorTriggerZone.isDoorTriggerZone = true;
    doorTriggerZone.building = building; // Reference to the building this zone controls
    doorTriggerZone.zoneWidth = triggerZoneData.width;
    doorTriggerZone.zoneHeight = triggerZoneData.height;

    // Make the zone invisible (no visual representation)
    doorTriggerZone.setVisible(false);

    return doorTriggerZone;
  }

  // Create door interaction zone for scene transitions
  createDoorInteractionZone(
    buildingX,
    buildingY,
    interactionZoneData,
    targetScene,
    targetPosition
  ) {
    // Calculate the position of the interaction zone relative to the building
    const zoneX = buildingX + interactionZoneData.offsetX;
    const zoneY = buildingY + interactionZoneData.offsetY;

    // Create an invisible physics body for the door interaction zone
    const doorZone = this.scene.physics.add.staticImage(zoneX, zoneY, null);

    // Set the size of the interaction zone
    doorZone.body.setSize(
      interactionZoneData.width,
      interactionZoneData.height
    );
    doorZone.body.setOffset(
      -interactionZoneData.width / 2,
      -interactionZoneData.height / 2
    );

    // Add properties for scene transition
    doorZone.targetScene = targetScene;
    doorZone.targetPosition = targetPosition;
    doorZone.isDoorZone = true;

    // Make the zone invisible for production
    doorZone.setVisible(false);

    return doorZone;
  }

  // Clear door interaction zones and trigger zones when clearing buildings
  clearDoorInteractionZones(buildings) {
    if (buildings) {
      buildings.forEach((building) => {
        if (
          building &&
          building.doorInteractionZone &&
          building.doorInteractionZone.destroy
        ) {
          building.doorInteractionZone.destroy();
        }
        if (
          building &&
          building.doorTriggerZone &&
          building.doorTriggerZone.destroy
        ) {
          building.doorTriggerZone.destroy();
        }
      });
    }
  }
}
