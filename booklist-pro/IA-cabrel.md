# IA.md — Cabrel

## Fonctionnalité choisie
Le client HTTP unique (`services/api/client.ts`) avec gestion d'erreurs
discriminée, et la résolution de couverture (`domain/couverture.ts`).

## Prompt exact utilisé
"Génère un client HTTP unique pour l'API BookList Pro : une fonction
`requete<T>(chemin, schema, options)` qui pose les en-têtes, un timeout,
l'en-tête If-Match pour le contrôle de version optimiste, valide la
réponse avec un schéma zod, et transforme chaque code HTTP d'erreur
(401/403/409/422/503) en une variante d'un type ErreurApplicative
discriminé. Ajoute aussi une fonction qui résout le champ couverture
d'un livre (chemin relatif, URL absolue, ou repli si absent) en te
basant sur la description du sujet fourni en pièce jointe."

## Trois défauts réels relevés dans le résultat
1. **API inexistante utilisée en confiance sur la foi du sujet.** Le code
   généré pour `domain/couverture.ts` construisait une URL vers
   `/covers/:id.svg` en repli, parce que le sujet affirme que cette
   route "répond pour n'importe quel identifiant". En testant l'API
   fournie réellement (`curl`), cette route renvoie une 404 — jamais
   implémentée côté serveur. Le défaut n'est pas venu d'une hallucination
   de l'IA à proprement parler, mais du fait qu'elle a fait confiance à
   la documentation fournie sans la vérifier contre le code réel — un
   piège qu'un développeur peut tout autant se faire avoir.
2. **Couverture de tests insuffisante sur le fichier le plus critique.**
   `services/api/client.ts` — le fichier qui centralise tout le mapping
   d'erreurs — n'était couvert qu'à 50 % après la première génération. Le
   `switch` sur les codes 401/403/409/422/503 n'était quasiment pas
   testé, alors que c'est le point unique de défaillance de toute la
   gestion d'erreurs de l'application.
3. **Dépendance récente choisie sans vérifier sa compatibilité réelle.**
   `@testing-library/react-native` a été installé en version 14.0.1 (la
   plus récente publiée), qui s'appuie sur un tout nouveau moteur de
   rendu de test (`test-renderer`) au lieu du `react-test-renderer`
   classique. Résultat : `render()` s'exécutait sans erreur mais
   retournait un objet vide, sans qu'aucun message n'indique la cause —
   un échec silencieux qui aurait pu faire perdre beaucoup de temps.

## Corrections apportées et justification
1. `domain/couverture.ts` ne construit plus jamais d'URL vers
   `/covers/:id.svg`. Le repli est désormais dessiné localement (teinte +
   initiales du titre), documenté dans `docs/API-ECARTS.md` pour que ce
   choix ne soit pas pris pour un oubli en revue de code.
2. Ajout de 9 tests dédiés (`__tests__/services/client.test.ts`) qui
   couvrent explicitement chacun des codes HTTP mappés, faisant passer la
   couverture du fichier de 50 % à 94 %.
3. Rétrogradé vers `@testing-library/react-native@^12.9.0`, une version
   stable qui utilise `react-test-renderer` (déjà présent via la
   dépendance `jest-expo`). Un test de sanité minimal
   (`render(<Text>...</Text>)` puis vérification que le résultat n'est
   pas vide) a permis de confirmer le diagnostic avant de changer quoi
   que ce soit.
