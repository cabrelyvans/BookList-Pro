/**
 * Résout le champ `couverture` renvoyé par l'API en une source affichable.
 *
 * Constat vérifié en testant l'API fournie (voir docs/API-ECARTS.md) :
 * la route /covers/:id.svg documentée par le sujet n'existe pas (404), et
 * tous les livres du seed ont couverture: null. Se reposer sur cette route
 * pour le repli afficherait un cadre cassé sur l'ensemble du fonds. Le repli
 * est donc dessiné localement (teinte + initiales), jamais délégué au serveur.
 */
export type SourceCouverture = { type: 'distante'; url: string } | { type: 'repli'; graine: string };

export function resoudreCouverture(couverture: string | null, idLivre: string, urlBase: string): SourceCouverture {
  const valeur = (couverture ?? '').trim();
  if (valeur.length === 0) {
    return { type: 'repli', graine: idLivre };
  }
  if (valeur.startsWith('http://') || valeur.startsWith('https://')) {
    return { type: 'distante', url: valeur };
  }
  // Chemin relatif (ex: /media/xxx.png envoyé par un libraire).
  return { type: 'distante', url: `${urlBase}${valeur}` };
}

/** Teinte déterministe : un même livre a toujours le même repli visuel. */
export function teinteRepli(graine: string): number {
  let accumulation = 0;
  for (let i = 0; i < graine.length; i += 1) {
    accumulation = (accumulation * 31 + graine.charCodeAt(i)) % 360;
  }
  return accumulation;
}

/** Initiales du titre pour le repli (ex: "Des Terres lointaines" -> "DT"). */
export function initialesRepli(titre: string): string {
  const mots = titre
    .split(/\s+/)
    .filter((mot) => mot.length > 0 && /\p{L}/u.test(mot[0] ?? ''))
    .slice(0, 2);
  if (mots.length === 0) return '?';
  return mots.map((mot) => (mot[0] ?? '').toUpperCase()).join('');
}
