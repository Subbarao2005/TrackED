import express from 'express';
import bcrypt from 'bcryptjs';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import Task from '../models/Task.js';

const router = express.Router();

// Middleware strictly for admins
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
        return res.status(403).json({ message: 'System Admin clearance required.' });
    }
    next();
};

// @route   GET /api/admin/system-stats
// @desc    Get overarching platform analytics
router.get('/system-stats', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const studentsCount = await Student.countDocuments();
        const mentorsCount = await Mentor.countDocuments();
        const tasksCount = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });

        res.json({
            users: usersCount,
            students: studentsCount,
            mentors: mentorsCount,
            tasks: tasksCount,
            completedTasks
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to access system analytics.' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users in the system with their IDs spanning across all tiers
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving global user table.' });
    }
});

// @route   POST /api/admin/user
// @desc    Force generate any type of account
router.post('/user', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email collision detected in global scope.' });

        const salt = await bcrypt.genSalt(10);
        const autoPassword = password ? password : 'password'; 
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        if (role === 'student') {
            await new Student({ user: newUser._id, class: 'Unassigned', section: 'A' }).save();
        } else if (role === 'mentor') {
            await new Mentor({ user: newUser._id, students: [] }).save();
        }

        res.status(201).json({ message: `System node [${role.toUpperCase()}] explicitly drafted.`, user: newUser });
    } catch (err) {
        res.status(500).json({ message: 'Database integrity fault on user creation.', error: err.message });
    }
});

// @route   PUT /api/admin/user/:id
// @desc    Update a user's details / role
router.put('/user/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { name, email, role } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User object physically absent.' });

        // Warning: Role mutations map structures. If going from student->mentor, we leave the structural Student ghost in DB for now (v2.1 fix target).
        user.name = name || user.name;
        user.email = email || user.email;
        if (role && user.role !== role) {
            user.role = role;
            if (role === 'student') {
                const existing = await Student.findOne({ user: user._id });
                if (!existing) await new Student({ user: user._id, class: 'Unknown', section: 'A' }).save();
            } else if (role === 'mentor') {
                const existing = await Mentor.findOne({ user: user._id });
                if (!existing) await new Mentor({ user: user._id, students: [] }).save();
            }
        }
        await user.save();
        res.json({ message: 'User root object mutated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Admin Override failed.', error: err.message });
    }
});

// @route   DELETE /api/admin/user/:id
// @desc    Delete a user
router.delete('/user/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Entity missing.' });

        await User.findByIdAndDelete(req.params.id);
        
        if (user.role === 'student') await Student.deleteOne({ user: req.params.id });
        if (user.role === 'mentor') await Mentor.deleteOne({ user: req.params.id });
        
        res.json({ message: 'Entity permanently erased from Matrix.' });
    } catch (err) {
        res.status(500).json({ message: 'Destruction abort.', error: err.message });
    }
});

export default router;
