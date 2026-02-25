const PRESETS = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard:   { rows: 16, cols: 30, mines: 99 },
};

let rows, cols, totalMines;
let grid, revealed, flagged;
let gameOver, firstClick, minesPlaced;
let timerInterval, seconds;

const boardEl = document.getElementById('board');
const mineCountEl = document.getElementById('mine-count');
const timerEl = document.getElementById('timer');
const difficultyEl = document.getElementById('difficulty');
const overlayEl = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlay-message');
const overlayRestart = document.getElementById('overlay-restart');

function init() {
  const preset = PRESETS[difficultyEl.value];
  rows = preset.rows;
  cols = preset.cols;
  totalMines = preset.mines;

  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
  flagged = Array.from({ length: rows }, () => Array(cols).fill(false));

  gameOver = false;
  firstClick = true;
  minesPlaced = false;
  seconds = 0;

  clearInterval(timerInterval);
  timerEl.textContent = '0';
  mineCountEl.textContent = totalMines;
  overlayEl.classList.add('hidden');

  renderBoard();
}

function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (grid[r][c] === -1) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    grid[r][c] = -1;
    placed++;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === -1) {
            count++;
          }
        }
      }
      grid[r][c] = count;
    }
  }
  minesPlaced = true;
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 36px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell hidden';
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('click', () => handleClick(r, c));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick(r, c);
      });

      boardEl.appendChild(cell);
    }
  }
}

function getCell(r, c) {
  return boardEl.children[r * cols + c];
}

function handleClick(r, c) {
  if (gameOver || flagged[r][c] || revealed[r][c]) return;

  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = seconds;
    }, 1000);
  }

  if (grid[r][c] === -1) {
    revealMines();
    endGame(false);
    return;
  }

  reveal(r, c);
  checkWin();
}

function handleRightClick(r, c) {
  if (gameOver || revealed[r][c]) return;

  flagged[r][c] = !flagged[r][c];
  const cell = getCell(r, c);

  if (flagged[r][c]) {
    cell.classList.add('flagged');
    cell.textContent = '\u{1F6A9}';
  } else {
    cell.classList.remove('flagged');
    cell.textContent = '';
  }

  const flagCount = flagged.flat().filter(Boolean).length;
  mineCountEl.textContent = totalMines - flagCount;
}

function reveal(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  if (revealed[r][c] || flagged[r][c]) return;

  revealed[r][c] = true;
  const cell = getCell(r, c);
  cell.classList.remove('hidden');
  cell.classList.add('revealed');

  const val = grid[r][c];
  if (val > 0) {
    cell.textContent = val;
    cell.dataset.count = val;
  } else if (val === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        reveal(r + dr, c + dc);
      }
    }
  }
}

function revealMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === -1) {
        const cell = getCell(r, c);
        cell.classList.remove('hidden');
        cell.classList.add('mine');
        cell.textContent = '\u{1F4A3}';
      }
    }
  }
}

function checkWin() {
  let unrevealedSafe = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== -1 && !revealed[r][c]) unrevealedSafe++;
    }
  }
  if (unrevealedSafe === 0) endGame(true);
}

function endGame(won) {
  gameOver = true;
  clearInterval(timerInterval);

  overlayMsg.textContent = won ? '\u{1F389} クリア！' : '\u{1F4A5} ゲームオーバー';
  overlayMsg.className = won ? 'win' : 'lose';
  overlayEl.classList.remove('hidden');
}

document.getElementById('new-game').addEventListener('click', init);
difficultyEl.addEventListener('change', init);
overlayRestart.addEventListener('click', init);

init();
