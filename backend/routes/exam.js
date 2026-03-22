import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Exam from '../models/Exam.js';
import ExamSubmission from '../models/ExamSubmission.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// ─────────────────────────────────────────
// TEACHER ROUTES
// ─────────────────────────────────────────

// @route   POST /api/exam/generate
// @desc    AI analyses this week's tasks, generates 10 MCQ + 10 short answer questions
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });

    let topicList = [];

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(401).json({ message: 'Missing Gemini API Key in .env file!' });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);

    // If teacher manually provided topics, use those directly
    if (req.body.manualTopics && req.body.manualTopics.trim()) {
      topicList = req.body.manualTopics
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0);
    } else {
      // Auto-extract from this week's assigned tasks
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentTasks = await Task.find({ createdAt: { $gte: oneWeekAgo } });
      topicList = [...new Set(recentTasks.map(t => t.title))];
    }

    if (topicList.length === 0) {
      return res.status(400).json({ message: 'No topics found. Either assign tasks this week or enter custom topics manually.' });
    }

    // Build the AI Prompt
    const prompt = `
You are an expert educational assessment AI for a school/tuition management system.
Students studied the following topics this week:
${topicList.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Generate a weekly assessment exam with EXACTLY the following JSON structure and nothing else:
{
  "title": "Weekly Assessment - [Topics Summary]",
  "mcqs": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0
    }
  ],
  "shortAnswers": [
    {
      "question": "Question text here?",
      "modelAnswer": "The ideal comprehensive answer"
    }
  ]
}

Rules:
- Generate EXACTLY 10 MCQ questions and EXACTLY 10 short answer questions
- MCQ correctOption is the 0-based index (0, 1, 2, or 3)
- Short answer model answers should be 2-4 sentences
- Questions must be directly based on the provided topics
- Vary difficulty: 4 easy, 4 medium, 2 hard per section
- Return ONLY valid JSON, no markdown, no explanation
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Strip markdown code fences if AI adds them
    const cleanJson = rawText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(cleanJson);

    if (!parsed.mcqs || parsed.mcqs.length !== 10 || !parsed.shortAnswers || parsed.shortAnswers.length !== 10) {
      return res.status(500).json({ message: 'AI returned malformed exam structure. Please try again.' });
    }

    // Save as DRAFT exam
    const exam = new Exam({
      title: parsed.title,
      weekTopics: topicList,
      mcqs: parsed.mcqs,
      shortAnswers: parsed.shortAnswers,
      status: 'draft',
      createdBy: req.user.id,
      targetStudents: req.body.targetStudent && req.body.targetStudent !== 'all' ? [req.body.targetStudent] : []
    });

    await exam.save();
    res.status(201).json({ message: 'Exam generated successfully!', exam });

  } catch (err) {
    console.error('Exam Generation Error:', err);
    res.status(500).json({ message: 'AI generation failed: ' + err.message });
  }
});

// @route   GET /api/exam/teacher
// @desc    Get all exams created by this teacher
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const exams = await Exam.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/exam/:id/status
// @desc    Teacher publishes or closes an exam
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const { status } = req.body; // 'published' or 'closed'
    const exam = await Exam.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: `Exam ${status} successfully.`, exam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/exam/:id
// @desc    Teacher deletes a draft exam
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    await Exam.findByIdAndDelete(req.params.id);
    await ExamSubmission.deleteMany({ exam: req.params.id });
    res.json({ message: 'Exam deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/exam/:id/results
// @desc    Teacher views all student submissions for an exam
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
    const submissions = await ExamSubmission.find({ exam: req.params.id })
      .populate('student', 'name email');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// STUDENT ROUTES
// ─────────────────────────────────────────

// @route   GET /api/exam/student/active
// @desc    Get the currently published exam for the student
router.get('/student/active', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });

    const activeExam = await Exam.findOne({ 
       status: 'published',
       $or: [
          { targetStudents: { $size: 0 } },  // Empty array = globally assigned to all 
          { targetStudents: req.user.id }    // Specifically assigned to this exact student string
       ]
    }).sort({ createdAt: -1 });
    if (!activeExam) return res.json({ exam: null });

    // Check if this student already submitted
    const existing = await ExamSubmission.findOne({ exam: activeExam._id, student: req.user.id });

    // Strip correct answers before sending to student!
    const safeExam = {
      _id: activeExam._id,
      title: activeExam.title,
      weekTopics: activeExam.weekTopics,
      mcqs: activeExam.mcqs.map(q => ({ question: q.question, options: q.options })), // No correctOption!
      shortAnswers: activeExam.shortAnswers.map(q => ({ question: q.question })),        // No modelAnswer!
    };

    res.json({ exam: safeExam, alreadySubmitted: !!existing, submission: existing || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/exam/student/submissions
// @desc    Get all historical exam results for this student
router.get('/student/submissions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
    const submissions = await ExamSubmission.find({ student: req.user.id })
      .populate('exam', 'title weekTopics createdBy')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/exam/:id/submit
// @desc    Student submits answers; AI evaluates spontaneously
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });

    // Prevent double submission
    const existing = await ExamSubmission.findOne({ exam: req.params.id, student: req.user.id });
    if (existing) return res.status(400).json({ message: 'You have already submitted this exam.' });

    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.status !== 'published') return res.status(404).json({ message: 'Exam not available.' });

    const { mcqAnswers, shortAnswers } = req.body;

    // ── MCQ Auto-Grading (Instant, no AI needed) ──────────────────
    let mcqScore = 0;
    exam.mcqs.forEach((q, i) => {
      if (mcqAnswers[i] === q.correctOption) mcqScore++;
    });

    // ── AI Short Answer Grading (Gemini) ─────────────────────────
    const aiFeedback = [];
    let shortAnswerScore = 0;
    
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(401).json({ message: 'Missing Gemini API Key! Please verify your .env file.' });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const gradingPrompt = `
You are a strict but fair educational examiner AI.
Grade the following student short answers. For each answer, return ONLY a valid JSON array:
[
  { "score": 0.5, "feedback": "Short feedback sentence (max 25 words)" },
  ...
]

