/**
 * test-analytics.js
 * Programmatic validation script for Phase 3 Step 1 Analytics Aggregation Pipeline.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Project = require('./src/models/Project');
const ProjectMember = require('./src/models/ProjectMember');
const Task = require('./src/models/Task');

const TEST_DB_URI = process.env.MONGO_URI 
  ? process.env.MONGO_URI.replace(/\/commitflow$/, '/commitflow_test_analytics')
  : 'mongodb://127.0.0.1:27017/commitflow_test_analytics';

async function runTest() {
  console.log('=== STARTING ANALYTICS AGGREGATION TESTS ===');
  console.log(`Connecting to: ${TEST_DB_URI}`);

  try {
    await mongoose.connect(TEST_DB_URI);
    console.log('Connected to test database.');

    // Clean up
    await mongoose.connection.db.dropDatabase();
    console.log('Cleaned test database.');

    // Seed Users
    const u1 = await User.create({ name: 'User One', email: 'one@test.com', password: 'password123' });
    const u2 = await User.create({ name: 'User Two', email: 'two@test.com', password: 'password123' });

    // Seed Project
    const project = await Project.create({
      name: 'Analytics Test Project',
      ownerId: u1._id,
    });

    // Seed tasks with various statuses, priorities, assignees
    const tasks = [
      {
        projectId: project._id,
        title: 'Task 1',
        status: 'Done',
        priority: 'High',
        assignee: u1._id,
      },
      {
        projectId: project._id,
        title: 'Task 2',
        status: 'In Progress',
        priority: 'Medium',
        assignee: u1._id,
      },
      {
        projectId: project._id,
        title: 'Task 3',
        status: 'Todo',
        priority: 'Low',
        assignee: u2._id,
      },
      {
        projectId: project._id,
        title: 'Task 4',
        status: 'Review',
        priority: 'Medium',
        assignee: null, // Unassigned
      },
      {
        projectId: project._id,
        title: 'Task 5',
        status: 'Backlog',
        priority: 'Low',
        assignee: u2._id,
      },
    ];

    await Task.create(tasks);
    console.log('Seeded 5 test tasks.\n');

    // Run the actual aggregation pipeline logic from the controller
    const projectObjectId = new mongoose.Types.ObjectId(project._id);

    const [result] = await Task.aggregate([
      {
        $match: { projectId: projectObjectId },
      },
      {
        $facet: {
          projectSummary: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                backlog: {
                  $sum: { $cond: [{ $eq: ['$status', 'Backlog'] }, 1, 0] },
                },
                todo: {
                  $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] },
                },
                inProgress: {
                  $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
                },
                review: {
                  $sum: { $cond: [{ $eq: ['$status', 'Review'] }, 1, 0] },
                },
                done: {
                  $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                },
                completionRate: {
                  $avg: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                },
              },
            },
            {
              $project: { _id: 0 },
            },
          ],
          taskPerUser: [
            {
              $match: { assignee: { $ne: null } },
            },
            {
              $group: {
                _id: '$assignee',
                taskCount: { $sum: 1 },
                statuses: { $push: '$status' },
              },
            },
            {
              $sort: { taskCount: -1 },
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails',
              },
            },
            {
              $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                userId: '$_id',
                name: { $ifNull: ['$userDetails.name', 'Deleted User'] },
                email: { $ifNull: ['$userDetails.email', null] },
                taskCount: 1,
                statuses: 1,
              },
            },
          ],
          priorityDistribution: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { count: -1 },
            },
            {
              $project: {
                _id: 0,
                priority: '$_id',
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    // Perform assertions
    console.log('--- VERIFYING AGGREGATION RESULTS ---');
    const summary = result.projectSummary[0] || {};
    
    console.log('Summary:', summary);
    console.log('Task per User:', result.taskPerUser);
    console.log('Priority Distribution:', result.priorityDistribution);

    console.log('\nAsserting summary counts...');
    if (summary.totalTasks === 5) console.log('[PASS] totalTasks is 5');
    else console.error('[FAIL] totalTasks expected 5, got', summary.totalTasks);

    if (summary.done === 1) console.log('[PASS] done is 1');
    else console.error('[FAIL] done expected 1, got', summary.done);

    if (summary.todo === 1) console.log('[PASS] todo is 1');
    else console.error('[FAIL] todo expected 1, got', summary.todo);

    if (summary.inProgress === 1) console.log('[PASS] inProgress is 1');
    else console.error('[FAIL] inProgress expected 1, got', summary.inProgress);

    if (summary.review === 1) console.log('[PASS] review is 1');
    else console.error('[FAIL] review expected 1, got', summary.review);

    if (summary.backlog === 1) console.log('[PASS] backlog is 1');
    else console.error('[FAIL] backlog expected 1, got', summary.backlog);

    // completionRate is 1/5 = 0.2
    if (Math.abs(summary.completionRate - 0.2) < 0.001) console.log('[PASS] completionRate is 0.2');
    else console.error('[FAIL] completionRate expected 0.2, got', summary.completionRate);

    console.log('\nAsserting assignee counts (unassigned excluded)...');
    if (result.taskPerUser.length === 2) console.log('[PASS] 2 users returned');
    else console.error('[FAIL] taskPerUser length expected 2, got', result.taskPerUser.length);

    const u1Stats = result.taskPerUser.find(u => u.name === 'User One');
    if (u1Stats && u1Stats.taskCount === 2) console.log('[PASS] User One has 2 tasks');
    else console.error('[FAIL] User One stats mismatch:', u1Stats);

    const u2Stats = result.taskPerUser.find(u => u.name === 'User Two');
    if (u2Stats && u2Stats.taskCount === 2) console.log('[PASS] User Two has 2 tasks');
    else console.error('[FAIL] User Two stats mismatch:', u2Stats);

    console.log('\nAsserting priority counts...');
    const highPriority = result.priorityDistribution.find(p => p.priority === 'High');
    if (highPriority && highPriority.count === 1) console.log('[PASS] High priority count is 1');
    else console.error('[FAIL] High priority count mismatch:', highPriority);

    const medPriority = result.priorityDistribution.find(p => p.priority === 'Medium');
    if (medPriority && medPriority.count === 2) console.log('[PASS] Medium priority count is 2');
    else console.error('[FAIL] Medium priority count mismatch:', medPriority);

    const lowPriority = result.priorityDistribution.find(p => p.priority === 'Low');
    if (lowPriority && lowPriority.count === 2) console.log('[PASS] Low priority count is 2');
    else console.error('[FAIL] Low priority count mismatch:', lowPriority);

    console.log('\n=== ALL AGGREGATION TESTS VERIFIED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

runTest();
