import { Scene } from "phaser";

export class playerAnimationManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Creates all wizard animations from the loaded sprite sheet
   * @param {string} spriteKey - The key of the loaded sprite sheet
   */
  createWizardAnimations(spriteKey = "wizard-walk") {
    this.createWalkingAnimations(spriteKey);
    this.createIdleAnimations(spriteKey);
  }

  /**
   * Creates walking animations for all four directions
   * @param {string} spriteKey - The key of the loaded sprite sheet
   */
  createWalkingAnimations(spriteKey) {
    const walkingAnimations = [
      {
        key: "wizard-walk-up",
        startFrame: 1,
        endFrame: 8,
        description:
          "Facing up (frames 1-8, skipping frame 0 which is standing)",
      },
      {
        key: "wizard-walk-left",
        startFrame: 10,
        endFrame: 17,
        description:
          "Facing left (frames 10-17, skipping frame 9 which is standing)",
      },
      {
        key: "wizard-walk-down",
        startFrame: 19,
        endFrame: 26,
        description:
          "Facing down (frames 19-26, skipping frame 18 which is standing)",
      },
      {
        key: "wizard-walk-right",
        startFrame: 28,
        endFrame: 35,
        description:
          "Facing right (frames 28-35, skipping frame 27 which is standing)",
      },
    ];

    walkingAnimations.forEach((anim) => {
      this.scene.anims.create({
        key: anim.key,
        frames: this.scene.anims.generateFrameNumbers(spriteKey, {
          start: anim.startFrame,
          end: anim.endFrame,
        }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  /**
   * Creates idle animations for all four directions
   * @param {string} spriteKey - The key of the loaded sprite sheet
   */
  createIdleAnimations(spriteKey) {
    const idleAnimations = [
      { key: "wizard-idle-up", frame: 0 },
      { key: "wizard-idle-left", frame: 9 },
      { key: "wizard-idle-down", frame: 18 },
      { key: "wizard-idle-right", frame: 27 },
    ];

    idleAnimations.forEach((anim) => {
      this.scene.anims.create({
        key: anim.key,
        frames: [{ key: spriteKey, frame: anim.frame }],
        frameRate: 1,
      });
    });
  }

  /**
   * Creates animations for additional sprite sheets
   * This method can be extended for other character animations
   * @param {string} spriteKey - The key of the loaded sprite sheet
   * @param {Object} config - Configuration object for the animations
   */
  createCustomAnimations(spriteKey, config) {
    // This can be extended for other character types or animation sets
    // For now, it's a placeholder for future expansion
    console.log(`Creating custom animations for ${spriteKey}`, config);
  }
}
