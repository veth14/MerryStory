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

export async function sendContractReviewEmail(options: ContractReviewEmailOptions): Promise<void> {
  const { to, contractName, eventName, reviewLink, accessCode, recipientName } = options;
  const transporter = getEmailTransporter();
  const fromAddress = process.env.EMAIL_USER!;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Contract Agreement Review</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f7f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f7f4;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-top:4px solid #D4AF37;box-shadow:0 10px 40px rgba(0,0,0,0.03);">
          <tr>
            <td style="padding:34px 48px 12px;text-align:center;">
              <h1 style="font-family:'Georgia',serif;font-weight:400;font-size:26px;color:#111;letter-spacing:4px;margin:0;">MERRY STORY</h1>
              <p style="font-size:10px;letter-spacing:5px;color:#888;text-transform:uppercase;margin:8px 0 0;">Productions</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 48px 40px;">
              <p style="font-size:15px;line-height:1.8;margin:0 0 20px;color:#444;font-family:'Georgia',serif;font-style:italic;text-align:center;">
                Your contract agreement is ready for review.
              </p>

              <p style="font-size:15px;line-height:1.8;margin:0 0 20px;color:#444;">
                Dear ${recipientName || 'Client'},
              </p>

              <p style="font-size:15px;line-height:1.8;margin:0 0 20px;color:#444;">
                We have prepared the agreement for <strong>${eventName}</strong>. Before opening the contract page, please use the private access code below.
              </p>

              <div style="background-color:#FAFAFA;padding:25px 30px;border-left:3px solid #D4AF37;margin-bottom:35px;">
                <div style="margin-bottom:10px;">
                  <strong style="color:#111;font-size:11px;text-transform:uppercase;letter-spacing:1px;">CONTRACT:</strong>
                  <span style="color:#555;margin-left:5px;">${contractName}</span>
                </div>
                <div>
                  <strong style="color:#111;font-size:11px;text-transform:uppercase;letter-spacing:1px;">ACCESS CODE:</strong>
                  <span style="color:#555;margin-left:5px;font-size:18px;font-weight:700;letter-spacing:0.18em;">${accessCode}</span>
                </div>
              </div>

              <div style="text-align:center;margin:34px 0 38px;">
                <p style="font-size:13px;line-height:1.8;margin-bottom:20px;color:#666;letter-spacing:1px;text-transform:uppercase;">
                  Secure Contract Review Link
                </p>
                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="background-color:#D4AF37;padding:0;">
                      <a href="${reviewLink}" style="display:inline-block;padding:14px 28px;background-color:#D4AF37;color:white;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">
                        Open Contract Page
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.7;">
                You will be asked to enter the access code before the contract file is shown.
              </p>
              <p style="margin:0 0 32px;font-size:12px;color:#a1a1aa;word-break:break-all;">
                <a href="${reviewLink}" style="color:#D4AF37;">${reviewLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #EAEAEA;margin:40px 0;" />

              <div style="text-align:center;">
                <p style="font-size:14px;line-height:1.5;color:#666;margin-bottom:5px;">
                  Warmest regards,
                </p>
                <p style="color:#111;font-family:'Georgia',serif;font-size:18px;font-style:italic;margin-top:0;margin-bottom:5px;">
                  The Merry Story Team
                </p>
                <a href="mailto:hello@merrystory.com" style="font-size:11px;color:#999;text-decoration:none;letter-spacing:1px;">
                  HELLO@MERRYSTORY.COM
                </a>
              </div>
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
    subject: `Contract Access Code: ${contractName}`,
    html,
  });
}

