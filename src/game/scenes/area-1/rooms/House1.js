import { Scene } from "phaser";
import { SceneManager } from "../../../managers/SceneManager.js";

export class House1 extends Scene {
  constructor() {
    super("House1");
  }

  async create() {
    console.log("House1 scene create() started");
    this.cameras.main.setBackgroundColor(0x000000); // Black background

    // Clear any existing scene manager and objects
    if (this.sceneManager) {
      this.sceneManager.clearExistingObjects();
    }

    // Initialize scene manager
    this.sceneManager = new SceneManager(this);

    try {
      // Load level data from JSON and wait for completion
      await this.sceneManager.loadLevelData();
      console.log("House1 level loaded successfully");
    } catch (error) {
      console.error("House1 level loading failed:", error);
    }

    // Add screen edge detection
    this.setupScreenEdges();
    console.log("House1 scene create() completed");
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

      // Update combat manager
      if (this.sceneManager.combatManager) {
        this.sceneManager.combatManager.update();
      }

      // Manual screen edge detection (backup method)
      if (this.player.sprite.y < 0) {
        this.scene.start("StarterArea");
      }
    }
  }
}
