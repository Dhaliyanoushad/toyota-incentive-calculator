import mongoose, { Schema } from 'mongoose';

const SaleItemSchema = new Schema({
  modelId: { type: Schema.Types.ObjectId, ref: 'CarModel', required: true },
  quantity: { type: Number, required: true, min: 0 }
}, { _id: false });

const SalesRecordSchema = new Schema({
  officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // e.g. "05" or "May"
  year: { type: Number, required: true }, // e.g. 2026
  sales: [SaleItemSchema],
  totalCars: { type: Number, required: true, default: 0 },
  incentiveRate: { type: Number, required: true, default: 0 }, // For records, or reference rate
  totalIncentive: { type: Number, required: true, default: 0 } // Computed total ₹ payout
}, {
  timestamps: true
});

export default mongoose.models.SalesRecord || mongoose.model('SalesRecord', SalesRecordSchema);
