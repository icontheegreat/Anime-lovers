import { Response } from 'express';
import { z } from 'zod';

import {
  Post,
  MediaType
} from '../models/Post';

import { AuthRequest } from '../middleware/auth';

import {
  countWords,
  normalizeTags,
  slugify
} from '../utils/validation';

import {
  uploadBuffer,
  destroyMedia
} from '../services/cloudinary';

const bodySchema = z.object({
  description: z.string().trim(),
  anime: z.string().trim().min(1).max(100)
});

const MAX_THREAD_ITEMS = 5;

async function uniqueSlug(anime: string) {
  const base = slugify(anime) || 'post';

  let slug = `${base}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  while (await Post.exists({ slug })) {
    slug = `${base}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  return slug;
}

function getFiles(
  req: AuthRequest,
  field: string
) {
  const files = req.files as
    | Record<string, Express.Multer.File[]>
    | undefined;

  return files?.[field]?.[0] ?? null;
}

function getThreadDescriptions(
  req: AuthRequest
) {
  if (!req.body.threadDescriptions) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      req.body.threadDescriptions
    );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((value) =>
      String(value ?? '').trim()
    );
  } catch {
    throw new Error(
      'Invalid thread descriptions.'
    );
  }
}

async function validateVideo(
  file: Express.Multer.File
) {
  if (!file.mimetype.startsWith('video/')) {
    return null;
  }

  /*
   * The actual duration is obtained from Cloudinary
   * after uploading the file.
   */
  return true;
}

async function uploadPostMedia(
  file: Express.Multer.File
): Promise<{
  mediaType: MediaType;
  mediaUrl: string;
  mediaPublicId: string;
}> {
  /*
   * Explicitly type this as MediaType.
   *
   * This prevents TypeScript from treating the
   * value as a generic string.
   */
  const mediaType: MediaType =
    file.mimetype.startsWith('video/')
      ? 'video'
      : 'image';

  const uploaded = await uploadBuffer(
    file.buffer,
    mediaType,
    `anime-platform/${mediaType}s`
  );

  /*
   * Video duration validation.
   */
  if (mediaType === 'video') {
    const duration = Number(
      uploaded.duration
    );

    if (
      !Number.isFinite(duration) ||
      duration < 5 ||
      duration > 60
    ) {
      try {
        await destroyMedia(
          uploaded.public_id,
          'video'
        );
      } catch {}

      throw new Error(
        !Number.isFinite(duration)
          ? 'Unable to validate video duration. Please try another video.'
          : duration < 5
          ? 'Video must be at least 5 seconds long.'
          : 'Video cannot exceed 60 seconds.'
      );
    }
  }

  return {
    mediaType,
    mediaUrl: uploaded.secure_url,
    mediaPublicId: uploaded.public_id
  };
}

export async function createPost(
  req: AuthRequest,
  res: Response
) {
  const uploadedMedia: {
    publicId: string;
    mediaType: MediaType;
  }[] = [];

  try {
    const data = bodySchema.parse(
      req.body
    );

    /*
     * MAIN DESCRIPTION
     */
    if (
      countWords(data.description) < 2
    ) {
      return res.status(400).json({
        message:
          'Description must contain at least 2 words.'
      });
    }

    /*
     * MAIN MEDIA
     */
    const mainFile = getFiles(
      req,
      'media'
    );

    if (!mainFile) {
      return res.status(400).json({
        message:
          'Please upload an image or video.'
      });
    }

    /*
     * TAGS
     */
    let tags: string[] = [];

    try {
      tags = normalizeTags(
        req.body.tags
          ? JSON.parse(req.body.tags)
          : []
      );
    } catch {
      return res.status(400).json({
        message: 'Invalid tags.'
      });
    }

    if (tags.length > 5) {
      return res.status(400).json({
        message: 'Maximum 5 tags.'
      });
    }

    /*
     * MAIN MEDIA UPLOAD
     */
    const mainUpload =
      await uploadPostMedia(
        mainFile
      );

    uploadedMedia.push({
      publicId:
        mainUpload.mediaPublicId,
      mediaType:
        mainUpload.mediaType
    });

    /*
     * THREAD DESCRIPTIONS
     */
    const threadDescriptions =
      getThreadDescriptions(req);

    /*
     * THREAD
     */
    const thread: {
      mediaType: MediaType;
      mediaUrl: string;
      mediaPublicId: string;
      description: string;
    }[] = [];

    for (
      let i = 0;
      i < MAX_THREAD_ITEMS;
      i++
    ) {
      const file = getFiles(
        req,
        `threadMedia${i}`
      );

      /*
       * No file means this slot does not exist.
       */
      if (!file) {
        continue;
      }

      const description =
        threadDescriptions[i] || '';

      /*
       * Each thread description requires
       * at least 2 words.
       */
      if (
        countWords(description) < 2
      ) {
        throw new Error(
          `Detail ${
            i + 1
          } description must contain at least 2 words.`
        );
      }

      await validateVideo(file);

      /*
       * Upload thread media.
       */
      const uploaded =
        await uploadPostMedia(file);

      uploadedMedia.push({
        publicId:
          uploaded.mediaPublicId,
        mediaType:
          uploaded.mediaType
      });

      /*
       * Only actually uploaded thread
       * items are added to the database.
       */
      thread.push({
        mediaType:
          uploaded.mediaType,

        mediaUrl:
          uploaded.mediaUrl,

        mediaPublicId:
          uploaded.mediaPublicId,

        description
      });
    }

    /*
     * CREATE POST
     */
    const post = await Post.create({
      authorId:
        req.authorId,

      mediaType:
        mainUpload.mediaType,

      mediaUrl:
        mainUpload.mediaUrl,

      mediaPublicId:
        mainUpload.mediaPublicId,

      description:
        data.description,

      anime:
        data.anime,

      tags,

      thread,

      slug:
        await uniqueSlug(
          data.anime
        ),

      deletedAt: null
    });

    return res.status(201).json({
      post
    });
  } catch (e: any) {
    /*
     * If anything fails after Cloudinary uploads,
     * remove every uploaded file so we don't leave
     * orphaned media behind.
     */
    for (
      const item of uploadedMedia
    ) {
      try {
        await destroyMedia(
          item.publicId,
          item.mediaType
        );
      } catch {}
    }

    return res.status(400).json({
      message:
        e?.issues?.[0]?.message ??
        e?.message ??
        'Unable to create post.'
    });
  }
}

