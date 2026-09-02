import cloudinary from '../config/cloudinary';
import {Readable} from 'stream';
export async function uploadBuffer(buffer:Buffer,resourceType:'image'|'video',folder:string){return await new Promise<any>((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({resource_type:resourceType,folder},(error,result)=>error?reject(error):resolve(result));Readable.from(buffer).pipe(stream);});}
export async function destroyMedia(publicId:string,resourceType:'image'|'video'){return cloudinary.uploader.destroy(publicId,{resource_type:resourceType});}
