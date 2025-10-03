import { BuildingManager } from "./BuildingManager.js";
import { PlayerInitializer } from "../player_barry/playerInitializer.js";

export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.buildingManager = new BuildingManager(scene);
    this.playerInBuilding = null; // Track which building the player is currently near
  }

  async loadLevelData() {
    // Load the JSON file from public directory
    const response = await fetch("/assets/scene_json/area-1/start.json");
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

    // Initialize player
    this.scene.playerInitializer = new PlayerInitializer(this.scene);
    this.scene.player = this.scene.playerInitializer.initializePlayer(
      levelData.player.x,
      levelData.player.y
    );
    this.scene.playerInitializer.createPlayerUI();

    // Set up collisions with custom callback
    this.scene.buildings.forEach((building) => {
      this.scene.physics.add.collider(
        this.scene.player.sprite,
        building,
        this.handlePlayerBuildingCollision.bind(this),
        null,
        this.scene
      );

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
