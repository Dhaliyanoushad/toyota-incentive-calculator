import mongoose, { Schema } from 'mongoose';

const IncentiveSlabSchema = new Schema({
  startCount: { type: Number, required: true },
  endCount: { type: Number, default: null }, // null means Infinity (e.g., "8+")
  rate: { type: Number, required: true } // incentive in ₹
}, {
  timestamps: true
});

export default mongoose.models.IncentiveSlab || mongoose.model('IncentiveSlab', IncentiveSlabSchema);
