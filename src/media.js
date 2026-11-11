import {supabase,result} from './backend';
export const MAX_WORK_PHOTOS=6;
export function validateImage(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Elegí una imagen JPG, PNG o WebP. Si está en HEIC, exportala como JPG.');
 if(!file.size||file.size>10*1024*1024)throw Error('La imagen debe pesar hasta 10 MB.');
}
export async function prepareImage(file){
 validateImage(file);
 const bitmap=await createImageBitmap(file);
 try{
  if(!bitmap.width||!bitmap.height)throw Error('No pudimos leer la imagen.');
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
  if(!blob||blob.size>3*1024*1024)throw Error('No pudimos reducir la foto. Probá con otra imagen más pequeña.');
  return blob;
 }finally{bitmap.close()}
}
export async function imageUrl(path){
 if(!path)return null;
 if(!supabase)return path.startsWith('data:image/jpeg;base64,')?path:null;
 const data=await result(supabase.storage.from('profile-media').createSignedUrl(path,3600));return data.signedUrl;
}
export async function uploadImage(userId,file){
 const blob=await prepareImage(file);
 if(!supabase)return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('No pudimos leer la foto.'));r.readAsDataURL(blob)});
 const path=`${userId}/${crypto.randomUUID()}.jpg`;
 await result(supabase.storage.from('profile-media').upload(path,blob,{contentType:'image/jpeg',upsert:false}));return path;
}
export async function removeImage(path){if(supabase&&path)await result(supabase.storage.from('profile-media').remove([path]));}
