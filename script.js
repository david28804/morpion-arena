/* =========================================================
   MORPION ARENA – Logique du jeu
   JavaScript natif, sans framework.
   Modes : 2 joueurs, ou joueur contre ordinateur (3 niveaux).
   ========================================================= */

"use strict";

/* ---------- Constantes ---------- */

// Les 8 combinaisons gagnantes (indices des cases 0 à 8)
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
  [0, 4, 8], [2, 4, 6],            // diagonales
];

const PLAYER_X = "X";      // en mode ordinateur : le joueur humain
const PLAYER_O = "O";      // en mode ordinateur : l'ordinateur
const CPU_DELAY = 550;     // temps de "réflexion" de l'ordinateur (ms)
const STORAGE_KEY = "morpion-arena-scores-v2";

const DIFFICULTY_LABELS = { easy: "Facile", medium: "Moyen", hard: "Difficile" };

/* ---------- État du jeu ---------- */

const state = {
  board: Array(9).fill(null), // contenu des 9 cases
  currentPlayer: PLAYER_X,    // joueur dont c'est le tour
  gameOver: false,            // true quand la partie est terminée
  mode: "pvp",                // "pvp" (2 joueurs) ou "cpu" (contre l'ordinateur)
  difficulty: "medium",       // "easy", "medium" ou "hard"
  cpuTimer: null,             // coup de l'ordinateur en attente
  allScores: {},              // scores séparés par mode : { pvp: {...}, "cpu-hard": {...} }
};

/** Clé des scores pour le mode en cours. */
function scoreKey() {
  return state.mode === "pvp" ? "pvp" : `cpu-${state.difficulty}`;
}

/** Scores du mode en cours (créés à 0 si besoin). */
function currentScores() {
  const key = scoreKey();
  if (!state.allScores[key]) state.allScores[key] = { X: 0, O: 0, draw: 0 };
  return state.allScores[key];
}

const isCpuMode = () => state.mode === "cpu";
const isCpuTurn = () => isCpuMode() && state.currentPlayer === PLAYER_O;

/* ---------- Références DOM ---------- */

const $ = (id) => document.getElementById(id);

const screens = { home: $("home"), game: $("game") };
const boardEl = $("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const statusEl = $("status");
const scoreEls = { X: $("score-x"), O: $("score-o"), draw: $("score-draw") };
const scoreCards = { X: $("score-card-x"), O: $("score-card-o") };
const labelX = $("label-x");
const labelO = $("label-o");
const modeBadge = $("mode-badge");
const difficultyGroup = $("difficulty-group");
const modal = $("result");
const modalSymbol = $("result-symbol");
const modalTitle = $("result-title");

/* ---------- Sauvegarde des scores ---------- */
// Les scores sont conservés entre les manches et après un rechargement
// (localStorage). Si le stockage est indisponible, le jeu fonctionne quand même.

function loadScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") state.allScores = saved;
  } catch (e) {
    /* stockage indisponible : scores à 0 */
  }
}

function saveScores() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.allScores));
  } catch (e) {
    /* ignoré */
  }
}

/* ---------- Navigation entre écrans ---------- */

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("screen--active"));
  screens[name].classList.add("screen--active");
}

/** Lit le mode et la difficulté choisis sur la page d'accueil. */
function readSetup() {
  state.mode = document.querySelector('input[name="mode"]:checked').value;
  state.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
}

/** Adapte les libellés de l'écran de jeu au mode choisi. */
function applyModeLabels() {
  if (isCpuMode()) {
    labelX.textContent = "Vous";
    labelO.textContent = "Ordinateur";
    modeBadge.textContent = `Contre l'ordinateur · ${DIFFICULTY_LABELS[state.difficulty]}`;
  } else {
    labelX.textContent = "Joueur X";
    labelO.textContent = "Joueur O";
    modeBadge.textContent = "2 joueurs";
  }
}

/* ---------- Règles du jeu ---------- */

/**
 * Cherche une ligne gagnante sur le plateau.
 * @returns {number[]|null} les indices de la ligne gagnante, ou null.
 */
