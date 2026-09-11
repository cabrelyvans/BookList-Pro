# Mesure de performance avant/apres optimisation (Lot 3) -- methode + resultats

## Ce qui a été mesuré

`CarteLivre` (composant de ligne de la liste, `components/CarteLivre.tsx`)
était déjà enveloppé dans `React.memo()`, avec ce commentaire au-dessus :

> Mémoïsée pour que la frappe dans la barre de recherche [...] ne re-rende
> pas chaque ligne de la liste.

En relisant l'écran d'accueil (`app/index.tsx`) pendant ce lot, ce n'était
**pas vrai en pratique** :

```tsx
renderItem={({ item }) => <CarteLivre livre={item} onPress={(id) => router.push(`/livres/${id}`)} />}
```

`onPress` est une fonction fléchée **inline** : `renderItem` en construit une
nouvelle à chaque fois qu'il est appelé pour une ligne. `React.memo()`
compare les props de façon superficielle (`Object.is`) — `livre` reste la
même référence tant que la page de résultats n'a pas changé, mais `onPress`,
lui, change à *chaque* rendu de l'écran (ex: à chaque frappe dans la barre
de recherche, avant même que le debounce ne déclenche une nouvelle requête).
Résultat : la mémoïsation était invalidée sur cette seule prop, et **chaque
ligne visible re-rendait pour rien** à chaque frappe.

## Correctif

`app/index.tsx` : la fonction passée à `onPress` est désormais stabilisée
avec `useCallback(..., [])`, donc la même référence traverse tous les
rendus de l'écran :

```tsx
const ouvrirFiche = useCallback((id: string) => router.push(`/livres/${id}`), []);
// ...
renderItem={({ item }) => <CarteLivre livre={item} onPress={ouvrirFiche} />}
```

Avec `livre` ET `onPress` stables, `React.memo()` peut enfin bloquer le
re-rendu des lignes inchangées comme il était censé le faire depuis le
départ.

## Méthode de mesure

Un test dédié (`__tests__/components/CarteLivre.test.tsx`) reproduit
exactement le scénario réel : une liste de lignes `CarteLivre`, un parent
dont un état sans rapport se met à jour (`setTick`), et on compte les
exécutions **réelles** du corps du composant — pas via le `Profiler` natif
de React (vérifié empiriquement que son `onRender` se déclenche même quand
un enfant mémoïsé a bien bloqué son re-rendu, ce qui en fait un mauvais
indicateur ici), mais en remplaçant `<Couverture>` — rendu sans condition à
chaque exécution de `CarteLivreBrute` — par un espion (`jest.mock`) et en
comptant ses appels.

Deux scénarios, 20 lignes, un seul re-rendu du parent déclenché :

| Scénario | Lignes qui re-rendent réellement |
| --- | --- |
| `onPress` inline (bug, avant correctif) | **20 / 20** |
| `onPress` via `useCallback` (après correctif) | **0 / 20** |

## Ordre de grandeur du temps de rendu

Complément indicatif, mesuré via `performance.now()` autour du même
scénario avec une liste de 300 lignes (moyenne sur 3 exécutions, environnement
de test Jest/React Native Testing Library — **pas un appareil physique**,
donc à ne lire que comme un ordre de grandeur comparatif entre les deux
scénarios, pas comme un temps de rendu réel sur téléphone) :

| Scénario | Durée du commit de re-rendu (300 lignes) |
| --- | --- |
| `onPress` inline (bug) | ~60–74 ms |
| `onPress` via `useCallback` (correctif) | ~6–9 ms |

Soit une division par 8 à 10 du temps passé à re-rendre des lignes qui
n'avaient, en réalité, rien à re-rendre.

## Pourquoi ne pas avoir ajouté `getItemLayout` sur le `FlatList`

Envisagé en alternative, mais pas retenu pour ce lot : la hauteur d'une
ligne `CarteLivre` dépend du rendu réel du texte (`titre` sur une ligne,
`auteur · année` en dessous) dont la hauteur exacte varie avec la plateforme
et les réglages d'accessibilité (échelle de police système). Le seul
élément dont la hauteur est garantie déterministe est `<Couverture largeur={48}>`
(`Math.round(48 * 1.4) = 67`), mais rien ne garantit qu'il reste le plus
grand des deux enfants dans tous les cas (ex: police système agrandie). Un
`getItemLayout` basé sur une constante fausse provoquerait des sauts visuels
au défilement, plus gênants que le gain qu'il apporterait — et ce gain
n'est de toute façon mesurable qu'avec un défilement réel sur un appareil
physique, indisponible dans cet environnement. Décision : ne pas l'ajouter
plutôt que de livrer une optimisation non vérifiable ni vérifiée.
