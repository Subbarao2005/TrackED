import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],   // Array of 4 option strings
  correctOption: { type: Number } // Index into options (0-3)
});

const shortAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  modelAnswer: { type: String } // AI's ideal answer for correction baseline
});

const examSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  weekTopics:   [{ type: String }],
  mcqs:         [mcqSchema],
  shortAnswers: [shortAnswerSchema],
  status:       { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Empty = all students
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);
