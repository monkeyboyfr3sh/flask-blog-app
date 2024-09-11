window.onload = function() {
    let fps = 60; // Initial FPS value
    let emulatorInterval;
    let waitingForInput = null; // To store the button being remapped
    let lastHighlighted = null; // To store the last highlighted element

    // Make body visible after everything is fully loaded
    document.body.style.visibility = 'visible';

    const nes = new jsnes.NES({
        onFrame: function(framebuffer_24) {
            const canvas = document.getElementById('nes-canvas');
            const context = canvas.getContext('2d');
            const imageData = context.createImageData(256, 240);

            // Populate imageData with NES framebuffer data
            for (let i = 0; i < framebuffer_24.length; i++) {
                imageData.data[i * 4 + 2] = (framebuffer_24[i] >> 16) & 0xFF;  // Red
                imageData.data[i * 4 + 1] = (framebuffer_24[i] >> 8) & 0xFF;   // Green
                imageData.data[i * 4 + 0] = framebuffer_24[i] & 0xFF;          // Blue
                imageData.data[i * 4 + 3] = 0xFF;                              // Alpha
            }

            // Create an offscreen canvas to hold the original NES frame (256x240)
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = 256;
            offscreenCanvas.height = 240;
            const offscreenContext = offscreenCanvas.getContext('2d');
            offscreenContext.putImageData(imageData, 0, 0);

            // Scale and draw the offscreen canvas onto the visible canvas, fitting the entire space
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
        }
    });


    // Initial key mapping
    let controlMapping = {
        'Enter': jsnes.Controller.BUTTON_START,
        'c': jsnes.Controller.BUTTON_SELECT,
        'x': jsnes.Controller.BUTTON_A,
        'z': jsnes.Controller.BUTTON_B,
        'ArrowUp': jsnes.Controller.BUTTON_UP,
        'ArrowDown': jsnes.Controller.BUTTON_DOWN,
        'ArrowLeft': jsnes.Controller.BUTTON_LEFT,
        'ArrowRight': jsnes.Controller.BUTTON_RIGHT
    };

    // Update the sidebar button map visually
    function updateSidebarMap(button, newKey) {
        const mapElement = {
            'start': 'map-start',
            'select': 'map-select',
            'a': 'map-a',
            'b': 'map-b',
            'up': 'map-up',
            'down': 'map-down',
            'left': 'map-left',
            'right': 'map-right'
        };

        const elementId = mapElement[button];
        const listItem = document.getElementById(elementId);
        if (listItem) {
            listItem.textContent = `${button.charAt(0).toUpperCase() + button.slice(1)}: ${newKey}`;
        }
    }

    // Handle button remapping clicks
    document.getElementById('button-map').addEventListener('click', (event) => {
        const button = event.target.getAttribute('data-button');
        if (button) {
            waitingForInput = button;

            // Highlight the clicked button
            if (lastHighlighted) {
                lastHighlighted.classList.remove('highlight');  // Remove highlight from the last element
            }
            event.target.classList.add('highlight');  // Add highlight to the current element
            lastHighlighted = event.target;  // Store the current element
        }
    });

    document.addEventListener('keydown', (event) => {
        const button = controlMapping[event.key];
        
        if (button !== undefined || event.code === 'Space') {
            nes.buttonDown(1, button);
            event.preventDefault();  // Prevent default behavior (e.g., arrow key scrolling, spacebar scrolling)
        }
    
        if (waitingForInput) {
            // Remapping in progress
            const newKey = event.key;
            controlMapping[newKey] = jsnes.Controller[`BUTTON_${waitingForInput.toUpperCase()}`];
            updateSidebarMap(waitingForInput, newKey);  // Update the sidebar with the new key
    
            // Remove the highlight after the key is set
            if (lastHighlighted) {
                lastHighlighted.classList.remove('highlight');
            }
    
            waitingForInput = null;  // Reset waiting state
            lastHighlighted = null;  // Reset last highlighted element
            return;
        }
    });

    document.addEventListener('keyup', (event) => {
        const button = controlMapping[event.key];
        if (button !== undefined) {
            nes.buttonUp(1, button);
            event.preventDefault();  // Prevent default behavior (e.g., arrow key scrolling)
        }
    });

    // Load ROM file
    document.getElementById('rom-loader').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            // Progress tracking
            document.getElementById('loading-container').style.display = 'block';
            reader.onprogress = function(event) {
                if (event.lengthComputable) {
                    const percentLoaded = Math.round((event.loaded / event.total) * 100);
                    document.getElementById('progress-bar').value = percentLoaded;
                    document.getElementById('progress-percent').textContent = percentLoaded + '%';
                }
            };

            // Load the ROM as binary string
            reader.onload = function() {
                try {
                    const binaryString = reader.result;
                    nes.loadROM(binaryString);
                    startEmulator();  // Start emulator once ROM is loaded
                    document.getElementById('loading-container').style.display = 'none';
                } catch (error) {
                    console.error("Error loading ROM:", error);
                    alert("Failed to load ROM. Please try again with a valid ROM.");
                }
            };

            reader.onerror = function() {
                console.error("Failed to read the ROM file.");
                alert("Error reading the file. Please try again.");
            };

            reader.readAsBinaryString(file);
        }
    });

    // Emulator loop with dynamic FPS
    function startEmulator() {
        if (emulatorInterval) {
            clearInterval(emulatorInterval);  // Clear previous interval if it exists
        }

        const frameDuration = 1000 / fps; // Frame duration in milliseconds

        emulatorInterval = setInterval(() => {
            nes.frame();  // Render the next frame of the game
        }, frameDuration);

        // Update FPS display
        document.getElementById('fps-display').textContent = fps;
    }

    // Function to update FPS and restart the emulator with the new FPS
    function updateFPS(newFPS) {
        fps = newFPS;
        startEmulator(); // Restart the emulator loop with the updated FPS
    }

    // FPS control buttons
    document.getElementById('increase-fps').addEventListener('click', () => {
        if (fps < 120) {  // Set a max limit, e.g., 120 FPS
            updateFPS(fps + 1);
        }
    });

    document.getElementById('decrease-fps').addEventListener('click', () => {
        if (fps > 1) {  // Set a min limit, e.g., 1 FPS
            updateFPS(fps - 1);
        }
    });

    // Resize canvas dynamically
    window.addEventListener('resize', resizeCanvas);

    function resizeCanvas() {
        const canvas = document.getElementById('nes-canvas');
        const container = document.getElementById('canvas-container');
    
        let scale;
        if (document.fullscreenElement) {
            // Full-screen scaling
            scale = Math.min(window.innerWidth / 256, window.innerHeight / 240);
            canvas.width = Math.floor(256 * scale);
            canvas.height = Math.floor(240 * scale);
        } else {
            // Normal scaling based on container width/height
            scale = Math.min(container.clientWidth / 256, container.clientHeight / 240);
            canvas.width = Math.floor(256 * scale);
            canvas.height = Math.floor(240 * scale);
        }
    
        // Keep the sidebar intact by ensuring only the canvas resizes
        container.style.width = `${canvas.width}px`;
        container.style.height = `${canvas.height}px`;
    }

    // Trigger initial resize on page load
    window.addEventListener('load', resizeCanvas);

    // Full screen mode
    document.getElementById('fullscreen').addEventListener('click', function() {
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer.requestFullscreen) {
            canvasContainer.requestFullscreen();
        } else if (canvasContainer.mozRequestFullScreen) { 
            canvasContainer.mozRequestFullScreen();
        } else if (canvasContainer.webkitRequestFullscreen) { 
            canvasContainer.webkitRequestFullscreen();
        } else if (canvasContainer.msRequestFullscreen) { 
            canvasContainer.msRequestFullscreen();
        }
    });

    // Trigger initial resize
    window.dispatchEvent(new Event('resize'));
};