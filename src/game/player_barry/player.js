export class Player {
  constructor(
    scene,
    x,
    y,
    name = "Barry",
    speed = 110,
    mana = 100,
    health = 100,
    inventory = [],
    equipment = [],
    PlayerLevel = 1,
    experience = 0,
    gold = 0,
    skills = [],
    spells = [],
    quests = []
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.sprite = null; // Will be set by the scene
    this.name = name;
    this.PlayerLevel = PlayerLevel;
    this.experience = experience;
    this.gold = gold;
    this.health = health;
    this.speed = speed;
    this.mana = mana;
    this.inventory = inventory;
    this.equipment = equipment;
    this.skills = skills;
    this.spells = spells;
    this.quests = quests;
    this.facingDirection = "down"; // Default facing direction
  }
  setCursorKeys(cursors) {
    this.cursors = cursors;
  }
  setWASDKeys(wasd) {
    this.wasd = wasd;
  }
  move(speed) {
    let velocityX = 0;
    let velocityY = 0;
    let isMoving = false;
    let currentDirection = this.facingDirection || "down"; // Default direction

    // Check for movement input (WASD or Arrow keys)
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -speed;
      isMoving = true;
      currentDirection = "left";
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = speed;
      isMoving = true;
      currentDirection = "right";
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -speed;
      isMoving = true;
      currentDirection = "up";
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = speed;
      isMoving = true;
      currentDirection = "down";
    }

    // Update facing direction
    this.facingDirection = currentDirection;

    // Handle animation based on movement and direction
    if (this.sprite && this.sprite.anims) {
      if (isMoving) {
        // Play walking animation for current direction
        this.sprite.play(`wizard-walk-${currentDirection}`, true);
      } else {
        // Play idle animation for current direction
        this.sprite.play(`wizard-idle-${currentDirection}`, true);
      }
    }

    // Apply movement using physics velocity
    this.sprite.body.setVelocity(velocityX, velocityY);

    // Update player position
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }

  // Methods for managing persistent data
  addSpell(spell) {
    if (!this.spells.includes(spell)) {
      this.spells.push(spell);
    }
  }

  addSkill(skill) {
    if (!this.skills.includes(skill)) {
      this.skills.push(skill);
    }
  }

  addItem(item) {
    this.inventory.push(item);
  }
  removeItem(item) {
    this.inventory = this.inventory.filter((i) => i !== item);
  }
  addEquipment(equipment) {
    this.equipment.push(equipment);
  }
  removeEquipment(equipment) {
    this.equipment = this.equipment.filter((e) => e !== equipment);
  }
  addQuest(quest) {
    this.quests.push(quest);
  }
  removeQuest(quest) {
    this.quests = this.quests.filter((q) => q !== quest);
  }
  // Save player data to Phaser registry for persistence
  saveToRegistry() {
    if (this.scene) {
      this.scene.registry.set("playerData", {
        name: this.name,
        x: this.x,
        y: this.y,
        health: this.health,
        mana: this.mana,
        speed: this.speed,
        PlayerLevel: this.PlayerLevel,
        experience: this.experience,
        gold: this.gold,
        inventory: this.inventory,
        equipment: this.equipment,
        skills: this.skills,
        spells: this.spells,
        quests: this.quests,
      });
    }
  }

  // Load player data from Phaser registry
  loadFromRegistry(loadPosition = true) {
    if (this.scene) {
      const playerData = this.scene.registry.get("playerData");
      if (playerData) {
        this.name = playerData.name;
        // Only load position if explicitly requested
        if (loadPosition) {
          this.x = playerData.x;
          this.y = playerData.y;
        }
        this.health = playerData.health;
        this.mana = playerData.mana;
        this.speed = playerData.speed;
        this.PlayerLevel = playerData.PlayerLevel;
        this.experience = playerData.experience;
        this.gold = playerData.gold;
        this.inventory = playerData.inventory || [];
        this.equipment = playerData.equipment || [];
        this.skills = playerData.skills || [];
        this.spells = playerData.spells || [];
        this.quests = playerData.quests || [];
      }
    }
  }
}
