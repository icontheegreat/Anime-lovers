export const countWords=(value:string)=>value.trim().split(/\s+/).filter(Boolean).length;
export function normalizeTags(tags:unknown):string[]{ if(!Array.isArray(tags)) return []; return [...new Set(tags.map(String).map(t=>t.trim().replace(/^\[|\]$/g,'').toLowerCase()).filter(Boolean))].slice(0,4); }
export function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55);}
