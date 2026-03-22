import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Task from '../models/Task.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   POST /api/tasks/assign
// @desc    Mentor creates a new task for student(s)
router.post('/assign', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Unauthorized' });

    const { title, deadline, target } = req.body;
    
    // Find the mentor mapping to extract their assigned students
    let mentorProfile = await Mentor.findOne({ user: req.user.id }).populate('students');
    
    // 🔴 AUTO-HEAL 
    if (!mentorProfile) {
        mentorProfile = new Mentor({ user: req.user.id, students: [] });
        await mentorProfile.save();
    }

    const tasksToInsert = [];

    mentorProfile.students.forEach(studentRel => {
       // Filter against dropdown strictly allowing specified targeted elements
       if (target !== 'all' && studentRel.user.toString() !== target) return;

       tasksToInsert.push({
           title,
           deadline,
           student: studentRel.user, 
           assignedBy: req.user.id,
           status: 'Pending',
           color: 'rose'
       });
    });

    if (tasksToInsert.length === 0) {
        return res.status(400).json({ message: 'Target mismatch: Selected student does not exist natively bounded to this mentor Profile.' });
    }

    await Task.insertMany(tasksToInsert);
    
    // Auto-Alert Push Notifications
    const notifs = tasksToInsert.map(t => ({ user: t.student, message: `New Task Assigned: ${t.title}`, type: 'task' }));
    await Notification.insertMany(notifs);

    res.status(201).json({ message: 'Tasks successfully pushed to students' });

  } catch (err) {
    console.error("Task POST Error:", err);
    res.status(500).json({ message: err.message || 'Server database error' });
  }
});

// @route   GET /api/tasks/mentor
// @desc    Get recently assigned tasks created by this mentor
router.get('/mentor', authMiddleware, async (req, res) => {
  try {
     const tasks = await Task.find({ assignedBy: req.user.id })
       .populate('student', 'name')
       .sort({ createdAt: -1 });
     res.json(tasks);
  } catch (err) {
     res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// @route   PUT /api/tasks/:id/status
// @desc    Mentor updates the current progression standing of an assignment
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Unauthorized. Only mentors can evaluate assigned tasks.' });
        
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        if (task.assignedBy.toString() !== req.user.id) {
           return res.status(403).json({ message: 'Cannot modify a task you did not assign.' });
        }

        // Cycle through the statuses dynamically
        const statuses = ['Pending', 'In Progress', 'Completed'];
        const colors = { 'Pending': 'rose', 'In Progress': 'amber', 'Completed': 'emerald' };
        
        let currentIndex = statuses.indexOf(task.status);
        let nextIndex = (currentIndex + 1) % statuses.length;
        
        task.status = statuses[nextIndex];
        task.color = colors[task.status];
        
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Server database error while updating the task status.' });
    }
});

// @route   GET /api/tasks/student
// @desc    Get all daily tasks uniquely assigned to the logged in student
router.get('/student', authMiddleware, async (req, res) => {
    try {
       // Populate the assignedBy field so we know the mentor's name!
       const tasks = await Task.find({ student: req.user.id })
           .populate('assignedBy', 'name')
           .sort({ createdAt: -1 });
       res.json(tasks);
    } catch (err) {
       res.status(500).json({ message: 'Error fetching tasks' });
    }
});

export default router;
