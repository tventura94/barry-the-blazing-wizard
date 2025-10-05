import { Boot } from "./scenes/Boot";
import { StarterArea as MainGame } from "./scenes/area-1/StarterArea";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { House1 } from "./scenes/area-1/rooms/House1";
import { VincentsStore } from "./scenes/area-1/rooms/VincentsStore";
import { TurnBasedCombat } from "./scenes/TurnBasedCombat";
import { AUTO, Game } from "phaser";

// Debug configuration - set to false to disable all debug visualizations
export const DEBUG_CONFIG = {
  enabled: true, // THIS TRIGGERS DEBUGGING
  showCollisionBodies: true, // Red rectangles for additional collision bodies
  showPassThroughBodies: true, // Green rectangles for pass-through areas
  showGrid: true, // Show grid overlay for tilemap alignment
};

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#028af8",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: DEBUG_CONFIG.enabled,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    MainGame,
    GameOver,
    VincentsStore,
    House1,
    TurnBasedCombat,
  ],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;
