/**
 * test-controllers.js
 * Programmatic integration test runner for Phase 2 controller logic and nested routes.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const User = require('./src/models/User');
const Project = require('./src/models/Project');
const ProjectMember = require('./src/models/ProjectMember');
const Task = require('./src/models/Task');
const Comment = require('./src/models/Comment');

const TEST_PORT = 5055;
const TEST_DB_URI = process.env.MONGO_URI 
  ? process.env.MONGO_URI.replace(/\/commitflow$/, '/commitflow_test_controllers')
  : 'mongodb://127.0.0.1:27017/commitflow_test_controllers';

async function runTests() {
  console.log('=== STARTING ROUTE & CONTROLLER INTEGRATION TESTS ===');
  console.log(`Connecting to: ${TEST_DB_URI}`);

  let server;

  try {
    await mongoose.connect(TEST_DB_URI);
    console.log('Connected to test database.');

    // Clean up test DB
    await mongoose.connection.db.dropDatabase();
    console.log('Test database cleaned.\n');

    // ----------------------------------------------------
    // SEED DATA
    // ----------------------------------------------------
    console.log('Seeding test users and projects...');
    
    // 1. Create Users
    const adminUser = await User.create({ name: 'Admin User', email: 'admin@test.com', password: 'password123' });
    const editorUser = await User.create({ name: 'Editor User', email: 'editor@test.com', password: 'password123' });
    const viewerUser = await User.create({ name: 'Viewer User', email: 'viewer@test.com', password: 'password123' });
    const outsiderUser = await User.create({ name: 'Outsider User', email: 'outsider@test.com', password: 'password123' });

    // 2. Create Project
    const project = await Project.create({
      name: 'Test Project Workspace',
      description: 'A workspace to validate controllers.',
      ownerId: adminUser._id,
    });

    // 3. Establish Memberships
    await ProjectMember.create({ projectId: project._id, userId: adminUser._id, role: 'admin' });
    await ProjectMember.create({ projectId: project._id, userId: editorUser._id, role: 'editor' });
    await ProjectMember.create({ projectId: project._id, userId: viewerUser._id, role: 'viewer' });
    // outsiderUser is left without membership

    console.log('Seeding complete.\n');

    // 4. Generate Auth Tokens
    const getAuthHeaders = (user) => {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`,
      };
    };

    // 5. Start Test Server
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server listening on http://localhost:${TEST_PORT}`);
    });

    // Helpers to write assertions
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`[PASS] ${message}`);
        passed++;
      } else {
        console.error(`[FAIL] ${message}`);
        failed++;
      }
    }

    const baseUrl = `http://localhost:${TEST_PORT}/api`;

    // Shared references for nested lookups
    let createdTaskId = null;
    let createdCommentId = null;

    // -------------------------------------------------------------------------
    // TEST 1: Task Creation (POST /projects/:projectId/tasks)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 1: Task Creation ---');

    // Non-member tries to create task
    const res1Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(outsiderUser),
      body: JSON.stringify({ title: 'Hack the database' }),
    });
    assert(res1Fail.status === 403, `Non-member denied task creation (Status: ${res1Fail.status})`);

    // Editor tries to create task (should succeed)
    const res1Success = await fetch(`${baseUrl}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(editorUser),
      body: JSON.stringify({
        title: 'Implement task controllers',
        description: 'Implement nested task router endpoints.',
        status: 'Todo',
        priority: 'High',
      }),
    });
    assert(res1Success.status === 201, `Editor can create task (Status: ${res1Success.status})`);
    
    const taskData = await res1Success.json();
    createdTaskId = taskData.data._id;
    assert(createdTaskId !== null, 'Task ID successfully captured.');

    // -------------------------------------------------------------------------
    // TEST 2: Get Project Tasks (GET /projects/:projectId/tasks)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 2: Get Project Tasks ---');

    // Viewer gets project tasks (should succeed)
    const res2Success = await fetch(`${baseUrl}/projects/${project._id}/tasks`, {
      method: 'GET',
      headers: getAuthHeaders(viewerUser),
    });
    assert(res2Success.status === 200, `Viewer can fetch tasks (Status: ${res2Success.status})`);
    const tasksData = await res2Success.json();
    assert(tasksData.data.length === 1, `Fetched correct number of tasks (Count: ${tasksData.data.length})`);

    // Non-member gets project tasks (should fail)
    const res2Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks`, {
      method: 'GET',
      headers: getAuthHeaders(outsiderUser),
    });
    assert(res2Fail.status === 403, `Non-member denied fetching tasks (Status: ${res2Fail.status})`);

    // -------------------------------------------------------------------------
    // TEST 3: Get Task By ID (GET /projects/:projectId/tasks/:id)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 3: Get Task By ID ---');

    // Viewer fetches task by ID (should succeed)
    const res3Success = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(viewerUser),
    });
    assert(res3Success.status === 200, `Viewer can fetch task by ID (Status: ${res3Success.status})`);

    // Non-member fetches task by ID (should fail)
    const res3Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(outsiderUser),
    });
    assert(res3Fail.status === 403, `Non-member denied fetching task by ID (Status: ${res3Fail.status})`);

    // -------------------------------------------------------------------------
    // TEST 4: Update Task (PATCH /projects/:projectId/tasks/:id)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 4: Update Task ---');

    // Viewer tries to update task (should fail)
    const res4Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(viewerUser),
      body: JSON.stringify({ status: 'In Progress' }),
    });
    assert(res4Fail.status === 403, `Viewer denied task update (Status: ${res4Fail.status})`);

    // Editor updates task (should succeed)
    const res4Success = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(editorUser),
      body: JSON.stringify({ status: 'Review', title: 'Task routing nested design' }),
    });
    assert(res4Success.status === 200, `Editor can update task (Status: ${res4Success.status})`);
    const updatedTaskData = await res4Success.json();
    assert(updatedTaskData.data.status === 'Review', `Task status correctly updated to "Review".`);

    // -------------------------------------------------------------------------
    // TEST 5: Comment Addition (POST /projects/:projectId/tasks/:taskId/comments)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 5: Comment Addition ---');

    // Viewer adds comment (should succeed)
    const res5Success = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(viewerUser),
      body: JSON.stringify({ text: 'Review looks great, merging soon.' }),
    });
    assert(res5Success.status === 201, `Viewer can add comment (Status: ${res5Success.status})`);
    const commentData = await res5Success.json();
    createdCommentId = commentData.data._id;

    // Outsider user tries to comment (should fail)
    const res5Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(outsiderUser),
      body: JSON.stringify({ text: 'Spam comment' }),
    });
    assert(res5Fail.status === 403, `Non-member denied comment addition (Status: ${res5Fail.status})`);

    // -------------------------------------------------------------------------
    // TEST 6: Get Task Comments (GET /projects/:projectId/tasks/:taskId/comments)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 6: Get Task Comments ---');

    const res6Success = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments`, {
      method: 'GET',
      headers: getAuthHeaders(viewerUser),
    });
    assert(res6Success.status === 200, `Viewer can read task comments (Status: ${res6Success.status})`);
    const commentsData = await res6Success.json();
    assert(commentsData.data.length === 1, `Fetched correct comment size (Count: ${commentsData.data.length})`);

    // -------------------------------------------------------------------------
    // TEST 7: Delete Comment (DELETE /projects/:projectId/tasks/:taskId/comments/:id)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 7: Delete Comment ---');

    // Editor User creates a comment
    const res7Seed = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(editorUser),
      body: JSON.stringify({ text: 'Editor block comment' }),
    });
    const seedComment = await res7Seed.json();
    const editorCommentId = seedComment.data._id;

    // Viewer tries to delete Editor's comment (should fail)
    const res7Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments/${editorCommentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(viewerUser),
    });
    assert(res7Fail.status === 403, `Viewer cannot delete Editor comment (Status: ${res7Fail.status})`);

    // Viewer deletes own comment (should succeed)
    const res7Success1 = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments/${createdCommentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(viewerUser),
    });
    assert(res7Success1.status === 200, `Viewer can delete own comment (Status: ${res7Success1.status})`);

    // Editor deletes Viewer's comment (Editor is allowed to delete any comment because of role permissions)
    const res7Success2 = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}/comments/${editorCommentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(editorUser),
    });
    assert(res7Success2.status === 200, `Editor can delete task comments (Status: ${res7Success2.status})`);

    // -------------------------------------------------------------------------
    // TEST 8: Delete Task (DELETE /projects/:projectId/tasks/:id)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST CASE 8: Delete Task & Cascade comments ---');

    // Admin creates a task first
    const res8AdminCreate = await fetch(`${baseUrl}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(adminUser),
      body: JSON.stringify({
        title: 'Admin created task',
        description: 'Only admin or creator can delete.',
        status: 'Todo',
        priority: 'Medium',
      }),
    });
    assert(res8AdminCreate.status === 201, 'Admin can create task');
    const adminTask = await res8AdminCreate.json();
    const adminTaskId = adminTask.data._id;

    // Editor tries to delete Admin's task (should fail, 403)
    const res8Fail = await fetch(`${baseUrl}/projects/${project._id}/tasks/${adminTaskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(editorUser),
    });
    assert(res8Fail.status === 403, `Editor denied task deletion on other user's task (Status: ${res8Fail.status})`);

    // Editor deletes own task (should succeed)
    const res8EditorSuccess = await fetch(`${baseUrl}/projects/${project._id}/tasks/${createdTaskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(editorUser),
    });
    assert(res8EditorSuccess.status === 200, `Editor can delete own task (Status: ${res8EditorSuccess.status})`);

    // Admin deletes Admin's task (should succeed)
    const res8Success = await fetch(`${baseUrl}/projects/${project._id}/tasks/${adminTaskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(adminUser),
    });
    assert(res8Success.status === 200, `Admin can delete task (Status: ${res8Success.status})`);

    // Verify task is deleted
    const res8VerifyTask = await fetch(`${baseUrl}/projects/${project._id}/tasks/${adminTaskId}`, {
      method: 'GET',
      headers: getAuthHeaders(adminUser),
    });
    assert(res8VerifyTask.status === 404, 'Task is successfully deleted from DB.');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n=== INTEGRATION TEST SUMMARY ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.error('\nSome integration tests failed. Check assertions above.');
      process.exitCode = 1;
    } else {
      console.log('\nAll nested route & controller tests passed successfully!');
    }

  } catch (error) {
    console.error('An unexpected error occurred during testing:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log('Test server shut down.');
    }
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

runTests();
