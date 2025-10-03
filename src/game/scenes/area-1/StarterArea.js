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
        this.scene.start("BlueRoom");
      }
    }
  }
}
