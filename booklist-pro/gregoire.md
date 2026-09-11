# IA.md — Grégoire

## Fonctionnalité choisie
La persistance du thème (`theme/ThemeProvider.tsx`,
`services/stockage/preferences.ts`) et le composant de couverture avec
repli local (`components/Couverture.tsx`).

## Prompt exact utilisé
"Écris un ThemeProvider React qui expose un thème clair/sombre, respecte
la préférence système par défaut au premier lancement, et persiste le
choix explicite de l'utilisateur via AsyncStorage à travers une
abstraction dédiée. Écris aussi un composant Couverture qui affiche
l'image distante d'un livre si elle existe, ou un repli local (couleur +
initiales du titre) sinon, en te basant sur une fonction de résolution
déjà fournie dans le domaine."

## Trois défauts réels relevés dans le résultat
1. **Anti-pattern signalé par l'outillage, pas détecté à l'œil.** La
   première version de `components/Couverture.tsx` réinitialisait l'état
   d'échec de chargement via `useEffect(() => setEnEchec(false),
   [couverture])`. La configuration ESLint du projet
   (`react-hooks/set-state-in-effect`, liée au futur compilateur React)
   a signalé ce pattern comme risqué : ajuster un état en réaction à un
   changement de prop dans un effet peut provoquer un rendu
   supplémentaire inutile, la méthode recommandée étant d'ajuster l'état
   directement pendant le rendu.
2. **Promesse rejetée non gérée, jamais déclenchée en usage normal.**
   `ThemeProvider.tsx` lisait le thème persisté avec
   `lireThemePersiste().then(...)`, sans `.catch()`. Si `AsyncStorage`
   échoue (stockage plein, corrompu, ou simplement indisponible sur
   certaines configurations), cette promesse rejetée n'était interceptée
   nulle part — un défaut qui ne se voit dans aucun test ni aucune
   démonstration normale, seulement en simulant une panne du stockage.
3. **Fonctionnalité générée et testée isolément, mais jamais intégrée.**
   Le thème et l'internationalisation (`i18n/`) ont été produits
   fonctionnels et corrects pris séparément, mais ni l'un ni l'autre
   n'est branché dans `app/_layout.tsx` ni utilisé par les écrans
   existants — un défaut de coordination plus que de code : l'IA ne
   pouvait pas savoir que cette intégration finale restait à faire
   puisqu'elle n'a jamais eu la vue d'ensemble du planning de l'équipe.

## Corrections apportées et justification
1. Remplacé le `useEffect` de réinitialisation par un ajustement d'état
   pendant le rendu (comparaison de la couverture précédente et actuelle
   dans le corps du composant, avec `setEtat(...)` appelé
   conditionnellement avant le `return`) — le pattern que React
   documente lui-même pour ce cas précis.
2. Ajouté un `.catch()` explicite autour de la lecture du thème
   persisté, qui conserve la préférence système déjà appliquée par
   défaut plutôt que de laisser l'erreur remonter sans être gérée.
3. Non corrigé à ce stade, assumé comme dette technique documentée :
   `theme/ThemeProvider.tsx` et `i18n/` restent prêts mais non branchés.
   Priorité donnée à finir et tester le Lot 1+2 plutôt que de commencer
   une intégration du Lot 3 qui resterait elle-même incomplète.
