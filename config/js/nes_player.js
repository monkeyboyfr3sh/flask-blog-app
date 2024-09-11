document.addEventListener('DOMContentLoaded', function() {
    let fps = 80; // Initial FPS value
    let originalFPS = fps; // Store the original FPS value
    let fpsBoostActive = false; // Boolean to track if FPS boost is active
    let emulatorInterval;
    let waitingForInput = null; // To store the button being remapped
    let lastHighlighted = null; // To store the last highlighted element

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

            // Scale and draw the offscreen canvas onto the visible canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
        }
    });

    // Initial key mapping, now including FPS Boost
    let controlMapping = {
        'Enter': jsnes.Controller.BUTTON_START,
        'c': jsnes.Controller.BUTTON_SELECT,
        'x': jsnes.Controller.BUTTON_A,
        'z': jsnes.Controller.BUTTON_B,
        'ArrowUp': jsnes.Controller.BUTTON_UP,
        'ArrowDown': jsnes.Controller.BUTTON_DOWN,
        'ArrowLeft': jsnes.Controller.BUTTON_LEFT,
        'ArrowRight': jsnes.Controller.BUTTON_RIGHT,
        'f': 'fpsBoost'  // Default mapping for FPS Boost
    };

    // Function to temporarily set FPS to 200
    function activateFPSBoost() {
        if (!fpsBoostActive) {  // Only set original FPS if boost is not already active
            originalFPS = fps;  // Store the current FPS
            updateFPS(20);      // Temporarily set FPS to 200
            fpsBoostActive = true; // Set flag to indicate FPS boost is active
        }
    }

    // Function to revert FPS to the original value
    function deactivateFPSBoost() {
        if (fpsBoostActive) {  // Only revert if boost is active
            updateFPS(originalFPS);  // Revert to the original FPS
            fpsBoostActive = false;  // Reset flag to indicate boost is no longer active
        }
    }

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
            'right': 'map-right',
            'fpsBoost': 'map-fps-boost'  // Added FPS Boost to the map
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
                lastHighlighted.classList.remove('highlight');
            }
            event.target.classList.add('highlight');
            lastHighlighted = event.target;
        }
    });

    document.addEventListener('keydown', (event) => {
        const button = controlMapping[event.key];
        const element = document.querySelector(`[data-button="${event.key}"]`);
    
        // If an element exists for the pressed key, add the 'active' class
        if (element) {
            element.classList.add('active');
        }
    
        if (button !== undefined && button !== 'fpsBoost') {
            nes.buttonDown(1, button);
            event.preventDefault();  // Prevent default behavior (e.g., arrow key scrolling)
        }
    
        if (button === 'fpsBoost') {
            activateFPSBoost();  // Activate FPS boost when the key is pressed
        }
    
        if (waitingForInput) {
            const newKey = event.key;
            controlMapping[newKey] = (waitingForInput === 'fpsBoost')
                ? 'fpsBoost'
                : jsnes.Controller[`BUTTON_${waitingForInput.toUpperCase()}`];
            updateSidebarMap(waitingForInput, newKey);
    
            // Remove highlight and reset waiting state
            if (lastHighlighted) {
                lastHighlighted.classList.remove('highlight');
            }
            waitingForInput = null;
            lastHighlighted = null;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        const button = controlMapping[event.key];
        const element = document.querySelector(`[data-button="${event.key}"]`);
    
        // If an element exists for the released key, remove the 'active' class
        if (element) {
            element.classList.remove('active');
        }
    
        if (button === 'fpsBoost') {
            deactivateFPSBoost();  // Deactivate FPS boost when the key is released
        } else if (button !== undefined) {
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

        const frameDuration = 1000 / fps;  // Frame duration in milliseconds

        emulatorInterval = setInterval(() => {
            nes.frame();  // Render the next frame of the game
        }, frameDuration);
    }

    function updateFPS(newFPS) {
        fps = newFPS;
        document.getElementById('fps-display').textContent = fps;
        startEmulator();  // Restart the emulator loop with the updated FPS
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

    // Save State Function to File
    function saveStateToFile() {
        try {
            const saveData = nes.toJSON(); // Get current emulator state
            const saveDataString = JSON.stringify(saveData);

            // Allow the user to download the save state
            const blob = new Blob([saveDataString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nes-save-state.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error saving state to file:', error);
            alert('Failed to save game state to file.');
        }
    }

    // Load State Function from File
    function loadStateFromFile(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const saveData = JSON.parse(reader.result);
                    nes.fromJSON(saveData);
                } catch (error) {
                    console.error('Error loading state from file:', error);
                    alert('Failed to load game state from file.');
                }
            };
            reader.readAsText(file);
        }
    }

    // Save State Function
    function saveState() {
        try {
            const saveData = nes.toJSON(); // Get current emulator state
            const saveDataString = JSON.stringify(saveData);
    
            // Save to localStorage
            localStorage.setItem('nesSaveState', saveDataString);
    
        } catch (error) {
            console.error('Error saving state:', error);
            alert('Failed to save game state.');
        }
    }

    // Load State Function
    function loadState() {
        try {
            // Load from localStorage
            const saveDataString = localStorage.getItem('nesSaveState');
            if (saveDataString) {
                const saveData = JSON.parse(saveDataString);
                nes.fromJSON(saveData);
            } else {
                alert('No saved state found.');
            }
    
        } catch (error) {
            console.error('Error loading state:', error);
            alert('Failed to load game state.');
        }
    }

    // Save and Load button event listeners
    document.getElementById('save-state').addEventListener('click', saveState);
    document.getElementById('load-state').addEventListener('click', loadState);

    // Event listeners for Save/Load to file
    document.getElementById('save-state-to-file').addEventListener('click', saveStateToFile);
    document.getElementById('load-state-file').addEventListener('change', loadStateFromFile);

    // Trigger file input when the button is clicked
    document.getElementById('load-state-from-file').addEventListener('click', function() {
        document.getElementById('load-state-file').click();
    });

    // Trigger initial resize
    window.dispatchEvent(new Event('resize'));
});