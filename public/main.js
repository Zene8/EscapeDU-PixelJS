document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    const app = new PIXI.Application();
    const initialSize = Math.min(window.innerWidth, window.innerHeight);
    await app.init({ 
      width: initialSize,
      height: initialSize
     });

    app.canvas.style.position = 'absolute';
    app.canvas.style.display = 'flex';
    app.canvas.style.justifycontent = 'center';
    console.log("Canvas element created:", app.canvas);

    // Attach the canvas to the document
    document.body.appendChild(app.canvas);

    // Variables
    let player;
    let hints = [];
    let background;
    let currentRoomId = 'room1';

    // Loading screen
    const loadingText = new PIXI.Text('Loading...', {
      fill: 'white',
      fontSize: 24,
    });
    loadingText.anchor.set(0.5);
    loadingText.x = app.screen.width / 2;
    loadingText.y = app.screen.height / 2;
    app.stage.addChild(loadingText);

    // Fetch room data
    async function fetchRoomData(roomId) {
      try {
        const response = await fetch(`/room/${roomId}`);
        if (!response.ok) throw new Error(`Failed to fetch room data: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    }

    // Fetch sprite data
    async function fetchSpriteData(spriteId) {
      try {
        const response = await fetch(`/sprite/${spriteId}`);
        if (!response.ok) throw new Error(`Failed to fetch sprite data: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching sprite data:', error);
      }
    }

    // Load room
    async function loadRoom(roomId, playerID) {
      app.stage.removeChildren();
      app.stage.addChild(loadingText);

      try {
        currentRoomId = roomId;
        const room = await fetchRoomData(roomId);
        const playerData = await fetchSpriteData(playerID);

        // Load assets
        await PIXI.Assets.load([room.background, playerData.sprite]);

        // Background
        background = PIXI.Sprite.from(room.background);
        if (background) {
          background.width = initialSize;
          background.height = initialSize;
        }
        app.stage.addChild(background);

        // Player
        if (!player) {
          player = PIXI.Sprite.from(playerData.sprite);
          player.anchor.set(0.5);
          player.width = app.screen.width * 0.05;
          player.height = player.width;
          player.x = app.screen.width / 2;
          player.y = app.screen.height / 2;
        }
        app.stage.addChild(player);

        // Hints
        hints = room.hints.map((hint) => ({
          ...hint,
          radius: hint.radius || 50,
          sprite: createHintSprite(hint),
        }));

        // Door
        createDoor(room.door);
      } catch (error) {
        console.error('Error loading room:', error);
      } finally {
        app.stage.removeChild(loadingText);
      }
    }

    // Create hint sprite
    function createHintSprite(hint) {
      const hintSprite = new PIXI.Graphics()
        .beginFill(0xff0000)
        .drawCircle(0, 0, hint.radius || 10)
        .endFill();
      hintSprite.x = hint.x;
      hintSprite.y = hint.y;
      hintSprite.interactive = true;
      hintSprite.buttonMode = true;
      hintSprite.on('pointerdown', () => unlockHint(hint));
      app.stage.addChild(hintSprite);
      return hintSprite;
    }

    // Unlock hint
    function unlockHint(hint) {
      if (hint.unlocked) return;
      hint.unlocked = true;
      alert(`Hint: ${hint.description}`);
    }

    // Create door
    function createDoor(door) {
      const doorSprite = new PIXI.Graphics()
        .beginFill(0x00ff00)
        .drawRect(0, 0, 50, 100)
        .endFill();
      doorSprite.x = door.x;
      doorSprite.y = door.y;
      doorSprite.interactive = true;
      doorSprite.buttonMode = true;
      doorSprite.on('pointerdown', () => openDoor(door));
      app.stage.addChild(doorSprite);
    }

    // Open the door
    function openDoor(door) {
      const distance = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2);
      if (distance > (door.interactDistance || 50)) {
        alert("You're too far from the door!");
        return;
      }
      const code = prompt('Enter the code to unlock the door:');
      if (code === door.code) {
        alert('Correct! Moving to the next room...');
        loadRoom(door.nextRoom, 'player1');
      } else {
        alert('Incorrect code. Try again.');
      }
    }

    // Player movement
    const keys = {};
    window.addEventListener('keydown', (e) => (keys[e.key] = true));
    window.addEventListener('keyup', (e) => (keys[e.key] = false));

    function updatePlayer(delta) {
      const speed = 5;
      if (keys['ArrowUp']) player.y = Math.max(0, player.y - speed);
      if (keys['ArrowDown']) player.y = Math.min(app.screen.height - player.height, player.y + speed);
      if (keys['ArrowLeft']) player.x = Math.max(0, player.x - speed);
      if (keys['ArrowRight']) player.x = Math.min(app.screen.width - player.width, player.x + speed);
      checkProximity();
    }

    // Check proximity to hints
    function checkProximity() {
      hints.forEach((hint) => {
        const distance = Math.sqrt((player.x - hint.x) ** 2 + (player.y - hint.y) ** 2);
        hint.sprite.visible = distance <= hint.radius && !hint.unlocked;
      });
    }

    // Scale game elements
    function scaleGameElements(size) {
      if (player) {
        player.width = size * 0.05; // 5% of the game window
        player.height = player.width;
      }
    
      hints.forEach((hint) => {
        if (hint.sprite) {
          hint.sprite.clear()
            .Fill(0xff0000)
            .drawCircle(0, 0, size * 0.02) // 2% of the game window
            .Fill();
        }
      });
    }
    
    
    // Resize event
    window.addEventListener('resize', () => {
      // Determine the smaller dimension for the square aspect ratio
      const size = Math.min(window.innerWidth, window.innerHeight);
    
      // Resize the PIXI application to the new size
      app.renderer.resize(size, size);
    
      // Adjust the background to fill the square game window
      if (background) {
        background.width = size;
        background.height = size;
      }
    
      // Scale other game elements
      scaleGameElements(size);
    });
    

    // Game loop
    app.ticker.add((delta) => updatePlayer(delta));

    // Load the first room
    await loadRoom('room1', 'player1');
  })();
});
