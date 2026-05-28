import Contact from '../models/Contact.js';
import { createReachContact } from '../services/reachService.js';

// Best-effort split of a single "name" string into first + last for Reach payload.
const splitName = (raw) => {
    if (!raw || typeof raw !== 'string') return { first: null, last: null };
    const parts = raw.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: null };
    return { first: parts[0], last: parts.slice(1).join(' ') };
};

// @desc    Submit a contact message
// @route   POST /api/contacts
// @access  Public
export const submitMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const newMessage = await Contact.create({
            name,
            email,
            subject,
            message
        });

        // Fire-and-forget: push contact-form lead to Hostinger Reach.
        // The "note" carries the subject so the lead is identifiable in Reach (capped at 75 chars by the service).
        const { first, last } = splitName(name);
        createReachContact({
            email,
            name: first,
            surname: last,
            note: `Contact form: ${subject}`
        }).catch((e) => console.error('Reach sync (contact form) failed', e.message));

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Submit contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending message'
        });
    }
};

// @desc    Get all contact messages
// @route   GET /api/contacts
// @access  Private/Admin
export const getMessages = async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching messages'
        });
    }
};

// @desc    Delete a contact message
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
export const deleteMessage = async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        await message.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting message'
        });
    }
};
