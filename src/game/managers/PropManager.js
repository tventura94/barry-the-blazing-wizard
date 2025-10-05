import { DEBUG_CONFIG } from "../main.js";

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
      // Create the prop sprite with physics body
      // Use sprite for animated props, staticImage for static props
      const prop = propData.animation
        ? this.scene.physics.add.sprite(
            propData.x,
            propData.y,
            propData.texture
          )
        : this.scene.physics.add.staticImage(
            propData.x,
            propData.y,
            propData.texture
          );

      // Set the prop ID for reference
      prop.propId = propData.id;

      // Make animated props immovable like static props
      if (propData.animation) {
        prop.body.setImmovable(true);
      }

      // Apply scaling if specified
      if (propData.scale !== undefined) {
        prop.setScale(propData.scale);
      }

      // Set depth for the prop (use JSON config or default to 100)
      const depth = propData.depth !== undefined ? propData.depth : 100;
      prop.setDepth(depth);

      // Create and play animation if specified
      if (propData.animation) {
        console.log(
          `Creating animation for prop ${propData.id}:`,
          propData.animation
        );
        this.createPropAnimation(propData.animation);
        console.log(
          `Playing animation "${propData.animation.key}" for prop ${propData.id}`
        );
        prop.play(propData.animation.key);
      }

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

        // Set depth to be above player (higher z-index) when player is not in pass-through area
        passThroughBody.setDepth(200);

        // Debug visualization for pass-through bodies only if debug is enabled
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.showPassThroughBodies) {
          const debugGraphics = this.scene.add.graphics();
          debugGraphics.lineStyle(2, 0x00ff00, 1); // Green for pass-through bodies
          debugGraphics.strokeRect(
            passThroughBody.x - bodyData.bodySize.width / 2,
            passThroughBody.y - bodyData.bodySize.height / 2,
            bodyData.bodySize.width,
            bodyData.bodySize.height
          );
          passThroughBody.debugGraphics = debugGraphics;
        }

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

        // Add debug visualization for additional collision bodies only if debug is enabled
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.showCollisionBodies) {
          const debugGraphics = this.scene.add.graphics();
          debugGraphics.lineStyle(2, 0xff0000, 1); // Red for additional collision bodies
          debugGraphics.strokeRect(
            additionalBody.x - bodyData.bodySize.width / 2,
            additionalBody.y - bodyData.bodySize.height / 2,
            bodyData.bodySize.width,
            bodyData.bodySize.height
          );
          additionalBody.debugGraphics = debugGraphics;
        }

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

  createPropAnimation(animationConfig) {
    // Create animation if it doesn't already exist
    if (!this.scene.anims.exists(animationConfig.key)) {
      console.log(
        `Creating new animation: ${animationConfig.key}`,
        animationConfig
      );

      // Use generateFrameNumbers if frames array is not provided
      let frames;
      if (animationConfig.frames) {
        frames = animationConfig.frames;
      } else if (
        animationConfig.spriteKey &&
        animationConfig.startFrame !== undefined &&
        animationConfig.endFrame !== undefined
      ) {
        frames = this.scene.anims.generateFrameNumbers(
          animationConfig.spriteKey,
          {
            start: animationConfig.startFrame,
            end: animationConfig.endFrame,
          }
        );
      } else {
        console.error(
          `Invalid animation config for ${animationConfig.key}: missing frames or spriteKey/startFrame/endFrame`
        );
        return;
      }

      this.scene.anims.create({
        key: animationConfig.key,
        frames: frames,
        frameRate: animationConfig.frameRate || 3,
        repeat:
          animationConfig.repeat !== undefined ? animationConfig.repeat : -1,
      });
      console.log(`Animation "${animationConfig.key}" created successfully`);
    } else {
      console.log(`Animation "${animationConfig.key}" already exists`);
    }
  }

  clearProps() {
    // Destroy all props and their additional physics bodies
    this.props.forEach((prop) => {
      if (prop) {
        // Destroy additional collision bodies first
        if (prop.additionalBodies) {
          prop.additionalBodies.forEach((additionalBody) => {
            if (additionalBody) {
              // Destroy debug graphics if they exist
              if (
                additionalBody.debugGraphics &&
                additionalBody.debugGraphics.destroy
              ) {
                additionalBody.debugGraphics.destroy();
              }
              // Destroy the additional body
              if (additionalBody.destroy) {
                additionalBody.destroy();
              }
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
