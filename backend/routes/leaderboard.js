import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Student from '../models/Student.js';

const router = express.Router();

// @route GET /api/leaderboard
// @desc  Compute top students by attendance % + task completion rate
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Aggregate attendance per student
    const attendanceStats = await Attendance.aggregate([
      { $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
      }}
    ]);

    // Aggregate task completion per student
    const taskStats = await Task.aggregate([
      { $group: {
          _id: '$student',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
      }}
    ]);

    const taskMap = {};
    taskStats.forEach(t => { taskMap[t._id.toString()] = t; });

    // Score = 70% attendance + 30% task completion
    const scored = await Promise.all(attendanceStats.map(async (a) => {
      const userId = a._id.toString();
      const attendancePct = a.total === 0 ? 100 : Math.round((a.present / a.total) * 100);
      const t = taskMap[userId];
      const taskPct = t && t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;
      const score = Math.round(attendancePct * 0.7 + taskPct * 0.3);

      const user = await User.findById(a._id).select('name');
      return {
        userId,
        name: user?.name || 'Unknown',
        attendancePct,
        taskPct,
        score
      };
    }));

    // Sort descending by score, take top 10
    const leaderboard = scored
      .filter(s => s.name !== 'Unknown')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
