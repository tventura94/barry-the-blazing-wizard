export class VincentsStoreDialogs {
  constructor(scene) {
    this.scene = scene;
    this.dialogData = null;
    this.loadDialogData();
  }

  // Load dialog data from JSON
  async loadDialogData() {
    try {
      // Dynamically construct JSON file path based on scene name
      const sceneName = this.scene.scene.key;
      const jsonFile = `/assets/dialogs/${sceneName}.json`;

      const response = await fetch(jsonFile);
      if (!response.ok) {
        console.warn(`No dialog file found for ${sceneName}`);
        this.dialogData = this.getDefaultDialogs();
        return;
      }
      this.dialogData = await response.json();
    } catch (error) {
      console.error(
        `Failed to load ${this.scene.scene.key} dialog data:`,
        error
      );
      this.dialogData = this.getDefaultDialogs();
    }
  }

  // Get dialog for specific NPC
  getDialog(npcId) {
    if (!this.dialogData) {
      return this.getDefaultDialog(npcId);
    }

    const npcDialogs = this.dialogData[npcId];
    if (!npcDialogs) {
      return this.getDefaultDialog(npcId);
    }

    // Check for contextual dialogs first
    if (npcDialogs.contextual) {
      for (const contextDialog of npcDialogs.contextual) {
        if (this.checkContextConditions(contextDialog.conditions)) {
          return this.processDialog(contextDialog);
        }
      }
    }

    // Fall back to default dialog
    return this.processDialog(
      npcDialogs.default || this.getDefaultDialog(npcId)
    );
  }

  // Check if context conditions are met
  checkContextConditions(conditions) {
    if (!conditions) return true;

    // Check if player has met Vincent before
    if (conditions.firstMeeting) {
      const hasMetVincent = this.scene.registry.get("metVincent", false);
      return !hasMetVincent;
    }

    // Check if player has specific items
    if (conditions.hasItems) {
      for (const item of conditions.hasItems) {
        if (!this.scene.player.inventory.includes(item)) {
          return false;
        }
      }
    }

    // Check if player has specific quests
    if (conditions.hasQuests) {
      for (const quest of conditions.hasQuests) {
        if (!this.scene.player.quests.includes(quest)) {
          return false;
        }
      }
    }

    // Check player level
    if (
      conditions.minLevel &&
      this.scene.player.PlayerLevel < conditions.minLevel
    ) {
      return false;
    }

    // Check flags
    if (conditions.flags) {
      for (const flag of conditions.flags) {
        const flagValue = this.scene.registry.get(flag.flag, false);
        if (flag.required && !flagValue) return false;
        if (!flag.required && flagValue) return false;
      }
    }

    return true;
  }

  // Process dialog data into the format expected by DialogManager
  processDialog(dialog) {
    if (!dialog) return null;

    const processedDialog = {
      id: dialog.id,
      text: dialog.text,
      actions: dialog.actions || [],
    };

    // Handle multiple dialog lines
    if (dialog.dialogs && Array.isArray(dialog.dialogs)) {
      processedDialog.dialogs = dialog.dialogs;
      processedDialog.currentIndex = 0;
      processedDialog.text = dialog.dialogs[0];
    }

    // Handle choices
    if (dialog.choices && Array.isArray(dialog.choices)) {
      processedDialog.choices = dialog.choices.map((choice) => ({
        text: choice.text,
        actions: choice.actions || [],
        nextDialog: choice.nextDialog
          ? this.processDialog(choice.nextDialog)
          : null,
      }));
    }

    return processedDialog;
  }

  // Get default dialog for NPC
  getDefaultDialog(npcId) {
    const defaultDialogs = {
      vincent: {
        id: "vincent_default",
        text: "Welcome to my store! I have all sorts of magical items for sale. How can I help you today?",
        dialogs: [
          "Welcome to my store! I have all sorts of magical items for sale.",
          "I'm Vincent, the local merchant around these parts.",
          "Feel free to browse my wares, but be careful with the magical ones!",
          "How can I help you today?",
        ],
      },
    };

    return this.processDialog(
      defaultDialogs[npcId] || {
        id: `${npcId}_default`,
        text: `Hello there! I'm ${npcId}. How can I help you?`,
      }
    );
  }

  // Get default dialog data structure
  getDefaultDialogs() {
    return {
      vincent: {
        default: {
          id: "vincent_default",
          text: "Welcome to my store! I have all sorts of magical items for sale. How can I help you today?",
          dialogs: [
            "Welcome to my store! I have all sorts of magical items for sale.",
            "I'm Vincent, the local merchant around these parts.",
            "Feel free to browse my wares, but be careful with the magical ones!",
            "How can I help you today?",
          ],
          choices: [
            {
              text: "What do you have for sale?",
              actions: [
                { type: "setFlag", flag: "askedAboutItems", value: true },
              ],
              nextDialog: {
                id: "vincent_items",
                text: "I have potions, scrolls, and magical trinkets! Here's what I can offer you:",
                choices: [
                  {
                    text: "I'll take a health potion",
                    actions: [
                      { type: "giveItem", item: "health_potion" },
                      { type: "giveGold", amount: -10 },
                    ],
                  },
                  {
                    text: "Show me your scrolls",
                    actions: [
                      {
                        type: "setFlag",
                        flag: "askedAboutScrolls",
                        value: true,
                      },
                    ],
                    nextDialog: {
                      id: "vincent_scrolls",
                      text: "I have fireball scrolls, healing scrolls, and teleportation scrolls. Which interests you?",
                      choices: [
                        {
                          text: "Fireball scroll please",
                          actions: [
                            { type: "giveItem", item: "fireball_scroll" },
                            { type: "giveGold", amount: -25 },
                          ],
                        },
                        {
                          text: "Healing scroll please",
                          actions: [
                            { type: "giveItem", item: "healing_scroll" },
                            { type: "giveGold", amount: -20 },
                          ],
                        },
                        {
                          text: "Actually, I'll pass",
                          actions: [],
                        },
                      ],
                    },
                  },
                  {
                    text: "I'll think about it",
                    actions: [],
                  },
                ],
              },
            },
            {
              text: "Do you have any quests for me?",
              actions: [
                { type: "setFlag", flag: "askedAboutQuests", value: true },
              ],
              nextDialog: {
                id: "vincent_quests",
                text: "Actually, I do have something that needs doing...",
                choices: [
                  {
                    text: "I'm interested!",
                    actions: [
                      { type: "giveQuest", quest: "investigate_forest" },
                    ],
                    nextDialog: {
                      id: "vincent_quest_accepted",
                      text: "Great! There's been strange activity in the forest to the north. Investigate and report back to me!",
                      actions: [
                        {
                          type: "setFlag",
                          flag: "vincent_quest_active",
                          value: true,
                        },
                      ],
                    },
                  },
                  {
                    text: "Maybe later",
                    actions: [],
                  },
                ],
              },
            },
            {
              text: "Just browsing, thanks",
              actions: [],
            },
          ],
        },
        contextual: [
          {
            id: "vincent_first_meeting",
            conditions: {
              firstMeeting: true,
            },
            text: "Oh! A new face in town! Welcome, welcome!",
            dialogs: [
              "Oh! A new face in town! Welcome, welcome!",
              "I don't think I've seen you around here before.",
              "I'm Vincent, and this is my humble little shop.",
              "Feel free to look around - I have some interesting items that might catch your eye!",
            ],
            actions: [{ type: "setFlag", flag: "metVincent", value: true }],
          },
          {
            id: "vincent_has_crystal",
            conditions: {
              hasItems: ["mysterious_crystal"],
            },
            text: "Is that... a mysterious crystal? Where did you find such a thing?",
            dialogs: [
              "Is that... a mysterious crystal?",
              "Where did you find such a thing?",
              "That's exactly what I was looking for!",
              "Here, take this reward for bringing it to me!",
            ],
            choices: [
              {
                text: "I found it in the forest",
                actions: [
                  { type: "removeItem", item: "mysterious_crystal" },
                  { type: "giveGold", amount: 100 },
                  { type: "setFlag", flag: "crystal_delivered", value: true },
                ],
              },
              {
                text: "I'm not sure where I got it",
                actions: [
                  { type: "removeItem", item: "mysterious_crystal" },
                  { type: "giveGold", amount: 50 },
                  { type: "setFlag", flag: "crystal_delivered", value: true },
                ],
              },
            ],
          },
        ],
      },
    };
  }
}
