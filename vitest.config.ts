import {defineConfig} from 'vitest/config';import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@roama/prisma-client':fileURLToPath(new URL('./generated/prisma/client.ts',import.meta.url)),'@':fileURLToPath(new URL('.',import.meta.url))}},test:{environment:'node',setupFiles:['./tests/setup.ts'],include:['tests/**/*.test.ts']}});
