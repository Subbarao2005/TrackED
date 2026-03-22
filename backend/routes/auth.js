import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';

const router = express.Router();

// 🛡️ Brute-Force Protection: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route POST /api/auth/register
// @desc Register a typical user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password, role });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route POST /api/auth/login
// @desc Login user & get token
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
