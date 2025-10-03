import { BuildingManager } from "./BuildingManager.js";
import { PropManager } from "./PropManager.js";
import { PlayerInitializer } from "../player_barry/playerInitializer.js";

export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.buildingManager = new BuildingManager(scene);
    this.propManager = new PropManager(scene);
    this.playerInBuilding = null; // Track which building the player is currently near
  }

  async loadLevelData() {
    // Load the JSON file from public directory
    const response = await fetch("/assets/scene_json/area-1/area-1.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const levelData = await response.json();

    // Create level from JSON data
    this.createLevelFromData(levelData);

    // Debug logging
    console.log("Level loaded:", levelData.name);
    console.log("Buildings created:", this.scene.buildings.length);
  }

  createLevelFromData(levelData) {
    // Clear existing objects first
    this.clearExistingObjects();

    // Create background
    this.scene.add
      .image(
        levelData.background.x,
        levelData.background.y,
        levelData.background.image
      )
      .setAlpha(levelData.background.alpha);

    // Create buildings from data using BuildingManager
    this.scene.buildings =
      this.buildingManager.createBuildingsFromLevelData(levelData);

    // Create props from data using PropManager
    this.scene.props = this.propManager.createPropsFromLevelData(levelData);

    // Initialize player
    this.scene.playerInitializer = new PlayerInitializer(this.scene);
    this.scene.player = this.scene.playerInitializer.initializePlayer(
      levelData.player.x,
      levelData.player.y
    );
    this.scene.playerInitializer.createPlayerUI();

    // Set up collisions with custom callback
    this.scene.buildings.forEach((building) => {
      console.log(
        `Setting up collision between player and building ${building.buildingId}`
      );

      // Main building physics body
      this.scene.physics.add.collider(
        this.scene.player.sprite,
        building,
        this.handlePlayerBuildingCollision.bind(this),
        null,
        this.scene
      );

      // Additional collision bodies for multiple collision areas
      if (building.additionalBodies && building.additionalBodies.length > 0) {
        building.additionalBodies.forEach((additionalBody, index) => {
          console.log(`  Setting up collision with additional body ${index}`);
          this.scene.physics.add.collider(
            this.scene.player.sprite,
            additionalBody,
            this.handlePlayerBuildingCollision.bind(this),
            null,
            this.scene
          );
        });
      }

      // Pass-through bodies don't need collision detection, they handle z-index layering
      if (building.passThroughBodies && building.passThroughBodies.length > 0) {
        console.log(
          `  Pass-through bodies: ${building.passThroughBodies.length} (no collision detection)`
        );
      }

      // Set up door interaction zone collisions (for scene transitions)
      if (building.doorInteractionZone) {
        this.scene.physics.add.collider(
          this.scene.player.sprite,
          building.doorInteractionZone,
          this.handleDoorInteraction.bind(this),
          null,
          this.scene
        );
      }
    });

    // Set up collisions between player and props
    this.scene.props.forEach((prop) => {
      console.log(
        `Setting up collision between player and prop ${prop.propId}`
      );

      // Main prop physics body (same as buildings)
      this.scene.physics.add.collider(
        this.scene.player.sprite,
        prop,
        this.handlePlayerPropCollision.bind(this),
        null,
        this.scene
      );

      // Additional collision bodies for multiple collision areas
      if (prop.additionalBodies && prop.additionalBodies.length > 0) {
        prop.additionalBodies.forEach((additionalBody, index) => {
          console.log(`  Setting up collision with additional body ${index}`);
          this.scene.physics.add.collider(
            this.scene.player.sprite,
            additionalBody,
            this.handlePlayerPropCollision.bind(this),
            null,
            this.scene
          );
        });
      }

      // Pass-through bodies don't need collision detection, they handle z-index layering
      if (prop.passThroughBodies && prop.passThroughBodies.length > 0) {
        console.log(
          `  Pass-through bodies: ${prop.passThroughBodies.length} (no collision detection)`
        );
      }
    });

    // Debug: Log player physics body info
    console.log("Player physics body:", {
      immovable: this.scene.player.sprite.body.immovable,
      size: {
        width: this.scene.player.sprite.body.width,
        height: this.scene.player.sprite.body.height,
      },
      position: {
        x: this.scene.player.sprite.x,
        y: this.scene.player.sprite.y,
      },
    });

    // Create UI text
    this.scene.add
      .text(
        levelData.ui.x,
        levelData.ui.y,
        levelData.ui.text,
        levelData.ui.style
      )
      .setOrigin(0.5);
  }

  clearExistingObjects() {
    // Clear existing buildings and player if they exist
    this.buildingManager.clearBuildings(this.scene.buildings);
    this.propManager.clearProps();
    if (
      this.scene.player &&
      this.scene.player.sprite &&
      this.scene.player.sprite.destroy
    ) {
      this.scene.player.sprite.destroy();
    }
    if (this.scene.playerInitializer) {
      this.scene.playerInitializer = null;
    }
  }

  // Handle collision between player and building
  handlePlayerBuildingCollision(player, building) {
    // This method is now mainly for collision detection
    // Door opening/closing is handled by the trigger zones
    console.log(`Player collided with building ${building.buildingId}`);
  }

  // Handle collision between player and prop
  handlePlayerPropCollision(player, prop) {
    // This method handles collision detection with props
    // The physics engine will prevent the player from walking through the prop
    console.log(`Player collided with prop ${prop.propId}`);
  }

  // Check pass-through areas for z-index layering
  checkPassThroughAreas() {
    if (!this.scene.player || !this.scene.player.sprite) {
      return;
    }

    const playerX = this.scene.player.sprite.x;
    const playerY = this.scene.player.sprite.y;
    let isInPassThroughArea = false;

    // Check all props for pass-through areas
    if (this.scene.props) {
      this.scene.props.forEach((prop) => {
        if (prop.passThroughBodies && prop.passThroughBodies.length > 0) {
          prop.passThroughBodies.forEach((passThroughBody) => {
            const bodyX = passThroughBody.x;
            const bodyY = passThroughBody.y;
            const bodyWidth = passThroughBody.displayWidth;
            const bodyHeight = passThroughBody.displayHeight;

            // Check if player is within the pass-through area bounds
            const leftBound = bodyX - bodyWidth / 2;
            const rightBound = bodyX + bodyWidth / 2;
            const topBound = bodyY - bodyHeight / 2;
            const bottomBound = bodyY + bodyHeight / 2;

            // Debug logging
            if (Math.random() < 0.01) {
              // Only log occasionally to avoid spam
              console.log(`Pass-through area ${prop.propId}:`, {
                bodyPos: { x: bodyX, y: bodyY },
                bodySize: { width: bodyWidth, height: bodyHeight },
                bounds: {
                  left: leftBound,
                  right: rightBound,
                  top: topBound,
                  bottom: bottomBound,
                },
                playerPos: { x: playerX, y: playerY },
              });
            }

            if (
              playerX >= leftBound &&
              playerX <= rightBound &&
              playerY >= topBound &&
              playerY <= bottomBound
            ) {
              isInPassThroughArea = true;
              console.log(
                `Player is in pass-through area of prop ${prop.propId}`
              );
            }
          });
        }
      });
    }

    // Check all buildings for pass-through areas
    if (this.scene.buildings) {
      this.scene.buildings.forEach((building) => {
        if (
          building.passThroughBodies &&
          building.passThroughBodies.length > 0
        ) {
          building.passThroughBodies.forEach((passThroughBody) => {
            const bodyX = passThroughBody.x;
            const bodyY = passThroughBody.y;
            const bodyWidth = passThroughBody.displayWidth;
            const bodyHeight = passThroughBody.displayHeight;

            // Check if player is within the pass-through area bounds
            const leftBound = bodyX - bodyWidth / 2;
            const rightBound = bodyX + bodyWidth / 2;
            const topBound = bodyY - bodyHeight / 2;
            const bottomBound = bodyY + bodyHeight / 2;

            // Debug logging
            if (Math.random() < 0.01) {
              // Only log occasionally to avoid spam
              console.log(`Pass-through area ${building.buildingId}:`, {
                bodyPos: { x: bodyX, y: bodyY },
                bodySize: { width: bodyWidth, height: bodyHeight },
                bounds: {
                  left: leftBound,
                  right: rightBound,
                  top: topBound,
                  bottom: bottomBound,
                },
                playerPos: { x: playerX, y: playerY },
              });
            }

            if (
              playerX >= leftBound &&
              playerX <= rightBound &&
              playerY >= topBound &&
              playerY <= bottomBound
            ) {
              isInPassThroughArea = true;
              console.log(
                `Player is in pass-through area of building ${building.buildingId}`
              );
            }
          });
        }
      });
    }

    // Adjust player depth based on pass-through areas
    if (isInPassThroughArea) {
      // Player is under something, put them behind it (lower z-index)
      this.scene.player.sprite.setDepth(50);
    } else {
      // Player is in normal area, put them in front (higher z-index)
      this.scene.player.sprite.setDepth(150);
    }
  }

  // Check door trigger zones for proximity detection
  checkDoorTriggerZones() {
    if (
      !this.scene.player ||
      !this.scene.player.sprite ||
      !this.scene.buildings
    ) {
      return;
    }

    const player = this.scene.player.sprite;
    const playerX = player.x;
    const playerY = player.y;

    // Check all buildings for trigger zone proximity
    this.scene.buildings.forEach((building) => {
      if (
        building.doorTriggerZone &&
        this.buildingManager.canToggleDoor(building)
      ) {
        const triggerZone = building.doorTriggerZone;
        const zoneX = triggerZone.x;
        const zoneY = triggerZone.y;
        const zoneWidth = triggerZone.zoneWidth;
        const zoneHeight = triggerZone.zoneHeight;

        // Check if player is within the trigger zone bounds
        const isPlayerInZone =
          playerX >= zoneX - zoneWidth / 2 &&
          playerX <= zoneX + zoneWidth / 2 &&
          playerY >= zoneY - zoneHeight / 2 &&
          playerY <= zoneY + zoneHeight / 2;

        if (isPlayerInZone) {
          // Player is in trigger zone
          if (!this.playerInBuilding) {
            this.playerInBuilding = building;
            if (!building.isDoorOpen) {
              this.buildingManager.toggleDoorState(building);
              console.log(
                `Door opened for building ${building.buildingId} via trigger zone`
              );
            }
          }
        } else if (this.playerInBuilding === building) {
          // Player was in this building's trigger zone but has left
          if (building.isDoorOpen) {
            this.buildingManager.toggleDoorState(building);
            console.log(
              `Door closed for building ${building.buildingId} - player left trigger zone`
            );
          }
          this.playerInBuilding = null;
        }
      }
    });
  }

  // Check if player has left the current building and close door if needed
  checkPlayerLeavingBuildingBoundingBox() {
    // This method is now handled by checkDoorTriggerZones()
    // Keeping it for backward compatibility but it's no longer used
  }

  // Handle door interaction for scene transitions
  handleDoorInteraction(player, doorZone) {
    if (doorZone && doorZone.isDoorZone && doorZone.targetScene) {
      console.log(
        `Player entered door zone, transitioning to ${doorZone.targetScene}`
      );

      // Save player data before scene transition
      if (this.scene.player) {
        this.scene.player.saveToRegistry();
      }

      // Start the target scene
      this.scene.scene.start(doorZone.targetScene);
    }
  }
}