function findWinningLine(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

/** Vrai si toutes les cases sont occupées. */
function isBoardFull(board) {
  return board.every((cell) => cell !== null);
}

/** Indices des cases libres. */
function emptyCells(board) {
  return board.reduce((acc, v, i) => (v === null ? acc.concat(i) : acc), []);
}

/* ---------- Intelligence artificielle ---------- */

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Case qui permettrait à `player` de gagner immédiatement, ou null. */
function findWinningMove(board, player) {
  for (const i of emptyCells(board)) {
    board[i] = player;
    const wins = findWinningLine(board) !== null;
    board[i] = null;
    if (wins) return i;
  }
  return null;
}

/**
 * Minimax : évalue le plateau du point de vue de l'ordinateur (O).
 * +10 victoire de O, -10 victoire de X, 0 nul. La profondeur
 * favorise les victoires rapides et les défaites lentes.
 */
function minimax(board, isCpuToPlay, depth) {
  const line = findWinningLine(board);
  if (line) return board[line[0]] === PLAYER_O ? 10 - depth : depth - 10;
  if (isBoardFull(board)) return 0;

  let best = isCpuToPlay ? -Infinity : Infinity;
  for (const i of emptyCells(board)) {
    board[i] = isCpuToPlay ? PLAYER_O : PLAYER_X;
    const score = minimax(board, !isCpuToPlay, depth + 1);
    board[i] = null;
    best = isCpuToPlay ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

/** Meilleur coup selon minimax (au hasard parmi les coups équivalents). */
function bestMove(board) {
  let bestScore = -Infinity;
  let moves = [];
  for (const i of emptyCells(board)) {
    board[i] = PLAYER_O;
    const score = minimax(board, false, 1);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      moves = [i];
    } else if (score === bestScore) {
      moves.push(i);
    }
  }
  return randomItem(moves);
}

/**
 * Choisit le coup de l'ordinateur selon la difficulté :
 * - Facile    : joue au hasard.
 * - Moyen     : gagne s'il peut, bloque s'il doit, sinon centre ou hasard.
 * - Difficile : minimax, imbattable (au mieux, match nul).
 */
function chooseCpuMove(board, difficulty) {
  const copy = board.slice();
  if (difficulty === "easy") return randomItem(emptyCells(copy));

  if (difficulty === "medium") {
    const win = findWinningMove(copy, PLAYER_O);
    if (win !== null) return win;
    const block = findWinningMove(copy, PLAYER_X);
    if (block !== null) return block;
    if (copy[4] === null) return 4;
    return randomItem(emptyCells(copy));
  }

  return bestMove(copy);
}

/** Programme le coup de l'ordinateur après un court délai. */
function scheduleCpuMove() {
  boardEl.classList.add("board--locked");
  state.cpuTimer = setTimeout(() => {
    state.cpuTimer = null;
    if (state.gameOver) return;
    boardEl.classList.remove("board--locked");
    playMove(chooseCpuMove(state.board, state.difficulty));
  }, CPU_DELAY);
}

function cancelCpuMove() {
  if (state.cpuTimer) {
    clearTimeout(state.cpuTimer);
    state.cpuTimer = null;
  }
}

/* ---------- Déroulement d'une partie ---------- */

/** Gère le clic sur une case. */
function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  // Pas de coup après la fin de la partie, ni pendant le tour de l'ordinateur
  if (state.gameOver || isCpuTurn()) return;

  // Case déjà occupée : on refuse avec une petite animation
  if (state.board[index] !== null) {
    cell.classList.remove("cell--shake");
    void cell.offsetWidth; // relance l'animation
    cell.classList.add("cell--shake");
    return;
  }

  playMove(index);
}

/** Pose le symbole du joueur courant puis vérifie la fin de partie. */
function playMove(index) {
  const player = state.currentPlayer;
  state.board[index] = player;

  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player === PLAYER_X ? "cell--x" : "cell--o");
  cell.setAttribute("aria-label", `Case ${index + 1} : ${player}`);

  const winningLine = findWinningLine(state.board);

  if (winningLine) {
    endGame(player, winningLine);
  } else if (isBoardFull(state.board)) {
    endGame(null);
  } else {
    // Changement de joueur
    state.currentPlayer = player === PLAYER_X ? PLAYER_O : PLAYER_X;
    updateTurnDisplay();
    if (isCpuTurn()) scheduleCpuMove();
  }
}

/** Phrase annonçant le vainqueur, adaptée au mode. */
function winnerMessage(winner) {
  if (isCpuMode()) {
    return winner === PLAYER_X ? "Vous avez gagné !" : "L'ordinateur gagne !";
  }
  return `Victoire du joueur ${winner} !`;
}

/**
 * Termine la partie.
 * @param {string|null} winner  "X", "O" ou null pour un match nul
 * @param {number[]} [line]     cases gagnantes
 */
