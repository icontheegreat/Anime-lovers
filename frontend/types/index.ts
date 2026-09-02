export type Author={_id:string;id?:string;name:string;email?:string;country:string;profileImage:string};
export type Post={_id:string;authorId:Author|string;mediaType:'image'|'video';mediaUrl:string;description:string;anime:string;tags:string[];slug:string;createdAt:string;deletedAt?:string|null};