export async function listPosts(
  req: AuthRequest,
  res: Response
) {
  const limit = Math.min(
    Math.max(
      Number(req.query.limit) || 8,
      1
    ),
    20
  );

  const cursor =
    typeof req.query.cursor === 'string'
      ? new Date(
          req.query.cursor
        )
      : null;

  const filter: any = {
    deletedAt: null
  };

  if (
    cursor &&
    !Number.isNaN(
      cursor.getTime()
    )
  ) {
    filter.createdAt = {
      $lt: cursor
    };
  }

  const posts =
    await Post.find(filter)
      .sort({
        createdAt: -1
      })
      .limit(limit)
      .populate(
        'authorId',
        'name country profileImage'
      );

  const nextCursor =
    posts.length === limit
      ? posts[
          posts.length - 1
        ].createdAt.toISOString()
      : null;

  res.json({
    posts,
    nextCursor
  });
}

export async function getPost(
  req: AuthRequest,
  res: Response
) {
  const post =
    await Post.findOne({
      slug: req.params.slug,
      deletedAt: null
    }).populate(
      'authorId',
      'name country profileImage'
    );

  if (!post) {
    return res.status(404).json({
      message:
        'Post not found.'
    });
  }

  res.json({
    post
  });
}

export async function updatePost(
  req: AuthRequest,
  res: Response
) {
  const post =
    await Post.findOne({
      _id: req.params.id,
      authorId: req.authorId,
      deletedAt: null
    });

  if (!post) {
    return res.status(404).json({
      message:
        'Post not found.'
    });
  }

  const data =
    bodySchema.parse(
      req.body
    );

  /*
   * MAIN DESCRIPTION
   */
  if (
    countWords(
      data.description
    ) < 2
  ) {
    return res.status(400).json({
      message:
        'Description must contain at least 2 words.'
    });
  }

  /*
   * UPDATE BASIC POST INFORMATION
   */
  post.description =
    data.description;

  post.anime =
    data.anime;

  /*
   * TAGS
   */
  post.tags =
    normalizeTags(
      req.body.tags
        ? JSON.parse(
            req.body.tags
          )
        : []
    );

  if (
    post.tags.length > 5
  ) {
    return res.status(400).json({
      message:
        'Maximum 5 tags.'
    });
  }

  /*
   * REPLACE MAIN MEDIA
   * if a new file was uploaded.
   */
  const newMainFile =
    getFiles(
      req,
      'media'
    );

  if (newMainFile) {
    const oldPublicId =
      post.mediaPublicId;

    const oldMediaType: MediaType =
      post.mediaType;

    /*
     * Upload new media.
     */
    const uploaded =
      await uploadPostMedia(
        newMainFile
      );

    /*
     * Replace database values.
     */
    post.mediaType =
      uploaded.mediaType;

    post.mediaUrl =
      uploaded.mediaUrl;

    post.mediaPublicId =
      uploaded.mediaPublicId;

    /*
     * Remove old Cloudinary media.
     */
    try {
      await destroyMedia(
        oldPublicId,
        oldMediaType
      );
    } catch {}
  }

  await post.save();

  return res.json({
    post
  });
}

export async function deletePost(
  req: AuthRequest,
  res: Response
) {
  const post =
    await Post.findOne({
      _id: req.params.id,
      authorId: req.authorId,
      deletedAt: null
    });

  if (!post) {
    return res.status(404).json({
      message:
        'Post not found.'
    });
  }

  /*
   * SOFT DELETE
   */
  post.deletedAt =
    new Date();

  await post.save();

  /*
   * DELETE MAIN MEDIA
   */
  try {
    await destroyMedia(
      post.mediaPublicId,
      post.mediaType
    );
  } catch {}

  /*
   * DELETE THREAD MEDIA
   */
  for (
    const item of post.thread || []
  ) {
    try {
      await destroyMedia(
        item.mediaPublicId,
        item.mediaType
      );
    } catch {}
  }

  return res.json({
    message:
      'Post deleted.'
  });
}

export async function myPosts(
  req: AuthRequest,
  res: Response
) {
  const posts =
    await Post.find({
      authorId:
        req.authorId
    }).sort({
      createdAt: -1
    });

  return res.json({
    posts
  });
}