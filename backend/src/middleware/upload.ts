import multer from 'multer';
export const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:100*1024*1024},fileFilter:(_req,file,cb)=>{ if(file.mimetype.startsWith('image/')||file.mimetype.startsWith('video/')) cb(null,true); else cb(new Error('Please upload an image or video.')); }});