function endGame(winner, line = []) {
  state.gameOver = true;
  boardEl.classList.add("board--locked", "board--over");
  Object.values(scoreCards).forEach((c) => c.classList.remove("score--active"));

  const scores = currentScores();
  if (winner) {
    line.forEach((i) => cells[i].classList.add("cell--win"));
    scores[winner] += 1;
    statusEl.textContent = winnerMessage(winner);
  } else {
    scores.draw += 1;
    statusEl.textContent = "Match nul !";
  }

  saveScores();
  renderScores(winner || "draw");

  // Affiche la fenêtre de résultat après l'animation des cases
  setTimeout(() => showResult(winner), 700);
}

/** Classe CSS de couleur associée à un joueur. */
function colorClass(player) {
  return player === PLAYER_X ? "txt-x" : "txt-o";
}

/* ---------- Affichage ---------- */

function updateTurnDisplay() {
  const p = state.currentPlayer;
  if (isCpuMode()) {
    statusEl.innerHTML = p === PLAYER_X
      ? `À vous de jouer (<span class="txt-x">X</span>)`
      : `L'ordinateur réfléchit…`;
  } else {
    statusEl.innerHTML = `Au tour du joueur <span class="${colorClass(p)}">${p}</span>`;
  }
  boardEl.dataset.turn = p;
  scoreCards.X.classList.toggle("score--active", p === PLAYER_X);
  scoreCards.O.classList.toggle("score--active", p === PLAYER_O);
}

/**
 * Met à jour les scores affichés.
 * @param {string} [changed] score à animer ("X", "O" ou "draw")
 */
function renderScores(changed) {
  const scores = currentScores();
  for (const key of Object.keys(scoreEls)) {
    scoreEls[key].textContent = scores[key];
  }
  if (changed && scoreEls[changed]) {
    const el = scoreEls[changed];
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
}

function showResult(winner) {
  // Ne pas afficher si une nouvelle partie a été lancée entre-temps
  if (!state.gameOver || !screens.game.classList.contains("screen--active")) return;

  if (winner) {
    modalSymbol.textContent = winner;
    modalSymbol.className = `modal__symbol ${colorClass(winner)}`;
  } else {
    modalSymbol.textContent = "=";
    modalSymbol.className = "modal__symbol";
  }
  modalTitle.textContent = winner ? winnerMessage(winner) : "Match nul !";
  modal.hidden = false;
  $("btn-modal-new").focus();
}

function hideResult() {
  modal.hidden = true;
}

/* ---------- Commandes ---------- */

/** Vide le plateau sans toucher aux scores. X commence toujours. */
function newGame() {
  cancelCpuMove();
  state.board.fill(null);
  state.currentPlayer = PLAYER_X;
  state.gameOver = false;

  cells.forEach((cell, i) => {
    cell.textContent = "";
    cell.className = "cell";
    cell.setAttribute("aria-label", `Case ${i + 1}`);
  });
  boardEl.classList.remove("board--locked", "board--over");

  hideResult();
  updateTurnDisplay();
}

/** Remet à zéro les scores du mode en cours et relance une partie. */
function resetScores() {
  if (!confirm("Réinitialiser les scores de ce mode ?")) return;
  state.allScores[scoreKey()] = { X: 0, O: 0, draw: 0 };
  saveScores();
  renderScores();
  newGame();
}

/* ---------- Événements ---------- */

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));

// Affiche le choix de difficulté seulement en mode ordinateur
document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener("change", () => {
    difficultyGroup.hidden = input.value !== "cpu" || !input.checked;
  });
});

$("btn-start").addEventListener("click", () => {
  readSetup();
  applyModeLabels();
  renderScores();
  newGame();
  showScreen("game");
});
$("btn-new").addEventListener("click", newGame);
$("btn-restart").addEventListener("click", newGame);
$("btn-reset").addEventListener("click", resetScores);
$("btn-home").addEventListener("click", () => {
  cancelCpuMove();
  hideResult();
  showScreen("home");
});
$("btn-modal-new").addEventListener("click", newGame);
$("btn-modal-close").addEventListener("click", hideResult);

// Fermer la fenêtre avec Échap ou en cliquant à côté
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) hideResult();
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) hideResult();
});

/* ---------- Initialisation ---------- */

loadScores();
// Le navigateur peut restaurer le dernier mode coché : on synchronise l'affichage
difficultyGroup.hidden = document.querySelector('input[name="mode"]:checked').value !== "cpu";
renderScores();
updateTurnDisplay();
