import {defineConfig,globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([...nextVitals,...nextTs,globalIgnores(['.next/**','.open-next/**','.wrangler/**','out/**','build/**','generated/**','next-env.d.ts','node_modules/**','work/**','outputs/**'])]);
