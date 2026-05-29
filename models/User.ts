import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'officer'], default: 'officer', required: true }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
