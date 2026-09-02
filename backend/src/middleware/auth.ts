import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken'; import {env} from '../config/env'; import {Author} from '../models/Author';
export interface AuthRequest extends Request { authorId?:string; }
export async function requireAuth(req:AuthRequest,res:Response,next:NextFunction){ try { const token=req.cookies?.token; if(!token) return res.status(401).json({message:'Please log in to continue.'}); const p=jwt.verify(token,env.jwtSecret) as {authorId:string}; const author=await Author.findById(p.authorId).select('_id'); if(!author) return res.status(401).json({message:'Session is no longer valid.'}); req.authorId=author.id; next(); } catch { return res.status(401).json({message:'Please log in to continue.'}); } }
