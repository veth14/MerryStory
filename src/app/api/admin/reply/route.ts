import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { AuthGuardError, requireRole } from '@/lib/auth/guards';

export async function POST(request: Request) {
  try {
    await requireRole(request, ['admin', 'coordinator']);

    const body = await request.json();
    const { to, subject, message, clientName } = body;

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Formatting the message to preserve line breaks
    const formattedMessage = message.replace(/\\n/g, '<br/>');

    const mailOptions = {
      from: `"Merry Story Productions" <${process.env.EMAIL_USER || 'merrystoryeventservices@gmail.com'}>`,
      to,
      subject,
      html: `
        <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #D4AF37; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
            
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Georgia', serif; font-weight: normal; font-size: 26px; color: #111; letter-spacing: 4px; margin: 0;">MERRY STORY</h1>
              <p style="font-size: 10px; letter-spacing: 5px; color: #888; text-transform: uppercase; margin-top: 8px;">Productions</p>
            </div>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 25px; color: #444;">
              Dear ${clientName || 'Client'},
            </p>
            
            <div style="font-size: 15px; line-height: 1.8; margin-bottom: 35px; color: #444;">
              ${formattedMessage}
            </div>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
              Warmest regards,
            </p>

            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #EEE;">
              <strong style="color: #111; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Merry Story Team</strong><br/>
              <span style="color: #999; font-size: 12px; margin-top: 8px; display: inline-block;">Creating Moments, Telling Stories</span><br/>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully' }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Email reply error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
