# Anime Visual Posts

Production-oriented monorepo for a visual anime post feed using Next.js, Express, MongoDB/Mongoose, Cloudinary, TypeScript, Tailwind CSS, and Framer Motion.

## Requirements
- Node.js 20+
- MongoDB locally or MongoDB Atlas
- Cloudinary account

## Setup
1. Copy `.env.example` to `backend/.env` and put `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
2. Install dependencies:
   `npm install && npm --prefix frontend install && npm --prefix backend install`
3. Start both apps:
   `npm run dev`
4. Frontend: http://localhost:3000
5. API health: http://localhost:5000/api/health

## Production
- Deploy `frontend` to Vercel.
- Deploy `backend` to Render as a Node web service.
- Use a separate MongoDB Atlas production database.
- Set the same JWT secret only on the backend and set production frontend/API origins.

## First author/post
Open `/auth/register`, create an author with a profile image, then use `/dashboard` to create the first post.

## Delete behavior
Posts are soft-deleted (`deletedAt`) so their MongoDB records remain. Deleted posts are excluded from every public feed/query. Their Cloudinary media is removed when deletion succeeds.
