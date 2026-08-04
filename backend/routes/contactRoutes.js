import express from 'express';
const router = express.Router();
import { submitMessage, getMessages, deleteMessage } from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';

// Public route for form submission
router.post('/', submitMessage);

// Admin-only routes for management
router.get('/', protect, authorize('admin'), getMessages);
router.delete('/:id', protect, authorize('admin'), deleteMessage);

export default router;
