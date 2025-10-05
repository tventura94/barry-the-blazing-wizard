import { Scene } from "phaser";

export class GuitarHeroCombat extends Scene {
  constructor() {
    super("GuitarHeroCombat");
  }

  init(data) {
    this.combatData = data.combatData || {};
    this.playerData = data.playerData || {};
    this.returnScene = data.returnScene || "StarterArea";

    // Combat state
    this.isCombatActive = false;
    this.combatTimer = null;
    this.currentSong = null;
    this.notes = [];
    this.currentNoteIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.health = 100;
    this.enemyHealth = 100;

    // Guitar Hero specific
    this.noteSpeed = 200; // pixels per second
    this.hitWindow = 50; // pixels - how close to target line to hit
    this.targetLineY = 600; // Y position of the target line
    this.noteLanes = [200, 300, 400, 500]; // X positions for note lanes
    this.laneKeys = ["A", "S", "D", "F"]; // Keys for each lane

    // Visual elements
    this.noteGraphics = [];
    this.targetLine = null;
    this.healthBars = null;
    this.scoreText = null;
    this.comboText = null;
  }

  create() {
    console.log("Guitar Hero Combat scene started");
    this.cameras.main.setBackgroundColor(0x1a1a1a);

    // Create combat UI
    this.createCombatUI();

    // Create the song/pattern
    this.createCombatPattern();

    // Set up input
    this.setupInput();

    // Start combat
    this.startCombat();
  }

  createCombatUI() {
    const centerX = this.cameras.main.width / 2;

    // Create target line
    this.targetLine = this.add.graphics();
    this.targetLine.lineStyle(4, 0xffffff, 1);
    this.targetLine.lineBetween(100, this.targetLineY, 700, this.targetLineY);

    // Create lane separators
    this.laneSeparators = this.add.graphics();
    this.laneSeparators.lineStyle(2, 0x333333, 1);
    this.noteLanes.forEach((x) => {
      this.laneSeparators.lineBetween(x, 100, x, this.targetLineY);
    });

    // Create health bars
    this.createHealthBars();

    // Create score display
    this.scoreText = this.add.text(50, 50, `Score: ${this.score}`, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
    });

