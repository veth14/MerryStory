import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { checkRateLimit } from '@/lib/rate-limit';
import { escapeHtmlOptional } from '@/lib/sanitize';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, { keyPrefix: 'rsvp-confirm', limit: 5, windowMs: 60_000 });

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1);
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
      });
    }

    const { eventName, guestName, email, attendees, dietary, isAttending, code } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (isAttending) {
      // 1. Generate QR Code
      // Encode unique guest ID or event pass payload.
      const qrData = JSON.stringify({ eventName, guestName, code, attendees });
      // Generate QR Code as Data URI (base64)
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      // 2. Setup Nodemailer Transporter (REAL EMAIL CONFIGURATION)
      // To make this send real emails, we are using Gmail as the service.
      // You must create a .env.local file in your project root and add:
      // EMAIL_USER=your_email@gmail.com
      // EMAIL_APP_PASSWORD=your_16_digit_app_password
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS, 
        }
      });

      // Generate a dynamic Google Calendar Add Link
      const eventNameText = String(eventName || '').replace(/[\r\n]+/g, ' ').trim();
      const guestNameText = String(guestName || '').replace(/[\r\n]+/g, ' ').trim();
      const attendeesText = String(attendees || '').replace(/[\r\n]+/g, ' ').trim();
      const codeText = String(code || '').replace(/[\r\n]+/g, ' ').trim();
      const eventTitle = encodeURIComponent(`RSVP: ${eventNameText}`);
      const eventDetails = encodeURIComponent(`You are successfully registered for ${eventNameText}!\nGuest Name: ${guestNameText}\nTotal Attendees: ${attendeesText}\nReference Code: ${codeText}`);
      const eventLocation = encodeURIComponent('Merry Story Productions Venue');
      // Using a placeholder date (December 25, 2024, 7 PM - 11 PM UTC)
      const eventDates = '20241225T190000Z/20241225T230000Z';
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${eventDates}&details=${eventDetails}&location=${eventLocation}`;

      // 3. Email Template
      const mailOptions = {
        from: '"Merry Story Productions" <merrystoryeventservices@gmail.com>', // sender address
        to: email, // list of receivers
        subject: `Your Ticket: ${eventNameText} RSVP Confirmed!`, 
        html: `
        <div style="background-color: #FDFDFD; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 50px 40px; border-top: 4px solid #D4AF37; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
            
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Georgia', serif; font-weight: normal; font-size: 26px; color: #111; letter-spacing: 4px; margin: 0;">MERRY STORY</h1>
              <p style="font-size: 10px; letter-spacing: 5px; color: #888; text-transform: uppercase; margin-top: 8px;">Productions</p>
            </div>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444; font-family: 'Georgia', serif; font-style: italic; text-align: center;">
              You are going to ${escapeHtmlOptional(eventNameText)}!
            </p>

            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
              Dear ${escapeHtmlOptional(guestNameText)},
            </p>
            
            <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #444;">
              Thank you for RSVPing. We have safely recorded your confirmation for <strong>${escapeHtmlOptional(attendeesText)} attendee(s)</strong>. We are truly delighted by the prospect of celebrating with you.
            </p>

            <div style="background-color: #FAFAFA; padding: 25px 30px; border-left: 3px solid #D4AF37; margin-bottom: 35px;">
              <div style="margin-bottom: 8px;">
                <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">REFERENCE CODE:</strong> 
                <span style="color: #555; margin-left: 5px;">${escapeHtmlOptional(codeText)}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">TOTAL ATTENDEES:</strong> 
                <span style="color: #555; margin-left: 5px;">${escapeHtmlOptional(attendeesText)}</span>
              </div>
              ${dietary ? `
              <div style="margin-bottom: 8px;">
                <strong style="color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">DIETARY NOTES:</strong> 
                <span style="color: #555; margin-left: 5px;">${escapeHtmlOptional(String(dietary))}</span>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
              <p style="font-size: 13px; line-height: 1.8; margin-bottom: 20px; color: #666; letter-spacing: 1px; text-transform: uppercase;">
                Your Entry QR Code Ticket
              </p>
              <img src="cid:qrcode_id" alt="Your Entry QR Code Ticket" style="width: 200px; height: 200px; border-radius: 8px; border: 1px solid #EAEAEA; padding: 10px;" />
              <p style="font-size: 11px; color: #999; margin-top: 15px;">Please present this QR code upon entering the event.</p>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
              <a href="${escapeHtmlOptional(googleCalendarUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #D4AF37; color: white; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; transition: opacity 0.3s;">
                Add to Google Calendar
              </a>
            </div>
            
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
        attachments: [
          {
            filename: 'ticket-qr.png',
            path: qrCodeDataUrl,
            cid: 'qrcode_id' // same cid value as in the html img src
          }
        ]
      };

      // 4. Send Email
      await transporter.sendMail(mailOptions);

      return NextResponse.json({ 
        success: true, 
        message: 'RSVP confirmed and ticket sent directly to the guest email!'
      });
    } else {
      // Logic if they are not attending
      return NextResponse.json({ success: true, message: 'RSVP marked as not attending' });
    }

  } catch (error: any) {
    console.error('Error handling RSVP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
