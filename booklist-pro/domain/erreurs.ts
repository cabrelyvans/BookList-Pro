/**
 * Type d'erreur applicatif discriminé — exigence chapitre 3.3 du sujet.
 * Toute erreur remontée par services/ doit être une de ces variantes,
 * jamais une Error générique ni un throw de chaîne.
 */

export type ErreurReseau = {
  type: 'reseau';
  message: string;
  cause?: unknown;
};

export type ErreurValidation = {
  type: 'validation';
  message: string;
  /** Un message par champ fautif, tel que renvoyé par l'API en 422 */
  champs: Record<string, string>;
};

export type ErreurConflit = {
  type: 'conflit';
  message: string;
  /** La ressource telle qu'elle existe côté serveur, pour proposer une fusion */
  versionAttendue: number;
  serveur: unknown;
};

export type ErreurAuth = {
  type: 'auth';
  code: 'jeton_absent' | 'jeton_expire' | 'jeton_invalide' | 'droits_insuffisants';
  message: string;
};

export type ErreurInconnue = {
  type: 'inconnue';
  message: string;
  cause?: unknown;
};

export type ErreurApplicative =
  | ErreurReseau
  | ErreurValidation
  | ErreurConflit
  | ErreurAuth
  | ErreurInconnue;

export function estErreurApplicative(valeur: unknown): valeur is ErreurApplicative {
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    'type' in valeur &&
    typeof (valeur as { type: unknown }).type === 'string'
  );
}

/** Message prêt à afficher à un libraire, sans jargon technique. */
export function messageUtilisateur(erreur: ErreurApplicative): string {
  switch (erreur.type) {
    case 'reseau':
      return "Impossible de joindre le serveur. Vérifiez la connexion et réessayez.";
    case 'validation':
      return 'Certains champs ne sont pas valides.';
    case 'conflit':
      return 'Cette fiche a été modifiée entre-temps par quelqu’un d’autre.';
    case 'auth':
      return erreur.code === 'droits_insuffisants'
        ? "Vous n'avez pas les droits nécessaires pour cette action."
        : 'Votre session a expiré, reconnexion en cours…';
    case 'inconnue':
      return "Une erreur inattendue s'est produite.";
  }
}
