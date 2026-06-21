const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const { cloudinary, uploadStream } = require('../config/cloudinary');

// The Cloudinary folder where all CommitFlow task attachments are stored.
const CLOUDINARY_FOLDER = 'commitflow_attachments';

// =============================================================================
// Attachment Controllers
// =============================================================================

/**
 * Uploads a file attachment to Cloudinary and records it in MongoDB.
 * Route: POST /api/projects/:projectId/tasks/:taskId/attachments
 *
 * Expects a multipart/form-data request processed by the uploadAttachment
 * multer middleware. The file buffer is available at req.file.buffer.
 */
exports.uploadFileAttachment = async (req, res, next) => {
  try {
    // Guard: ensure multer successfully captured the file
    if (!req.file) {
      const error = new Error('No file was uploaded. Please attach a file using the "attachment" field.');
      error.statusCode = 400;
      return next(error);
    }

    const { projectId, taskId } = req.params;

    // Verify the task actually belongs to this project before attaching
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    // Stream the memory buffer directly to Cloudinary — no disk writes
    const cloudinaryResult = await uploadStream(req.file.buffer, CLOUDINARY_FOLDER);

    // Persist the attachment metadata in MongoDB
    const attachment = await Attachment.create({
      taskId,
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      fileUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and attachment created successfully.',
      data: attachment,
    });
  } catch (error) {
    // Surface Multer-specific errors (e.g. LIMIT_FILE_SIZE) with a 400 status
    if (error.code === 'LIMIT_FILE_SIZE') {
      error.statusCode = 400;
      error.message = 'File exceeds the 5 MB size limit. Please upload a smaller file.';
    }
    next(error);
  }
};

/**
 * Fetches all attachments linked to a specific task.
 * Route: GET /api/projects/:projectId/tasks/:taskId/attachments
 */
exports.getTaskAttachments = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;

    // Verify the task belongs to this project
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    const attachments = await Attachment.find({ taskId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attachments.length,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a file attachment from both Cloudinary and MongoDB.
 * Route: DELETE /api/projects/:projectId/tasks/:taskId/attachments/:id
 *
 * Authorization: Only the original uploader OR a project Admin/Editor may
 * delete an attachment. The role is read from req.projectMember which is
 * populated by the authorizeProjectRole middleware.
 */
exports.deleteFileAttachment = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;

    const attachment = await Attachment.findOne({ _id: id, taskId });
    if (!attachment) {
      const error = new Error('Attachment not found on this task.');
      error.statusCode = 404;
      return next(error);
    }

    // Permission check: uploader OR project Admin/Editor
    const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
    const isProjectManager = ['admin', 'editor'].includes(req.projectMember.role);

    if (!isUploader && !isProjectManager) {
      const error = new Error(
        'Access denied. You must be the file uploader, or a project Admin/Editor to delete attachments.'
      );
      error.statusCode = 403;
      return next(error);
    }

    // Step 1: Remove the asset from Cloudinary using the stored public_id.
    // resource_type 'auto' is required for non-image assets (pdf, doc, txt).
    await cloudinary.uploader.destroy(attachment.publicId, {
      resource_type: 'raw',
      invalidate: true,
    });

    // Step 2: Remove the MongoDB document
    await Attachment.findByIdAndDelete(attachment._id);

    res.status(200).json({
      success: true,
      message: 'Attachment deleted from storage and database successfully.',
    });
  } catch (error) {
    next(error);
  }
};
