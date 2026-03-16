import nodemailer from "nodemailer";

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

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await transporter.sendMail({
    from: `"INNOVTEC Intranet" <${FROM}>`,
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a2744; font-size: 22px; margin: 0;">INNOVTEC <span style="font-weight: normal; color: #999;">Réseaux</span></h1>
        </div>
        <h2 style="color: #1a2744; font-size: 18px;">Réinitialisation du mot de passe</h2>
        <p style="color: #555; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #f5a623; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #999; font-size: 13px; line-height: 1.5;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.<br>
          Ce lien expire dans 1 heure.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
        <p style="color: #bbb; font-size: 11px; text-align: center;">
          © 2026 INNOVTEC Réseaux — Intranet
        </p>
      </div>
    `,
  });
}
