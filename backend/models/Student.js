import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
  nextMeeting: { type: String, default: 'Not Scheduled' },
  class: { type: String },
  section: { type: String }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
