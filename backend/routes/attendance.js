import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Attendance from '../models/Attendance.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';

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
        }
        res.json({ message: 'Daily Register Safely Synchronized to Database' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to sync attendance parameters' });
    }
});

// @route   GET /api/attendance/student-stats
// @desc    Student UI calls this to dynamically process total percentage counts and specific daily status
router.get('/student-stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
        
        const records = await Attendance.find({ student: req.user.id });
        
        const totalRaw = records.length;
        const presentRaw = records.filter(mark => mark.status === 'Present').length;
        
        // Base logical parameters. Start the GUI at a fresh 100% assumption if records = 0
        const percentageValue = totalRaw === 0 ? 100 : Math.round((presentRaw / totalRaw) * 100);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const activeTodayRecord = records.find(r => r.date === todayStr);

        // Fetch precise relational dependencies to sync exact scheduling logic into dashboard GUI safely
        const studentProfile = await Student.findOne({ user: req.user.id }).populate({ path: 'mentor', populate: { path: 'user', select: 'name' } });

        const absentRaw = totalRaw - presentRaw;

        res.json({
            percentage: percentageValue,
            totalClassesRecorded: totalRaw,
            attendedClasses: presentRaw,
            absentClasses: absentRaw,
            todaysStatus: activeTodayRecord ? activeTodayRecord.status : 'Pending',
            nextMeeting: studentProfile?.nextMeeting || 'Not Scheduled',
            mentorName: studentProfile?.mentor?.user?.name || 'Unassigned'
        });
    } catch (err) {
        res.status(500).json({ message: 'Student stat calculation engine failure.' });
    }
});

export default router;
