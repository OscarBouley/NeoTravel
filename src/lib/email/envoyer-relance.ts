import { transporter } from "./transporter";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface RelanceData {
  devisId: string;
  prospectEmail: string;
  prospectPrenom: string;
  reference: string;
  prixTTC: string;
  departVille: string;
  arriveeVille: string;
  numero: number;
  urgent: boolean;
}

const SUJETS: Record<number, string> = {
  1: "Votre devis NeoTravel vous attend",
  2: "Avez-vous eu le temps de consulter votre devis ?",
};

function getCorps(data: RelanceData): string {
  const accepterUrl = `${BASE_URL}/devis/${data.devisId}/accepter`;
  const declinerUrl = `${BASE_URL}/devis/${data.devisId}/decliner`;
  const prix = Math.round(parseFloat(data.prixTTC));

  if (data.numero === 1) {
    return `
      <p>Nous vous avons récemment envoyé un devis pour votre trajet
      ${data.departVille} → ${data.arriveeVille}.</p>
      <p>Avez-vous eu l'occasion de le consulter ? Nous restons à votre disposition
      pour toute question.</p>
    `;
  }

  if (data.numero === 2) {
    return `
      <p>Votre devis <strong>n°${data.reference}</strong> pour le trajet
      ${data.departVille} → ${data.arriveeVille} est toujours en attente de votre réponse.</p>
      <p style="font-size: 20px; font-weight: bold; color: #8DB600; text-align: center; margin: 16px 0;">
        ${prix} € TTC
      </p>
      <p>N'hésitez pas à nous faire part de votre décision afin que nous puissions
      réserver votre véhicule dans les meilleurs délais.</p>
    `;
  }

  return `
    <p>Votre devis <strong>n°${data.reference}</strong> pour le trajet
    ${data.departVille} → ${data.arriveeVille} est toujours en attente de votre réponse.</p>
    <p style="font-size: 20px; font-weight: bold; color: #8DB600; text-align: center; margin: 16px 0;">
      ${prix} € TTC
    </p>
    <p>N'hésitez pas à nous faire part de votre décision afin que nous puissions
    réserver votre véhicule dans les meilleurs délais.</p>
  `;
}

export async function envoyerRelance(data: RelanceData) {
  const accepterUrl = `${BASE_URL}/devis/${data.devisId}/accepter`;
  const declinerUrl = `${BASE_URL}/devis/${data.devisId}/decliner`;

  await transporter.sendMail({
    from: `"NeoTravel" <${process.env.GMAIL_USER}>`,
    to: data.prospectEmail,
    subject: SUJETS[data.numero] ?? `Relance devis NeoTravel — ${data.reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Bonjour ${data.prospectPrenom},</h2>

        ${getCorps(data)}

        <div style="text-align: center; margin: 28px 0;">
          <a href="${accepterUrl}"
             style="display: inline-block; padding: 14px 32px; background-color: #8DB600; color: #ffffff;
                    text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 8px; margin-right: 12px;">
            Accepter le devis
          </a>
          <a href="${declinerUrl}"
             style="display: inline-block; padding: 14px 32px; background-color: #e5e7eb; color: #374151;
                    text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 8px;">
            Décliner le devis
          </a>
        </div>

        <p>À très bientôt,<br/><strong>L'équipe NeoTravel</strong></p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">
          NeoTravel — Transport de groupe sur mesure
        </p>
      </div>
    `,
  });
}
