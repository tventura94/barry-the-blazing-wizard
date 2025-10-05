export class DialogManager {
  constructor(scene) {
    this.scene = scene;
    this.dialogBox = null;
    this.dialogText = null;
    this.choiceButtons = [];
    this.continuePrompt = null;
    this.isDialogActive = false;
    this.currentDialog = null;
    this.currentNPC = null;
    this.dialogHistory = [];
    this.interactionPrompt = null;
    this.interactionDistance = 60;
    this.typewriterTimer = null;
  }

  // Create dialog UI elements
  createDialogUI() {
    const cameraWidth = this.scene.cameras.main.width || 800;
    const cameraHeight = this.scene.cameras.main.height || 600;
    const centerX = cameraWidth / 2;
    const centerY = cameraHeight / 2;

    // Create dialog box background
    this.dialogBox = this.scene.add.rectangle(
      centerX,
      cameraHeight - 100,
      cameraWidth - 40,
      150,
      0x000000,
      0.9
    );
    this.dialogBox.setDepth(1000);
    this.dialogBox.setVisible(false);

    // Create dialog text
    this.dialogText = this.scene.add.text(centerX, cameraHeight - 140, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      wordWrap: { width: cameraWidth - 80 },
      align: "center",
    });
    this.dialogText.setOrigin(0.5);
    this.dialogText.setDepth(1001);
    this.dialogText.setVisible(false);
    this.dialogText.setAlpha(0);
    this.dialogText.setActive(false);

    // Create continue prompt
    this.continuePrompt = this.scene.add.text(
      centerX,
      cameraHeight - 60,
      "Press SPACE to continue or ESC to close",
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffff00",
      }
    );
    this.continuePrompt.setOrigin(0.5);
    this.continuePrompt.setDepth(1001);
    this.continuePrompt.setVisible(false);

    // Create choice container
    this.choiceContainer = this.scene.add.container(centerX, cameraHeight - 80);
    this.choiceContainer.setDepth(1001);
    this.choiceContainer.setVisible(false);

    // Set up input handling
    this.setupInputHandling();
  }

  // Destroy dialog UI elements
  destroyDialogUI() {
    console.log("Destroying dialog UI...");

    if (this.dialogBox) {
      this.dialogBox.destroy();
      this.dialogBox = null;
      console.log("Dialog box destroyed");
    }

    if (this.dialogText) {
      this.dialogText.destroy();
      this.dialogText = null;
      console.log("Dialog text destroyed");
    }

    if (this.continuePrompt) {
      this.continuePrompt.destroy();
      this.continuePrompt = null;
      console.log("Continue prompt destroyed");
    }

    if (this.choiceContainer) {
      // Destroy all choice elements first
      this.choiceContainer.list.forEach((child) => {
        if (child && child.destroy) {
          child.destroy();
        }
      });
      this.choiceContainer.destroy();
      this.choiceContainer = null;
      console.log("Choice container destroyed");
    }

    if (this.interactionPrompt) {
      this.interactionPrompt.destroy();
      this.interactionPrompt = null;
      console.log("Interaction prompt destroyed");
    }

    console.log("Dialog UI destroyed successfully");
  }

  setupInputHandling() {
    // Handle space key for continuing dialog
    this.scene.input.keyboard.on("keydown-SPACE", () => {
      if (this.isDialogActive && !this.currentDialog.choices) {
        this.nextDialog();
      }
    });

    // Handle escape key to close dialog
    this.scene.input.keyboard.on("keydown-ESC", () => {
      if (this.isDialogActive) {
        this.closeDialog();
      }
    });

    // Handle E key for interaction
    this.scene.input.keyboard.on("keydown-E", () => {
      if (!this.isDialogActive) {
        this.tryInteractWithNearbyNPC();
      }
    });
  }

  // Try to interact with nearby NPC
  tryInteractWithNearbyNPC() {
    if (!this.scene.player || !this.scene.npcs) return;

    const player = this.scene.player.sprite;
    let closestNPC = null;
    let closestDistance = this.interactionDistance;

    // Find the closest NPC within interaction distance
    for (const npc of this.scene.npcs) {
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        npc.x,
        npc.y
      );

      if (distance <= closestDistance) {
        closestNPC = npc;
        closestDistance = distance;
      }
    }

    if (closestNPC) {
      this.startDialog(closestNPC);
    }
  }

  // Start dialog with an NPC
  startDialog(npc) {
    if (this.isDialogActive) return;

    this.currentNPC = npc;
    const npcId = npc.npcId;

    // Ensure dialog UI is created before showing dialog
    if (!this.dialogBox) {
      this.createDialogUI();
    }

    // Get dialog data from the scene's dialog controller
    const dialogController = this.getDialogController();
    if (dialogController) {
      const dialogData = dialogController.getDialog(npcId);
      if (dialogData) {
        this.currentDialog = dialogData;
        this.showDialog();
      }
    }
  }

  // Get the appropriate dialog controller for the current scene
  getDialogController() {
    const sceneKey = this.scene.scene.key;

    // Dynamically construct dialog controller property name based on scene name
    const dialogControllerProperty = `${sceneKey.toLowerCase()}DialogController`;

    // Return the dialog controller if it exists on the scene
    return this.scene[dialogControllerProperty] || null;
  }

  // Show the actual dialog
  showDialog() {
    if (!this.currentDialog) return;

    console.log("Showing dialog:", this.currentDialog.id);
    this.isDialogActive = true;

    // Dialog UI is freshly created, no need to clear or reset

    // Ensure dialog elements are properly positioned
    this.updateDialogPosition();

    // Make sure text is properly positioned before making it visible
    if (this.dialogText) {
      const cameraWidth = this.scene.cameras.main.width || 800;
      const cameraHeight = this.scene.cameras.main.height || 600;
      this.dialogText.setPosition(cameraWidth / 2, cameraHeight - 140);
    }

    this.dialogBox.setVisible(true);
    this.dialogText.setVisible(true);
    this.dialogText.setAlpha(1);
    this.dialogText.setActive(true);
    console.log("Dialog elements made visible");

    // Display the dialog text
    this.displayDialogText(this.currentDialog.text);

    // Show choices if available
    if (this.currentDialog.choices && this.currentDialog.choices.length > 0) {
      this.showChoices();
    } else {
      this.continuePrompt.setVisible(true);
    }

    // Completely disable player movement and input
    if (this.scene.player && this.scene.player.sprite) {
      this.scene.player.sprite.body.setVelocity(0, 0);
      this.scene.player.sprite.body.setImmovable(true);
    }

    // Disable player input keys
    this.disablePlayerInput();

    // Add to dialog history
    this.dialogHistory.push(this.currentDialog.id || "unknown");
  }

  // Update dialog position to ensure it's properly centered
  updateDialogPosition() {
    if (
      !this.dialogBox ||
      !this.dialogText ||
      !this.continuePrompt ||
      !this.choiceContainer
    ) {
      console.log("Dialog elements not found, cannot update position");
      return;
    }

    // Safety check for camera dimensions
    const cameraWidth = this.scene.cameras.main.width || 800;
    const cameraHeight = this.scene.cameras.main.height || 600;

    const centerX = cameraWidth / 2;
    const dialogY = cameraHeight - 100;
    const textY = cameraHeight - 140;
    const promptY = cameraHeight - 60;
    const choiceY = cameraHeight - 80;

    console.log("Updating dialog position:", {
      centerX,
      dialogY,
      textY,
      promptY,
      choiceY,
      cameraWidth,
      cameraHeight,
    });

    // Update dialog box position
    this.dialogBox.setPosition(centerX, dialogY);
    this.dialogBox.setSize(cameraWidth - 40, 150);

    // Update dialog text position
    this.dialogText.setPosition(centerX, textY);
    this.dialogText.setWordWrapWidth(cameraWidth - 80);

    // Update continue prompt position
    this.continuePrompt.setPosition(centerX, promptY);

    // Update choice container position
    this.choiceContainer.setPosition(centerX, choiceY);
  }

  // Display dialog text with typewriter effect
  displayDialogText(text) {
    // Clear any existing typewriter timer
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }

    // Ensure text is properly positioned before displaying
    if (this.dialogText) {
      const cameraWidth = this.scene.cameras.main.width || 800;
      const cameraHeight = this.scene.cameras.main.height || 600;
      this.dialogText.setPosition(cameraWidth / 2, cameraHeight - 140);
    }

    this.dialogText.setText("");
    let index = 0;

    this.typewriterTimer = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        this.dialogText.setText(text.substring(0, index + 1));
        index++;
        if (index >= text.length) {
          this.typewriterTimer.destroy();
          this.typewriterTimer = null;
        }
      },
      repeat: text.length - 1,
    });
  }

  // Show dialog choices
  showChoices() {
    this.continuePrompt.setVisible(false);
    this.choiceContainer.setVisible(true);

    // Properly destroy existing choice elements before removing them
    this.choiceContainer.list.forEach((child) => {
      if (child && child.destroy) {
        child.destroy();
      }
    });
    this.choiceContainer.removeAll();

    const choices = this.currentDialog.choices;
    const startY = -20;
    const spacing = 30;

    console.log("Creating choices:", choices.length);

    choices.forEach((choice, index) => {
      const choiceY = startY + index * spacing;

      // Create choice background
      const choiceBg = this.scene.add.rectangle(
        0,
        choiceY,
        Math.min(400, this.scene.cameras.main.width - 80),
        25,
        0x333333,
        0.8
      );
      choiceBg.setStrokeStyle(2, 0x666666);

      // Create choice text
      const choiceText = this.scene.add.text(
        0,
        choiceY,
        `${index + 1}. ${choice.text}`,
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffffff",
        }
      );
      choiceText.setOrigin(0.5);

      // Make choice interactive
      choiceBg.setInteractive();
      choiceBg.on("pointerdown", () => {
        this.selectChoice(index);
      });

      // Add to container
      this.choiceContainer.add([choiceBg, choiceText]);
    });
  }

  // Clear choice elements
  clearChoices() {
    if (this.choiceContainer) {
      console.log(
        "Clearing choices, current container children:",
        this.choiceContainer.list.length
      );
      // Properly destroy existing choice elements before removing them
      this.choiceContainer.list.forEach((child) => {
        if (child && child.destroy) {
          child.destroy();
        }
      });
      this.choiceContainer.removeAll();
      this.choiceContainer.setVisible(false);
      console.log("Choices cleared successfully");
    }
  }

  // Reset dialog elements to clean state
  resetDialogElements() {
    // Hide all dialog elements
    if (this.dialogBox) this.dialogBox.setVisible(false);
    if (this.dialogText) {
      this.dialogText.setVisible(false);
      this.dialogText.setAlpha(0);
      this.dialogText.setActive(false);
      this.dialogText.setText("");
    }
    if (this.continuePrompt) this.continuePrompt.setVisible(false);
    if (this.choiceContainer) this.choiceContainer.setVisible(false);
  }

  // Handle choice selection
  selectChoice(choiceIndex) {
    console.log("Choice selected:", choiceIndex);
    const choice = this.currentDialog.choices[choiceIndex];

    // Execute choice actions
    if (choice.actions) {
      this.executeActions(choice.actions);
    }

    // Destroy typewriter timer if it exists
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }

    // Completely destroy and recreate dialog UI to ensure clean state
    this.destroyDialogUI();
    this.createDialogUI();

    // Move to next dialog or close
    if (choice.nextDialog) {
      console.log("Moving to next dialog:", choice.nextDialog.id);
      this.currentDialog = choice.nextDialog;
      this.showDialog();
    } else {
      console.log("No next dialog, closing");
      this.closeDialog();
    }
  }

  // Execute dialog actions
  executeActions(actions) {
    if (!actions) return;

    for (const action of actions) {
      switch (action.type) {
        case "giveItem":
          this.scene.player.addItem(action.item);
          console.log(`Gave item: ${action.item}`);
          break;
        case "removeItem":
          this.scene.player.removeItem(action.item);
          console.log(`Removed item: ${action.item}`);
          break;
        case "giveQuest":
          this.scene.player.addQuest(action.quest);
          console.log(`Gave quest: ${action.quest}`);
          break;
        case "setFlag":
          this.scene.registry.set(action.flag, action.value);
          console.log(`Set flag: ${action.flag} = ${action.value}`);
          break;
        case "changeScene":
          this.scene.scene.start(action.scene);
          break;
        case "giveGold":
          this.scene.player.gold += action.amount;
          console.log(`Gave gold: ${action.amount}`);
          break;
        case "startCombat":
          if (
            this.scene.sceneManager &&
            this.scene.sceneManager.combatManager
          ) {
            this.scene.sceneManager.combatManager.startCombat(
              action.combatData
            );
          }
          break;
        case "fleeCombat":
          if (
            this.scene.sceneManager &&
            this.scene.sceneManager.combatManager
          ) {
            this.scene.sceneManager.combatManager.fleeCombat();
          }
          break;
      }
    }
  }

  // Move to next dialog or close
  nextDialog() {
    if (!this.currentDialog) return;

    // If there are multiple dialog lines, show next one
    if (
      this.currentDialog.dialogs &&
      this.currentDialog.currentIndex < this.currentDialog.dialogs.length - 1
    ) {
      this.currentDialog.currentIndex =
        (this.currentDialog.currentIndex || 0) + 1;
      this.displayDialogText(
        this.currentDialog.dialogs[this.currentDialog.currentIndex]
      );
    } else {
      // Execute any actions and close dialog
      if (this.currentDialog.actions) {
        this.executeActions(this.currentDialog.actions);
      }
      this.closeDialog();
    }
  }

  // Disable player input during dialog
  disablePlayerInput() {
    if (this.scene.player && this.scene.player.cursors) {
      this.scene.player.cursors.left.enabled = false;
      this.scene.player.cursors.right.enabled = false;
      this.scene.player.cursors.up.enabled = false;
      this.scene.player.cursors.down.enabled = false;
    }
    if (this.scene.player && this.scene.player.wasd) {
      this.scene.player.wasd.A.enabled = false;
      this.scene.player.wasd.D.enabled = false;
      this.scene.player.wasd.W.enabled = false;
      this.scene.player.wasd.S.enabled = false;
    }
  }

  // Re-enable player input after dialog
  enablePlayerInput() {
    if (this.scene.player && this.scene.player.cursors) {
      this.scene.player.cursors.left.enabled = true;
      this.scene.player.cursors.right.enabled = true;
      this.scene.player.cursors.up.enabled = true;
      this.scene.player.cursors.down.enabled = true;
    }
    if (this.scene.player && this.scene.player.wasd) {
      this.scene.player.wasd.A.enabled = true;
      this.scene.player.wasd.D.enabled = true;
      this.scene.player.wasd.W.enabled = true;
      this.scene.player.wasd.S.enabled = true;
    }
  }

  // Close dialog
  closeDialog() {
    console.log("Closing dialog...");
    this.isDialogActive = false;

    // Destroy typewriter timer if it exists
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
      console.log("Typewriter timer destroyed");
    }

    // Completely destroy and recreate dialog UI to ensure clean state
    this.destroyDialogUI();
    this.createDialogUI();

    // Reset dialog state
    this.currentDialog = null;
    this.currentNPC = null;

    // Re-enable player movement and input
    if (this.scene.player && this.scene.player.sprite) {
      this.scene.player.sprite.body.setImmovable(false);
    }
    this.enablePlayerInput();

    console.log("Dialog closed successfully");
  }

  // Show interaction prompt when near NPC
  showInteractionPrompt(npc) {
    if (!this.interactionPrompt) {
      this.interactionPrompt = this.scene.add.text(
        npc.x,
        npc.y - 60,
        "Press E to talk",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffff00",
          backgroundColor: "#000000",
          padding: { x: 8, y: 4 },
        }
      );
      this.interactionPrompt.setOrigin(0.5);
      this.interactionPrompt.setDepth(1000);
    } else {
      this.interactionPrompt.setPosition(npc.x, npc.y - 60);
      this.interactionPrompt.setVisible(true);
    }
  }

  // Hide interaction prompt
  hideInteractionPrompt() {
    if (this.interactionPrompt) {
      this.interactionPrompt.setVisible(false);
    }
  }

  // Check if player is near an NPC and show prompt
  checkNPCInteraction() {
    if (this.isDialogActive || !this.scene.player || !this.scene.npcs) return;

    const player = this.scene.player.sprite;
    let nearestNPC = null;
    let nearestDistance = this.interactionDistance;

    // Find the nearest NPC within interaction distance
    for (const npc of this.scene.npcs) {
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        npc.x,
        npc.y
      );

      if (distance <= this.interactionDistance && distance < nearestDistance) {
        nearestNPC = npc;
        nearestDistance = distance;
      }
    }

    if (nearestNPC) {
      this.showInteractionPrompt(nearestNPC);
    } else {
      this.hideInteractionPrompt();
    }
  }

  // Update method to be called from scene update
  update() {
    if (!this.isDialogActive) {
      this.checkNPCInteraction();
    }
  }

  // Clean up
  destroy() {
    if (this.dialogBox) this.dialogBox.destroy();
    if (this.dialogText) this.dialogText.destroy();
    if (this.continuePrompt) this.continuePrompt.destroy();
    if (this.interactionPrompt) this.interactionPrompt.destroy();
    if (this.choiceContainer) this.choiceContainer.destroy();
  }
}