Each answer is scored out of 1 (0 = completely wrong, 0.5 = partial, 1 = correct).
Return ONLY a valid JSON array, no markdown, no explanation.

Questions and answers:
${exam.shortAnswers.map((q, i) => `Q${i + 1}: ${q.question}\nModel Answer: ${q.modelAnswer}\nStudent Answer: ${shortAnswers[i] || '(No answer)'}`).join('\n\n')}
`;

    try {
      const gradingResult = await model.generateContent(gradingPrompt);
      let gradingRaw = gradingResult.response.text().trim();
      gradingRaw = gradingRaw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
      const gradingData = JSON.parse(gradingRaw);

      gradingData.forEach(g => {
        shortAnswerScore += parseFloat(g.score) || 0;
        aiFeedback.push(g.feedback || 'No feedback.');
      });
    } catch (aiErr) {
      console.error('Grading AI error:', aiErr);
      // Fallback: basic keyword matching
      exam.shortAnswers.forEach((q, i) => {
        const studentAns = (shortAnswers[i] || '').toLowerCase();
        const modelWords = q.modelAnswer.toLowerCase().split(' ').filter(w => w.length > 4);
        const matches = modelWords.filter(w => studentAns.includes(w)).length;
        const ratio = Math.min(matches / Math.max(modelWords.length * 0.3, 1), 1);
        shortAnswerScore += ratio;
        aiFeedback.push(ratio > 0.7 ? 'Good answer.' : ratio > 0.3 ? 'Partial answer.' : 'Needs more detail.');
      });
    }

    // ── AI Overall Summary (Gemini) ────────────────────────────────
    const totalScore = mcqScore + Math.round(shortAnswerScore);
    const maxScore = exam.mcqs.length + exam.shortAnswers.length;

    let aiSummary = '';
    try {
      const summaryResult = await model.generateContent(
        `A student scored ${totalScore} out of ${maxScore} on a weekly test. Write a 2-sentence encouraging performance summary with specific improvement suggestions. Be direct and helpful.`
      );
      aiSummary = summaryResult.response.text().trim();
    } catch {
      aiSummary = `You scored ${totalScore}/${maxScore}. Keep practising the topics covered this week!`;
    }

    const submission = new ExamSubmission({
      exam: req.params.id,
      student: req.user.id,
      mcqAnswers,
      shortAnswers,
      mcqScore,
      shortAnswerScore: Math.round(shortAnswerScore),
      totalScore,
      maxScore,
      aiFeedback,
      aiSummary
    });

    await submission.save();
    res.status(201).json({ submission });

  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ message: 'Submission failed: ' + err.message });
  }
});

export default router;
