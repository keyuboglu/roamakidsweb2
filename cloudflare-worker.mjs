import worker from './.open-next/worker.js';
import pg from 'pg';
import {ANONYMIZE_LEGACY_ANALYTICS_SQL,EXPIRE_ANONYMOUS_TOTALS_SQL,CLEAR_TOKEN_ATTRIBUTION_SQL} from './lib/analytics-maintenance.ts';

async function maintainPrivacy(connectionString) {
  if(!connectionString)throw new Error('DATABASE_URL is required for privacy maintenance.');
  const client=new pg.Client({connectionString,connectionTimeoutMillis:5000});
  try {
    await client.connect();
    await client.query(`UPDATE "Completion" SET "abuseKey" = NULL WHERE "registeredAt" < NOW() - INTERVAL '30 days' AND "abuseKey" IS NOT NULL`);
    await client.query(`DELETE FROM "RateLimitBucket" WHERE "windowStart" < NOW() - INTERVAL '24 hours' OR "key" LIKE 'analytics:%'`);
    await client.query(`DELETE FROM "EmailVerificationToken" WHERE "expiresAt" < NOW() - INTERVAL '24 hours'`);
    await client.query(`DELETE FROM "AndroidWaitlist" WHERE "expiresAt" < NOW()`);
    await client.query('BEGIN');
    try {
      await client.query(ANONYMIZE_LEGACY_ANALYTICS_SQL);
      await client.query(EXPIRE_ANONYMOUS_TOTALS_SQL);
      await client.query(CLEAR_TOKEN_ATTRIBUTION_SQL);
      await client.query('COMMIT');
    } catch(error) {
      await client.query('ROLLBACK');
      throw error;
    }
    console.log('Scheduled privacy maintenance completed.');
  } finally {
    await client.end();
  }
}

const cloudflareWorker={
  ...worker,
  async scheduled(_controller,env,ctx) {
    ctx.waitUntil(maintainPrivacy(env.DATABASE_URL));
  },
};

export default cloudflareWorker;
