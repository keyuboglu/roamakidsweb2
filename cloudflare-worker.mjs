import worker from './.open-next/worker.js';
import pg from 'pg';

async function maintainPrivacy(connectionString) {
  if(!connectionString)throw new Error('DATABASE_URL is required for privacy maintenance.');
  const client=new pg.Client({connectionString,connectionTimeoutMillis:5000});
  try {
    await client.connect();
    await client.query(`UPDATE "Completion" SET "abuseKey" = NULL WHERE "registeredAt" < NOW() - INTERVAL '30 days' AND "abuseKey" IS NOT NULL`);
    await client.query(`DELETE FROM "RateLimitBucket" WHERE "windowStart" < NOW() - INTERVAL '24 hours'`);
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
