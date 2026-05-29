import mongoose, { Schema } from 'mongoose';

const CarModelSchema = new Schema({
  modelName: { type: String, required: true },
  baseSuffix: { type: String, required: true }, // e.g. "LE", "SE", "XLE"
  variant: { type: String, required: true }, // e.g. "Hybrid", "AWD", "Gas"
  isActive: { type: Boolean, default: true, required: true }
}, {
  timestamps: true
});

export default mongoose.models.CarModel || mongoose.model('CarModel', CarModelSchema);
