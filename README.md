# Morpion Arena

Jeu de morpion (Tic-Tac-Toe) pour deux joueurs sur le même appareil, en HTML, CSS et JavaScript natifs.

## Lancer le jeu

Ouvrez `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari). Aucun serveur ni installation n'est nécessaire.

## Comment jouer

1. Sur la page d'accueil, cliquez sur **Commencer à jouer**.
2. Le joueur **X** commence, puis les joueurs jouent chacun leur tour en cliquant sur une case libre.
3. Le premier qui aligne trois symboles (ligne, colonne ou diagonale) gagne la manche et marque un point.
4. Si les neuf cases sont remplies sans alignement, la manche est nulle.

## Commandes

| Bouton | Effet |
|---|---|
| Nouvelle partie | Vide le plateau, garde les scores |
| Recommencer | Relance la manche en cours depuis zéro, garde les scores |
| Réinitialiser les scores | Remet X, O et les nuls à 0 (après confirmation) |
| Retour à l'accueil | Revient à la page d'accueil |

Les scores sont aussi enregistrés dans le navigateur (`localStorage`) : ils restent après un rechargement de la page.

## Organisation du code

- `index.html` : structure (accueil, écran de jeu, fenêtre de résultat).
- `style.css` : thème sombre, animations, adaptation mobile/tablette.
- `script.js` :
  - `state` : plateau, joueur courant, fin de partie, scores ;
  - `WINNING_LINES` : les 8 alignements gagnants ;
  - `handleCellClick` / `playMove` : refuse les cases occupées et les coups après la fin, pose le symbole, change de joueur ;
  - `findWinningLine` / `isBoardFull` : détection de la victoire et du match nul ;
  - `endGame`, `newGame`, `resetScores` : fin de manche et commandes.
