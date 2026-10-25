import type {NextConfig} from 'next';
import path from 'node:path';
const nextConfig:NextConfig={
  agentRules:false,
  ...(process.env.CLOUDFLARE_BUILD==='true'?{
    turbopack:{resolveAlias:{'@roama/prisma-client':'./generated/prisma-cloudflare/client.ts'}},
    webpack(config,{webpack}){
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^@roama\/prisma-client$|generated[/\\]prisma[/\\]client(?:\.ts)?$)/,
        path.resolve('generated/prisma-cloudflare/client.ts'),
      ));
      config.externals.push((
        {context,request}:{context?:string;request?:string},
        callback:(error?:Error|null,result?:string)=>void,
      )=>{
        if(context&&request?.endsWith('.wasm?module')){
          callback(null,`import ${path.resolve(context,request)}`);
        }else{
          callback();
        }
      });
      return config;
    },
  }:{}),
  outputFileTracingIncludes:{'/*':['./node_modules/pg-cloudflare/dist/**/*','./node_modules/pg-cloudflare/esm/**/*']},
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}];},
};
export default nextConfig;
