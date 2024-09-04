document.addEventListener('DOMContentLoaded', () => {
    const gridSize = 10;
    const mineCount = 20;
    let grid = [];
    let minesLeft = mineCount;
    let timer = 0;
    let interval;

    const gridElement = document.getElementById('minesweeper-grid');
    const minesCountElement = document.getElementById('mines-count');
    const timerElement = document.getElementById('timer');
    const resetButton = document.getElementById('reset-button');

    function initGame() {
        clearInterval(interval);
        timer = 0;
        minesLeft = mineCount;
        minesCountElement.textContent = minesLeft;
        timerElement.textContent = timer;

        grid = [];
        gridElement.innerHTML = '';

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
    }

    function handleRightClick(event) {
        event.preventDefault();
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        flagCell(row, col);
    }

    function revealCell(row, col) {
        if (grid[row][col].isRevealed || grid[row][col].isFlagged) return;

        grid[row][col].isRevealed = true;
        const cellElement = getCellElement(row, col);

        if (grid[row][col].isMine) {
            cellElement.classList.add('mine');
            gameOver();
        } else {
            cellElement.classList.add('revealed');
            if (grid[row][col].adjacentMines > 0) {
                cellElement.textContent = grid[row][col].adjacentMines;
            } else {
                revealAdjacentCells(row, col);
            }
        }
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

        minesLeft += grid[row][col].isFlagged ? -1 : 1;
        minesCountElement.textContent = minesLeft;
    }

    function getCellElement(row, col) {
        return gridElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    }

    function startTimer() {
        interval = setInterval(() => {
            timer++;
            timerElement.textContent = timer;
        }, 1000);
    }

    function gameOver() {
        clearInterval(interval);
        grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell.isMine && !cell.isRevealed) {
                    getCellElement(i, j).classList.add('mine');
                }
            });
        });
        alert('Game Over!');
    }

    resetButton.addEventListener('click', initGame);

    initGame();
});
