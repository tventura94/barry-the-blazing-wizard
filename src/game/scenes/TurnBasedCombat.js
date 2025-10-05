import { Scene } from "phaser";

export class TurnBasedCombat extends Scene {
  constructor() {
    super("TurnBasedCombat");
  }

  init(data) {
    this.combatData = data.combatData || {};
    this.playerData = data.playerData || {};
    this.returnScene = data.returnScene || "StarterArea";

    // Combat state
    this.isCombatActive = false;
    this.currentTurn = "player"; // "player" or "enemy"
    this.playerHealth = this.playerData.health || 100;
    this.enemyHealth = this.combatData.health || 100;
    this.playerMaxHealth = this.playerHealth;
    this.enemyMaxHealth = this.enemyHealth;
    this.playerAttack = this.playerData.attack || 20;
    this.enemyAttack = this.combatData.attack || 15;
    this.playerDefense = this.playerData.defense || 10;
    this.enemyDefense = this.combatData.defense || 10;

    // UI elements
    this.combatUI = null;
    this.actionButtons = [];
    this.healthBars = null;
    this.combatText = null;
    this.turnText = null;
  }

  create() {
    console.log("Turn-based Combat scene started");
    this.cameras.main.setBackgroundColor(0x2c3e50);

    // Create combat UI
    this.createCombatUI();

    // Start combat
    this.startCombat();
  }

  createCombatUI() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create background
    this.add.rectangle(centerX, centerY, 800, 600, 0x34495e, 0.9);

    // Create enemy info (top)
    this.enemyText = this.add.text(
      centerX,
      100,
      `${this.combatData.name || "Enemy"}`,
      {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#e74c3c",
        align: "center",
      }
    );
    this.enemyText.setOrigin(0.5);

