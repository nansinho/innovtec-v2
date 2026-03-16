import nodemailer from "nodemailer";
import { getCompanyLogo } from "@/actions/settings";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@intranet-innovtec.fr";

// Couleurs INNOVTEC
const NAVY = "#1a2744";
const YELLOW = "#f5a623";
const LIGHT_BG = "#f7f8fa";
const WHITE = "#ffffff";

async function getLogoHtml(): Promise<string> {
  try {
    const logos = await getCompanyLogo();
    const logoUrl = logos.light || logos.dark;
    if (logoUrl) {
      return `<img src="${logoUrl}" alt="INNOVTEC Réseaux" style="height: 40px; max-width: 180px; object-fit: contain;" />`;
    }
  } catch {
    // fallback to text
  }
  return `<span style="font-size: 22px; font-weight: 700; color: ${WHITE}; letter-spacing: 0.5px;">INNOVTEC <span style="font-weight: 400; opacity: 0.7;">Réseaux</span></span>`;
}

function emailLayout(content: string, logoHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin: 0; padding: 0; background-color: ${LIGHT_BG}; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${LIGHT_BG}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color: ${NAVY}; padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center;">
              ${logoHtml}
            </td>
          </tr>

          <!-- YELLOW ACCENT LINE -->
          <tr>
            <td style="background-color: ${YELLOW}; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color: ${WHITE}; padding: 36px 32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: ${NAVY}; padding: 20px 32px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.5);">
                © 2026 INNOVTEC Réseaux — Intranet collaboratif
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const logoHtml = await getLogoHtml();

  const content = `
    <h2 style="margin: 0 0 8px; font-size: 20px; color: ${NAVY}; font-weight: 700;">
      Réinitialisation du mot de passe
    </h2>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Vous avez demandé la réinitialisation de votre mot de passe sur l'intranet INNOVTEC.
      Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
    </p>

    <!-- BUTTON -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 28px;">
          <a href="${resetLink}"
             style="background-color: ${YELLOW}; color: ${WHITE}; text-decoration: none;
                    padding: 14px 36px; border-radius: 8px; font-weight: 700;
                    font-size: 15px; display: inline-block; letter-spacing: 0.3px;
                    box-shadow: 0 2px 8px rgba(245,166,35,0.3);">
            Réinitialiser mon mot de passe
          </a>
        </td>
      </tr>
    </table>

    <!-- DIVIDER -->
    <div style="border-top: 1px solid #e5e7eb; margin: 4px 0 20px;"></div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
      Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
      Ce lien expire dans <strong>1 heure</strong>.
    </p>

    <p style="color: #d1d5db; font-size: 11px; margin: 16px 0 0; word-break: break-all;">
      <a href="${resetLink}" style="color: #9ca3af; text-decoration: underline;">${resetLink}</a>
    </p>
  `;

  await transporter.sendMail({
    from: `"INNOVTEC Intranet" <${FROM}>`,
    to,
    subject: "Réinitialisation de votre mot de passe — INNOVTEC Intranet",
    html: emailLayout(content, logoHtml),
  });
}
