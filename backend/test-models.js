/**
 * test-models.js
 * Programmatic model validation script for Phase 2 task system.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./src/models/Task');
const Comment = require('./src/models/Comment');
const Attachment = require('./src/models/Attachment');

const TEST_DB_URI = process.env.MONGO_URI 
  ? process.env.MONGO_URI.replace(/\/commitflow$/, '/commitflow_test')
  : 'mongodb://127.0.0.1:27017/commitflow_test';

async function runTests() {
  console.log('=== STARTING MODEL VALIDATION TESTS ===');
  console.log(`Connecting to: ${TEST_DB_URI}`);

  try {
    await mongoose.connect(TEST_DB_URI);
    console.log('Connected to test database successfully.\n');

    // Clean up test DB before running assertions
    await mongoose.connection.db.dropDatabase();
    console.log('Test database cleaned.\n');

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`[PASS] ${message}`);
        passedTests++;
      } else {
        console.error(`[FAIL] ${message}`);
        failedTests++;
      }
    }

    // ----------------------------------------------------
    // TEST 1: Task - Missing required projectId
    // ----------------------------------------------------
    try {
      const task = new Task({
        title: 'Complete task system implementation',
        status: 'Todo',
      });
      await task.validate();
      assert(false, 'Task validation should have failed for missing projectId.');
    } catch (err) {
      assert(
        err.errors.projectId && err.errors.projectId.kind === 'required',
        'Task validation correctly failed for missing required projectId.'
      );
    }

    // ----------------------------------------------------
    // TEST 2: Task - Title length constraint
    // ----------------------------------------------------
    try {
      const task = new Task({
        projectId: new mongoose.Types.ObjectId(),
        title: 'Ab', // too short (min 3 characters)
      });
      await task.validate();
      assert(false, 'Task validation should have failed for short title.');
    } catch (err) {
      assert(
        err.errors.title && err.errors.title.kind === 'minlength',
        'Task validation correctly failed for short title (less than 3 characters).'
      );
    }

    // ----------------------------------------------------
    // TEST 3: Task - Invalid status enum
    // ----------------------------------------------------
    try {
      const task = new Task({
        projectId: new mongoose.Types.ObjectId(),
        title: 'Validate schemas',
        status: 'InReview', // invalid status (not 'Review')
      });
      await task.validate();
      assert(false, 'Task validation should have failed for invalid status.');
    } catch (err) {
      assert(
        err.errors.status && err.errors.status.kind === 'enum',
        'Task validation correctly failed for invalid status enum.'
      );
    }

    // ----------------------------------------------------
    // TEST 4: Task - Successful validation & default fields
    // ----------------------------------------------------
    try {
      const task = new Task({
        projectId: new mongoose.Types.ObjectId(),
        title: 'Verify tasks system',
      });
      await task.validate();
      assert(task.status === 'Todo', 'Task status correctly defaulted to "Todo".');
      assert(task.priority === 'Medium', 'Task priority correctly defaulted to "Medium".');
      assert(task.description === '', 'Task description correctly defaulted to empty string.');
    } catch (err) {
      assert(false, `Task validation unexpectedly failed with error: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 5: Comment - Missing required fields & text constraints
    // ----------------------------------------------------
    try {
      const comment = new Comment({
        taskId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        text: '   ', // empty string after trim
      });
      await comment.validate();
      assert(false, 'Comment validation should have failed for empty/whitespace text.');
    } catch (err) {
      assert(
        err.errors.text && err.errors.text.kind === 'required',
        'Comment validation correctly failed for trimmed empty comment.'
      );
    }

    // ----------------------------------------------------
    // TEST 6: Comment - Successful validation
    // ----------------------------------------------------
    try {
      const comment = new Comment({
        taskId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        text: 'This is a valid comment text.',
      });
      await comment.validate();
      assert(comment.text === 'This is a valid comment text.', 'Comment text successfully validated.');
    } catch (err) {
      assert(false, `Comment validation unexpectedly failed: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 7: Attachment - Missing Cloudinary metadata
    // ----------------------------------------------------
    try {
      const attachment = new Attachment({
        taskId: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        fileName: 'screenshot.png',
        // missing fileUrl and publicId
      });
      await attachment.validate();
      assert(false, 'Attachment validation should have failed for missing Cloudinary fields.');
    } catch (err) {
      assert(
        err.errors.fileUrl && err.errors.publicId,
        'Attachment validation correctly failed for missing fileUrl and publicId.'
      );
    }

    // ----------------------------------------------------
    // TEST 8: Attachment - Successful validation
    // ----------------------------------------------------
    try {
      const attachment = new Attachment({
        taskId: new mongoose.Types.ObjectId(),
        uploadedBy: new mongoose.Types.ObjectId(),
        fileName: 'diagram.svg',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234/diagram.svg',
        publicId: 'demo/v1234/diagram',
      });
      await attachment.validate();
      assert(attachment.fileName === 'diagram.svg', 'Attachment validation succeeded and file values match.');
    } catch (err) {
      assert(false, `Attachment validation unexpectedly failed: ${err.message}`);
    }

    console.log('\n=== MODEL VALIDATION RESULTS ===');
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.error('\nSome tests failed. Check assertions above.');
      process.exitCode = 1;
    } else {
      console.log('\nAll model validation tests passed successfully!');
    }

  } catch (error) {
    console.error('An unexpected error occurred during testing:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

runTests();
