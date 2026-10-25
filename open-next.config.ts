import {defineCloudflareConfig} from '@opennextjs/cloudflare';

const config=defineCloudflareConfig({});
config.buildCommand='npm run db:generate && next build --webpack';

export default config;
