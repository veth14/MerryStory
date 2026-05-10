import { getMongoDb } from "../src/lib/mongodb";
import nodemailer from "nodemailer";

async function run() {
  try {
    const db = await getMongoDb();
    const events = db.collection('events');
    const users = db.collection('users');

    const now = Date.now();
    const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // we want items that will be deleted within ~30 days: archivedAt <= now - (5years - 30days)
    const notifyThreshold = new Date(now - (fiveYearsMs - thirtyDaysMs));

    const candidates = await events.find({ archived: true, doNotPurge: { $ne: true }, archivedAt: { $lte: notifyThreshold } }).toArray();

    if (candidates.length === 0) {
      console.log('No archived events nearing deletion.');
      process.exit(0);
    }

    const admins = await users.find({ role: { $in: ['admin', 'ADMINISTRATOR', 'administrator'] }, email: { $exists: true } }).toArray();
    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      const subject = `Retention Notice — ${candidates.length} archived event(s) scheduled for deletion in ~30 days`;
      const html = `<p>The following archived events are scheduled for automatic deletion in approximately 30 days:</p><ul>${candidates.map(e => `<li>${e.title} — archivedAt: ${new Date(e.archivedAt).toISOString()} — id: ${e._id}</li>`).join('')}</ul><p>If you need to retain any of these, set <code>doNotPurge</code> on the event or restore it.</p>`;

      await transporter.sendMail({ from: process.env.EMAIL_USER, to: adminEmails.join(','), subject, html });
      console.log('Pre-delete notification sent to', adminEmails.join(','));
    } else {
      console.log('No admin emails configured or EMAIL_* env missing; skipping email notification.');
    }

    process.exit(0);
  } catch (err) {
    console.error('preDeleteNotification failed:', err);
    process.exit(1);
  }
}

if (require.main === module) run();
