import mongoose from 'mongoose';

const FeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  cashCode: { type: String },
  receiptRef: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'paid'], default: 'pending' },
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Fee', FeeSchema);
