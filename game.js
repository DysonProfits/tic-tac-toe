const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const CELLS = [...document.querySelectorAll(".cell")];
const statusEl = document.querySelector("#status");
const scoreXEl = document.querySelector("#score-x");
const scoreOEl = document.querySelector("#score-o");
const scoreDrawEl = document.querySelector("#score-draw");
const scoreXLabel = document.querySelector("#score-x-label");
const scoreOLabel = document.querySelector("#score-o-label");
const modeButtons = [...document.querySelectorAll(".mode")];

const LABELS = ["Row 1, column 1", "Row 1, column 2", "Row 1, column 3", "Row 2, column 1", "Row 2, column 2", "Row 2, column 3", "Row 3, column 1", "Row 3, column 2", "Row 3, column 3"];

let board = Array(9).fill("");
let turn = "X";
let mode = "cpu";
let locked = false;
let scores = { X: 0, O: 0, draw: 0 };

function winner(state) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return { mark: state[a], line };
    }
  }
  return null;
}

function emptyIndexes(state) {
  return state.flatMap((mark, index) => (mark ? [] : [index]));
}

function bestMove(state) {
  let bestScore = -Infinity;
  let move = emptyIndexes(state)[0];
  for (const index of emptyIndexes(state)) {
    state[index] = "O";
    const score = minimax(state, false);
    state[index] = "";
    if (score > bestScore) {
      bestScore = score;
      move = index;
    }
  }
  return move;
}

// Scores favour quicker wins and slower losses, so the computer finishes a
// winning line at once instead of wandering.
function minimax(state, maximizing, depth = 1) {
  const result = winner(state);
  if (result?.mark === "O") return 10 - depth;
  if (result?.mark === "X") return depth - 10;
  const open = emptyIndexes(state);
  if (open.length === 0) return 0;

  if (maximizing) {
    let best = -Infinity;
    for (const index of open) {
      state[index] = "O";
      best = Math.max(best, minimax(state, false, depth + 1));
      state[index] = "";
    }
    return best;
  }

  let best = Infinity;
  for (const index of open) {
    state[index] = "X";
    best = Math.min(best, minimax(state, true, depth + 1));
    state[index] = "";
  }
  return best;
}

function paint() {
  const result = winner(board);
  const full = emptyIndexes(board).length === 0;
  CELLS.forEach((cell, index) => {
    const mark = board[index];
    cell.textContent = mark;
    cell.classList.toggle("x", mark === "X");
    cell.classList.toggle("o", mark === "O");
    cell.classList.toggle("win", Boolean(result?.line.includes(index)));
    const cpuThinking = mode === "cpu" && turn === "O";
    cell.disabled = locked || cpuThinking || Boolean(mark) || Boolean(result) || full;
    const occupant = mark || "empty";
    cell.setAttribute("aria-label", `${LABELS[index]}, ${occupant}`);
  });

  if (result) {
    statusEl.textContent = resultText(result.mark);
  } else if (full) {
    statusEl.textContent = "Draw";
  } else if (mode === "cpu" && turn === "O") {
    statusEl.textContent = "Computer is thinking";
  } else if (mode === "cpu") {
    statusEl.textContent = "Your turn · X";
  } else {
    statusEl.textContent = `${turn === "X" ? "Player X" : "Player O"}'s turn`;
  }
}

function resultText(mark) {
  if (mode === "cpu") {
    return mark === "X" ? "You win" : "Computer wins";
  }
  return `${mark === "X" ? "Player X" : "Player O"} wins`;
}

function finishIfNeeded() {
  const result = winner(board);
  if (result) {
    scores[result.mark] += 1;
    locked = true;
    updateScore();
    return true;
  }
  if (emptyIndexes(board).length === 0) {
    scores.draw += 1;
    locked = true;
    updateScore();
    return true;
  }
  return false;
}

function updateScore() {
  scoreXEl.textContent = String(scores.X);
  scoreOEl.textContent = String(scores.O);
  scoreDrawEl.textContent = String(scores.draw);
  scoreXLabel.textContent = mode === "cpu" ? "You" : "Player X";
  scoreOLabel.textContent = mode === "cpu" ? "Computer" : "Player O";
}

function play(index, byComputer = false) {
  if (locked || board[index] || winner(board)) return;
  if (mode === "cpu" && turn === "O" && !byComputer) return;
  board[index] = turn;
  if (finishIfNeeded()) {
    paint();
    return;
  }
  turn = turn === "X" ? "O" : "X";
  paint();
  if (mode === "cpu" && turn === "O") {
    cpuTimer = window.setTimeout(computerTurn, 280);
  }
}

let cpuTimer = null;

function computerTurn() {
  cpuTimer = null;
  if (locked || mode !== "cpu" || turn !== "O") return;
  play(bestMove(board), true);
}

function newGame() {
  window.clearTimeout(cpuTimer);
  cpuTimer = null;
  board = Array(9).fill("");
  turn = "X";
  locked = false;
  paint();
}

CELLS.forEach((cell) => {
  cell.addEventListener("click", () => play(Number(cell.dataset.index)));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    modeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    scores = { X: 0, O: 0, draw: 0 };
    updateScore();
    newGame();
  });
});

document.querySelector("#new-game").addEventListener("click", newGame);
updateScore();
paint();
