import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
        res.json(notifications);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: 'Marked read' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
