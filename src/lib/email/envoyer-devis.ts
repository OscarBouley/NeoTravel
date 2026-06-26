import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { transporter } from "./transporter";
import { DevisPdf, type DevisPdfData } from "./devis-pdf";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function envoyerDevis(
  data: DevisPdfData & { devisId: string; isRevision?: boolean },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(DevisPdf, { data }) as any,
  );

  const accepterUrl = `${BASE_URL}/devis/${data.devisId}/accepter`;
  const declinerUrl = `${BASE_URL}/devis/${data.devisId}/decliner`;

  const subject = data.isRevision
    ? `Nouveau devis NeoTravel — ${data.reference}`
    : `Votre devis NeoTravel — ${data.reference}`;

  const intro = data.isRevision
    ? `<p>Suite à nos échanges, votre conseiller vous a préparé un nouveau devis
       <strong>n°${data.reference}</strong> pour votre trajet
       ${data.voyage.departVille} → ${data.voyage.arriveeVille}.</p>`
    : `<p>Suite à votre demande, veuillez trouver ci-joint votre devis
       <strong>n°${data.reference}</strong> pour votre trajet
       ${data.voyage.departVille} → ${data.voyage.arriveeVille}.</p>`;

  await transporter.sendMail({
    from: `"NeoTravel" <${process.env.GMAIL_USER}>`,
    to: data.prospect.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Bonjour ${data.prospect.prenom},</h2>

        ${intro}

        <p style="font-size: 24px; font-weight: bold; color: #8DB600; text-align: center; margin: 24px 0;">
          ${Math.round(data.prix.prixTTC)} € TTC
        </p>

        <p>Prenez connaissance du devis en pièce jointe et faites-nous savoir si vous souhaitez le valider ou non :</p>

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

        <p style="font-size: 13px; color: #666;">
          Si vous avez des questions, n'hésitez pas à nous contacter. Un conseiller est disponible
          pour vous accompagner dans votre projet.
        </p>

        <p>À très bientôt,<br/><strong>L'équipe NeoTravel</strong></p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">
          NeoTravel — Transport de groupe sur mesure
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `devis-neotravel-${data.reference}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      },
    ],
  });
}
