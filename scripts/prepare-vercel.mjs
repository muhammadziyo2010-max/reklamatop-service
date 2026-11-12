import {readdir,readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
// Only public assets and the reviewed Vercel runtime enter the deployment.
const root=process.argv[2]||'.vercel-staging';
await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
async function copyTree(source,destination){await mkdir(destination,{recursive:true});for(const item of await readdir(source,{withFileTypes:true})){const src=path.join(source,item.name),dest=path.join(destination,item.name);if(item.isDirectory())await copyTree(src,dest);else if(item.isFile())await copyFile(src,dest)}}
await copyTree('public',root);await copyTree('vercel',root);
const files=[];async function collect(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await collect(file);else files.push({file:path.relative(root,file),data:await readFile(file,'utf8'),encoding:'utf-8'})}}await collect(root);
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(files));
console.log(`Prepared ${files.length} deploy files.`);
