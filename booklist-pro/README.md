# BookList Pro — client mobile (React Native / Expo)

Application cliente pour le cahier de lecture numérique des Comptoirs du Livre.
Équipe : Cabrel, Gaëtan, Grégoire.

## Démarrer en 5 minutes

### 1. Lancer l'API (dans un terminal séparé)
```bash
cd api-books-v2
npm install
npm run seed        # génère 500 livres — ou npm run seed:small pour 50, en dev
npm start            # http://localhost:3000
```
Vérifier : http://localhost:3000/health doit répondre `{"statut":"ok", ...}`.

### 2. Lancer l'application (dans ce dossier)
```bash
npm install
npm run web          # ouvre http://localhost:8081
```

Aucun émulateur requis. L'application tourne entièrement dans le navigateur via
`react-native-web`.

### 3. Comptes de test (une fois l'auth activée, Lot 4)
| Email | Mot de passe | Rôle |
|---|---|---|
| editeur@booklist.fr | editeur123 | Libraire titulaire (écriture) |
| lecteur@booklist.fr | lecteur123 | Libraire saisonnier (lecture seule) |

## Scripts disponibles
| Commande | Effet |
|---|---|
| `npm run web` | Démarre l'app dans le navigateur |
| `npm run lint` | ESLint (zéro `any`, zéro `console.log` résiduel) |
| `npm run format` | Formatage Prettier |
| `npm test` | Tests Jest + Testing Library |
| `npm run test:coverage` | Tests avec couverture (seuil 40 % sur `domain/` et `services/`) |
| `npx tsc --noEmit` | Vérification TypeScript stricte |

Pour tester en mode dégradé (recommandé dès le Lot 2) :
```bash
cd api-books-v2 && npm run chaos     # latence 1,5s + 30% d'échecs 503
```

## Connexion à l'API et pipeline des requêtes

### Comment l'application se connecte à l'API

Toute la configuration réseau tient dans **un seul fichier**,
`services/api/config.ts` :

```ts
export const URL_BASE_API = 'http://localhost:3000';
export const DELAI_EXPIRATION_MS = 8000;
```

Aucun autre fichier du projet ne connaît cette URL. Changer d'environnement
(dev/prod, ou une IP locale pour tester sur téléphone via Expo Go) se fait
en modifiant cette seule ligne.

La connexion elle-même — c'est-à-dire l'appel réseau réel — passe
systématiquement par `services/api/client.ts::requete()`, qui centralise
tout ce qu'une requête a besoin de porter :

```ts
export async function requete<T>(
  chemin: string,
  schema: z.ZodType<T>,
  options: OptionsRequete = {},
): Promise<ResultatApi<T>> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_EXPIRATION_MS);

  const entetes: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.ifMatch !== undefined) entetes['If-Match'] = String(options.ifMatch);

  const reponse = await fetch(`${URL_BASE_API}${chemin}`, {
    method: options.method ?? 'GET',
    headers: entetes,
    body: options.corps !== undefined ? JSON.stringify(options.corps) : undefined,
    signal: controleur.signal,
  });
  // ... traitement de la réponse, voir plus bas
}
```

Trois choses se passent à chaque connexion :
1. **Un délai d'expiration de 8 secondes** (`AbortController`) : si l'API
   ne répond pas, la requête est annulée plutôt que de bloquer l'écran
   indéfiniment.
2. **Les en-têtes appropriés** : `Content-Type` systématique, et
   `If-Match` (contrôle de version optimiste) uniquement sur les écritures
   qui en ont besoin.
3. **Aucun composant ni écran n'appelle jamais `fetch` directement** —
   c'est une règle vérifiée en revue de code (voir `docs/ARCHITECTURE.md`).

