document.addEventListener('DOMContentLoaded', () => {
    // Existing variables
    let gridSize = 10;
    let mineCount = 20;
    let grid = [];
    let minesLeft = mineCount;
    let timer = 0;
    let interval;

    const gridElement = document.getElementById('minesweeper-grid');
    const minesCountElement = document.getElementById('mines-count');
    const timerElement = document.getElementById('timer');
    const resetButton = document.getElementById('reset-button');
    const difficultySelect = document.getElementById('difficulty');

    // Confetti setup
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiContext = confettiCanvas.getContext('2d');
    let confettiParticles = [];
    let isConfettiActive = false;
    let firstClick = true;

    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
    window.dispatchEvent(new Event('resize'));

    difficultySelect.addEventListener('change', () => {
        updateDifficulty();
        initGame();
    });

    const GRAVITY = 0.005;
    const FRICTION = 0.98;
    let confettiParticleRate = 8;  // How many particles to spawn per frame
    
    function startConfetti() {
        isConfettiActive = true;
        requestAnimationFrame(renderConfetti);
    }
    
    function renderConfetti() {
        if (!isConfettiActive) return;
    
        confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
        // Spawn new particles each frame
        for (let i = 0; i < confettiParticleRate; i++) {
            const centerX = confettiCanvas.width / 2;
            // Randomly select either the top-left, top-right, or top-center
            const spawnPoint = Math.floor(Math.random() * 3);
            let x, y = 0;  // All particles start from the top of the canvas
    
            if (spawnPoint === 0) {
                x = 0;  // Top-left corner
            } else if (spawnPoint === 1) {
                x = confettiCanvas.width;  // Top-right corner
            } else {
                x = centerX;  // Top-center
            }
    
            // Calculate random speed and direction
            const angle = Math.atan2(confettiCanvas.height - y, (Math.random() * confettiCanvas.width) - x);
            const speed = Math.random() * 5 + 2;  // Random speed
    
            confettiParticles.push({
                x: x,
                y: y,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                size: Math.random() * 3 + 5,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                velocityY: 0,
            });
        }
    
        // Update existing particles
        confettiParticles.forEach((particle, index) => {
            // Apply gravity and friction
            particle.velocityY += GRAVITY;
            particle.speedY += particle.velocityY;
            particle.speedX *= FRICTION;
    
            // Update particle position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
    
            // Recycle particle if it goes below the canvas (vertical only)
            if (particle.y > confettiCanvas.height) {
                confettiParticles.splice(index, 1);  // Remove particle once it goes off the screen
            }
    
            // Draw particle
            confettiContext.fillStyle = particle.color;
            confettiContext.beginPath();
            confettiContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            confettiContext.fill();
        });
    
        requestAnimationFrame(renderConfetti);
    }
    
    function stopConfetti() {
        isConfettiActive = false;
        confettiParticles = [];
        confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    
    function updateDifficulty() {
        const difficulty = difficultySelect.value;
        if (difficulty === 'easy') {
            gridSize = 8;
            mineCount = 10;
        } else if (difficulty === 'medium') {
            gridSize = 10;
            mineCount = 20;
        } else if (difficulty === 'hard') {
            gridSize = 14;
            mineCount = 40;
        }
    }

    function initGame() {
        clearInterval(interval);
        timer = 0;
        minesLeft = mineCount;
        minesCountElement.textContent = String(minesLeft).padStart(3, '0');
        timerElement.textContent = String(timer).padStart(3, '0');

        grid = [];
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
        gridElement.style.gridTemplateRows = `repeat(${gridSize}, 30px)`;

        firstClick = true;

        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                const cell = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0
                };
                row.push(cell);
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = i;
                cellElement.dataset.col = j;
                cellElement.addEventListener('click', handleClick);
                cellElement.addEventListener('contextmenu', handleRightClick);
                gridElement.appendChild(cellElement);
            }
            grid.push(row);
        }

        placeMines();
        startTimer();
    }

    function placeMines() {
        let placedMines = 0;
        while (placedMines < mineCount) {
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);

            if (!grid[row][col].isMine) {
                grid[row][col].isMine = true;
                placedMines++;
            }
        }

        calculateAdjacentMines();
    }

    function calculateAdjacentMines() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (!grid[i][j].isMine) {
                    grid[i][j].adjacentMines = countAdjacentMines(i, j);
                }
            }
        }
    }

    function countAdjacentMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    if (grid[newRow][newCol].isMine) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    function handleClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        revealCell(row, col);
        checkWinCondition(); // Check for win condition after a cell is revealed
    }

    function handleRightClick(event) {
        event.preventDefault(); 
        let cellElement = event.target;
        if (!cellElement.classList.contains('cell')) {
            cellElement = cellElement.closest('.cell');
        }
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        flagCell(row, col);
        checkWinCondition(); // Check for win condition after a flag is placed
    }

    function revealCell(row, col) {
        if (grid[row][col].isRevealed || grid[row][col].isFlagged) return;
    
        // If it's the first click and the cell is a mine, move the mine to a new position
        if (firstClick && grid[row][col].isMine) {
            moveMine(row, col);
        }
    
        firstClick = false;  // Once the first cell is revealed, this becomes false
    
        grid[row][col].isRevealed = true;
        const cellElement = getCellElement(row, col);
    
        if (grid[row][col].isMine) {
            cellElement.classList.add('mine');
            cellElement.innerHTML = '<i class="fas fa-bomb"></i>';
            gameOver();
        } else {
            cellElement.classList.add('revealed');
            if (grid[row][col].adjacentMines > 0) {
                cellElement.textContent = grid[row][col].adjacentMines;
                cellElement.classList.add('number-' + grid[row][col].adjacentMines);
            } else {
                revealAdjacentCells(row, col);
            }
        }
    }

    function moveMine(row, col) {
        // Find a random empty cell to move the mine to
        let newRow, newCol;
        do {
            newRow = Math.floor(Math.random() * gridSize);
            newCol = Math.floor(Math.random() * gridSize);
        } while (grid[newRow][newCol].isMine || (newRow === row && newCol === col));
    
        // Move the mine
        grid[row][col].isMine = false;
        grid[newRow][newCol].isMine = true;
    
        // Recalculate adjacent mines after moving the mine
        calculateAdjacentMines();
    }

    function revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }

    function flagCell(row, col) {
        if (grid[row][col].isRevealed) return;
        grid[row][col].isFlagged = !grid[row][col].isFlagged;
        const cellElement = getCellElement(row, col);
        cellElement.classList.toggle('flagged');
        if (grid[row][col].isFlagged) {
            cellElement.innerHTML = '<i class="fas fa-flag"></i>';
        } else {
            cellElement.innerHTML = '';
        }

        minesLeft += grid[row][col].isFlagged ? -1 : 1;
        minesCountElement.textContent = minesLeft;
    }

    function getCellElement(row, col) {
        return gridElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    }

    function startTimer() {
        interval = setInterval(() => {
            if (timer < 999) {
                timer++;
            }
            timerElement.textContent = String(timer).padStart(3, '0');
        }, 1000);
    }

    function gameOver() {
        clearInterval(interval);
        grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell.isMine && !cell.isRevealed) {
                    getCellElement(i, j).classList.add('mine');
                    getCellElement(i, j).innerHTML = '<i class="fas fa-bomb"></i>';
                }
            });
        });

        setTimeout(() => {
            alert('Game Over!');
        }, 500);
    }

    // New function to check if the user has won the game
    function checkWinCondition() {
        let allMinesFlagged = true;
        let allNonMinesRevealed = true;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = grid[i][j];
                if (cell.isMine && !cell.isFlagged) {
                    allMinesFlagged = false;
                }
                if (!cell.isMine && !cell.isRevealed) {
                    allNonMinesRevealed = false;
                }
            }
        }

        if (allMinesFlagged && allNonMinesRevealed) {
            setTimeout(() => {
                startConfetti();
                alert('You won!');
                clearInterval(interval); // Stop the timer
            }, 500);
        }
    }

    resetButton.addEventListener('click', () => {
        stopConfetti();
        initGame();
    });

    updateDifficulty();
    initGame();
});
