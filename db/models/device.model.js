import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    device: { type: String, required: true },
    status: { type: String, enum: ['on', 'off'], default: 'off' },
    room: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: null },
  },
  {
    versionKey: false,
  }
);

// Map _id to id when calling toJSON or toObject
deviceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

export const Device = mongoose.model('Device', deviceSchema);
