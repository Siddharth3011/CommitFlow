const mongoose = require('mongoose');

// =============================================================================
// Attachment Schema
// =============================================================================

const attachmentSchema = new mongoose.Schema(
  {
    // The task to which this attachment belongs
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required.'],
      index: true,
    },

    // The user who uploaded the attachment
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader User ID is required.'],
    },

    // Original display filename of the attachment
    fileName: {
      type: String,
      required: [true, 'File name is required.'],
      trim: true,
    },

    // Cloudinary URL location of the stored resource
    fileUrl: {
      type: String,
      required: [true, 'File URL is required.'],
      trim: true,
    },

    // Cloudinary asset management public identifier
    publicId: {
      type: String,
      required: [true, 'Cloudinary Public ID is required.'],
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
