import { Scene } from "phaser";
import { SceneManager } from "../../managers/SceneManager.js";

export class StarterArea extends Scene {
  constructor() {
    super("StarterArea");
  }

  async create() {
    console.log("StarterArea scene create() started");
    this.cameras.main.setBackgroundColor(0x00ff00);

    // Clear any existing scene manager and objects
    if (this.sceneManager) {
      this.sceneManager.clearExistingObjects();
    }

    // Initialize scene manager
    this.sceneManager = new SceneManager(this);

    try {
      // Load level data from JSON and wait for completion
      await this.sceneManager.loadLevelData();
      console.log("Level loaded successfully");

      // Check if player is returning from a room and use stored position
      this.handlePlayerReturnFromRoom();
    } catch (error) {
      console.error("Level loading failed:", error);
    }

    // Add screen edge detection
    this.setupScreenEdges();
    console.log("StarterArea scene create() completed");
  }

  setupScreenEdges() {
    // Simple screen edge detection - no physics needed
    // The actual detection happens in the update() method
  }

  handlePlayerReturnFromRoom() {
    // Check if player has a stored position from a room exit
    if (this.registry.get("playerData")) {
      const playerData = this.registry.get("playerData");
      if (playerData.lastOpenWorldPosition && this.player) {
        // Update player position to the stored open world position
        this.player.x = playerData.lastOpenWorldPosition.x;
        this.player.y = playerData.lastOpenWorldPosition.y;
        if (this.player.sprite) {
          this.player.sprite.x = playerData.lastOpenWorldPosition.x;
          this.player.sprite.y = playerData.lastOpenWorldPosition.y;
        }
        console.log(
          `Player returned to open world at stored position: (${playerData.lastOpenWorldPosition.x}, ${playerData.lastOpenWorldPosition.y})`
        );
      }
    }
  }

  update() {
    // Update player only if initialized
    if (this.playerInitializer && this.player) {
      this.playerInitializer.updatePlayer();

      // Check door trigger zones for proximity detection
      if (this.sceneManager) {
        this.sceneManager.checkDoorTriggerZones();
        // Check pass-through areas for z-index layering
        this.sceneManager.checkPassThroughAreas();
      }

      // Manual screen edge detection (backup method)
      if (this.player.sprite.y > 768) {
        this.scene.start("House1");
      }
    }
  }
}
