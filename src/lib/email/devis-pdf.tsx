import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const green = "#8DB600";
const darkText = "#1a1a1a";
const gray = "#666666";

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: darkText,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  brandAccent: {
    color: green,
  },
  subtitle: {
    fontSize: 8,
    color: gray,
    marginTop: 2,
  },
  devisRef: {
    textAlign: "right",
  },
  refNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: green,
  },
  refDate: {
    fontSize: 9,
    color: gray,
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: green,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: green,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 160,
    color: gray,
  },
  value: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },
  clientSection: {
    marginBottom: 16,
  },
  voyageSection: {
    marginBottom: 16,
  },
  prixBox: {
    backgroundColor: green,
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  prixLabel: {
    fontSize: 12,
    color: "#ffffff",
    marginBottom: 4,
  },
  prixValeur: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  prixDetail: {
    fontSize: 8,
    color: "#ffffff",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: gray,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 8,
  },
  mention: {
    fontSize: 8,
    color: gray,
    marginTop: 12,
    lineHeight: 1.4,
  },
});

export interface DevisPdfData {
  reference: string;
  date: string;
  prospect: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    societe: string;
  };
  voyage: {
    besoin: string;
    departVille: string;
    departDate: string;
    departHeure: string;
    arriveeVille: string;
    arriveeDate: string;
    arriveeHeure: string;
    nbPassagers: number;
  };
  prix: {
    prixHT: number;
    prixTTC: number;
  };
}

const BESOIN_LABELS: Record<string, string> = {
  aller_simple: "Aller simple",
  aller_retour: "Aller-retour",
  circuit: "Circuit",
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DevisPdf({ data }: { data: DevisPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>
              Neo<Text style={s.brandAccent}>Travel</Text>
            </Text>
            <Text style={s.subtitle}>
              Location autocar, bus, minibus avec chauffeur
            </Text>
          </View>
          <View style={s.devisRef}>
            <Text style={s.refNumber}>DEVIS N° {data.reference}</Text>
            <Text style={s.refDate}>Le {formatDate(data.date)}</Text>
            <Text style={s.refDate}>
              Valable sous réserve de disponibilité
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Client */}
        <View style={s.clientSection}>
          <Text style={s.sectionTitle}>Client</Text>
          <View style={s.row}>
            <Text style={s.label}>Nom</Text>
            <Text style={s.value}>
              {data.prospect.prenom} {data.prospect.nom}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Société</Text>
            <Text style={s.value}>{data.prospect.societe}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Email</Text>
            <Text style={s.value}>{data.prospect.email}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Téléphone</Text>
            <Text style={s.value}>{data.prospect.telephone}</Text>
          </View>
        </View>

        {/* Voyage */}
        <View style={s.voyageSection}>
          <Text style={s.sectionTitle}>Votre voyage</Text>
          <View style={s.row}>
            <Text style={s.label}>Type de déplacement</Text>
            <Text style={s.value}>
              {BESOIN_LABELS[data.voyage.besoin] ?? data.voyage.besoin}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Nombre de passagers</Text>
            <Text style={s.value}>{data.voyage.nbPassagers}</Text>
          </View>

          <View style={{ marginTop: 8 }} />

          <View style={s.row}>
            <Text style={s.label}>Départ</Text>
            <Text style={s.value}>
              {data.voyage.departVille} — {formatDate(data.voyage.departDate)}{" "}
              à {data.voyage.departHeure}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Arrivée</Text>
            <Text style={s.value}>
              {data.voyage.arriveeVille} —{" "}
              {formatDate(data.voyage.arriveeDate)} à{" "}
              {data.voyage.arriveeHeure}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Prix */}
        <View style={s.prixBox}>
          <Text style={s.prixLabel}>TARIF TTC</Text>
          <Text style={s.prixValeur}>
            {Math.round(data.prix.prixTTC)} €
          </Text>
          <Text style={s.prixDetail}>
            HT : {data.prix.prixHT.toFixed(2)} € — TVA 10%
          </Text>
        </View>

        {/* Mentions */}
        <Text style={s.mention}>
          Ce prix comprend : frais chauffeur, Assurances Responsabilité civile
          professionnelle.{"\n"}
          Reste à votre charge : péages autoroutiers et parkings éventuels.
          {"\n\n"}
          Les prestations de transports réalisées en France sont soumises au
          taux de TVA de 10%.
        </Text>

        {/* Footer */}
        <View style={s.footer}>
          <Text>
            NeoTravel — Transport de groupe sur mesure — contact@neotravel.fr
          </Text>
        </View>
      </Page>
    </Document>
  );
}
