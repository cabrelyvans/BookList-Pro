# Écarts constatés entre le sujet et l'API fournie

Constaté en testant directement `api-books-v2` en local (curl + lecture du
code source de l'API), pas une supposition.

## Les routes de couverture n'existent pas

Le sujet décrit trois routes : `GET /covers/:id.svg`, `POST /books/:id/cover`,
`DELETE /books/:id/cover`. Test réel :

```
curl http://localhost:3000/covers/<id-existant>.svg
→ 404 {"erreur":"route_inconnue", ...}
```

Ces routes ne sont déclarées nulle part dans le code source de l'API, et
`npm run seed` initialise tous les livres avec `couverture: null`.

**Conséquence pour nous** : le sujet affirme que "la route /covers/:id.svg
répond pour n'importe quel identifiant" et qu'"aucune fiche n'a donc de raison
d'afficher un cadre vide". C'est faux pour la version de l'API qu'on nous a
donnée. Notre `domain/couverture.ts` ne construit donc jamais d'URL vers cette
route : quand le champ est vide, on dessine un repli local (teinte +
initiales du titre) dans `components/Couverture.tsx`, jamais délégué au
serveur. Le même repli s'active si une image distante échoue à charger.

**Tâche 3 du Lot 3 (remplacement de couverture) — bloquée, pas de contournement viable.**
Vérifié en deux temps, pas juste sur la lecture du sujet :

1. `POST /books/:id/cover` et `DELETE /books/:id/cover` renvoient eux aussi
   `404 route_inconnue` en réel (mêmes routes que ci-dessus, jamais déclarées
   côté serveur).
2. Le contournement évident — encoder l'image en base64 et la poser dans le
   champ `couverture` existant via le `PATCH` déjà utilisé pour le reste de
   la fiche — est lui aussi fermé : `api-books-v2/src/livres.js` valide ce
   champ avec `texte('couverture', false, 500)`, une limite dure de 500
   caractères, bien en-deçà de ce qu'une image encodée nécessite.

Il n'existe donc **aucun moyen réel de remplacer une couverture** contre
cette version de l'API, quelle que soit l'approche côté client. Conformément
à la consigne du sujet ("si une règle semble impossible à respecter, s'arrêter
et le signaler"), ce point a été remonté à Grégoire plutôt que contourné
silencieusement (ex. en stockant l'image ailleurs que dans l'API). Décision :
ne pas implémenter cette tâche tant que l'API ne l'expose pas ; à réactiver
si `api-books-v2` évolue.

## `POST /sync` ne traite que des livres

La route accepte des mutations `create`/`update`/`delete` sur des ouvrages
uniquement (vérifié dans `src/routes-systeme.js`). Les notes de lecture n'y
ont pas leur place.

**Conséquence pour nous** : si on attaque le mode hors ligne (Lot 4), la file
de mutations devra distinguer les deux natures et rejouer les notes sur leurs
routes REST classiques, après le lot de livres — pas encore implémenté, à
traiter dans l'ADR 002 le cas échéant.

## `authRequise` est visible sur `/health`

`GET /health` expose ce champ. Utile pour éviter d'afficher un écran de
connexion inutile quand l'API tourne sans `npm run auth`.
