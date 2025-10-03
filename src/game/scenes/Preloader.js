import { Scene } from "phaser";
import { playerAnimationManager } from "../player_barry/playerAnimationManager.js";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("logo", "logo.png");
    this.load.image("background", "bg.png");
    this.load.image("building1", "buildings/building1.png");
    this.load.image("building1-door-open", "buildings/building1-door-open.png");
    this.load.image("tree1", "props/tree1.png");
    this.load.image("store1", "buildings/store1.png");
    this.load.image("store1-door-open", "buildings/store1-door-open.png");

    // Load the wizard character sprite sheet
    this.load.spritesheet("wizard-walk", "barry-sprites/walk.png", {
      frameWidth: 64, // Each frame is 64 pixels wide
      frameHeight: 64, // Each frame is 64 pixels tall
      endFrame: 35, // 36 frames total (4 rows x 9 frames each)
    });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    // Create animation manager and set up all wizard animations
    const animationManager = new playerAnimationManager(this);
    animationManager.createWizardAnimations("wizard-walk");

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");
  }
}