    // Create player info (bottom)
    this.playerText = this.add.text(centerX, 500, "Player", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#3498db",
      align: "center",
    });
    this.playerText.setOrigin(0.5);

    // Create health bars
    this.createHealthBars();

    // Create combat text area
    this.combatText = this.add.text(centerX, 200, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 600 },
    });
    this.combatText.setOrigin(0.5);

    // Create turn indicator
    this.turnText = this.add.text(centerX, 250, "", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#f39c12",
      align: "center",
    });
    this.turnText.setOrigin(0.5);

    // Create action buttons
    this.createActionButtons();
  }

  createHealthBars() {
    const centerX = this.cameras.main.width / 2;
    const barWidth = 300;
    const barHeight = 25;

    // Enemy health bar (top)
    this.enemyHealthBarBg = this.add.rectangle(
      centerX,
      140,
      barWidth + 10,
      barHeight + 10,
      0x000000,
      0.8
    );
    this.enemyHealthBar = this.add.rectangle(
      centerX,
      140,
      barWidth,
      barHeight,
      0xe74c3c
    );
    this.enemyHealthText = this.add.text(
      centerX,
      140,
      `${this.enemyHealth}/${this.enemyMaxHealth}`,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
      }
    );
    this.enemyHealthText.setOrigin(0.5);

    // Player health bar (bottom)
    this.playerHealthBarBg = this.add.rectangle(
      centerX,
      460,
      barWidth + 10,
      barHeight + 10,
      0x000000,
      0.8
    );
    this.playerHealthBar = this.add.rectangle(
      centerX,
      460,
      barWidth,
      barHeight,
      0x3498db
    );
    this.playerHealthText = this.add.text(
      centerX,
      460,
      `${this.playerHealth}/${this.playerMaxHealth}`,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
      }
    );
    this.playerHealthText.setOrigin(0.5);
  }

  createActionButtons() {
    const centerX = this.cameras.main.width / 2;
    const buttonY = 350;
    const buttonSpacing = 150;

    // Attack button
    const attackButton = this.add.rectangle(
      centerX - buttonSpacing,
      buttonY,
      120,
      50,
      0xe74c3c
    );
    attackButton.setInteractive();
    attackButton.on("pointerdown", () => this.playerAction("attack"));
    this.add
      .text(centerX - buttonSpacing, buttonY, "Attack", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Defend button
    const defendButton = this.add.rectangle(
      centerX,
      buttonY,
      120,
      50,
      0x27ae60
    );
    defendButton.setInteractive();
    defendButton.on("pointerdown", () => this.playerAction("defend"));
    this.add
      .text(centerX, buttonY, "Defend", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Run button
    const runButton = this.add.rectangle(
      centerX + buttonSpacing,
      buttonY,
      120,
      50,
      0x95a5a6
    );
    runButton.setInteractive();
    runButton.on("pointerdown", () => this.playerAction("run"));
    this.add
      .text(centerX + buttonSpacing, buttonY, "Run", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    this.actionButtons = [attackButton, defendButton, runButton];
  }

  startCombat() {
    console.log("Starting turn-based combat!");
    this.isCombatActive = true;
    this.updateUI();
    this.showCombatMessage(`${this.combatData.name || "Enemy"} appears!`);
    this.updateTurnIndicator();
  }

  playerAction(action) {
    if (!this.isCombatActive || this.currentTurn !== "player") return;

    this.disableActionButtons();

    switch (action) {
      case "attack":
        this.playerAttackAction();
        break;
      case "defend":
        this.playerDefendAction();
        break;
      case "run":
        this.playerRunAction();
        break;
    }
  }

  playerAttackAction() {
    const damage = this.calculateDamage(this.playerAttack, this.enemyDefense);
    this.enemyHealth = Math.max(0, this.enemyHealth - damage);

    this.showCombatMessage(`You attack for ${damage} damage!`);
    this.updateUI();

    if (this.enemyHealth <= 0) {
      this.endCombat(true);
    } else {
      this.nextTurn();
    }
  }

  playerDefendAction() {
    this.showCombatMessage("You defend! Defense increased for next turn.");
    // Defense bonus could be implemented here
    this.nextTurn();
  }

  playerRunAction() {
    this.showCombatMessage("You attempt to run away...");
    // 50% chance to run away
    if (Math.random() < 0.5) {
      this.endCombat(false, "escaped");
    } else {
      this.showCombatMessage("You couldn't escape!");
      this.nextTurn();
    }
  }

  nextTurn() {
    if (this.currentTurn === "player") {
      this.currentTurn = "enemy";
      this.updateTurnIndicator();
      this.time.delayedCall(1000, () => this.enemyTurn());
    } else {
      this.currentTurn = "player";
      this.updateTurnIndicator();
      this.enableActionButtons();
    }
  }

  enemyTurn() {
    if (!this.isCombatActive || this.currentTurn !== "enemy") return;

    // Simple AI: 80% chance to attack, 20% chance to defend
    if (Math.random() < 0.8) {
      this.enemyAttackAction();
    } else {
      this.enemyDefendAction();
    }
  }

  enemyAttackAction() {
    const damage = this.calculateDamage(this.enemyAttack, this.playerDefense);
    this.playerHealth = Math.max(0, this.playerHealth - damage);

    this.showCombatMessage(
      `${this.combatData.name || "Enemy"} attacks for ${damage} damage!`
    );
    this.updateUI();

    if (this.playerHealth <= 0) {
      this.endCombat(false);
    } else {
      this.nextTurn();
    }
  }

  enemyDefendAction() {
    this.showCombatMessage(`${this.combatData.name || "Enemy"} defends!`);
    this.nextTurn();
  }

  calculateDamage(attack, defense) {
    const baseDamage = attack - defense;
    const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120% damage
    return Math.max(1, Math.floor(baseDamage * randomFactor));
  }

  showCombatMessage(message) {
    this.combatText.setText(message);
  }

  updateTurnIndicator() {
    const turnMessage =
      this.currentTurn === "player" ? "Your turn!" : "Enemy's turn!";
    this.turnText.setText(turnMessage);
  }

  updateUI() {
    // Update health bars
    const playerHealthPercent = this.playerHealth / this.playerMaxHealth;
    const enemyHealthPercent = this.enemyHealth / this.enemyMaxHealth;

    this.playerHealthBar.width = 300 * playerHealthPercent;
    this.enemyHealthBar.width = 300 * enemyHealthPercent;

    // Update health text
    this.playerHealthText.setText(
      `${this.playerHealth}/${this.playerMaxHealth}`
    );
    this.enemyHealthText.setText(`${this.enemyHealth}/${this.enemyMaxHealth}`);
  }

  enableActionButtons() {
    this.actionButtons.forEach((button) => {
      button.setInteractive();
      button.setAlpha(1);
    });
  }

  disableActionButtons() {
    this.actionButtons.forEach((button) => {
      button.disableInteractive();
      button.setAlpha(0.5);
    });
  }

  endCombat(victory, reason = null) {
    console.log(`Combat ended. Victory: ${victory}, Reason: ${reason}`);
    this.isCombatActive = false;
    this.disableActionButtons();

    if (reason === "escaped") {
      this.showCombatMessage("You successfully escaped!");
    } else if (victory) {
      this.showCombatMessage("Victory! You defeated the enemy!");
    } else {
      this.showCombatMessage("Defeat! You were defeated...");
    }

    // Show results after a delay
    this.time.delayedCall(2000, () => {
      this.showCombatResults(victory, reason);
    });
  }

  showCombatResults(victory, reason) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create results background
    const resultsBg = this.add.rectangle(
      centerX,
      centerY,
      400,
      200,
      0x000000,
      0.9
    );
    resultsBg.setStrokeStyle(2, 0xffffff);

    // Results text
    let resultMessage = "";
    if (reason === "escaped") {
      resultMessage = "ESCAPED!";
    } else if (victory) {
      resultMessage = "VICTORY!";
    } else {
      resultMessage = "DEFEAT!";
    }

    const resultText = this.add.text(centerX, centerY - 40, resultMessage, {
      fontFamily: "Arial",
      fontSize: "32px",
      color: reason === "escaped" ? "#f39c12" : victory ? "#27ae60" : "#e74c3c",
      align: "center",
    });
    resultText.setOrigin(0.5);

    // Continue button
    const continueText = this.add.text(
      centerX,
      centerY + 40,
      "Press SPACE to continue",
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
      }
    );
    continueText.setOrigin(0.5);

    // Handle continue
    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start(this.returnScene);
    });
  }

  update() {
    // Turn-based combat doesn't need continuous updates
  }
}
