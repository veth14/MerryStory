import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, priority, message } = body;

    if (!subject || !priority || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const formattedMessage = message.replace(/\n/g, '<br/>');
    const priorityColor = priority === 'high' ? '#DC2626' : '#2563EB';

    const mailOptions = {
      from: `"Merry Story System" <${process.env.EMAIL_USER || 'merrystoryeventservices@gmail.com'}>`,
      to: 'vianangelo.14@gmail.com',
      subject: `[${priority.toUpperCase()} PRIORITY] Support Ticket: ${subject}`,
      html: `
        <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #1D1D1F; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
            
            <div style="margin-bottom: 40px;">
              <h1 style="font-family: 'Helvetica Neue', sans-serif; font-weight: 800; font-size: 20px; color: #111; margin: 0;">MERRY STORY DASHBOARD</h1>
              <p style="font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #888; text-transform: uppercase; margin-top: 4px;">Automated Support Ticket</p>
            </div>

            <div style="margin-bottom: 30px; padding: 15px; background: #F9FAFB; border-left: 4px solid ${priorityColor};">
              <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #6B7280;">Ticket Summary</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; width: 100px; color: #374151;">Subject:</td>
                  <td style="padding: 4px 0; color: #111;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; width: 100px; color: #374151;">Priority:</td>
                  <td style="padding: 4px 0; color: ${priorityColor}; font-weight: bold; text-transform: capitalize;">${priority}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; width: 100px; color: #374151;">Timestamp:</td>
                  <td style="padding: 4px 0; color: #111;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <p style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #6B7280;">Message Details</p>
            <div style="font-size: 15px; line-height: 1.8; margin-bottom: 35px; color: #111; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background: #FFF;">
              ${formattedMessage}
            </div>

            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #EEE;">
              <strong style="color: #111; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">System Generated Message</strong><br/>
              <span style="color: #999; font-size: 11px; margin-top: 4px; display: inline-block;">This email was sent directly from the Merry Story admin dashboard.</span>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Support ticket sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Support ticket error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send support ticket' }, { status: 500 });
  }
}
