# Morpion Arena

Jeu de morpion (Tic-Tac-Toe) pour deux joueurs sur le même appareil, en HTML, CSS et JavaScript natifs.

## Lancer le jeu

Ouvrez `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari). Aucun serveur ni installation n'est nécessaire.

## Comment jouer

1. Sur la page d'accueil, cliquez sur **Commencer à jouer**.
2. Le joueur **X** commence, puis les joueurs jouent chacun leur tour en cliquant sur une case libre.
3. Le premier qui aligne trois symboles (ligne, colonne ou diagonale) gagne la manche et marque un point.
4. Si les neuf cases sont remplies sans alignement, la manche est nulle.

## Modes de jeu

Choisissez le mode sur la page d'accueil :

- **2 joueurs** : deux personnes jouent à tour de rôle sur le même appareil.
- **Contre l'ordinateur** : vous jouez X, l'ordinateur joue O. Quatre niveaux :
  - **Facile** : l'ordinateur joue au hasard.
  - **Moyen** : il gagne s'il le peut, vous bloque si vous allez gagner, sinon il prend le centre ou joue au hasard.
  - **Difficile** : il joue le coup parfait environ 3 fois sur 4, sinon un coup « moyen ». Difficile, mais battable.
  - **Expert** : il calcule tous les coups possibles à chaque tour (algorithme minimax). Il ne perd jamais : au mieux, vous obtenez un match nul.

Chaque mode et chaque niveau a ses propres scores.

## Commandes

| Bouton | Effet |
|---|---|
| Nouvelle partie | Vide le plateau, garde les scores |
| Recommencer | Relance la manche en cours depuis zéro, garde les scores |
| Réinitialiser les scores | Remet à 0 les scores du mode en cours |
| Retour à l'accueil | Revient à la page d'accueil |

Les scores sont aussi enregistrés dans le navigateur (`localStorage`) : ils restent après un rechargement de la page.

## Organisation du code

- `index.html` : structure (accueil, écran de jeu, fenêtre de résultat).
- `style.css` : thème sombre, animations, adaptation mobile/tablette.
- `logo.svg` / `logo-512.png` : logo du jeu (onglet, icône de téléphone) ; `og-image.png` : aperçu lors du partage du lien ; `site.webmanifest` : nom et icône quand on ajoute le jeu à l'écran d'accueil.
- `script.js` :
  - `state` : plateau, joueur courant, fin de partie, scores ;
  - `WINNING_LINES` : les 8 alignements gagnants ;
  - `handleCellClick` / `playMove` : refuse les cases occupées et les coups après la fin, pose le symbole, change de joueur ;
  - `findWinningLine` / `isBoardFull` : détection de la victoire et du match nul ;
  - `chooseCpuMove` / `minimax` : coups de l'ordinateur selon la difficulté ;
  - `endGame`, `newGame`, `resetScores` : fin de manche et commandes.