### Le pipeline complet d'une requête — schéma

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐     ┌────────────┐
│   Écran     │ --> │  Hook (Query │ --> │  services/api/       │ --> │ services/api/     │ --> │ API réelle │
│  (app/,     │     │   ou Mutation│     │  livres.ts, notes.ts │     │ client.ts         │     │ (fetch)    │
│  features/) │     │   TanStack)  │     │  (endpoint typé)     │     │ (URL, en-têtes,    │     │            │
└─────────────┘     └──────────────┘     └─────────────────────┘     │  timeout, erreurs) │     └────────────┘
       ^                    ^                                         └──────────────────┘             │
       │                    │                                                                            │
       │                    └──────────── réponse validée par zod (domain/*.ts) ◄─────────────────────────┘
       │
       └── mise à jour de l'écran (cache TanStack Query, invalidé ou optimiste)
```

### Le pipeline étape par étape, avec un exemple réel

Prenons `GET /books` (charger la liste paginée) :

1. **L'écran** (`app/index.tsx`) appelle le hook `useLivresInfini(criteres)`
   — il ne sait rien de l'URL, ni du format de la requête HTTP.
2. **Le hook** (`hooks/useLivres.ts`) traduit les critères de recherche en
   filtres via `domain/recherche.ts::versFiltresApi()`, puis appelle
   `listerLivres(filtres)`.
3. **`services/api/livres.ts::listerLivres`** construit l'URL avec ses
   paramètres de requête (`?page=1&limit=20&q=...&sort=...`) et délègue
   l'appel réel à `client.ts::requete()`.
4. **`client.ts`** exécute le `fetch`, avec le timeout et les en-têtes
   décrits ci-dessus.
5. **La réponse JSON est validée par un schéma zod**
   (`schemaPageLivres` dans `domain/livre.ts`) avant de remonter — un
   type TypeScript ne suffit pas, il faut vérifier à l'exécution que
   l'API a bien renvoyé la forme attendue.
6. **Le résultat remonte sous une forme explicite**, jamais une exception :
   ```ts
   type ResultatApi<T> = { succes: true; donnees: T } | { succes: false; erreur: ErreurApplicative };
   ```
   Le hook doit donc **toujours** traiter le cas d'échec — impossible de
   l'oublier par accident.
7. **TanStack Query met le résultat en cache**, sous une clé structurée
   (`['livres', 'recherche', criteres]`), et le rend disponible à l'écran
   via `isLoading` / `isError` / `data`.

### Le cas d'une écriture (exemple : `PATCH` pour basculer un favori)

Le pipeline est le même, avec deux différences :
- L'en-tête **`If-Match`** porte la version connue du livre. Si elle est
  périmée côté serveur, la réponse est un `409`, transformé par
  `client.ts` en `ErreurConflit` (`domain/erreurs.ts`) plutôt qu'appliquée
  aveuglément.
- La mise à jour du cache est **optimiste** (`hooks/useFavoris.ts`) :
  l'écran change instantanément, avant même la réponse du serveur, avec
  un retour en arrière automatique si le serveur refuse.

### Comment les erreurs réseau sont gérées à chaque étape

Chaque code HTTP renvoyé par l'API est traduit en une variante précise
d'`ErreurApplicative` (`domain/erreurs.ts`) dans `client.ts` :

| Code HTTP | Erreur applicative | Ce que ça déclenche à l'écran |
|---|---|---|
| 401/403 | `auth` | Message de droits/session (Lot 4 non branché) |
| 409 | `conflit` | Version périmée, fiche modifiée entre-temps |
| 422 | `validation` | Message affiché sous le bon champ du formulaire |
| 503 | `reseau` | "Service indisponible, réessayez" |
| timeout / offline | `reseau` | Idem, avec bouton "Réessayer" (`EtatEcran`) |

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour un exemple
supplémentaire (où placer une nouvelle entité) et
[`__tests__/services/client.test.ts`](__tests__/services/client.test.ts)
pour la preuve testée de chacun de ces mappings.



Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour le détail des couches
et le parcours complet d'une modification. En bref :

```
app/            écrans (Expo Router) — pas de logique métier, pas de fetch
components/     UI pure
features/       code par domaine (books, notes, auth, sync)
hooks/          logique réutilisable
services/       seul endroit qui connaît l'API
domain/         types + règles métier pures
theme/          tokens de design
```

## Décisions d'architecture
- [ADR 001 — Gestion de l'état serveur](docs/ADR/001-gestion-etat-serveur.md)
- ADR 002 — Stratégie hors ligne _(à rédiger si le Lot 4 est attaqué)_
- ADR 003 — Résolution des conflits _(à rédiger si le Lot 4 est attaqué)_

## Cible du projet
Lot 3 (fiche enrichie, confort d'usage) comme socle garanti, avec
l'authentification du Lot 4 en bonus si le temps le permet. Voir le plan de
campagne fourni en amont du projet pour le détail jour par jour.

## IA
Voir [`IA.md`](IA.md) (gabarit — une fiche par personne à dupliquer).
