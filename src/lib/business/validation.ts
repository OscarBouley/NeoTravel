const MAX_PASSAGERS = 200;
const MAX_JOURS_FUTUR = 365;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validerDemande(data: {
  departDate?: string | null;
  arriveeDate?: string | null;
  departVille?: string | null;
  arriveeVille?: string | null;
  voyageursMin?: number | null;
  voyageursMax?: number | null;
}): ValidationResult {
  const errors: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (data.departDate) {
    const dep = new Date(data.departDate);
    if (dep < today) {
      errors.push("La date de départ ne peut pas être dans le passé");
    }
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_JOURS_FUTUR);
    if (dep > maxDate) {
      errors.push(`La date de départ ne peut pas dépasser ${MAX_JOURS_FUTUR} jours dans le futur`);
    }
  }

  if (data.arriveeDate) {
    const arr = new Date(data.arriveeDate);
    if (arr < today) {
      errors.push("La date d'arrivée ne peut pas être dans le passé");
    }
    if (data.departDate && arr < new Date(data.departDate)) {
      errors.push("La date d'arrivée ne peut pas être avant la date de départ");
    }
  }

  if (data.departVille && data.arriveeVille) {
    if (data.departVille.trim().toLowerCase() === data.arriveeVille.trim().toLowerCase()) {
      errors.push("La ville de départ et d'arrivée ne peuvent pas être identiques");
    }
  }

  if (data.voyageursMin != null) {
    if (data.voyageursMin < 1) {
      errors.push("Le nombre minimum de voyageurs doit être d'au moins 1");
    }
    if (data.voyageursMin > MAX_PASSAGERS) {
      errors.push(`Le nombre de voyageurs ne peut pas dépasser ${MAX_PASSAGERS}`);
    }
  }

  if (data.voyageursMax != null) {
    if (data.voyageursMax < 1) {
      errors.push("Le nombre maximum de voyageurs doit être d'au moins 1");
    }
    if (data.voyageursMax > MAX_PASSAGERS) {
      errors.push(`Le nombre de voyageurs ne peut pas dépasser ${MAX_PASSAGERS}`);
    }
  }

  if (data.voyageursMin != null && data.voyageursMax != null) {
    if (data.voyageursMin > data.voyageursMax) {
      errors.push("Le nombre minimum de voyageurs ne peut pas dépasser le maximum");
    }
  }

  return { valid: errors.length === 0, errors };
}
