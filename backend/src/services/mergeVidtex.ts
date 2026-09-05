import ffmpegStatic from 'ffmpeg-static';
import sharp from 'sharp';

import {
  mkdir,
  rm,
  writeFile,
} from 'fs/promises';

import path from 'path';
import os from 'os';
import crypto from 'crypto';

import { spawn } from 'child_process';

type VidtexTheme = 'light' | 'dark';

type MergeVidtexOptions = {
  videoUrl: string;
  profileImageUrl: string;
  username: string;
  description: string;
  theme: VidtexTheme;
};

const WIDTH = 1080;
const HEADER_HEIGHT = 160;
const VIDEO_HEIGHT = 608;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(
  text: string,
  maxChars = 48
) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const lines: string[] = [];

  let current = '';

  for (const word of words) {
    const candidate = current
      ? `${current} ${word}`
      : word;

    if (
      candidate.length > maxChars &&
      current
    ) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

async function fetchBuffer(
  url: string
) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download source media (${response.status}).`
    );
  }

  return Buffer.from(
    await response.arrayBuffer()
  );
}

/*
 * =========================================================
 * CREATE HEADER
 * =========================================================
 *
 * The avatar + username are centered as one group.
 * The avatar is clipped into a perfect circle.
 */
async function createHeader(
  profileImageUrl: string,
  username: string,
  theme: VidtexTheme,
  outputPath: string
) {
  const isDark =
    theme === 'dark';

  const background =
    isDark
      ? '#111827'
      : '#ffffff';

  const foreground =
    isDark
      ? '#ffffff'
      : '#111111';

  const border =
    isDark
      ? '#263244'
      : '#e5e7eb';

  const avatarSize = 82;

  /*
   * Get profile image.
   */
  const profileBuffer =
    await fetchBuffer(
      profileImageUrl
    );

  /*
   * Resize and crop to square first.
   */
  const avatar =
    await sharp(profileBuffer)
      .resize(
        avatarSize,
        avatarSize,
        {
          fit: 'cover',
          position: 'centre',
        }
      )
      .png()
      .toBuffer();

  const avatarBase64 =
    avatar.toString('base64');

  /*
   * Approximate text width so that
   * the avatar + username can be
   * centered as one group.
   */
  const estimatedTextWidth =
    Math.max(
      username.length * 20,
      100
    );

  const groupGap = 24;

  const groupWidth =
    avatarSize +
    groupGap +
    estimatedTextWidth;

  const groupStartX =
    Math.max(
      32,
      (WIDTH - groupWidth) / 2
    );

  const avatarX =
    groupStartX;

  const avatarY =
    (HEADER_HEIGHT -
      avatarSize) /
    2;

  const avatarCenterX =
    avatarX +
    avatarSize / 2;

  const avatarCenterY =
    avatarY +
    avatarSize / 2;

  const avatarRadius =
    avatarSize / 2;

  /*
   * Vertically center username
   * with the avatar.
   */
  const textX =
    avatarX +
    avatarSize +
    groupGap;

  const textY =
    HEADER_HEIGHT / 2 +
    12;

  const svg = `
    <svg
      width="${WIDTH}"
      height="${HEADER_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <defs>

        <!-- Perfect circular profile image -->
        <clipPath id="avatarCircle">
          <circle
            cx="${avatarCenterX}"
            cy="${avatarCenterY}"
            r="${avatarRadius}"
          />
        </clipPath>

      </defs>

      <!-- Header background -->
      <rect
        width="${WIDTH}"
        height="${HEADER_HEIGHT}"
        fill="${background}"
      />

      <!-- Circular profile image -->
      <image
        href="data:image/png;base64,${avatarBase64}"
        x="${avatarX}"
        y="${avatarY}"
        width="${avatarSize}"
        height="${avatarSize}"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#avatarCircle)"
      />

      <!-- Username -->
      <text
        x="${textX}"
        y="${textY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="34"
        font-weight="700"
        fill="${foreground}"
      >
        ${escapeXml(username)}
      </text>

      <!-- Header divider -->
      <line
        x1="0"
        y1="${HEADER_HEIGHT - 1}"
        x2="${WIDTH}"
        y2="${HEADER_HEIGHT - 1}"
        stroke="${border}"
        stroke-width="2"
      />

    </svg>
  `;

  await sharp(
    Buffer.from(svg)
  )
    .png()
    .toFile(outputPath);
}

/*
 * =========================================================
 * CREATE FOOTER
 * =========================================================
 *
 * Contains ONLY:
 * - description
 * - @icontheegreat
 *
 * No tags.
 * No anime title.
 * No posting time.
 */
async function createFooter(
  description: string,
  theme: VidtexTheme,
  outputPath: string
) {
  const isDark =
    theme === 'dark';

  const background =
    isDark
      ? '#111827'
      : '#ffffff';

  const foreground =
    isDark
      ? '#ffffff'
      : '#111111';

  const secondary =
    isDark
      ? '#9ca3af'
      : '#6b7280';

  const border =
    isDark
      ? '#263244'
      : '#e5e7eb';

  const lines =
    wrapText(description);

  const safeLines =
    lines.length
      ? lines
      : [''];

  const lineHeight = 46;
  const topPadding = 44;
  const bottomPadding = 76;

  const footerHeight =
    topPadding +
    safeLines.length *
      lineHeight +
    bottomPadding;

  const textLines =
    safeLines
      .map(
        (line, index) => `
          <text
            x="48"
            y="${
              topPadding +
              (index + 1) *
                lineHeight
            }"
            font-family="Arial, Helvetica, sans-serif"
            font-size="34"
            fill="${foreground}"
          >
            ${escapeXml(line)}
          </text>
        `
      )
      .join('');

  const watermarkY =
    footerHeight - 28;

  const svg = `
    <svg
      width="${WIDTH}"
      height="${footerHeight}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <!-- Footer background -->
      <rect
        width="${WIDTH}"
        height="${footerHeight}"
        fill="${background}"
      />

      <!-- Divider -->
      <line
        x1="0"
        y1="1"
        x2="${WIDTH}"
        y2="1"
        stroke="${border}"
        stroke-width="2"
      />

      <!-- Description -->
      ${textLines}

      <!-- Watermark -->
      <text
        x="${WIDTH - 48}"
        y="${watermarkY}"
        text-anchor="end"
        font-family="Arial, Helvetica, sans-serif"
        font-size="24"
        font-weight="700"
        fill="${secondary}"
      >
        @icontheegreat
      </text>

    </svg>
  `;

  await sharp(
    Buffer.from(svg)
  )
    .png()
    .toFile(outputPath);

  return footerHeight;
}

/*
 * =========================================================
 * RUN FFMPEG
 * =========================================================
 */

function runFfmpeg(
  args: string[]
) {
  return new Promise<void>(
    (resolve, reject) => {
      if (!ffmpegStatic) {
        reject(
          new Error(
            'FFmpeg binary is not available.'
          )
        );

        return;
      }

      const process =
        spawn(
          ffmpegStatic,
          args,
          {
            stdio: [
              'ignore',
              'pipe',
              'pipe',
            ],
          }
        );

      let stderr = '';

      process.stderr.on(
        'data',
        (chunk) => {
          stderr +=
            chunk.toString();
        }
      );

      process.on(
        'error',
        reject
      );

      process.on(
        'close',
        (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `FFmpeg failed with code ${code}: ${stderr.slice(-4000)}`
              )
            );
          }
        }
      );
    }
  );
}

/*
 * =========================================================
 * MERGE VIDTEX
 * =========================================================
 */

export async function mergeVidtex(
  options: MergeVidtexOptions
) {
  const id =
    crypto
      .randomBytes(12)
      .toString('hex');

  const tempDir =
    path.join(
      os.tmpdir(),
      `vidtex-${id}`
    );

  await mkdir(
    tempDir,
    {
      recursive: true,
    }
  );

  const inputPath =
    path.join(
      tempDir,
      'input.mp4'
    );

  const headerPath =
    path.join(
      tempDir,
      'header.png'
    );

  const footerPath =
    path.join(
      tempDir,
      'footer.png'
    );

  const outputPath =
    path.join(
      tempDir,
      'output.mp4'
    );

  try {
    /*
     * Download original source video.
     */
    const videoBuffer =
      await fetchBuffer(
        options.videoUrl
      );

    await writeFile(
      inputPath,
      videoBuffer
    );

    /*
     * Generate header.
     */
    await createHeader(
      options.profileImageUrl,
      options.username,
      options.theme,
      headerPath
    );

    /*
     * Generate description footer.
     */
    const footerHeight =
      await createFooter(
        options.description,
        options.theme,
        footerPath
      );

    /*
     * Total output height.
     */
    const totalHeight =
      HEADER_HEIGHT +
      VIDEO_HEIGHT +
      footerHeight;

    const backgroundColor =
      options.theme === 'dark'
        ? '0x111827'
        : '0xffffff';

    /*
     * =====================================================
     * FFMPEG FILTER GRAPH
     * =====================================================
     */

    const filter = [
      /*
       * 1. Fit original video into
       * the center video area.
       *
       * No stretching.
       * No cropping.
       */
      `[0:v]scale=${WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=${backgroundColor}[video]`,

      /*
       * 2. Place header at the top
       * of the full canvas.
       */
      `[3:v][1:v]overlay=0:0[header]`,

      /*
       * 3. Place original video
       * directly below the header.
       */
      `[header][video]overlay=0:${HEADER_HEIGHT}[withVideo]`,

      /*
       * 4. Place description/footer
       * directly beneath the video.
       */
      `[withVideo][2:v]overlay=0:${HEADER_HEIGHT + VIDEO_HEIGHT}[final]`,
    ].join(';');

    await runFfmpeg([
      '-y',

      /*
       * Original video.
       */
      '-i',
      inputPath,

      /*
       * Header.
       */
      '-loop',
      '1',
      '-i',
      headerPath,

      /*
       * Footer.
       */
      '-loop',
      '1',
      '-i',
      footerPath,

      /*
       * Full output canvas.
       */
      '-f',
      'lavfi',
      '-i',
      `color=c=${backgroundColor}:s=${WIDTH}x${totalHeight}:r=30`,

      /*
       * Filter graph.
       */
      '-filter_complex',
      filter,

      /*
       * Final rendered video.
       */
      '-map',
      '[final]',

      /*
       * Original audio.
       */
      '-map',
      '0:a?',

      '-c:v',
      'libx264',

      '-preset',
      'veryfast',

      '-crf',
      '23',

      '-pix_fmt',
      'yuv420p',

      '-c:a',
      'aac',

      '-b:a',
      '192k',

      /*
       * Helps MP4 start playing quickly
       * after download.
       */
      '-movflags',
      '+faststart',

      /*
       * End when original video ends.
       */
      '-shortest',

      outputPath,
    ]);

    return {
      filePath: outputPath,

      cleanup: async () => {
        await rm(
          tempDir,
          {
            recursive: true,
            force: true,
          }
        );
      },
    };
  } catch (error) {
    await rm(
      tempDir,
      {
        recursive: true,
        force: true,
      }
    );

    throw error;
  }
}