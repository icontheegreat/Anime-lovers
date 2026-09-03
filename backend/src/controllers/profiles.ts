import { Response } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

import { Author } from '../models/Author';
import { Post } from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import {
  uploadBuffer,
  destroyMedia,
} from '../services/cloudinary';

const updateProfileSchema = z.object({
  country: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(300),
});

const allowedSocials = [
  'x',
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'other',
];

export async function getProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    const { authorId } = req.params;

    if (!isValidObjectId(authorId)) {
      return res.status(404).json({
        message: 'Profile not found.',
      });
    }

    const author = await Author.findById(authorId).select(
      '_id name country profileImage bio socials createdAt'
    );

    if (!author) {
      return res.status(404).json({
        message: 'Profile not found.',
      });
    }

    const posts = await Post.find({
      authorId: author._id,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .populate(
        'authorId',
        '_id name country profileImage'
      );

    return res.json({
      author,
      posts,
    });
  } catch (e: any) {
    return res.status(500).json({
      message:
        e?.message ?? 'Unable to load profile.',
    });
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const author = await Author.findById(req.authorId);

    if (!author) {
      return res.status(404).json({
        message: 'Profile not found.',
      });
    }

    // Keep the old image information before changing anything.
    const oldImagePublicId =
      author.profileImagePublicId;

    let newImageUrl = author.profileImage;
    let newImagePublicId =
      author.profileImagePublicId;

    // Upload a new profile picture only if one was provided.
    if (req.file) {
      const uploaded = await uploadBuffer(
        req.file.buffer,
        'image',
        'anime-platform/profiles'
      );

      newImageUrl = uploaded.secure_url;
      newImagePublicId = uploaded.public_id;
    }

    // Social links are optional.
    // Empty links will not be stored.
    let socials: Record<string, string> = {};

    if (req.body.socials) {
      try {
        const parsed = JSON.parse(
          req.body.socials
        );

        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          for (const key of allowedSocials) {
            const value = String(
              parsed[key] ?? ''
            ).trim();

            if (value) {
              socials[key] = value;
            }
          }
        }
      } catch {
        return res.status(400).json({
          message: 'Invalid social links.',
        });
      }
    }

    // Update profile information.
    author.country = data.country;
    author.bio = data.bio;
    author.socials = socials;
    author.profileImage = newImageUrl;
    author.profileImagePublicId =
      newImagePublicId;

    await author.save();

    // Delete the old Cloudinary image only after
    // the new profile has successfully been saved.
    if (
      req.file &&
      oldImagePublicId &&
      oldImagePublicId !== newImagePublicId
    ) {
      try {
        await destroyMedia(
          oldImagePublicId,
          'image'
        );
      } catch {
        // Do not fail the profile update if
        // Cloudinary cleanup fails.
      }
    }

    return res.json({
      author: {
        _id: author._id,
        name: author.name,
        email: author.email,
        country: author.country,
        profileImage: author.profileImage,
        bio: author.bio,
        socials: author.socials,
        createdAt: author.createdAt,
      },
    });
  } catch (e: any) {
    return res.status(400).json({
      message:
        e?.issues?.[0]?.message ??
        e?.message ??
        'Unable to update profile.',
    });
  }
}