import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  activeOtp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Mentor', mentorSchema);
