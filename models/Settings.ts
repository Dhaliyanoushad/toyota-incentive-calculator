import mongoose, { Schema } from 'mongoose';

const SettingsSchema = new Schema({
  calculationMode: { type: String, enum: ['progressive', 'flat'], default: 'progressive', required: true }
}, {
  timestamps: true
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
