// Preserve the project's existing Brotli asset preparation architecture.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {brotliCompressSync,brotliDecompressSync,constants} from 'node:zlib';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bytes=fs.readFileSync('pianist-tailored.glb');
if(sha(bytes)!=='3b10d4739ab5d403397991d795146054f18939d10de4dddd858bc6c42e6b8f25')throw Error('Frozen candidate changed');
const packed=brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:11}});
if(!brotliDecompressSync(packed).equals(bytes))throw Error('Lossless archive round trip failed');
fs.writeFileSync('pianist.glb.br',packed);
const manifest={'pianist.glb':{bytes:bytes.length,sha256:sha(bytes),brotliBytes:packed.length,brotliSha256:sha(packed)}};
fs.writeFileSync('asset-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
