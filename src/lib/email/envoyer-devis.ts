import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { transporter } from "./transporter";
import { DevisPdf, type DevisPdfData } from "./devis-pdf";

export async function envoyerDevis(data: DevisPdfData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(DevisPdf, { data }) as any,
  );

  await transporter.sendMail({
    from: `"NeoTravel" <${process.env.GMAIL_USER}>`,
    to: data.prospect.email,
    subject: `Votre devis NeoTravel — ${data.reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Bonjour ${data.prospect.prenom},</h2>
        <p>Merci pour votre demande de devis chez <strong>NeoTravel</strong>.</p>
        <p>Vous trouverez ci-joint votre devis <strong>n°${data.reference}</strong> pour votre trajet
        ${data.voyage.departVille} → ${data.voyage.arriveeVille}.</p>
        <p style="font-size: 24px; font-weight: bold; color: #8DB600; text-align: center; margin: 20px 0;">
          ${Math.round(data.prix.prixTTC)} € TTC
        </p>
        <p>Un conseiller vous recontactera sous 2h pour finaliser votre réservation.</p>
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
