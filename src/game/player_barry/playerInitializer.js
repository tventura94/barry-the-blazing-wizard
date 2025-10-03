import { Player } from "./player.js";

export class PlayerInitializer {
  constructor(scene) {
    this.scene = scene;
    this.player = null;
    this.saveTimer = 0; // Timer for saving data
    this.saveInterval = 3600; // Save every 3600 frames (1 minute at 60fps)
  }

  // Initialize player with all setup
  initializePlayer(startX = 500, startY = 500) {
    // Create or load existing player
    this.player = new Player(this.scene, startX, startY, "Hero");

    // Try to load existing player data, if none exists, use defaults
    // Note: We don't load x,y from registry here as each scene controls starting position
    this.player.loadFromRegistry(false);

    // Create the wizard sprite using the loaded sprite sheet with physics
    this.player.sprite = this.scene.physics.add.sprite(
      this.player.x,
      this.player.y,
      "wizard-walk"
    );
    this.player.sprite.setOrigin(0.5, 0.5); // Center the sprite
    this.player.sprite.setScale(1); // Adjust scale if needed

    // Set up physics body for the player
    this.player.sprite.body.setSize(32, 32); // Adjust collision box size as needed

    // Debug logging
    console.log("Player sprite created with physics body:", {
      immovable: this.player.sprite.body.immovable,
      size: {
        width: this.player.sprite.body.width,
        height: this.player.sprite.body.height,
      },
      position: { x: this.player.sprite.x, y: this.player.sprite.y },
    });

    // Set up keyboard input for movement
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys("W,S,A,D");

    // Connect input to player
    this.player.setCursorKeys(this.cursors);
    this.player.setWASDKeys(this.wasd);

    return this.player;
  }

  // Create UI elements for player info
  createPlayerUI() {
    // Add some text to show player info
    this.scene.add.text(
      50,
      50,
      `Player: ${this.player.name}\nHealth: ${this.player.health}\nMana: ${this.player.mana}\nSpeed: ${this.player.speed}`,
      {
        fontFamily: "Arial",
        fontSize: 16,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      }
    );
  }

  // Update player data (call this in scene update)
  updatePlayer() {
    if (this.player) {
      this.player.move(this.player.speed);

      // Save player data every minute instead of every frame
      this.saveTimer++;
      if (this.saveTimer >= this.saveInterval) {
        this.player.saveToRegistry();
        this.saveTimer = 0; // Reset timer
      }
    }
  }

  // Force save player data (call when important changes happen)
  savePlayerData() {
    if (this.player) {
      this.player.saveToRegistry();
    }
  }

  // Get the player instance
  getPlayer() {
    return this.player;
  }
}
