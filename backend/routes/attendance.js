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

export default router;
