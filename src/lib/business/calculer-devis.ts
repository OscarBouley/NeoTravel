import {
  GRILLE_FORFAIT,
  PRIX_KM_AU_DELA,
  COEFF_SAISONNALITE,
  COEFF_DATE_DEMANDE,
  COEFF_CAPACITE,
  CAPACITE_MAX_AUTO,
  MARGE,
} from "./tarifs";

export interface DevisParams {
  distanceKm: number;
  besoin: "aller_simple" | "aller_retour" | "circuit";
  dateDepart: string;
  dateDemande?: string;
  nbPassagers: number;
}

export interface DevisResult {
  prixHT: number;
  prixTTC: number;
  detail: {
    prixBase: number;
    multiplicateur: number;
    marge: number;
    coeffSaison: number;
    coeffDate: number;
    coeffCapacite: number;
    renvoyerCommercial: boolean;
  };
}

const MOIS_FR = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
];

const TVA = 0.1;

function getPrixBase(distanceKm: number): number {
  const paliers = Object.keys(GRILLE_FORFAIT)
    .map(Number)
    .sort((a, b) => a - b);

  for (const palier of paliers) {
    if (distanceKm <= palier) {
      return GRILLE_FORFAIT[palier];
    }
  }

  const kmTotal = distanceKm * 2;
  return kmTotal * PRIX_KM_AU_DELA;
}

function getCoeffSaison(dateDepart: string): number {
  const mois = new Date(dateDepart).getMonth();
  return COEFF_SAISONNALITE[MOIS_FR[mois]] ?? 0;
}

function getCoeffDate(dateDepart: string, dateDemande: string): number {
  const depart = new Date(dateDepart);
  const demande = new Date(dateDemande);
  const joursAvant = Math.floor(
    (depart.getTime() - demande.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (joursAvant <= COEFF_DATE_DEMANDE.prioritaire.seuilJours) {
    return COEFF_DATE_DEMANDE.prioritaire.coeff;
  }
  if (joursAvant <= COEFF_DATE_DEMANDE.urgent.seuilJours) {
    return COEFF_DATE_DEMANDE.urgent.coeff;
  }
  if (joursAvant <= COEFF_DATE_DEMANDE.normal.seuilJours) {
    return COEFF_DATE_DEMANDE.normal.coeff;
  }
  return COEFF_DATE_DEMANDE.troisMoisEtPlus.coeff;
}

function getCoeffCapacite(nbPassagers: number): {
  coeff: number;
  renvoyerCommercial: boolean;
} {
  if (nbPassagers > CAPACITE_MAX_AUTO) {
    return { coeff: 0, renvoyerCommercial: true };
  }

  for (const tranche of COEFF_CAPACITE) {
    if (nbPassagers <= tranche.max) {
      return { coeff: tranche.coeff, renvoyerCommercial: false };
    }
  }

  return { coeff: 0, renvoyerCommercial: true };
}

export function calculerDevis(params: DevisParams): DevisResult {
  const { distanceKm, besoin, dateDepart, nbPassagers } = params;
  const dateDemande = params.dateDemande ?? new Date().toISOString().slice(0, 10);

  const prixBase = getPrixBase(distanceKm);

  const multiplicateur = besoin === "aller_retour" ? 2 : 1;

  const coeffSaison = getCoeffSaison(dateDepart);
  const coeffDate = getCoeffDate(dateDepart, dateDemande);
  const { coeff: coeffCapacite, renvoyerCommercial } =
    getCoeffCapacite(nbPassagers);

  const prixApresMultiplicateur = prixBase * multiplicateur;
  const prixApresMarge = prixApresMultiplicateur * (1 + MARGE);
  const prixHT =
    prixApresMarge *
    (1 + coeffSaison) *
    (1 + coeffDate) *
    (1 + coeffCapacite);

  const prixTTC = prixHT * (1 + TVA);

  return {
    prixHT: Math.round(prixHT * 100) / 100,
    prixTTC: Math.round(prixTTC * 100) / 100,
    detail: {
      prixBase,
      multiplicateur,
      marge: MARGE,
      coeffSaison,
      coeffDate,
      coeffCapacite,
      renvoyerCommercial,
    },
  };
}
