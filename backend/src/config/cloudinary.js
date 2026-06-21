const cloudinary = require('cloudinary').v2;

// =============================================================================
// Cloudinary Configuration
// =============================================================================
// Initialises the Cloudinary SDK with environment-specific credentials.
// These three values are mandatory — the server will refuse to start if any
// are missing (validated in server.js startup checks).

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs in responses
});

// =============================================================================
// uploadStream Helper
// =============================================================================

/**
 * Streams a file Buffer directly to Cloudinary without writing to disk.
 *
 * Instead of saving the file locally and then uploading from a path, we pipe
 * the raw Buffer supplied by multer's memoryStorage straight into Cloudinary's
 * upload_stream API. This keeps our server stateless and removes the need for
 * a /tmp directory or any disk I/O.
 *
 * @param {Buffer}  fileBuffer - The raw file buffer provided by multer.
 * @param {string}  folderName - The Cloudinary folder to store the asset in.
 * @returns {Promise<object>} Resolves with the full Cloudinary upload result,
 *                            including `secure_url` and `public_id`.
 */
const uploadStream = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folderName,
      resource_type: 'auto', // Handles images, raw files (pdf, doc, txt), video, etc.
    };

    // Create the writable stream Cloudinary provides; hook result/error events.
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // Write the buffer content into the upload stream and signal end-of-data.
    stream.end(fileBuffer);
  });
};

module.exports = { cloudinary, uploadStream };
