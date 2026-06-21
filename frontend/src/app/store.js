import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectReducer from '../features/projects/projectSlice';
import memberReducer from '../features/projects/memberSlice';
import taskReducer from '../features/tasks/taskSlice';
import commentReducer from '../features/tasks/commentSlice';
import attachmentReducer from '../features/tasks/attachmentSlice';

// Configure Redux store combining all feature slices
export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    members: memberReducer,
    tasks: taskReducer,
    comments: commentReducer,
    attachments: attachmentReducer,
  },
});

export default store;
