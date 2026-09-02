import { Schema, model, Document, Types } from 'mongoose';
export type MediaType='image'|'video';
export interface IPost extends Document { authorId:Types.ObjectId; mediaType:MediaType; mediaUrl:string; mediaPublicId:string; description:string; anime:string; tags:string[]; slug:string; createdAt:Date; deletedAt:Date|null; }
const schema=new Schema<IPost>({
  authorId:{type:Schema.Types.ObjectId,ref:'Author',required:true,index:true}, mediaType:{type:String,enum:['image','video'],required:true},
  mediaUrl:{type:String,required:true},mediaPublicId:{type:String,required:true},description:{type:String,required:true},anime:{type:String,required:true,trim:true,maxlength:100},
  tags:{type:[String],default:[],validate:{validator:(v:string[])=>v.length<=4,message:'Maximum 4 tags'}},slug:{type:String,required:true,unique:true,index:true},deletedAt:{type:Date,default:null,index:true}
},{timestamps:{createdAt:true,updatedAt:true}});
schema.index({deletedAt:1,createdAt:-1});
export const Post=model<IPost>('Post',schema);
