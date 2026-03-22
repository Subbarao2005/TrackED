import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Attendance from '../models/Attendance.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import { io } from '../server.js';

const router = express.Router();

// @route   GET /api/attendance/today
// @desc    Mentors grab their specific database roster + any existing marks for today
router.get('/today', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Unauthorized' });
        
        let mentorProfile = await Mentor.findOne({ user: req.user.id }).populate({
           path: 'students', 
           populate: { path: 'user', select: 'name _id' } 
        });

        // 🔴 AUTO-HEAL
        if (!mentorProfile) {
            mentorProfile = new Mentor({ user: req.user.id, students: [] });
            await mentorProfile.save();
        }

        // Set exact calendar day format (YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        // Format mapping including looking up if the teacher already submitted attendance earlier today
        const dynamicRoster = await Promise.all(mentorProfile.students.map(async (stRel) => {
            const existingMark = await Attendance.findOne({ student: stRel.user._id, date: todayStr });
            return {
                id: stRel.user._id,
                name: stRel.user.name,
                status: existingMark ? existingMark.status : null
            };
        }));
        
        res.json({ roster: dynamicRoster, date: todayStr });
    } catch (err) {
        console.error("GET /today Attendance Error:", err);
        res.status(500).json({ message: 'Server Database Error (Attendance Roster)', error: err.message });
    }
});

// @route   POST /api/attendance/mark
// @desc    Mentors execute bulk updates explicitly for the active date roster
router.post('/mark', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Unauthorized' });
        const { date, attendanceData } = req.body; // payload looks like: array of { student: "ID", status: "Present" }
        
        // Loop over the payload mapping and perform Upsert Actions (Update if exists, Insert if Brand New)
        for (const record of attendanceData) {
            await Attendance.findOneAndUpdate(
                { student: record.student, date: date },
                { status: record.status, mentor: req.user.id },
                { upsert: true, new: true } // Creates missing docs, updates existing docs!
            );
            
            // Push notification directly bounding to the student profile
            await Notification.create({ user: record.student, message: `Your precise attendance was marked as ${record.status} for ${date}`, type: 'attendance' });

            // ⚡ Live Socket Trigger to the student
            io.to(record.student).emit('live_attendance', { status: record.status, date });
        }
        res.json({ message: 'Daily Register Safely Synchronized to Database' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to sync attendance parameters' });
    }
});

// @route   GET /api/attendance/student-stats
// @desc    Student dashboard stats via MongoDB Aggregation Pipeline
router.get('/student-stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });

        // ⚡ MongoDB Aggregation Pipeline — computed at DB level, not in JavaScript
        const pipeline = [
            { $match: { student: new (await import('mongoose')).default.Types.ObjectId(req.user.id) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absent:  { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } }
                }
            }
        ];

        const [agg] = await Attendance.aggregate(pipeline);
        const totalRaw   = agg?.total   || 0;
        const presentRaw = agg?.present || 0;
        const absentRaw  = agg?.absent  || 0;
        const percentageValue = totalRaw === 0 ? 100 : Math.round((presentRaw / totalRaw) * 100);

        // Today's status check
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = await Attendance.findOne({ student: req.user.id, date: todayStr });

        // Relational data for mentor name + next meeting
        const studentProfile = await Student.findOne({ user: req.user.id })
            .populate({ path: 'mentor', populate: { path: 'user', select: 'name' } });

        res.json({
            percentage: percentageValue,
            totalClassesRecorded: totalRaw,
            attendedClasses: presentRaw,
            absentClasses: absentRaw,
            todaysStatus: todayRecord ? todayRecord.status : 'Pending',
            nextMeeting: studentProfile?.nextMeeting || 'Not Scheduled',
            mentorName: studentProfile?.mentor?.user?.name || 'Unassigned'
        });
    } catch (err) {
        res.status(500).json({ message: 'Student stat aggregation engine failure.' });
    }
});

// @route   POST /api/attendance/generate-otp
// @desc    Mentor generates an active OTP for smart attendance. Valid for 5 mins.
router.post('/generate-otp', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Unauthorized' });
        
        const mentorProfile = await Mentor.findOne({ user: req.user.id });
        if (!mentorProfile) return res.status(404).json({ message: 'Mentor profile missing.' });

        // Generate a random 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const expires = new Date(Date.now() + 5 * 60000); // 5 minutes from now
        
        mentorProfile.activeOtp = code;
        mentorProfile.otpExpiresAt = expires;
        await mentorProfile.save();

        res.json({ otp: code, expiresAt: expires });
    } catch (err) {
        res.status(500).json({ message: 'Failed to cryptographically generate OTP.' });
    }
});

// @route   POST /api/attendance/verify-otp
// @desc    Student verifies the OTP sent by their mentor to auto-mark PRESENT
router.post('/verify-otp', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can run OTP validation routines.' });
        const { otp } = req.body;
        
        // Find who their mentor is
        const studentProfile = await Student.findOne({ user: req.user.id }).populate('mentor');
        if (!studentProfile || !studentProfile.mentor) {
            return res.status(400).json({ message: 'You must be assigned to a Mentor to utilize Smart OTP verification.' });
        }

        const mentorProfile = studentProfile.mentor;
        
        // Validate OTP and Expiry
        if (!mentorProfile.activeOtp || mentorProfile.activeOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP code.' });
        }
        if (new Date() > mentorProfile.otpExpiresAt) {
            return res.status(400).json({ message: 'This OTP has expired.' });
        }

        // OTP is VALID -> Mark Student as Present for today!
        const todayStr = new Date().toISOString().split('T')[0];
        await Attendance.findOneAndUpdate(
            { student: req.user.id, date: todayStr },
            { status: 'Present', mentor: mentorProfile.user }, // Credit the mentoring user id
            { upsert: true, new: true }
        );

        // Alert both ends
        await Notification.create({ user: req.user.id, message: `OTP verified. Marked Present for ${todayStr}.`, type: 'attendance' });
        io.to(req.user.id).emit('live_attendance', { status: 'Present', date: todayStr });
        io.to(mentorProfile.user.toString()).emit('smart_attendance_hit', { student: req.user.id, name: "A Student" });

        res.json({ message: 'Successfully Verified! Marked Present.' });
    } catch (err) {
        res.status(500).json({ message: 'Engine failure during verification loop.' });
    }
});

export default router;
