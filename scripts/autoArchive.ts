import { getMongoDb } from "../src/lib/mongodb";
import nodemailer from "nodemailer";

async function run() {
  try {
    const db = await getMongoDb();
    const events = db.collection('events');
    const users = db.collection('users');
    const audit = db.collection('audit_logs');

    // Find events that should be archived: status === 'Completed', not archived, and not doNotPurge
    const cursor = events.find({ status: 'Completed', archived: { $ne: true }, doNotPurge: { $ne: true } });
    const toArchive = await cursor.toArray();

    if (toArchive.length === 0) {
      console.log('No events to archive.');
      process.exit(0);
    }

    const now = new Date();

    for (const ev of toArchive) {
      await events.updateOne({ _id: ev._id }, { $set: { archived: true, archivedAt: now } });

      await audit.insertOne({
        category: 'EVENT_MANAGEMENT',
        action: 'EVENT_UPDATED',
        severity: 'info',
        message: `Auto-archived event: ${ev.title}`,
        details: { eventId: ev._id.toString(), eventTitle: ev.title },
        actorUid: null,
        actorEmail: 'system',
        actorRole: 'system',
        targetUid: ev._id.toString(),
        targetType: 'event',
        createdAt: new Date()
      });
    }

    // Notify admins with a summary email
    const admins = await users.find({ role: { $in: ['admin', 'ADMINISTRATOR', 'administrator'] }, email: { $exists: true } }).toArray();
    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      const subject = `Auto-Archive Notification — ${toArchive.length} event(s) archived`;
      const html = `<p>The following events were automatically archived:</p><ul>${toArchive.map(e => `<li>${e.title} (id: ${e._id})</li>`).join('')}</ul>`;

      await transporter.sendMail({ from: process.env.EMAIL_USER, to: adminEmails.join(','), subject, html });
      console.log('Admin notification sent to', adminEmails.join(','));
    } else {
      console.log('No admin emails configured or EMAIL_* env missing; skipping email notification.');
    }

    console.log(`Archived ${toArchive.length} events.`);
    process.exit(0);
  } catch (err) {
    console.error('autoArchive failed:', err);
    process.exit(1);
  }
}

if (require.main === module) run();
