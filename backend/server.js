// ⚡ CRITICAL: dotenv must be loaded first via a dedicated module
// because ES Module imports are hoisted before inline code runs.
import './loadEnv.js';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import mentorRoutes from './routes/mentor.js';
import taskRoutes from './routes/tasks.js';
import attendanceRoutes from './routes/attendance.js';
import teacherRoutes from './routes/teacher.js';
import examRoutes from './routes/exam.js';
import financeRoutes from './routes/finance.js';
import notificationRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';

const app = express();
const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5000;

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
  // Optional: Students can join a room bearing their user ID to receive targeted real-time alerts
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });
  socket.on('disconnect', () => console.log('🔴 Socket disconnected:', socket.id));
});

// 🛡️ Security Middleware
app.use(cors()); // ⚡ Moved UP to ensure preflight requests get headers even when rate limited!
app.use(helmet({ contentSecurityPolicy: false })); // Security headers

// 🚦 Global API Rate Limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests from this IP, please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
  res.send('API Running – TrackED Backend v2.0 (Secured + Rate-Limited)');
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Student from './models/Student.js';
import Mentor from './models/Mentor.js';

// Database connection
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI;

    // If no URI is provided, magically spin up a real MongoDB instance in-memory!
    if (!mongoURI) {
      console.log('No MongoDB URI found. Starting an automatic in-memory MongoDB server...');
      const mongoServer = await MongoMemoryServer.create();
      mongoURI = mongoServer.getUri();
    }

    await mongoose.connect(mongoURI);
    console.log(`MongoDB connected successfully at: ${mongoURI}`);

    // Auto-seed Demo Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial demo accounts...');
      const defaultPassword = await bcrypt.hash('password', 10);
      await User.insertMany([
        { name: 'Demo Student', email: 'student@tracked.com', password: defaultPassword, role: 'student' },
        { name: 'Dr. Mentor', email: 'mentor@tracked.com', password: defaultPassword, role: 'mentor' },
        { name: 'Admin Teacher', email: 'teacher@tracked.com', password: defaultPassword, role: 'teacher' },
        { name: 'System Dev', email: 'developer@tracked.com', password: defaultPassword, role: 'developer' }
      ]);
      console.log('✅ 4 Demo Accounts Seeded. Password for all: "password"');

      // 🛑 Generate Relationship Ties 🛑
      const studentUser = await User.findOne({ email: 'student@tracked.com' });
      const mentorUser  = await User.findOne({ email: 'mentor@tracked.com' });

      // Build out the specific Table mappings automatically!
      const studentDoc = new Student({ user: studentUser._id, class: 'CS412', section: 'A' });
      const mentorDoc  = new Mentor({ user: mentorUser._id, students: [studentDoc._id] });
      
      studentDoc.mentor = mentorDoc._id; // Foreign Key cross-association
      await studentDoc.save();
      await mentorDoc.save();
      console.log('🔗 Role Objects Linked in DB: User (Student) -> Mentor (Dr. Mentor)');
    }

  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (with Socket.IO 🚀)`);
    console.log(`🛡️  Rate Limiting: Active | 🔒 Helmet: Active`);
  });

  // ⏰ Midnight Cron: Scan overdue tasks & push in-app notifications
  cron.schedule('0 0 * * *', async () => {
    try {
      const Task = (await import('./models/Task.js')).default;
      const Notification = (await import('./models/Notification.js')).default;
      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = await Task.find({
        status: { $in: ['Pending', 'In Progress'] },
        deadline: { $lt: today }
      });
      if (overdueTasks.length > 0) {
        const notifs = overdueTasks.map(t => ({
          user: t.student,
          message: `⚠️ Overdue Task: "${t.title}" was due on ${t.deadline}. Please complete it urgently!`,
          type: 'task'
        }));
        await Notification.insertMany(notifs);
        console.log(`[CRON] Pushed ${overdueTasks.length} overdue notifications.`);
      }
    } catch (err) { console.error('[CRON ERROR]', err.message); }
  });
  console.log('⏰ Midnight overdue-task cron scheduled.');
});
