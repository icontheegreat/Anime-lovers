import { Response } from 'express';
import { isValidObjectId } from 'mongoose';

import { Post } from '../models/Post';
import { Author } from '../models/Author';
import { AuthRequest } from '../middleware/auth';
import { mergeVidtex } from '../services/mergeVidtex';

export async function downloadVideo(
  req: AuthRequest,
  res: Response
) {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(404).json({
        message: 'Post not found.',
      });
    }

    const theme =
      req.query.theme === 'dark'
        ? 'dark'
        : 'light';

    /*
     * Get the post only.
     */
    const post = await Post.findOne({
      _id: id,
      deletedAt: null,
    }).lean();

    if (!post) {
      return res.status(404).json({
        message: 'Post not found.',
      });
    }

    /*
     * This downloader is only for videos.
     */
    if (post.mediaType !== 'video') {
      return res.status(400).json({
        message:
          'This post does not contain a video.',
      });
    }

    /*
     * Get the author separately.
     *
     * This avoids Mongoose populated-type issues.
     */
    const author = await Author.findById(
      post.authorId
    )
      .select(
        '_id name profileImage'
      )
      .lean();

    if (!author) {
      return res.status(400).json({
        message:
          'This post has no valid author.',
      });
    }

    if (
      !author.name ||
      typeof author.name !== 'string'
    ) {
      return res.status(400).json({
        message:
          'Author name is unavailable.',
      });
    }

    if (
      !author.profileImage ||
      typeof author.profileImage !== 'string'
    ) {
      return res.status(400).json({
        message:
          'Author profile image is unavailable.',
      });
    }

    /*
     * Generate the downloadable Vidtex video.
     */
    const result = await mergeVidtex({
      videoUrl: post.mediaUrl,

      profileImageUrl:
        author.profileImage,

      username:
        author.name,

      description:
        post.description,

      theme,
    });

    const filename =
      `${post.slug || 'anime-video'}-vidtex.mp4`;

    return res.download(
      result.filePath,
      filename,
      async (error) => {
        await result.cleanup();

        if (error) {
          console.error(
            'Video download error:',
            error
          );
        }
      }
    );
  } catch (error: any) {
    console.error(
      'Download video error:',
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        'Unable to generate video.',
    });
  }
}