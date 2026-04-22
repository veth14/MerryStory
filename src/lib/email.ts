import nodemailer from "nodemailer";

function getEmailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export type WelcomeEmailOptions = {
  to: string;
  name: string;
  activationLink: string;
  role: string;
};

export async function sendWelcomeActivationEmail(options: WelcomeEmailOptions): Promise<void> {
  const { to, name, activationLink, role } = options;

  const transporter = getEmailTransporter();
  const fromAddress = process.env.EMAIL_USER!;

  const roleFriendly =
    role === "ADMINISTRATOR"
      ? "Administrator"
      : role === "LEAD COORDINATOR"
        ? "Lead Coordinator"
        : "Production Staff";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Merry Story</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1d1d1f;padding:36px 48px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:0.25em;color:#eebf43;text-transform:uppercase;">Merry Story Productions</p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">You&rsquo;re In.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#a1a1aa;letter-spacing:0.1em;text-transform:uppercase;">Hello, ${name}</p>
              <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#1d1d1f;line-height:1.3;">
                Your account has been created
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.7;">
                You have been added to the <strong style="color:#1d1d1f;">Merry Story Productions</strong> platform as a
                <strong style="color:#eebf43;">${roleFriendly}</strong>.
                To get started, please verify your email address and activate your account by clicking the button below.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background-color:#eebf43;border-radius:10px;padding:0;">
                    <a href="${activationLink}"
                       style="display:inline-block;padding:16px 36px;font-size:11px;font-weight:900;letter-spacing:0.15em;color:#1d1d1f;text-decoration:none;text-transform:uppercase;">
                      Activate My Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.7;">
                If the button above doesn&rsquo;t work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 32px;font-size:12px;color:#a1a1aa;word-break:break-all;">
                <a href="${activationLink}" style="color:#eebf43;">${activationLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #f4f4f5;margin:0 0 24px;" />

              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.7;">
                This invitation was sent by the Merry Story Productions admin team.
                If you believe this was sent in error, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 48px;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                &copy; ${new Date().getFullYear()} Merry Story Inc. &mdash; All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Merry Story Productions" <${fromAddress}>`,
    to,
    subject: "You're invited — Activate your Merry Story account",
    html,
  });
}
