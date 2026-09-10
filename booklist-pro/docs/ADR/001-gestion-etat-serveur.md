# ADR 001 — Gestion de l'état serveur

## Statut
Accepté — 10/09/2026

## Contexte
L'application consomme une API distante (`api-books-v2`) : livres paginés, notes de
lecture, favoris, statistiques. Il faut mettre en cache ces données, les invalider
après une mutation, gérer les états de chargement/erreur, et éviter les
sur-rendus pendant la recherche. Le contrat de qualité (chapitre 3.2) exige que
`app/` et `components/` ne fassent aucun appel réseau direct.

Contraintes : délai de 1,5 jour à 3 personnes, API instable en mode `chaos`
(latence 1,5 s, 30 % d'échecs 503), besoin de mises à jour optimistes (favoris,
statut de lecture).

## Options envisagées
1. **`useState` + `useEffect` maison** : zéro dépendance, mais on réécrit à la main
   le cache, l'invalidation, le anti-rebond, l'annulation de requête et les retries —
   trop coûteux en temps pour le délai imparti.
2. **Redux Toolkit Query** : solution complète mais plus lourde à mettre en place
   (store global, slices) pour un projet de cette taille en 1,5 jour.
3. **TanStack Query** : cache par clé structurée, invalidation déclarative,
   `isLoading`/`isError` prêts à l'emploi, retries configurables, mutations
   optimistes intégrées (`onMutate` / `onError` / `onSettled`).

## Décision
Nous retenons **TanStack Query** pour tout l'état serveur (livres, notes, stats).
L'état purement local (thème, langue, formulaires) reste en `useState` /
`react-hook-form`. L'état partagé non-serveur (session, préférences) passe par
**Zustand**.

Convention de clés de cache (voir `hooks/useLivres.ts`) :
```
['livres']
['livres', 'liste', { page, limit, q, status, favori, sort, order }]
['livres', 'detail', id]
```
Toute mutation invalide `['livres']` en bloc, sauf les mises à jour optimistes
ciblées (favori, statut de lecture) qui modifient directement le cache de la
liste concernée puis reviennent en arrière (`rollback`) si le serveur refuse.

## Conséquences
**Positives** : code de récupération de données très réduit, comportement
correct par défaut en mode `chaos` (retry configurable), facile à tester avec
`jest-expo` + un mock de `fetch`/MSW.

**Négatives** : une dépendance supplémentaire à maîtriser en 1,5 jour ; risque de
mal configurer `staleTime`/`retry` si on ne le documente pas ici.

**À revoir si** : le Lot 4 (mode hors ligne + file de mutations persistée) est
attaqué — TanStack Query gère mal une file de mutations qui doit survivre à un
rechargement complet de page ; il faudra alors une persistance dédiée
(`AsyncStorage` + rejeu manuel), documentée dans un ADR 002 séparé.
