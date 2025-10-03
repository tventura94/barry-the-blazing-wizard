import { Scene } from "phaser";
import { PlayerInitializer } from "../../player_barry/playerInitializer.js";

export class BlueRoom extends Scene {
  constructor() {
    super("BlueRoom");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0000ff); // Blue background

    this.add.image(512, 384, "background").setAlpha(0.5);

    // Initialize player using PlayerInitializer at specific position for this scene
    this.playerInitializer = new PlayerInitializer(this);
    this.player = this.playerInitializer.initializePlayer(500, 100);

    // Load player data from registry if available
    if (this.player) {
      this.player.loadFromRegistry(false); // Don't load position, use the scene's position
    }

    // Create player UI
    this.playerInitializer.createPlayerUI();

    this.add
      .text(512, 84, "No hookers here dipshit!", {
        fontFamily: "Arial Black",
        fontSize: 24,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);

    // Add screen edge detection
    this.setupScreenEdges();
  }

  setupScreenEdges() {
    // Simple screen edge detection - no physics needed
    // The actual detection happens in the update() method
  }

  update() {
    // Update player only if initialized
    if (this.playerInitializer && this.player) {
      this.playerInitializer.updatePlayer();

      // Manual screen edge detection (backup method)
      if (this.player.sprite.y < 0) {
        this.scene.start("StarterArea");
      }
    }
  }
}
