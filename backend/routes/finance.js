import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Fee from '../models/Fee.js';
import Salary from '../models/Salary.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// ----------------------------------------------------
// TEACHER MAPPED ROUTES (ADMIN)
// ----------------------------------------------------

// @route   GET /api/finance/fees
// @desc    Get all assigned student fees
router.get('/fees', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const fees = await Fee.find().populate('student', 'name email').sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   POST /api/finance/fees
// @desc    Assign a new fee to a specific student
router.post('/fees', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const { student, amount, description, dueDate } = req.body;
    
    // Generate a 6-character random alphanumeric cash verification code
    const cashCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const fee = new Fee({ student, amount, description, dueDate, createdBy: req.user.id, cashCode });
    await fee.save();
    
    // Broadcast notification directly to target student
    await Notification.create({ user: student, message: `New Administrative Fee Assigned: ${description} (₹${amount}). Due: ${new Date(dueDate).toLocaleDateString()}`, type: 'fee' });
    
    // Populate before returning so the UI table updates nicely
    const populated = await fee.populate('student', 'name email');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   PUT /api/finance/fees/:id/pay
// @desc    Mark a fee as successfully paid
router.put('/fees/:id/pay', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const fee = await Fee.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
    res.json(fee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   GET /api/finance/salaries
// @desc    Get all assigned mentor salaries
router.get('/salaries', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const salaries = await Salary.find().populate('mentor', 'name email').sort({ createdAt: -1 });
    res.json(salaries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   POST /api/finance/salaries
// @desc    Assign a new salary payment for a specific mentor
router.post('/salaries', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const { mentor, amount, description, payDate } = req.body;
    
    const salary = new Salary({ mentor, amount, description, payDate, createdBy: req.user.id });
    await salary.save();
    
    const populated = await salary.populate('mentor', 'name email');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   PUT /api/finance/salaries/:id/pay
// @desc    Mark a salary invoice as paid out
router.put('/salaries/:id/pay', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const salary = await Salary.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
    res.json(salary);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ----------------------------------------------------
// STUDENT ROUTE
// ----------------------------------------------------

// @route   GET /api/finance/student/fees
// @desc    Student gets their own fees breakdown
router.get('/student/fees', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
    const fees = await Fee.find({ student: req.user.id }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   PUT /api/finance/student/fees/:id/submit
// @desc    Student submits payment receipt for manual verification
router.put('/student/fees/:id/submit', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
    const fee = await Fee.findOneAndUpdate(
      { _id: req.params.id, student: req.user.id },
      { status: 'processing', receiptRef: req.body.receiptRef },
      { new: true }
    );
    res.json(fee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ----------------------------------------------------
// MENTOR ROUTE
// ----------------------------------------------------

// @route   PUT /api/finance/student/fees/:id/verify-cash
// @desc    Student inputs the teacher's secret cash code to automatically settle the bill
router.put('/student/fees/:id/verify-cash', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
    
    const fee = await Fee.findOne({ _id: req.params.id, student: req.user.id });
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    
    // Strict case-insensitive code check
    if (!fee.cashCode || fee.cashCode.toLowerCase() !== (req.body.code || '').toLowerCase()) {
       return res.status(400).json({ message: 'Invalid Cash Code provided.' });
    }

    fee.status = 'paid';
    await fee.save();
    res.json(fee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// @route   GET /api/finance/mentor/salaries
// @desc    Mentor gets their own salary payment records
router.get('/mentor/salaries', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Unauthorized' });
    const salaries = await Salary.find({ mentor: req.user.id }).sort({ createdAt: -1 });
    res.json(salaries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
