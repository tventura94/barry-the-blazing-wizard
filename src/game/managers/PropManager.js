export class PropManager {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
  }

  createPropsFromLevelData(levelData) {
    if (!levelData.props || !Array.isArray(levelData.props)) {
      console.log("No props found in level data");
      return [];
    }

    const createdProps = [];

    levelData.props.forEach((propData) => {
      const prop = this.createProp(propData);
      if (prop) {
        createdProps.push(prop);
        this.props.push(prop);
      }
    });

    console.log(`Created ${createdProps.length} props`);
    return createdProps;
  }

  createProp(propData) {
    try {
      // Create the prop sprite with physics body directly (like buildings)
      const prop = this.scene.physics.add.staticImage(
        propData.x,
        propData.y,
        propData.texture
      );

      // Set the prop ID for reference
      prop.propId = propData.id;

      // Set up physics body size and offset if specified
      if (propData.physics && propData.physics.bodySize) {
        const bodySize = propData.physics.bodySize;
        const bodyOffset = propData.physics.bodyOffset || { x: 0, y: 0 };

        // Set body size
        prop.body.setSize(bodySize.width, bodySize.height);

        // Set body offset
        prop.body.setOffset(bodyOffset.x, bodyOffset.y);
      }

      // Debug logging
      console.log(`Prop ${propData.id} physics body:`, {
        immovable: prop.body.immovable,
        size: { width: prop.body.width, height: prop.body.height },
        offset: { x: prop.body.offset.x, y: prop.body.offset.y },
        position: { x: prop.x, y: prop.y },
      });

      console.log(
        `Created prop: ${propData.id} at (${propData.x}, ${propData.y})`
      );
      return prop;
    } catch (error) {
      console.error(`Failed to create prop ${propData.id}:`, error);
      return null;
    }
  }

  clearProps() {
    // Destroy all props
    this.props.forEach((prop) => {
      if (prop && prop.destroy) {
        prop.destroy();
      }
    });
    this.props = [];
  }

  getProps() {
    return this.props;
  }
}
