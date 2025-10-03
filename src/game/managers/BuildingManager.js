export class BuildingManager {
  constructor(scene) {
    this.scene = scene;
  }

  createBuildingFromData(buildingData) {
    // Add building to the scene with physics body
    const building = this.scene.physics.add
      .staticImage(buildingData.x, buildingData.y, buildingData.texture)
      .setScale(buildingData.scale);

    // Set collision box for the building
    building.body.setSize(
      buildingData.physics.bodySize.width,
      buildingData.physics.bodySize.height
    );
    building.body.setOffset(
      buildingData.physics.bodyOffset.x,
      buildingData.physics.bodyOffset.y
    );

    // Add custom properties to track building state
    building.buildingId = buildingData.id;
    building.originalTexture = buildingData.texture;
    building.isDoorOpen = false;

    // Use door configuration from JSON if available
    if (buildingData.door) {
      building.doorEnabled = buildingData.door.enabled || false;
      building.doorOpenTexture = buildingData.door.openTexture;
      building.doorCloseDistance = buildingData.door.closeDistance || 120;

      // Create door trigger zone if configured (for door sprite switching)
      if (buildingData.door.triggerZone) {
        building.doorTriggerZone = this.createDoorTriggerZone(
          buildingData.x,
          buildingData.y,
          buildingData.door.triggerZone,
          building
        );
        console.log(
          `Created door trigger zone for building ${buildingData.id} at (${
            buildingData.x + buildingData.door.triggerZone.offsetX
          }, ${buildingData.y + buildingData.door.triggerZone.offsetY})`
        );
      }

      // Create door interaction zone if configured (for scene transitions)
      if (buildingData.door.interactionZone) {
        building.doorInteractionZone = this.createDoorInteractionZone(
          buildingData.x,
          buildingData.y,
          buildingData.door.interactionZone,
          buildingData.door.targetScene,
          buildingData.door.targetPosition
        );
        console.log(
          `Created door interaction zone for building ${buildingData.id} at (${
            buildingData.x + buildingData.door.interactionZone.offsetX
          }, ${buildingData.y + buildingData.door.interactionZone.offsetY})`
        );
      }
    }

    return building;
  }

  createBuildingsFromLevelData(levelData) {
    const buildings = [];
    levelData.buildings.forEach((buildingData) => {
      const building = this.createBuildingFromData(buildingData);
      buildings.push(building);
    });
    return buildings;
  }

  clearBuildings(buildings) {
    if (buildings) {
      // Clear door interaction zones first
      this.clearDoorInteractionZones(buildings);

      buildings.forEach((building) => {
        if (building && building.destroy) {
          building.destroy();
        }
      });
    }
  }

  // Method to toggle door state for a building
  toggleDoorState(building) {
    if (building && building.buildingId) {
      building.isDoorOpen = !building.isDoorOpen;
      const newTexture = building.isDoorOpen
        ? building.doorOpenTexture
        : building.originalTexture;
      building.setTexture(newTexture);
      console.log(
        `Building ${building.buildingId} door is now ${
          building.isDoorOpen ? "open" : "closed"
        }`
      );
    }
  }

  // Method to check if a building can have its door toggled
  canToggleDoor(building) {
    return (
      building &&
      building.buildingId &&
      building.doorEnabled &&
      building.originalTexture === "building1"
    );
  }

  // Create door trigger zone for door sprite switching
  createDoorTriggerZone(buildingX, buildingY, triggerZoneData, building) {
    // Calculate the position of the trigger zone relative to the building
    const zoneX = buildingX + triggerZoneData.offsetX;
    const zoneY = buildingY + triggerZoneData.offsetY;

    // Create a simple image (not physics body) for the door trigger zone
    const doorTriggerZone = this.scene.add.image(zoneX, zoneY, null);

    // Set the size of the trigger zone
    doorTriggerZone.setDisplaySize(
      triggerZoneData.width,
      triggerZoneData.height
    );

    // Add properties for door triggering
    doorTriggerZone.isDoorTriggerZone = true;
    doorTriggerZone.building = building; // Reference to the building this zone controls
    doorTriggerZone.zoneWidth = triggerZoneData.width;
    doorTriggerZone.zoneHeight = triggerZoneData.height;

    // Make the zone invisible (no visual representation)
    doorTriggerZone.setVisible(false);

    return doorTriggerZone;
  }

  // Create door interaction zone for scene transitions
  createDoorInteractionZone(
    buildingX,
    buildingY,
    interactionZoneData,
    targetScene,
    targetPosition
  ) {
    // Calculate the position of the interaction zone relative to the building
    const zoneX = buildingX + interactionZoneData.offsetX;
    const zoneY = buildingY + interactionZoneData.offsetY;

    // Create an invisible physics body for the door interaction zone
    const doorZone = this.scene.physics.add.staticImage(zoneX, zoneY, null);

    // Set the size of the interaction zone
    doorZone.body.setSize(
      interactionZoneData.width,
      interactionZoneData.height
    );
    doorZone.body.setOffset(
      -interactionZoneData.width / 2,
      -interactionZoneData.height / 2
    );

    // Add properties for scene transition
    doorZone.targetScene = targetScene;
    doorZone.targetPosition = targetPosition;
    doorZone.isDoorZone = true;

    // Make the zone invisible for production
    doorZone.setVisible(false);

    return doorZone;
  }

  // Clear door interaction zones and trigger zones when clearing buildings
  clearDoorInteractionZones(buildings) {
    if (buildings) {
      buildings.forEach((building) => {
        if (
          building &&
          building.doorInteractionZone &&
          building.doorInteractionZone.destroy
        ) {
          building.doorInteractionZone.destroy();
        }
        if (
          building &&
          building.doorTriggerZone &&
          building.doorTriggerZone.destroy
        ) {
          building.doorTriggerZone.destroy();
        }
      });
    }
  }
}
