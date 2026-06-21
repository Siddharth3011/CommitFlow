const multer = require('multer');

// =============================================================================
// Multer Memory Storage Configuration
// =============================================================================
// Using memoryStorage keeps the uploaded file as a Buffer in req.file.buffer
// rather than writing it to disk. This buffer is then piped directly to
// Cloudinary, avoiding any temporary file management on the server.

const storage = multer.memoryStorage();

// =============================================================================
// File Size Limit
// =============================================================================
// Maximum allowed size per upload: 5 MB.

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// =============================================================================
// File Type Filter
// =============================================================================
// Whitelist of MIME types accepted by the upload endpoint.
// Attempting to upload any other format will result in a 400 error.

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',                                                   // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',                                                           // .txt
]);

/**
 * Multer file filter — rejects uploads whose MIME type is not whitelisted.
 * Multer will pass the error object to `next(err)` which routes it to our
 * centralized error handler middleware.
 */
const fileTypeFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    const error = new Error(
      `Unsupported file type: "${file.mimetype}". Allowed types: JPEG, PNG, WebP, PDF, DOC, DOCX, TXT.`
    );
    error.statusCode = 400;
    cb(error, false); // Reject the file and forward the error
  }
};

// =============================================================================
// Multer Instance
// =============================================================================

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: fileTypeFilter,
});

// =============================================================================
// Exported Middleware
// =============================================================================
// Single-file interceptor: expects a multipart field named "attachment".
// Usage in routes: router.post('/path', uploadAttachment, controllerHandler)

const uploadAttachment = upload.single('attachment');

module.exports = { uploadAttachment };
