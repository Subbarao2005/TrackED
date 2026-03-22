import express from 'express';
import bcrypt from 'bcryptjs';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// @route   GET /api/teacher/users
// @desc    Get all active students and mentors in the system
router.get('/users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized. Teacher tier strictly required.' });
        
        const users = await User.find({ role: { $in: ['student', 'mentor'] } })
                                .select('-password')
                                .sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving platform users list', error: err.message });
    }
});

// @route   POST /api/teacher/user
// @desc    Create a new system mentor or student
router.post('/user', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized execution attempt.' });
        
        const { name, email, password, role } = req.body;
        
        if (!['student', 'mentor'].includes(role)) {
            return res.status(400).json({ message: 'You can only spawn Student or Mentor accounts.' });
        }

        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Account mapping collision! Email already active.' });

        const salt = await bcrypt.genSalt(10);
        const autoPassword = password ? password : 'password'; 
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        // Core Authority Registration
        let newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        // Foreign Collection Structural Generation
        if (role === 'student') {
            const newStudent = new Student({ user: newUser._id, class: 'Unknown', section: 'A' });
            await newStudent.save();
        } else if (role === 'mentor') {
            const newMentor = new Mentor({ user: newUser._id, students: [] });
            await newMentor.save();
        }

        res.status(201).json({ message: `${role.toUpperCase()} account successfully compiled into Database.` });
    } catch (err) {
        res.status(500).json({ message: 'Fatal crash spawning new identity node.', error: err.message });
    }
});

// @route   DELETE /api/teacher/user/:id
// @desc    Cascade destroy a mentor or student identity matrix
router.delete('/user/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized access.' });
        
        const requestedId = req.params.id;
        const targetMapping = await User.findById(requestedId);
        
        if (!targetMapping) return res.status(404).json({ message: 'Ghost entity. Could not find target inside structural DB.' });
        if (['teacher', 'developer'].includes(targetMapping.role)) {
            return res.status(403).json({ message: 'Core architecture rejects deletion of admin-level entities.' });
        }

        // Nuclear Structural Sub-table Erasure Process
        if (targetMapping.role === 'student') {
            await Student.deleteMany({ user: targetMapping._id });
            await Task.deleteMany({ student: targetMapping._id });
            await Attendance.deleteMany({ student: targetMapping._id });
        } else if (targetMapping.role === 'mentor') {
            await Mentor.deleteMany({ user: targetMapping._id });
            await Task.deleteMany({ assignedBy: targetMapping._id });
        }

        // Final Auth Collection Annihilation
        await User.findByIdAndDelete(targetMapping._id);

        res.json({ message: 'Entity securely isolated and purged from Node Environment.' });
    } catch (err) {
        res.status(500).json({ message: 'Database cascade failure.', error: err.message });
    }
});

// @route   GET /api/teacher/students-mapping
// @desc    Retrieve all students and mentors for assignment mapping
router.get('/students-mapping', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
        
        const students = await Student.find().populate('user', 'name email').populate({
            path: 'mentor',
            populate: { path: 'user', select: 'name' }
        });
        const mentors = await Mentor.find().populate('user', 'name');
        
        res.json({ students, mentors });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving structural mapping data', error: err.message });
    }
});

// @route   PUT /api/teacher/assign
// @desc    Dynamically update a student's assigned mentor, handling old and new Document arrays automatically
router.put('/assign', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
        
        const { studentId, mentorId } = req.body;
        
        const studentDoc = await Student.findById(studentId);
        if (!studentDoc) return res.status(404).json({ message: 'Student document structurally missing' });
        
        // Unlink from the Previous Mentor's tracking array safely
        if (studentDoc.mentor) {
            await Mentor.findByIdAndUpdate(studentDoc.mentor, {
                $pull: { students: studentDoc._id }
            });
        }
        
        // Inject into New Mentor mapping (or set to null if unassigned)
        if (mentorId && mentorId !== 'unassigned') {
            studentDoc.mentor = mentorId;
            await Mentor.findByIdAndUpdate(mentorId, {
                $addToSet: { students: studentDoc._id }
            });
        } else {
            studentDoc.mentor = null;
        }
        
        await studentDoc.save();
        res.json({ message: 'Relational logic safely integrated across Collections!' });
    } catch (err) {
        res.status(500).json({ message: 'Cross-collection array mutation fault.', error: err.message });
    }
});

export default router;
