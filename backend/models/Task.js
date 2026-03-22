import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  deadline: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The target student
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The mentor who created it
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  color: { type: String, default: 'amber' }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
