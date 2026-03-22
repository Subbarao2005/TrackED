import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Task from '../models/Task.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import { io } from '../server.js';

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

    const insertedTasks = await Task.insertMany(tasksToInsert);
    
    // Auto-Alert Push Notifications & Sockets
    const notifs = [];
    insertedTasks.forEach(t => {
      notifs.push({ user: t.student, message: `New Task Assigned: ${t.title}`, type: 'task' });
      io.to(t.student.toString()).emit('new_task', { title: t.title, deadline: t.deadline });
    });
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
// @desc    Update progression standing. Mentors can approve, Students can submit.
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        // Security check
        if (req.user.role === 'mentor' && task.assignedBy.toString() !== req.user.id) {
           return res.status(403).json({ message: 'Cannot modify a task you did not assign.' });
        }
        if (req.user.role === 'student' && task.student.toString() !== req.user.id) {
           return res.status(403).json({ message: 'You can only submit your own tasks.' });
        }

        const statuses = ['Pending', 'In Progress', 'Under Review', 'Completed'];
        const colors = { 'Pending': 'rose', 'In Progress': 'amber', 'Under Review': 'cyan', 'Completed': 'emerald' };
        
        let currentIndex = statuses.indexOf(task.status);
        let nextIndex = (currentIndex + 1) % statuses.length;

        // Logic check: Only Mentors can push to Completed
        if (req.user.role === 'student' && statuses[nextIndex] === 'Completed') {
            return res.status(400).json({ message: 'Students can only submit for review. Mentor must approve!' });
        }
        
        task.status = statuses[nextIndex];
        task.color = colors[task.status];
        await task.save();

        // ⚡ Live Socket notification
        if (task.status === 'Under Review') {
           io.to(task.assignedBy.toString()).emit('task_submitted', { title: task.title, student: req.user.id });
           await Notification.create({ user: task.assignedBy, message: `A student submitted task: ${task.title}`, type: 'task' });
        } else if (task.status === 'Completed') {
           io.to(task.student.toString()).emit('task_approved', { title: task.title });
           await Notification.create({ user: task.student, message: `Mentor approved your task: ${task.title} 🌟!`, type: 'task' });
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Server database error while updating the task status.' });
    }
});

// @route   GET /api/tasks/student
// @desc    Get all daily tasks uniquely assigned to the logged in student
router.get('/student', authMiddleware, async (req, res) => {
    try {
       const tasks = await Task.find({ student: req.user.id })
           .populate('assignedBy', 'name')
           .sort({ createdAt: -1 });
       res.json(tasks);
    } catch (err) {
       res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// @route   PUT /api/tasks/:id/submit
// @desc    Submit a file or grade/feedback
router.put('/:id/submit', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const { submissionUrl, feedback, grade } = req.body;

        if (req.user.role === 'student') {
            if (task.student.toString() !== req.user.id) return res.status(403).json({ message: 'Not your task' });
            task.submissionUrl = submissionUrl || task.submissionUrl;
            task.status = 'Under Review';
            task.color = 'cyan';
            
            io.to(task.assignedBy.toString()).emit('task_submitted', { title: task.title, student: req.user.id });
            await Notification.create({ user: task.assignedBy, message: `A student submitted task: ${task.title}`, type: 'task' });
        } else if (req.user.role === 'mentor') {
            if (task.assignedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Not assigned by you' });
            task.feedback = feedback || task.feedback;
            task.grade = grade || task.grade;
            task.status = 'Completed';
            task.color = 'emerald';
            
            io.to(task.student.toString()).emit('task_approved', { title: task.title });
            await Notification.create({ user: task.student, message: `Task approved: ${task.title}. Grade: ${task.grade}/100`, type: 'task' });
        }

        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Error updating task.' });
    }
});

export default router;
