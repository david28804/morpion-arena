/* =========================================================
   MORPION ARENA – Logique du jeu
   JavaScript natif, sans framework.
   ========================================================= */

"use strict";

/* ---------- Constantes ---------- */

// Les 8 combinaisons gagnantes (indices des cases 0 à 8)
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
  [0, 4, 8], [2, 4, 6],            // diagonales
];

const PLAYER_X = "X";
const PLAYER_O = "O";
const STORAGE_KEY = "morpion-arena-scores";

/* ---------- État du jeu ---------- */

const state = {
  board: Array(9).fill(null), // contenu des 9 cases
  currentPlayer: PLAYER_X,    // joueur dont c'est le tour
  gameOver: false,            // true quand la partie est terminée
  scores: { X: 0, O: 0, draw: 0 },
};

/* ---------- Références DOM ---------- */

const $ = (id) => document.getElementById(id);

const screens = { home: $("home"), game: $("game") };
const boardEl = $("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const statusEl = $("status");
const scoreEls = { X: $("score-x"), O: $("score-o"), draw: $("score-draw") };
const scoreCards = { X: $("score-card-x"), O: $("score-card-o") };
const modal = $("result");
const modalSymbol = $("result-symbol");
const modalTitle = $("result-title");

/* ---------- Sauvegarde des scores ---------- */
// Les scores sont conservés entre les manches et même après un
// rechargement de la page (localStorage). Si le stockage est
// indisponible (navigation privée...), le jeu fonctionne quand même.

function loadScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.X === "number") {
      state.scores = { X: saved.X, O: saved.O || 0, draw: saved.draw || 0 };
    }
  } catch (e) {
    /* stockage indisponible : on garde les scores à 0 */
  }
}

function saveScores() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scores));
  } catch (e) {
    /* ignoré */
  }
}

/* ---------- Navigation entre écrans ---------- */

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("screen--active"));
  screens[name].classList.add("screen--active");
}

/* ---------- Logique principale ---------- */

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

/** Gère le clic sur une case. */
function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  // Pas de coup après la fin de la partie
  if (state.gameOver) return;

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
  }
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

  if (winner) {
    line.forEach((i) => cells[i].classList.add("cell--win"));
    state.scores[winner] += 1;
    statusEl.innerHTML = `Le joueur <span class="${colorClass(winner)}">${winner}</span> gagne !`;
  } else {
    state.scores.draw += 1;
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
  statusEl.innerHTML = `Au tour du joueur <span class="${colorClass(p)}">${p}</span>`;
  boardEl.dataset.turn = p;
  scoreCards.X.classList.toggle("score--active", p === PLAYER_X);
  scoreCards.O.classList.toggle("score--active", p === PLAYER_O);
}

/**
 * Met à jour les scores affichés.
 * @param {string} [changed] score à animer ("X", "O" ou "draw")
 */
function renderScores(changed) {
  for (const key of Object.keys(scoreEls)) {
    scoreEls[key].textContent = state.scores[key];
  }
  if (changed && scoreEls[changed]) {
    const el = scoreEls[changed];
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
}

function showResult(winner) {
  // Ne pas afficher si le joueur a déjà relancé une partie entre-temps
  if (!state.gameOver) return;

  if (winner) {
    modalSymbol.textContent = winner;
    modalSymbol.className = `modal__symbol ${colorClass(winner)}`;
    modalTitle.textContent = `Victoire du joueur ${winner} !`;
  } else {
    modalSymbol.textContent = "=";
    modalSymbol.className = "modal__symbol";
    modalTitle.textContent = "Match nul !";
  }
  modal.hidden = false;
  $("btn-modal-new").focus();
}

function hideResult() {
  modal.hidden = true;
}

/* ---------- Commandes ---------- */

/** Vide le plateau sans toucher aux scores. X recommence toujours. */
function newGame() {
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

/** Remet tous les scores à zéro et relance une partie. */
function resetScores() {
  if (!confirm("Réinitialiser tous les scores ?")) return;
  state.scores = { X: 0, O: 0, draw: 0 };
  saveScores();
  renderScores();
  newGame();
}

/* ---------- Événements ---------- */

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));

$("btn-start").addEventListener("click", () => {
  newGame();
  showScreen("game");
});
$("btn-new").addEventListener("click", newGame);
$("btn-restart").addEventListener("click", newGame);
$("btn-reset").addEventListener("click", resetScores);
$("btn-home").addEventListener("click", () => {
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
renderScores();
updateTurnDisplay();
