import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_')
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * POST /api/upload/image
 * Handles single or multiple food listing images
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select a valid JPEG, PNG, or WebP image.',
      });
    }

    const files = req.files || [req.file];
    const uploadedUrls = [];

    for (const file of files) {
      if (isCloudinaryConfigured) {
        // Stream to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'foodlink/listings',
              transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        uploadedUrls.push(uploadResult.secure_url);
      } else {
        // Fallback: Convert to data URI for immediate persistent display without external service
        const b64 = file.buffer.toString('base64');
        const mimeType = file.mimetype || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${b64}`;
        uploadedUrls.push(dataUri);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Image(s) uploaded successfully',
      urls: uploadedUrls,
      url: uploadedUrls[0],
      provider: isCloudinaryConfigured ? 'cloudinary' : 'inline',
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image. Please try again or provide an image link.',
    });
  }
};
