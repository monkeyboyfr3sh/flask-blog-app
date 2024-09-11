document.addEventListener('DOMContentLoaded', () => {
    const confettiSettings = {
        gravity: 0.005,
        friction: 0.98,
        particleRate: 8,
        colors: () => `hsl(${Math.random() * 360}, 100%, 50%)`,
        sizeRange: [5, 8],
        speedRange: [2, 7]
    };

    const gridSettings = {
        size: 10,
        mineCount: 20,
        minesLeft: 20
    };

    let grid = [];
    let timer = 0;
    let interval;
    let confettiParticles = [];
    let isConfettiActive = false;
    let firstClick = true;

    const gridElement = document.getElementById('minesweeper-grid');
    const minesCountElement = document.getElementById('mines-count');
    const timerElement = document.getElementById('timer');
    const resetButton = document.getElementById('reset-button');
    const difficultySelect = document.getElementById('difficulty');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiContext = confettiCanvas.getContext('2d');

    window.addEventListener('resize', resizeConfettiCanvas);
    resizeConfettiCanvas();

    difficultySelect.addEventListener('change', () => {
        updateDifficulty();
        initGame();
    });

    resetButton.addEventListener('click', () => {
        stopConfetti();
        initGame();
    });

    function resizeConfettiCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }

    function updateDifficulty() {
        const difficulty = difficultySelect.value;
        const settings = {
            easy: { size: 8, mineCount: 10 },
            medium: { size: 10, mineCount: 20 },
            hard: { size: 14, mineCount: 40 }
        };
        gridSettings.size = settings[difficulty].size;
        gridSettings.mineCount = settings[difficulty].mineCount;
        gridSettings.minesLeft = gridSettings.mineCount;
    }

    function initGame() {
        clearInterval(interval);
        timer = 0;
        grid = [];
        minesLeft = gridSettings.mineCount;
        minesCountElement.textContent = formatNumber(minesLeft);
        timerElement.textContent = formatNumber(timer);
        gridElement.innerHTML = '';
        firstClick = true;

        setupGrid();
        placeMines();
        startTimer();
    }

    function setupGrid() {
        gridElement.style.gridTemplateColumns = `repeat(${gridSettings.size}, 30px)`;
        gridElement.style.gridTemplateRows = `repeat(${gridSettings.size}, 30px)`;

        for (let row = 0; row < gridSettings.size; row++) {
            const rowArray = [];
            for (let col = 0; col < gridSettings.size; col++) {
                const cell = createCell(row, col);
                rowArray.push(cell);
                gridElement.appendChild(cell.element);
            }
            grid.push(rowArray);
        }
    }

    function createCell(row, col) {
        const cell = {
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
            element: createCellElement(row, col)
        };
        return cell;
    }

    function createCellElement(row, col) {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        cellElement.dataset.row = row;
        cellElement.dataset.col = col;
        cellElement.addEventListener('click', handleClick);
        cellElement.addEventListener('contextmenu', handleRightClick);
        return cellElement;
    }

    function handleClick(event) {
        const { row, col } = getCellCoords(event.target);
        revealCell(row, col);
        checkWinCondition();
    }

    function handleRightClick(event) {
        event.preventDefault();
        const { row, col } = getCellCoords(event.target);
        flagCell(row, col);
        checkWinCondition();
    }

    function getCellCoords(target) {
        return {
            row: parseInt(target.dataset.row),
            col: parseInt(target.dataset.col)
        };
    }

    function revealCell(row, col) {
        const cell = grid[row][col];
        if (cell.isRevealed || cell.isFlagged) return;

        if (firstClick && cell.isMine) {
            moveMine(row, col);
        }
        firstClick = false;

        cell.isRevealed = true;
        updateCellDisplay(cell, row, col);

        if (cell.isMine) {
            gameOver();
        } else if (cell.adjacentMines === 0) {
            revealAdjacentCells(row, col);
        }
    }

    function flagCell(row, col) {
        const cell = grid[row][col];
        if (cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flagged');
        cell.element.innerHTML = cell.isFlagged ? '<i class="fas fa-flag"></i>' : '';

        minesLeft += cell.isFlagged ? -1 : 1;
        minesCountElement.textContent = minesLeft;
    }

    function updateCellDisplay(cell, row, col) {
        const cellElement = cell.element;
        if (cell.isMine) {
            cellElement.classList.add('mine');
            cellElement.innerHTML = '<i class="fas fa-bomb"></i>';
        } else {
            cellElement.classList.add('revealed');
            if (cell.adjacentMines > 0) {
                cellElement.textContent = cell.adjacentMines;
                cellElement.classList.add('number-' + cell.adjacentMines);
            }
        }
    }

    function moveMine(row, col) {
        let newRow, newCol;
        do {
            newRow = Math.floor(Math.random() * gridSettings.size);
            newCol = Math.floor(Math.random() * gridSettings.size);
        } while (grid[newRow][newCol].isMine || (newRow === row && newCol === col));

        grid[row][col].isMine = false;
        grid[newRow][newCol].isMine = true;
        calculateAdjacentMines();
    }

    function revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (isInBounds(newRow, newCol)) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }

    function isInBounds(row, col) {
        return row >= 0 && row < gridSettings.size && col >= 0 && col < gridSettings.size;
    }

    function placeMines() {
        let placedMines = 0;
        while (placedMines < gridSettings.mineCount) {
            const row = Math.floor(Math.random() * gridSettings.size);
            const col = Math.floor(Math.random() * gridSettings.size);
            if (!grid[row][col].isMine) {
                grid[row][col].isMine = true;
                placedMines++;
            }
        }
        calculateAdjacentMines();
    }

    function calculateAdjacentMines() {
        for (let row = 0; row < gridSettings.size; row++) {
            for (let col = 0; col < gridSettings.size; col++) {
                if (!grid[row][col].isMine) {
                    grid[row][col].adjacentMines = countAdjacentMines(row, col);
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
                if (isInBounds(newRow, newCol) && grid[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    function startTimer() {
        interval = setInterval(() => {
            if (timer < 999) timer++;
            timerElement.textContent = formatNumber(timer);
        }, 1000);
    }

    function formatNumber(num) {
        return String(num).padStart(3, '0');
    }

    function gameOver() {
        clearInterval(interval);
        grid.forEach(row => row.forEach(cell => {
            if (cell.isMine && !cell.isRevealed) {
                updateCellDisplay(cell);
            }
        }));
        setTimeout(() => alert('Game Over!'), 500);
    }

    function checkWinCondition() {
        const allMinesFlagged = grid.flat().every(cell => !cell.isMine || cell.isFlagged);
        const allNonMinesRevealed = grid.flat().every(cell => cell.isMine || cell.isRevealed);
        if (allMinesFlagged && allNonMinesRevealed) {
            setTimeout(() => {
                startConfetti();
                alert('You won!');
                clearInterval(interval);
            }, 500);
        }
    }

    // Confetti
    function startConfetti() {
        isConfettiActive = true;
        requestAnimationFrame(renderConfetti);
    }

    function renderConfetti() {
        if (!isConfettiActive) return;
        confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = 0; i < confettiSettings.particleRate; i++) {
            confettiParticles.push(createConfettiParticle());
        }

        confettiParticles.forEach((particle, index) => {
            updateParticle(particle);
            drawParticle(particle);
            if (particle.y > confettiCanvas.height) confettiParticles.splice(index, 1);
        });

        requestAnimationFrame(renderConfetti);
    }

    function createConfettiParticle() {
        const x = Math.random() * confettiCanvas.width;
        const y = 0;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (confettiSettings.speedRange[1] - confettiSettings.speedRange[0]) + confettiSettings.speedRange[0];
        return {
            x, y,
            size: Math.random() * (confettiSettings.sizeRange[1] - confettiSettings.sizeRange[0]) + confettiSettings.sizeRange[0],
            color: confettiSettings.colors(),
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            velocityY: 0
        };
    }

    function updateParticle(particle) {
        particle.velocityY += confettiSettings.gravity;
        particle.speedY += particle.velocityY;
        particle.speedX *= confettiSettings.friction;
        particle.x += particle.speedX;
        particle.y += particle.speedY;
    }

    function drawParticle(particle) {
        confettiContext.fillStyle = particle.color;
        confettiContext.beginPath();
        confettiContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        confettiContext.fill();
    }

    function stopConfetti() {
        isConfettiActive = false;
        confettiParticles = [];
        confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }

    // Initialize game
    updateDifficulty();
    initGame();
});
