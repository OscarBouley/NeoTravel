import { describe, it, expect } from "vitest";
import { calculerDevis } from "../calculer-devis";

const BASE_PARAMS = {
  distanceKm: 100,
  besoin: "aller_simple" as const,
  dateDepart: "2026-06-15",
  dateDemande: "2026-05-01",
  nbPassagers: 30,
};

describe("calculerDevis", () => {
  // ── CAS TYPES ──

  describe("cas types", () => {
    it("trajet court, basse saison, 25 pax", () => {
      const result = calculerDevis({
        distanceKm: 30,
        besoin: "aller_simple",
        dateDepart: "2026-01-20",
        dateDemande: "2025-11-01",
        nbPassagers: 25,
      });
      expect(result.prixHT).toBeGreaterThan(0);
      expect(result.prixTTC).toBeGreaterThan(result.prixHT);
      expect(result.detail.coeffSaison).toBe(-0.07);
      expect(result.detail.coeffCapacite).toBe(0);
      expect(result.detail.renvoyerCommercial).toBe(false);
    });

    it("trajet moyen A/R, haute saison mai, 50 pax", () => {
      const result = calculerDevis({
        distanceKm: 100,
        besoin: "aller_retour",
        dateDepart: "2026-05-20",
        dateDemande: "2026-05-10",
        nbPassagers: 50,
      });
      expect(result.detail.multiplicateur).toBe(2);
      expect(result.detail.coeffSaison).toBe(0.15);
      expect(result.detail.coeffCapacite).toBe(0);
      expect(result.prixTTC).toBeGreaterThan(1500);
    });

    it("trajet long, gros groupe 70 pax", () => {
      const result = calculerDevis({
        distanceKm: 250,
        besoin: "aller_simple",
        dateDepart: "2026-06-15",
        dateDemande: "2026-04-01",
        nbPassagers: 70,
      });
      expect(result.detail.coeffCapacite).toBe(0.4);
      expect(result.detail.renvoyerCommercial).toBe(false);
      expect(result.prixTTC).toBeGreaterThan(1500);
    });

    it("avec remise custom en pourcentage", () => {
      const sansRemise = calculerDevis(BASE_PARAMS);
      const avecRemise = calculerDevis(BASE_PARAMS, { ajustementCustom: -0.1 });
      expect(avecRemise.prixTTC).toBeLessThan(sansRemise.prixTTC);
      const ratio = avecRemise.prixHT / sansRemise.prixHT;
      expect(ratio).toBeCloseTo(0.9, 2);
    });

    it("override de tous les coefficients", () => {
      const result = calculerDevis(BASE_PARAMS, {
        coeffSaison: 0.05,
        coeffDate: 0.02,
        coeffCapacite: 0.1,
        marge: 0.2,
        ajustementCustom: -0.05,
      });
      expect(result.detail.coeffSaison).toBe(0.05);
      expect(result.detail.coeffDate).toBe(0.02);
      expect(result.detail.coeffCapacite).toBe(0.1);
      expect(result.detail.marge).toBe(0.2);
      expect(result.detail.ajustementCustom).toBe(-0.05);
    });
  });

  // ── PRIX DE BASE (GRILLE) ──

  describe("grille tarifaire", () => {
    it("distance ≤ 10 km → prix base 250€", () => {
      const result = calculerDevis({ ...BASE_PARAMS, distanceKm: 5 });
      expect(result.detail.prixBase).toBe(250);
    });

    it("distance = 30 km → prix base 250€", () => {
      const result = calculerDevis({ ...BASE_PARAMS, distanceKm: 30 });
      expect(result.detail.prixBase).toBe(250);
    });

    it("distance = 100 km → prix base 580€", () => {
      const result = calculerDevis({ ...BASE_PARAMS, distanceKm: 100 });
      expect(result.detail.prixBase).toBe(580);
    });

    it("distance = 180 km (dernier palier) → prix base 900€", () => {
      const result = calculerDevis({ ...BASE_PARAMS, distanceKm: 180 });
      expect(result.detail.prixBase).toBe(900);
    });

    it("distance = 181 km (au-delà grille) → calcul au km", () => {
      const result = calculerDevis({ ...BASE_PARAMS, distanceKm: 181 });
      expect(result.detail.prixBase).toBe(181 * 2 * 2.5);
    });

    it("distance = 500 km → calcul au km", () => {
      const result = calculerDevis({ ...BASE_PARAMS, distanceKm: 500 });
      expect(result.detail.prixBase).toBe(500 * 2 * 2.5);
    });
  });

  // ── MULTIPLICATEUR ──

  describe("multiplicateur besoin", () => {
    it("aller_simple → multiplicateur 1", () => {
      const result = calculerDevis({ ...BASE_PARAMS, besoin: "aller_simple" });
      expect(result.detail.multiplicateur).toBe(1);
    });

    it("aller_retour → multiplicateur 2", () => {
      const result = calculerDevis({ ...BASE_PARAMS, besoin: "aller_retour" });
      expect(result.detail.multiplicateur).toBe(2);
    });

    it("circuit → multiplicateur 1", () => {
      const result = calculerDevis({ ...BASE_PARAMS, besoin: "circuit" });
      expect(result.detail.multiplicateur).toBe(1);
    });

    it("A/R double le prix par rapport à aller simple", () => {
      const simple = calculerDevis({ ...BASE_PARAMS, besoin: "aller_simple" });
      const ar = calculerDevis({ ...BASE_PARAMS, besoin: "aller_retour" });
      expect(ar.prixTTC).toBeCloseTo(simple.prixTTC * 2, 0);
    });
  });

  // ── SAISONNALITÉ ──

  describe("coefficient saisonnalité", () => {
    it("janvier → -7%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, dateDepart: "2026-01-15" });
      expect(result.detail.coeffSaison).toBe(-0.07);
    });

    it("mai → +15%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, dateDepart: "2026-05-15" });
      expect(result.detail.coeffSaison).toBe(0.15);
    });

    it("septembre → 0%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, dateDepart: "2026-09-15" });
      expect(result.detail.coeffSaison).toBe(0);
    });

    it("juillet → +10%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, dateDepart: "2026-07-15" });
      expect(result.detail.coeffSaison).toBe(0.1);
    });

    it("août → -7%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, dateDepart: "2026-08-15" });
      expect(result.detail.coeffSaison).toBe(-0.07);
    });
  });

  // ── DÉLAI DEMANDE / DÉPART ──

  describe("coefficient délai demande", () => {
    it("≤14 jours → prioritaire +10%", () => {
      const result = calculerDevis({
        ...BASE_PARAMS,
        dateDepart: "2026-06-20",
        dateDemande: "2026-06-10",
      });
      expect(result.detail.coeffDate).toBe(0.1);
    });

    it("14-30 jours → urgent +5%", () => {
      const result = calculerDevis({
        ...BASE_PARAMS,
        dateDepart: "2026-07-10",
        dateDemande: "2026-06-20",
      });
      expect(result.detail.coeffDate).toBe(0.05);
    });

    it("30-90 jours → normal -5%", () => {
      const result = calculerDevis({
        ...BASE_PARAMS,
        dateDepart: "2026-09-01",
        dateDemande: "2026-06-15",
      });
      expect(result.detail.coeffDate).toBe(-0.05);
    });

    it(">90 jours → 3 mois+ -10%", () => {
      const result = calculerDevis({
        ...BASE_PARAMS,
        dateDepart: "2027-01-15",
        dateDemande: "2026-06-15",
      });
      expect(result.detail.coeffDate).toBe(-0.1);
    });
  });

  // ── CAPACITÉ ──

  describe("coefficient capacité", () => {
    it("≤19 pax → -5%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 15 });
      expect(result.detail.coeffCapacite).toBe(-0.05);
    });

    it("20-53 pax → 0%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 40 });
      expect(result.detail.coeffCapacite).toBe(0);
    });

    it("54-63 pax → +15%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 60 });
      expect(result.detail.coeffCapacite).toBe(0.15);
    });

    it("64-67 pax → +20%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 65 });
      expect(result.detail.coeffCapacite).toBe(0.2);
    });

    it("68-85 pax → +40%", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 80 });
      expect(result.detail.coeffCapacite).toBe(0.4);
    });

    it("85 pax (limite) → +40%, pas d'escalade", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 85 });
      expect(result.detail.coeffCapacite).toBe(0.4);
      expect(result.detail.renvoyerCommercial).toBe(false);
    });

    it("86 pax → escalade HITL", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 86 });
      expect(result.detail.renvoyerCommercial).toBe(true);
      expect(result.detail.coeffCapacite).toBe(0);
    });

    it("200 pax → escalade HITL", () => {
      const result = calculerDevis({ ...BASE_PARAMS, nbPassagers: 200 });
      expect(result.detail.renvoyerCommercial).toBe(true);
    });
  });

  // ── OVERRIDES ──

  describe("overrides", () => {
    it("override coeffCapacite désactive renvoyerCommercial même pour >85 pax", () => {
      const result = calculerDevis(
        { ...BASE_PARAMS, nbPassagers: 100 },
        { coeffCapacite: 0.5 },
      );
      expect(result.detail.renvoyerCommercial).toBe(false);
      expect(result.detail.coeffCapacite).toBe(0.5);
    });

    it("override marge remplace la valeur par défaut 15%", () => {
      const result = calculerDevis(BASE_PARAMS, { marge: 0.25 });
      expect(result.detail.marge).toBe(0.25);
    });

    it("marge à 0 → pas de marge", () => {
      const withMarge = calculerDevis(BASE_PARAMS);
      const withoutMarge = calculerDevis(BASE_PARAMS, { marge: 0 });
      expect(withoutMarge.prixHT).toBeLessThan(withMarge.prixHT);
    });
  });

  // ── TVA ET ARRONDI ──

  describe("TVA et arrondi", () => {
    it("prixTTC = prixHT * 1.10", () => {
      const result = calculerDevis(BASE_PARAMS);
      expect(result.prixTTC).toBeCloseTo(result.prixHT * 1.1, 1);
    });

    it("les prix sont arrondis à 2 décimales", () => {
      const result = calculerDevis(BASE_PARAMS);
      expect(result.prixHT).toBe(Math.round(result.prixHT * 100) / 100);
      expect(result.prixTTC).toBe(Math.round(result.prixTTC * 100) / 100);
    });
  });

  // ── FORMULE COMPLÈTE ──

  describe("formule complète vérifiable", () => {
    it("calcul déterministe avec tous les coefficients à 0", () => {
      const result = calculerDevis(
        { distanceKm: 100, besoin: "aller_simple", dateDepart: "2026-09-15", dateDemande: "2026-06-01", nbPassagers: 30 },
        { coeffSaison: 0, coeffDate: 0, coeffCapacite: 0, marge: 0.15, ajustementCustom: 0 },
      );
      // prixBase = 580, multiplicateur = 1, marge = 15%
      // prixHT = 580 * 1 * 1.15 * 1 * 1 * 1 * 1 = 667
      expect(result.prixHT).toBe(667);
      // prixTTC = 667 * 1.1 = 733.70
      expect(result.prixTTC).toBe(733.7);
    });

    it("calcul A/R avec marge et saisonnalité", () => {
      const result = calculerDevis(
        { distanceKm: 100, besoin: "aller_retour", dateDepart: "2026-09-15", dateDemande: "2026-06-01", nbPassagers: 30 },
        { coeffSaison: 0.1, coeffDate: 0, coeffCapacite: 0, marge: 0.15, ajustementCustom: 0 },
      );
      // prixBase = 580, mult = 2 → 1160, marge 15% → 1334, saison +10% → 1467.4
      expect(result.prixHT).toBe(1467.4);
      expect(result.prixTTC).toBeCloseTo(1467.4 * 1.1, 1);
    });
  });
});
