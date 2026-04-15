import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let detailsHtml = '';
    let clientDetailsHtml = '';

    if (type === 'inquiry') {
      const { eventType, message } = body;
      detailsHtml = `
        <p><strong>Inquiry Type:</strong> General Inquiry</p>
        <p><strong>Event Type:</strong> ${eventType || 'Not specified'}</p>
        <p><strong>Message / Needs:</strong><br/>${message || 'Not specified'}</p>
      `;
      clientDetailsHtml = `
        <div style="margin-bottom: 8px;">
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">EVENT TYPE:</strong> 
          <span style="color: #555; margin-left: 5px;">${eventType || 'Not specified'}</span>
        </div>
      `;
    } else {
      const { date, guests, vision } = body;
      detailsHtml = `
        <p><strong>Inquiry Type:</strong> Detailed Consultation Request</p>
        <p><strong>Preferred Date:</strong> ${date || 'Not specified'}</p>
        <p><strong>Guest Count:</strong> ${guests || 'Not specified'}</p>
        <p><strong>The Vision:</strong><br/>${vision || 'Not specified'}</p>
      `;
      clientDetailsHtml = `
        <div style="margin-bottom: 8px;">
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">PREFERRED DATE:</strong> 
          <span style="color: #555; margin-left: 5px;">${date || 'Not specified'}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">GUEST COUNT:</strong> 
          <span style="color: #555; margin-left: 5px;">${guests || 'Not specified'}</span>
        </div>
      `;
    }

    // 1. Email to You (Merry Story)
    const mailToYou = {
      from: process.env.EMAIL_USER,
      to: 'merrystoryeventservices@gmail.com', // Send to your business email
      replyTo: email,
      subject: type === 'inquiry' ? `New Inquiry from ${name}` : `New Consultation Request from ${name}`,
      html: `
        <h2>New Message Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${detailsHtml}
      `,
    };

    // 2. Auto-Reply to the Client
    const mailToClient = {
      from: `"Merry Story Productions" <merrystoryeventservices@gmail.com>`,
      to: email,
      subject: type === 'inquiry' ? `Your Inquiry - Merry Story` : `Consultation Request Received - Merry Story`,
      html: `
        <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #D4AF37; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
            
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Georgia', serif; font-weight: normal; font-size: 26px; color: #111; letter-spacing: 4px; margin: 0;">MERRY STORY</h1>
              <p style="font-size: 10px; letter-spacing: 5px; color: #888; text-transform: uppercase; margin-top: 8px;">Productions</p>
            </div>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
              Dear ${name},
            </p>
            
            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
              Thank you for reaching out to Merry Story Productions. We safely received your message and are truly delighted by the prospect of working together to curate something beautiful.
            </p>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 35px; color: #444;">
              Our creative directors are currently reviewing the details you shared. For your records, here is a brief summary of your inquiry:
            </p>

            <div style="background-color: #FAFAFA; padding: 25px 30px; border-left: 3px solid #D4AF37; margin-bottom: 35px;">
              ${clientDetailsHtml}
            </div>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 35px; color: #444;">
              We pride ourselves on exceptional communication. A member of our team will review your vision and reach back out to you within <strong>24 business hours</strong> to discuss the next steps in your journey.
            </p>
            
            <hr style="border: none; border-top: 1px solid #EAEAEA; margin: 40px 0;" />

            <div style="text-align: center;">
              <p style="font-size: 14px; line-height: 1.5; color: #666; margin-bottom: 5px;">
                Warmest regards,
              </p>
              <p style="color: #111; font-family: 'Georgia', serif; font-size: 18px; font-style: italic; margin-top: 0; margin-bottom: 5px;">
                The Merry Story Team
              </p>
              <a href="mailto:merrystoryeventservices@gmail.com" style="font-size: 11px; color: #999; text-decoration: none; letter-spacing: 1px;">
                HELLO@MERRYSTORY.COM
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #AAA; letter-spacing: 1px; text-transform: uppercase;">
            &copy; ${new Date().getFullYear()} Merry Story Productions. All rights reserved.
          </div>
        </div>
      `,
    };

    // Send both emails at the same time to speed up the API response
    await Promise.all([
      transporter.sendMail(mailToYou),
      transporter.sendMail(mailToClient)
    ]);

    return NextResponse.json({ message: 'Emails sent successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email. Please try again later.' }, { status: 500 });
  }
}
