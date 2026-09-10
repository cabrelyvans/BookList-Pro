# Architecture — BookList Pro

## Les couches

```
app/            écrans + routing (Expo Router) — AUCUNE logique métier, AUCUN fetch
components/     UI pure — aucune dépendance à l'API ni au store
features/       découpage par domaine (books, notes, auth, sync) — à peupler au fil des lots
hooks/          logique réutilisable (useLivres, à venir : useNotes, useFavoris, useDebounce...)
services/       SEUL endroit qui connaît l'API : services/api/ (client, endpoints), stockage, réseau
domain/         types + règles métier pures, sans dépendance technique (erreurs, validation zod)
theme/          tokens de design (clair/sombre)
docs/ADR/       décisions d'architecture
```

Règle vérifiée en revue de code : **aucun `fetch` ni URL en dur** en dehors de
`services/`. Un écran ne fait jamais `fetch(...)` — il appelle un hook, qui
appelle une fonction de `services/api/`.

## Parcours d'une modification (exemple : basculer un livre en "lu")

1. L'utilisateur appuie sur la case à cocher dans un composant de `app/` ou
   `features/books/`.
2. Le composant appelle un hook (`useModifierLivre`, à écrire sur le modèle de
   `useLivres.ts`) qui déclenche une **mutation TanStack Query**.
3. La mutation appelle `services/api/livres.ts::modifierLivrePartiel(id, version, { lu })`.
4. `modifierLivrePartiel` appelle `services/api/client.ts::requete()`, qui pose
   l'en-tête `If-Match`, envoie la requête, et retourne un `ResultatApi<Livre>`
   (jamais d'exception silencieuse — un objet `{ succes, ... }` explicite).
5. En cas de succès : le cache `['livres', ...]` est invalidé ou mis à jour de
   façon optimiste (voir ADR 001). En cas d'erreur : le type discriminé
   (`domain/erreurs.ts`) redescend jusqu'au composant via `EtatEcran`, qui
   affiche un message et un bouton "Réessayer".

## Où placerait-on une nouvelle entité "collections thématiques" ?

- `domain/collection.ts` : types + schéma zod
- `services/api/collections.ts` : endpoints
- `hooks/useCollections.ts` : hook TanStack Query
- `features/collections/` : composants spécifiques (carte de collection, formulaire)
- `app/collections/index.tsx` et `app/collections/[id].tsx` : écrans, qui ne font
  qu'assembler les hooks et composants ci-dessus.

## Ce qui empêche un composant d'appeler directement l'API

Rien ne l'empêche *techniquement* — React Native ne bloque pas un `fetch()` dans
un composant. C'est une **convention vérifiée en revue de code** (chapitre 3.2
du sujet), pas une contrainte du langage. Pour la rendre visible : toute PR qui
introduit un `fetch(` ou une URL `http://`/`https://` en dehors de `services/`
doit être refusée en revue.
