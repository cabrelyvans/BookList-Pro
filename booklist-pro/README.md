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

## Architecture

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
