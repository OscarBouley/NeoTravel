import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — NeoTravel",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-xl font-bold text-navy-100">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-navy-300">{children}</div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-navy-700">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-navy-700 bg-navy-800">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold text-navy-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-navy-800 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-navy-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RgpdPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <header className="border-b border-navy-800/50 bg-navy-950/90 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-navy-950">N</div>
            <span className="text-lg font-bold tracking-tight text-navy-100">
              Neo<span className="text-lime-400">Travel</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs text-navy-500">Dernière mise à jour : 29 juin 2026</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-100">Politique de confidentialité</h1>
        <p className="mt-4 text-sm leading-relaxed text-navy-400">
          NeoTravel s&apos;engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).
        </p>

        <Section id="responsable" title="1. Responsable du traitement">
          <p>Le responsable du traitement des données collectées via le site neo-travel-group25.vercel.app est :</p>
          <ul className="space-y-1 pl-4">
            <li>Société : NeoTravel</li>
            <li>Siège social : 85 Avenue du seigneur Bouley</li>
            <li>SIRET : 049583749583</li>
            <li>Contact RGPD : NeoTravelNoReply@gmail.com</li>
          </ul>
        </Section>

        <Section id="donnees" title="2. Données collectées">
          <p>
            Dans le cadre de l&apos;établissement d&apos;un devis de transport de groupe, NeoTravel collecte uniquement les données strictement nécessaires à la réalisation de ce service (principe de minimisation, article 5 du RGPD) :
          </p>
          <Table
            headers={["Donnée", "Finalité", "Obligatoire"]}
            rows={[
              ["Nom et prénom", "Identification du contact", "Oui"],
              ["Adresse email", "Envoi du devis et des relances", "Non"],
              ["Numéro de téléphone", "Contact en cas de besoin", "Non"],
              ["Ville de départ", "Calcul de la distance et du tarif", "Oui"],
              ["Ville d'arrivée", "Calcul de la distance et du tarif", "Oui"],
              ["Date du trajet", "Vérification disponibilité et tarif", "Oui"],
              ["Nombre de passagers", "Calcul du tarif et dimensionnement", "Oui"],
              ["Nom de l'entreprise", "Identification pour les devis professionnels", "Oui"],
            ]}
          />
          <p>
            Les conversations avec l&apos;assistant IA sont traitées en mémoire pendant la session uniquement. Seules les informations validées et nécessaires à l&apos;établissement du devis sont conservées en base de données.
          </p>
        </Section>

        <Section id="finalites" title="3. Finalités du traitement">
          <p>Vos données sont collectées et traitées pour les finalités suivantes, chacune reposant sur une base légale définie :</p>
          <Table
            headers={["Finalité", "Base légale (art. 6 RGPD)"]}
            rows={[
              ["Établissement et envoi du devis de transport", "Exécution d'un contrat (art. 6.1.b)"],
              ["Qualification de la demande et détection des informations manquantes", "Exécution d'un contrat (art. 6.1.b)"],
              ["Envoi de relances si le devis reste sans réponse", "Intérêt légitime (art. 6.1.f)"],
              ["Suivi du pipeline commercial (dashboard interne)", "Intérêt légitime (art. 6.1.f)"],
              ["Amélioration du service et des processus internes", "Intérêt légitime (art. 6.1.f)"],
            ]}
          />
        </Section>

        <Section id="conservation" title="4. Durée de conservation">
          <Table
            headers={["Catégorie de données", "Durée de conservation"]}
            rows={[
              ["Données prospect et demande de devis", "3 ans à compter du dernier contact"],
              ["Devis accepté (données contractuelles)", "10 ans (obligation légale comptable)"],
              ["Devis refusé ou sans réponse", "1 an à compter de la dernière relance"],
              ["Logs de conversation IA", "Session uniquement — non conservés au-delà"],
              ["Données de facturation", "10 ans (article L.123-22 du Code de commerce)"],
            ]}
          />
          <p>À l&apos;issue de ces durées, les données sont supprimées ou anonymisées. Aucune donnée n&apos;est conservée sans finalité définie.</p>
        </Section>

        <Section id="destinataires" title="5. Destinataires et sous-traitants">
          <p>Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales. Elles sont partagées uniquement avec les sous-traitants techniques nécessaires au fonctionnement du service :</p>
          <Table
            headers={["Sous-traitant", "Rôle", "Localisation", "Garanties"]}
            rows={[
              ["Supabase (PostgreSQL)", "Base de données — stockage des leads, devis et relances", "UE (eu-west-1)", "Clauses contractuelles types"],
              ["Vercel", "Hébergement et déploiement de l'application", "États-Unis", "Clauses contractuelles types (DPA Vercel)"],
              ["Google (Gmail SMTP)", "Envoi des emails de devis et de relance via Nodemailer", "États-Unis", "Clauses contractuelles types"],
              ["Anthropic / Vercel AI Gateway", "Modèle de langage pour la qualification des demandes (Claude Sonnet)", "États-Unis", "Clauses contractuelles types — aucune donnée personnelle identifiante dans les prompts"],
              ["OSRM / Nominatim", "Calcul de la distance routière (villes uniquement)", "UE", "Service public open source — pas de données personnelles transmises"],
            ]}
          />
          <p>
            Concernant l&apos;IA : les conversations avec l&apos;assistant sont traitées par le modèle Claude (Anthropic). Le calcul du prix est réalisé par un moteur de règles déterministe entièrement local — le LLM ne reçoit jamais de données personnelles identifiantes et ne participe jamais au calcul du devis.
          </p>
        </Section>

        <Section id="droits" title="6. Vos droits">
          <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants sur vos données personnelles :</p>
          <ul className="space-y-2 pl-4">
            <li><span className="font-semibold text-navy-200">Droit d&apos;accès (art. 15)</span> : obtenir une copie des données vous concernant que nous détenons.</li>
            <li><span className="font-semibold text-navy-200">Droit de rectification (art. 16)</span> : corriger des données inexactes ou incomplètes.</li>
            <li><span className="font-semibold text-navy-200">Droit à l&apos;effacement (art. 17)</span> : demander la suppression de vos données (droit à l&apos;oubli).</li>
            <li><span className="font-semibold text-navy-200">Droit à la limitation (art. 18)</span> : restreindre le traitement de vos données dans certains cas.</li>
            <li><span className="font-semibold text-navy-200">Droit à la portabilité (art. 20)</span> : recevoir vos données dans un format structuré et lisible.</li>
            <li><span className="font-semibold text-navy-200">Droit d&apos;opposition (art. 21)</span> : vous opposer au traitement fondé sur l&apos;intérêt légitime.</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à : <span className="text-lime-400">NeoTravelNoReply@gmail.com</span>
          </p>
          <p>Nous nous engageons à répondre dans un délai d&apos;un mois à compter de la réception de votre demande.</p>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :{" "}
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline underline-offset-2">
              cnil.fr/fr/plaintes
            </a>
          </p>
        </Section>

        <Section id="securite" title="7. Sécurité des données">
          <p>NeoTravel met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :</p>
          <ul className="space-y-2 pl-4">
            <li><span className="font-semibold text-navy-200">Chiffrement en transit</span> : toutes les communications sont chiffrées via HTTPS (TLS 1.3).</li>
            <li><span className="font-semibold text-navy-200">Chiffrement au repos</span> : les données stockées dans Supabase sont chiffrées par défaut.</li>
            <li><span className="font-semibold text-navy-200">Contrôle d&apos;accès</span> : Row Level Security (RLS) activé sur Supabase ; accès au dashboard limité aux équipes internes.</li>
            <li><span className="font-semibold text-navy-200">Minimisation des données IA</span> : l&apos;agent IA ne reçoit que les informations nécessaires à la qualification. Aucune donnée personnelle identifiante n&apos;est transmise dans les prompts.</li>
            <li><span className="font-semibold text-navy-200">Séparation des environnements</span> : environnement de développement distinct de la production ; les jeux de tests n&apos;utilisent pas de données réelles.</li>
            <li><span className="font-semibold text-navy-200">Variables d&apos;environnement sécurisées</span> : toutes les clés API sont stockées dans les variables d&apos;environnement Vercel, jamais dans le code source.</li>
          </ul>
        </Section>

        <Section id="cookies" title="8. Cookies et traceurs">
          <p>Le site NeoTravel n&apos;utilise pas de cookies de tracking ou de profilage publicitaire. Les seuls cookies présents sont :</p>
          <Table
            headers={["Cookie", "Finalité", "Durée"]}
            rows={[
              ["Session Next.js", "Maintien de la session de conversation avec l'assistant", "Durée de la session"],
              ["Préférences interface", "Mémorisation des préférences d'affichage", "30 jours"],
            ]}
          />
          <p>Aucun outil de mesure d&apos;audience tiers (Google Analytics, Hotjar, etc.) n&apos;est installé sur ce site.</p>
        </Section>

        <Section id="modifications" title="9. Modifications de cette politique">
          <p>
            Cette politique de confidentialité peut être mise à jour pour refléter des évolutions légales ou techniques. La date de dernière mise à jour est indiquée en haut de ce document. En cas de modification substantielle, les utilisateurs concernés seront informés par email.
          </p>
        </Section>

        <div className="mt-16 border-t border-navy-800 pt-6 text-center">
          <Link href="/" className="text-sm text-navy-400 transition-colors hover:text-lime-400">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
