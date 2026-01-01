import axios from 'axios';
import fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import crypto from 'crypto';

// Load .env in local/dev when dotenv is available so process.env picks up GOOGLE_MAPS_API_KEY
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const d = require('dotenv');
  d?.config?.();
} catch (err) {
  // ignore if dotenv is not installed or fails
}

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const STORE_DIR = path.join(__dirname, '..', '..', 'store', 'profile-images'); // adjust if build moves files

async function ensureStoreDir() {
  await fs.promises.mkdir(STORE_DIR, { recursive: true });
}

function makeFilename(ext = 'jpg') {
  const ts = Date.now();
  const rnd = crypto.randomBytes(6).toString('hex');
  return `${ts}-${rnd}.${ext}`;
}

/**
 * Extract a direct lh3.googleusercontent.com image URL from a Google Maps URL if present.
 */
function extractEmbeddedImageUrl(mapsUrl: string): string | null {
  try {
    // decode link
    const decoded = decodeURIComponent(mapsUrl);
    // try to find an lh3.googleusercontent.com URL inside the full string
    const m = decoded.match(
      /https?:\/\/lh3\.googleusercontent\.com\/[^\s"'&]+/i,
    );
    if (m) return m[0];
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Extract a candidate text query or place name from the maps URL path (/place/NAME/...)
 */
function extractPlaceNameFromMapsUrl(mapsUrl: string): string | null {
  try {
    const u = new URL(mapsUrl);
    // path segments may contain /place/Name/
    const segs = u.pathname
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
    const placeIndex = segs.findIndex((s) => s.toLowerCase() === 'place');
    if (placeIndex >= 0 && segs.length > placeIndex + 1) {
      // the next segment is the encoded place name
      return segs[placeIndex + 1].replace(/\+/g, ' ');
    }
    // fallback: use search param 'q' if present
    const q = u.searchParams.get('q');
    if (q) return q;
    // fallback: use hostname + coords in path (sometimes lat/lon exist)
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Download a URL (image) to local store and return saved filename and public path.
 */
async function downloadImageToStore(
  imageUrl: string,
): Promise<{ filename: string; publicPath: string }> {
  await ensureStoreDir();
  // follow redirects and stream
  const res = await axios.get(imageUrl, {
    responseType: 'stream',
    maxRedirects: 5,
    timeout: 20000,
  });
  // try to derive ext from content-type or url
  let ext = 'jpg';
  const ct = res.headers['content-type'];
  if (ct && ct.includes('png')) ext = 'png';
  else if (ct && ct.includes('webp')) ext = 'webp';
  else {
    try {
      const urlExt = path.extname(new URL(imageUrl).pathname).replace('.', '');
      if (urlExt) ext = urlExt.split('?')[0];
    } catch (e) {
      // ignore
    }
  }
  const filename = makeFilename(ext);
  const outPath = path.join(STORE_DIR, filename);
  const writer = fs.createWriteStream(outPath);
  await new Promise<void>((resolve, reject) => {
    if (!res.data || !writer) {
      reject(new Error('Invalid stream: res.data or writer is undefined'));
      return;
    }
    res.data.pipe(writer);
    writer.on('finish', () => resolve());
    writer.on('error', (err) => reject(err));
    res.data.on('error', (err) => reject(err));
  });
  // return public path expected by frontend - utiliser /store/ pour servir directement via nginx
  return { filename, publicPath: `/store/profile-images/${filename}` };
}

/**
 * Use Places APIs to get a photo (photo_reference) and download it.
 */
async function downloadPhotoViaPlaces(
  placeQueryOrMapsUrl: string,
): Promise<{ filename: string; publicPath: string } | null> {
  if (!GOOGLE_API_KEY) {
    console.warn(
      'GOOGLE_MAPS_API_KEY not configured — skipping Places API photo fetch',
    );
    return null;
  }

  // 1) Try Find Place from Text (inputtype=textquery)
  // Use the placeQueryOrMapsUrl as input; sometimes the entire maps URL works as input
  const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`;
  try {
    console.log(
      '[maps-downloader] calling FindPlaceFromText for:',
      placeQueryOrMapsUrl,
    );
    const findRes = await axios.get(findUrl, {
      params: {
        input: placeQueryOrMapsUrl,
        inputtype: 'textquery',
        fields: 'place_id,photos,name,formatted_address',
        key: GOOGLE_API_KEY,
      },
      timeout: 10000,
    });
    // debug: show basic find response shape
    console.log(
      '[maps-downloader] FindPlaceFromText response status:',
      findRes.status,
    );
    const candidates = findRes.data?.candidates ?? [];
    console.log(
      '[maps-downloader] candidates.length =',
      Array.isArray(candidates) ? candidates.length : 'not-array',
    );
    if (Array.isArray(candidates) && candidates.length > 0) {
      // prefer candidate with photos
      const candidateWithPhoto =
        candidates.find(
          (c: any) => Array.isArray(c.photos) && c.photos.length > 0,
        ) || candidates[0];
      const placeId = candidateWithPhoto.place_id;
      console.log(
        '[maps-downloader] selected placeId:',
        placeId,
        'hasPhotos:',
        Array.isArray(candidateWithPhoto.photos) &&
          candidateWithPhoto.photos.length > 0,
      );
      // call place details to get photos[] (if not available)
      const detailsUrl =
        'https://maps.googleapis.com/maps/api/place/details/json';
      const detailsRes = await axios.get(detailsUrl, {
        params: {
          place_id: placeId,
          fields: 'photo,photos',
          key: GOOGLE_API_KEY,
        },
        timeout: 10000,
      });
      console.log('[maps-downloader] Place details status:', detailsRes.status);
      const photos =
        detailsRes.data?.result?.photos || candidateWithPhoto.photos || [];
      console.log(
        '[maps-downloader] photos.length =',
        Array.isArray(photos) ? photos.length : 'not-array',
      );
      if (photos && photos.length > 0) {
        const best = photos[0];
        const photoRef = best.photo_reference;
        console.log(
          '[maps-downloader] photo_reference:',
          photoRef ? '[present]' : '[missing]',
        );
        if (photoRef) {
          // request place photo. This endpoint redirects to an lh3.googleusercontent.com url
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo`;
          // choose a reasonable maxwidth (or maxheight)
          const photoRes = await axios.get(photoUrl, {
            params: {
              photoreference: photoRef,
              maxwidth: 1600,
              key: GOOGLE_API_KEY,
            },
            responseType: 'stream',
            maxRedirects: 5,
            timeout: 20000,
          });
          // In many cases photoRes will be a redirect; axios will follow it and return the image data stream.
          // Save stream to disk:
          // determine ext from content-type header
          const contentType = photoRes.headers['content-type'] || '';
          let ext = 'jpg';
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          const filename = makeFilename(ext);
          await ensureStoreDir();
          const outPath = path.join(STORE_DIR, filename);
          const writer = fs.createWriteStream(outPath);
          await new Promise<void>((resolve, reject) => {
            if (!photoRes.data || !writer) {
              reject(
                new Error(
                  'Invalid stream: photoRes.data or writer is undefined',
                ),
              );
              return;
            }
            photoRes.data.pipe(writer);
            writer.on('finish', () => resolve());
            writer.on('error', (err) => reject(err));
            photoRes.data.on('error', (err) => reject(err));
          });
          return {
            filename,
            publicPath: `/store/profile-images/${filename}`,
          };
        }
      }
    }
  } catch (err: any) {
    // don't crash — return null to allow fallback
    console.warn('Places-based photo download failed:', err?.message || err);
    return null;
  }
  return null;
}

/**
 * Main entry: given a mapsUrl or place string, attempts to obtain a photo and save it.
 */
export async function downloadFirstPhotoFromMapsLink(
  mapsUrlOrQuery: string,
): Promise<{ filename: string; publicPath: string } | null> {
  // 1) try embedded lh3 link in the maps url
  try {
    const embedded = extractEmbeddedImageUrl(mapsUrlOrQuery);
    if (embedded) {
      try {
        return await downloadImageToStore(embedded);
      } catch (err: any) {
        console.warn(
          'Failed to download embedded image URL:',
          err?.message || err,
        );
        // fallthrough to places
      }
    }

    // 2) try Places API pipeline (needs API key)
    // prefer an extracted place name if maps url is complex
    const placeName =
      extractPlaceNameFromMapsUrl(mapsUrlOrQuery) || mapsUrlOrQuery;
    const viaPlaces = await downloadPhotoViaPlaces(placeName);
    if (viaPlaces) return viaPlaces;

    // 3) optional: attempt to fetch the maps page (fragile) and parse OG:image (not implemented here)
    return null;
  } catch (err) {
    console.error('downloadFirstPhotoFromMapsLink error:', err);
    return null;
  }
}

export default downloadFirstPhotoFromMapsLink;
