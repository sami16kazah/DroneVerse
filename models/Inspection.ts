import mongoose, { Schema, Document } from 'mongoose';

export interface IInspection extends Document {
  clientName: string;
  employeeName: string;
  location: {
    city: string;
    address: string;
    postcode: string;
    latitude?: number;
    longitude?: number;
  };
  turbine: {
    name: string; // e.g., "WTG 1"
    blades: {
      name: string; // e.g., "Blade 1"
      sides: {
        name: string; // e.g., "LE"
        images: {
            url: string;
            publicId: string;
        }[];
      }[];
    }[];
  }[];
  createdAt: Date;
}

const InspectionSchema: Schema = new Schema({
  clientName: { type: String, required: true },
  employeeName: { type: String, required: true },
  location: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    postcode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  turbine: [{
    name: { type: String, required: true },
    blades: [{
      name: { type: String, required: true },
      sides: [{
        name: { type: String, required: true },
        images: [{
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        }]
      }]
    }]
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Inspection || mongoose.model<IInspection>('Inspection', InspectionSchema);
