import { Scene } from "phaser";
import { SceneManager } from "../../../managers/SceneManager.js";
import { DialogManager } from "../../../managers/DialogManager/DialogManager.js";
import { VincentsStoreDialogs } from "../../../managers/DialogManager/VincentsStore/VincentsStoreDialogs.js";

export class VincentsStore extends Scene {
  constructor() {
    super("VincentsStore");
  }

  async create() {
    console.log("VincentsStore scene create() started");
    this.cameras.main.setBackgroundColor(0x000000); // Black background

    // Clear any existing scene manager and objects
    if (this.sceneManager) {
      this.sceneManager.clearExistingObjects();
    }

    // Initialize scene manager
    this.sceneManager = new SceneManager(this);

    // Initialize dialog system
    this.dialogManager = new DialogManager(this);
    this.vincentsstoreDialogController = new VincentsStoreDialogs(this);
    this.dialogManager.createDialogUI();

    try {
      // Load level data from JSON and wait for completion
      await this.sceneManager.loadLevelData();
      console.log("VincentsStore level loaded successfully");
    } catch (error) {
      console.error("VincentsStore level loading failed:", error);
    }

    // Add screen edge detection
    this.setupScreenEdges();
    console.log("VincentsStore scene create() completed");
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

      // Update dialog system
      if (this.dialogManager) {
        this.dialogManager.update();
      }

      // Manual screen edge detection (backup method)
      if (this.player.sprite.y < 0) {
        this.scene.start("StarterArea");
      }
    }
  }
}