export async function sendContractStatusEmail(options: ContractStatusEmailOptions): Promise<void> {
  const { to, contractName, signerName, recipientName, eventName, action, reviewLink } = options;
  const transporter = getEmailTransporter();
  const fromAddress = process.env.EMAIL_USER!;
  const actionLabel = action === "signature" ? "Signed & Confirmed" : "Revision Requested";
  const introCopy =
    action === "signature"
      ? "A client has signed and confirmed a contract agreement."
      : "A client has submitted a contract agreement for revision.";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Contract Status Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f7f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f7f4;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-top:4px solid #D4AF37;box-shadow:0 10px 40px rgba(0,0,0,0.03);">
          <tr>
            <td style="padding:34px 48px 12px;text-align:center;">
              <h1 style="font-family:'Georgia',serif;font-weight:400;font-size:26px;color:#111;letter-spacing:4px;margin:0;">MERRY STORY</h1>
              <p style="font-size:10px;letter-spacing:5px;color:#888;text-transform:uppercase;margin:8px 0 0;">Productions</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 48px 40px;">
              <p style="font-size:15px;line-height:1.8;margin:0 0 20px;color:#444;font-family:'Georgia',serif;font-style:italic;text-align:center;">
                ${introCopy}
              </p>

              <p style="font-size:15px;line-height:1.8;margin:0 0 20px;color:#444;">
                Dear Admin,
              </p>

              <p style="font-size:15px;line-height:1.8;margin:0 0 20px;color:#444;">
                <strong>${signerName}</strong> has submitted a response for <strong>${eventName}</strong>. You can review the latest contract document directly from the secure link below.
              </p>

              <div style="background-color:#FAFAFA;padding:25px 30px;border-left:3px solid #D4AF37;margin-bottom:35px;">
                <div style="margin-bottom:10px;">
                  <strong style="color:#111;font-size:11px;text-transform:uppercase;letter-spacing:1px;">CONTRACT:</strong>
                  <span style="color:#555;margin-left:5px;">${contractName}</span>
                </div>
                <div style="margin-bottom:10px;">
                  <strong style="color:#111;font-size:11px;text-transform:uppercase;letter-spacing:1px;">CLIENT:</strong>
                  <span style="color:#555;margin-left:5px;">${recipientName}</span>
                </div>
                <div>
                  <strong style="color:#111;font-size:11px;text-transform:uppercase;letter-spacing:1px;">RESPONSE:</strong>
                  <span style="color:#555;margin-left:5px;font-size:15px;font-weight:700;">${actionLabel}</span>
                </div>
              </div>

              <div style="text-align:center;margin:34px 0 38px;">
                <p style="font-size:13px;line-height:1.8;margin-bottom:20px;color:#666;letter-spacing:1px;text-transform:uppercase;">
                  Secure Contract Review Link
                </p>
                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="background-color:#D4AF37;padding:0;">
                      <a href="${reviewLink}" style="display:inline-block;padding:14px 28px;background-color:#D4AF37;color:white;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">
                        Open Contract Page
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.7;">
                This admin review link opens the contract directly and does not require the recipient access code.
              </p>
              <p style="margin:0 0 32px;font-size:12px;color:#a1a1aa;word-break:break-all;">
                <a href="${reviewLink}" style="color:#D4AF37;">${reviewLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #EAEAEA;margin:40px 0;" />

              <div style="text-align:center;">
                <p style="font-size:14px;line-height:1.5;color:#666;margin-bottom:5px;">
                  Warmest regards,
                </p>
                <p style="color:#111;font-family:'Georgia',serif;font-size:18px;font-style:italic;margin-top:0;margin-bottom:5px;">
                  The Merry Story Team
                </p>
                <a href="mailto:hello@merrystory.com" style="font-size:11px;color:#999;text-decoration:none;letter-spacing:1px;">
                  HELLO@MERRYSTORY.COM
                </a>
              </div>
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
    subject: `${actionLabel}: ${contractName}`,
    html,
  });
}

export type WelcomeEmailOptions = {
  to: string;
  name: string;
  activationLink: string;
  role: string;
};

export type ContractReviewEmailOptions = {
  to: string;
  contractName: string;
  eventName: string;
  reviewLink: string;
  accessCode: string;
  recipientName?: string;
};

export type ContractStatusEmailOptions = {
  to: string;
  contractName: string;
  signerName: string;
  recipientName: string;
  eventName: string;
  action: "revision" | "signature";
  reviewLink: string;
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