    this.comboText = this.add.text(50, 80, `Combo: ${this.combo}`, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffff00",
    });

    // Create enemy info
    this.enemyText = this.add.text(
      centerX,
      50,
      `${this.combatData.name || "Enemy"}`,
      {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ff0000",
        align: "center",
      }
    );
    this.enemyText.setOrigin(0.5);

    // Create instructions
    this.instructionsText = this.add.text(
      centerX,
      100,
      "Hit the notes as they reach the line!\nA S D F keys",
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#cccccc",
        align: "center",
      }
    );
    this.instructionsText.setOrigin(0.5);
  }

  createHealthBars() {
    const centerX = this.cameras.main.width / 2;
    const barWidth = 200;
    const barHeight = 20;

    // Player health bar
    this.playerHealthBar = this.add.graphics();
    this.playerHealthBar.fillStyle(0x00ff00);
    this.playerHealthBar.fillRect(
      centerX - barWidth / 2,
      120,
      barWidth,
      barHeight
    );

    this.playerHealthText = this.add.text(centerX, 125, "Player", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
    });
    this.playerHealthText.setOrigin(0.5);

    // Enemy health bar
    this.enemyHealthBar = this.add.graphics();
    this.enemyHealthBar.fillStyle(0xff0000);
    this.enemyHealthBar.fillRect(
      centerX - barWidth / 2,
      150,
      barWidth,
      barHeight
    );

    this.enemyHealthText = this.add.text(centerX, 155, "Enemy", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
    });
    this.enemyHealthText.setOrigin(0.5);
  }

  createCombatPattern() {
    // Create a simple pattern of notes
    this.notes = this.generateNotePattern();
    console.log(`Generated ${this.notes.length} notes for combat`);
  }

  generateNotePattern() {
    const notes = [];
    const patternLength = 30; // 30 seconds of notes
    const noteInterval = 500; // milliseconds between notes

    for (let i = 0; i < (patternLength * 1000) / noteInterval; i++) {
      // Randomly choose a lane
      const lane = Math.floor(Math.random() * this.noteLanes.length);
      const spawnTime = i * noteInterval;

      notes.push({
        lane: lane,
        x: this.noteLanes[lane],
        y: 100, // Start at top
        spawnTime: spawnTime,
        hitTime: spawnTime + (500 / this.noteSpeed) * 1000, // Time when it should be hit
        isHit: false,
        isMissed: false,
        spawned: false,
      });
    }

    return notes;
  }

  setupInput() {
    // Set up keyboard input for note lanes
    this.laneKeys.forEach((key, index) => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        this.hitNote(index);
      });
    });

    // Escape to quit combat
    this.input.keyboard.on("keydown-ESC", () => {
      this.endCombat(false);
    });
  }

  startCombat() {
    console.log("Starting Guitar Hero combat!");
    this.isCombatActive = true;
    this.combatStartTime = this.time.now;

    // Start spawning notes
    this.spawnNotes();

    // Start combat timer
    this.combatTimer = this.time.addEvent({
      delay: 30000, // 30 seconds
      callback: this.endCombat,
      args: [true],
      loop: false,
    });
  }

  spawnNotes() {
    if (!this.isCombatActive) return;

    const currentTime = this.time.now - this.combatStartTime;

    // Spawn notes that should appear now
    this.notes.forEach((note) => {
      if (!note.spawned && currentTime >= note.spawnTime) {
        this.spawnNote(note);
        note.spawned = true;
      }
    });

    // Continue spawning
    this.time.delayedCall(50, this.spawnNotes, [], this);
  }

  spawnNote(note) {
    // Create note visual
    const noteGraphic = this.add.circle(note.x, note.y, 15, 0x00ff00);
    noteGraphic.setDepth(10);

    // Animate note moving down
    this.tweens.add({
      targets: noteGraphic,
      y: this.targetLineY,
      duration: (500 / this.noteSpeed) * 1000,
      ease: "Linear",
      onComplete: () => {
        if (!note.isHit) {
          this.missNote(note);
        }
        noteGraphic.destroy();
      },
    });

    note.graphic = noteGraphic;
  }

  hitNote(laneIndex) {
    if (!this.isCombatActive) return;

    // Find the closest note in this lane that can be hit
    const currentTime = this.time.now - this.combatStartTime;
    let closestNote = null;
    let closestDistance = Infinity;

    this.notes.forEach((note) => {
      if (note.lane === laneIndex && !note.isHit && !note.isMissed) {
        const distance = Math.abs(note.hitTime - currentTime);
        if (distance < this.hitWindow && distance < closestDistance) {
          closestNote = note;
          closestDistance = distance;
        }
      }
    });

    if (closestNote) {
      this.hitNoteSuccess(closestNote, closestDistance);
    } else {
      // Miss - no note in range
      this.missNote(null);
    }
  }

  hitNoteSuccess(note, accuracy) {
    note.isHit = true;
    if (note.graphic) {
      note.graphic.destroy();
    }

    // Calculate score based on accuracy
    const accuracyScore = Math.max(0, this.hitWindow - accuracy);
    const baseScore = 100;
    const score = Math.floor(baseScore * (accuracyScore / this.hitWindow));

    this.score += score;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    // Deal damage to enemy
    const damage = 5 + Math.floor(score / 20);
    this.enemyHealth = Math.max(0, this.enemyHealth - damage);

    // Update UI
    this.updateUI();

    // Show hit effect
    this.showHitEffect(note.x, note.y, score);

    // Check for enemy defeat
    if (this.enemyHealth <= 0) {
      this.endCombat(true);
    }
  }

  missNote(note) {
    if (note) {
      note.isMissed = true;
      if (note.graphic) {
        note.graphic.destroy();
      }
    }

    // Reset combo
    this.combo = 0;

    // Player takes damage
    this.health = Math.max(0, this.health - 2);

    // Update UI
    this.updateUI();

    // Check for player defeat
    if (this.health <= 0) {
      this.endCombat(false);
    }
  }

  showHitEffect(x, y, score) {
    const effect = this.add.text(x, y, `+${score}`, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffff00",
    });
    effect.setOrigin(0.5);

    this.tweens.add({
      targets: effect,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => effect.destroy(),
    });
  }

  updateUI() {
    // Update score and combo
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`Combo: ${this.combo}`);

    // Update health bars
    const centerX = this.cameras.main.width / 2;
    const barWidth = 200;
    const barHeight = 20;

    // Player health bar
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0x00ff00);
    this.playerHealthBar.fillRect(
      centerX - barWidth / 2,
      120,
      (this.health / 100) * barWidth,
      barHeight
    );

    // Enemy health bar
    this.enemyHealthBar.clear();
    this.enemyHealthBar.fillStyle(0xff0000);
    this.enemyHealthBar.fillRect(
      centerX - barWidth / 2,
      150,
      (this.enemyHealth / 100) * barWidth,
      barHeight
    );
  }

  endCombat(victory) {
    console.log(`Combat ended. Victory: ${victory}`);
    this.isCombatActive = false;

    if (this.combatTimer) {
      this.combatTimer.destroy();
    }

    // Show results
    this.showCombatResults(victory);
  }

  showCombatResults(victory) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create results background
    const resultsBg = this.add.rectangle(
      centerX,
      centerY,
      400,
      300,
      0x000000,
      0.8
    );
    resultsBg.setStrokeStyle(2, 0xffffff);

    // Results text
    const resultText = this.add.text(
      centerX,
      centerY - 80,
      victory ? "VICTORY!" : "DEFEAT!",
      {
        fontFamily: "Arial",
        fontSize: "32px",
        color: victory ? "#00ff00" : "#ff0000",
        align: "center",
      }
    );
    resultText.setOrigin(0.5);

    // Score display
    const finalScoreText = this.add.text(
      centerX,
      centerY - 40,
      `Final Score: ${this.score}`,
      {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
      }
    );
    finalScoreText.setOrigin(0.5);

    const maxComboText = this.add.text(
      centerX,
      centerY - 10,
      `Max Combo: ${this.maxCombo}`,
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffff00",
        align: "center",
      }
    );
    maxComboText.setOrigin(0.5);

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
    // Update note positions and check for misses
    if (this.isCombatActive) {
      const currentTime = this.time.now - this.combatStartTime;

      this.notes.forEach((note) => {
        if (note.graphic && !note.isHit && !note.isMissed) {
          // Check if note should be missed
          if (currentTime > note.hitTime + this.hitWindow) {
            this.missNote(note);
          }
        }
      });
    }
  }
}
