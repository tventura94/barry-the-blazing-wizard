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
      // Create the prop sprite with physics body directly (same as buildings)
      const prop = this.scene.physics.add.staticImage(
        propData.x,
        propData.y,
        propData.texture
      );

      // Set the prop ID for reference
      prop.propId = propData.id;

      // Handle multiple physics bodies if specified
      if (
        propData.physics &&
        propData.physics.bodies &&
        Array.isArray(propData.physics.bodies)
      ) {
        // Find the first collision body to use as the main body
        const collisionBody = propData.physics.bodies.find(
          (body) => body.type === "collision"
        );
        if (collisionBody) {
          prop.body.setSize(
            collisionBody.bodySize.width,
            collisionBody.bodySize.height
          );
          prop.body.setOffset(
            collisionBody.bodyOffset.x,
            collisionBody.bodyOffset.y
          );
        }

        // Create additional physics bodies for all bodies
        prop.additionalBodies = [];
        prop.passThroughBodies = [];

        propData.physics.bodies.forEach((bodyData, index) => {
          if (bodyData.type === "collision" && bodyData === collisionBody) {
            // Skip the main collision body (already handled above)
            return;
          }

          const additionalBody = this.createAdditionalPhysicsBody(
            prop,
            bodyData,
            index
          );
          if (additionalBody) {
            if (bodyData.type === "pass-through") {
              prop.passThroughBodies.push(additionalBody);
            } else {
              prop.additionalBodies.push(additionalBody);
            }
          }
        });
      } else if (propData.physics && propData.physics.bodySize) {
        // Single physics body (legacy support - same as buildings)
        prop.body.setSize(
          propData.physics.bodySize.width,
          propData.physics.bodySize.height
        );
        prop.body.setOffset(
          propData.physics.bodyOffset.x,
          propData.physics.bodyOffset.y
        );
      }

      // Debug visualization disabled for main collision body
      // const debugGraphics = this.scene.add.graphics();
      // debugGraphics.lineStyle(2, 0xff0000, 1); // Red for main collision body
      // debugGraphics.strokeRect(
      //   prop.x + prop.body.offset.x - prop.body.width / 2,
      //   prop.y + prop.body.offset.y - prop.body.height / 2,
      //   prop.body.width,
      //   prop.body.height
      // );
      // prop.debugGraphics = debugGraphics;

      // Debug logging
      console.log(`Prop ${propData.id} physics body:`, {
        immovable: prop.body.immovable,
        size: { width: prop.body.width, height: prop.body.height },
        offset: { x: prop.body.offset.x, y: prop.body.offset.y },
        position: { x: prop.x, y: prop.y },
      });

      if (prop.additionalBodies) {
        console.log(`  Additional bodies: ${prop.additionalBodies.length}`);
      }

      console.log(
        `Created prop: ${propData.id} at (${propData.x}, ${propData.y})`
      );
      return prop;
    } catch (error) {
      console.error(`Failed to create prop ${propData.id}:`, error);
      return null;
    }
  }

  createAdditionalPhysicsBody(prop, bodyData, index) {
    try {
      if (bodyData.type === "pass-through") {
        // For pass-through bodies, create a simple image (no physics) for z-index layering
        const passThroughBody = this.scene.add.image(
          prop.x + (bodyData.bodyOffset?.x || 0),
          prop.y + (bodyData.bodyOffset?.y || 0),
          "transparent"
        );

        // Set size
        passThroughBody.setDisplaySize(
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );

        // Store reference to parent prop
        passThroughBody.parentProp = prop;
        passThroughBody.bodyIndex = index;
        passThroughBody.bodyType = "pass-through";

        // Make it invisible
        passThroughBody.setVisible(false);

        // Set depth to be above player (higher z-index)
        passThroughBody.setDepth(1000);

        // Debug visualization for pass-through bodies (temporarily enabled)
        const debugGraphics = this.scene.add.graphics();
        debugGraphics.lineStyle(2, 0x00ff00, 1); // Green for pass-through bodies
        debugGraphics.strokeRect(
          passThroughBody.x - bodyData.bodySize.width / 2,
          passThroughBody.y - bodyData.bodySize.height / 2,
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );
        passThroughBody.debugGraphics = debugGraphics;

        console.log(`Pass-through body ${index} for prop ${prop.propId}:`, {
          size: {
            width: passThroughBody.displayWidth,
            height: passThroughBody.displayHeight,
          },
          position: { x: passThroughBody.x, y: passThroughBody.y },
          depth: passThroughBody.depth,
        });

        return passThroughBody;
      } else {
        // For collision bodies, create physics body as before
        const additionalBody = this.scene.physics.add.staticImage(
          prop.x + (bodyData.bodyOffset?.x || 0),
          prop.y + (bodyData.bodyOffset?.y || 0),
          "transparent"
        );

        // Set body size and offset
        additionalBody.body.setSize(
          bodyData.bodySize.width,
          bodyData.bodySize.height
        );
        additionalBody.body.setOffset(0, 0);

        // Store reference to parent prop
        additionalBody.parentProp = prop;
        additionalBody.bodyIndex = index;
        additionalBody.bodyType = "collision";

        // Make the physics body invisible
        additionalBody.setVisible(false);

        console.log(
          `Additional collision body ${index} for prop ${prop.propId}:`,
          {
            immovable: additionalBody.body.immovable,
            size: {
              width: additionalBody.body.width,
              height: additionalBody.body.height,
            },
            offset: {
              x: additionalBody.body.offset.x,
              y: additionalBody.body.offset.y,
            },
            position: { x: additionalBody.x, y: additionalBody.y },
          }
        );

        return additionalBody;
      }
    } catch (error) {
      console.error(
        `Failed to create additional physics body ${index} for prop ${prop.propId}:`,
        error
      );
      return null;
    }
  }

  clearProps() {
    // Destroy all props and their additional physics bodies
    this.props.forEach((prop) => {
      if (prop) {
        // Destroy additional collision bodies first
        if (prop.additionalBodies) {
          prop.additionalBodies.forEach((additionalBody) => {
            if (additionalBody && additionalBody.destroy) {
              additionalBody.destroy();
            }
          });
        }

        // Destroy pass-through bodies
        if (prop.passThroughBodies) {
          prop.passThroughBodies.forEach((passThroughBody) => {
            if (passThroughBody) {
              // Destroy debug graphics if they exist
              if (
                passThroughBody.debugGraphics &&
                passThroughBody.debugGraphics.destroy
              ) {
                passThroughBody.debugGraphics.destroy();
              }
              // Destroy the pass-through body
              if (passThroughBody.destroy) {
                passThroughBody.destroy();
              }
            }
          });
        }

        // Debug graphics cleanup (disabled for main body)
        // if (prop.debugGraphics && prop.debugGraphics.destroy) {
        //   prop.debugGraphics.destroy();
        // }

        // Then destroy the prop itself (main physics body is destroyed with the prop)
        if (prop.destroy) {
          prop.destroy();
        }
      }
    });
    this.props = [];
  }

  getProps() {
    return this.props;
  }
}
