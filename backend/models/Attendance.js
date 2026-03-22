import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:    { type: String, required: true }, // Format: 'YYYY-MM-DD'
  status:  { type: String, enum: ['Present', 'Absent'], required: true }
}, { timestamps: true });

// Prevent a mentor from accidentally creating multiple attendance documents for the exact same student on the exact same day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
