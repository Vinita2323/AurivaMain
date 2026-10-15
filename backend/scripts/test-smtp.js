/**
 * Verify Gmail SMTP and optionally send a real test email to ADMIN_RECOVERY_EMAIL.
 *
 * Usage:
 *   node scripts/test-smtp.js
 *   node scripts/test-smtp.js --send
 *
 * Never prints SMTP_PASS or App Passwords.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const shouldSend = process.argv.includes('--send');

async function main() {
  const { default: env } = await import('../src/config/env.js');
  const {
    isSmtpConfigured,
    getMissingEmailConfigKeys,
    verifySmtpConnection,
    sendSmtpTestEmail
  } = await import('../src/services/emailService.js');

  console.log('=== Auriva SMTP check ===');
  console.log('HOST:', env.SMTP.HOST || '(empty)');
  console.log('PORT:', env.SMTP.PORT || '(empty)');
  console.log('SECURE:', env.SMTP.SECURE);
  console.log('USER:', env.SMTP.USER || '(empty)');
  console.log('PASS:', env.SMTP.PASS ? '[set]' : '(empty)');
  console.log('FROM:', env.SMTP.FROM || env.SMTP.USER || '(empty)');
  console.log('ADMIN_LOGIN_EMAIL:', env.ADMIN_LOGIN_EMAIL || '(empty)');
  console.log('ADMIN_RECOVERY_EMAIL:', env.ADMIN_RECOVERY_EMAIL || '(empty)');
  console.log('FRONTEND_URL:', env.FRONTEND_URL || '(empty)');

  if (!isSmtpConfigured()) {
    console.error('\nSMTP not configured. Missing:', getMissingEmailConfigKeys().join(', '));
    console.error('Add SMTP_PASS (Gmail App Password) in backend/.env, then re-run.');
    process.exitCode = 1;
    return;
  }

  try {
    const verified = await verifySmtpConnection();
    console.log('\nSMTP verify: OK');
    console.log(`Connected as ${verified.user} → ${verified.host}:${verified.port} (secure=${verified.secure})`);
  } catch (err) {
    console.error('\nSMTP verify: FAILED');
    console.error(err?.message || err);
    if (err?.response) console.error('SMTP response:', err.response);
    process.exitCode = 1;
    return;
  }

  if (!shouldSend) {
    console.log('\nConnection OK. To send a real test email to ADMIN_RECOVERY_EMAIL, run:');
    console.log('  node scripts/test-smtp.js --send');
    return;
  }

  try {
    const result = await sendSmtpTestEmail({ to: env.ADMIN_RECOVERY_EMAIL });
    console.log(`\nTest email sent to ${result.to}`);
    console.log('Check that inbox (and spam). Delivery claimed only after this send succeeded.');
  } catch (err) {
    console.error('\nTest email send: FAILED');
    console.error(err?.message || err);
    if (err?.cause?.message) console.error('Cause:', err.cause.message);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
