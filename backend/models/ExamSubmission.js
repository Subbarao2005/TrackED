import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  exam:    { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Student's raw answers
  mcqAnswers:        [{ type: Number }],  // Index of selected option per question
  shortAnswers:      [{ type: String }],  // Text answers per question

  // AI Correction Results
  mcqScore:          { type: Number, default: 0 },
  shortAnswerScore:  { type: Number, default: 0 },
  totalScore:        { type: Number, default: 0 },
  maxScore:          { type: Number, default: 20 },
  aiFeedback:        [{ type: String }],  // Per short-answer AI feedback
  aiSummary:         { type: String },    // Overall AI performance commentary

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// One submission per student per exam
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model('ExamSubmission', submissionSchema);
