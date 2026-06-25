export const GRILLE_FORFAIT: Record<number, number> = {
  10: 250,
  20: 250,
  30: 250,
  40: 320,
  50: 350,
  60: 390,
  70: 430,
  80: 500,
  90: 540,
  100: 580,
  110: 620,
  120: 660,
  130: 700,
  140: 740,
  150: 780,
  160: 820,
  170: 860,
  180: 900,
};

export const PRIX_KM_AU_DELA = 2.5;

export const COEFF_SAISONNALITE: Record<string, number> = {
  janvier: -0.07,
  fevrier: -0.07,
  mars: 0.1,
  avril: 0.1,
  mai: 0.15,
  juin: 0.15,
  juillet: 0.1,
  aout: -0.07,
  septembre: 0,
  octobre: 0,
  novembre: -0.07,
  decembre: 0,
};

export const COEFF_DATE_DEMANDE = {
  prioritaire: { seuilJours: 14, coeff: 0.1 },
  urgent: { seuilJours: 30, coeff: 0.05 },
  normal: { seuilJours: 90, coeff: -0.05 },
  troisMoisEtPlus: { seuilJours: Infinity, coeff: -0.1 },
};

export const COEFF_CAPACITE = [
  { max: 19, coeff: -0.05 },
  { max: 53, coeff: 0 },
  { max: 63, coeff: 0.15 },
  { max: 67, coeff: 0.2 },
  { max: 85, coeff: 0.4 },
];

export const CAPACITE_MAX_AUTO = 85;

export const MARGE = 0.15;
