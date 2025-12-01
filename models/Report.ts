import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnotation {
  type: "square" | "polygon";
  points: number[][]; // [[x, y], [x, y]] - stored as percentages (0-100)
  color: string;
  crackLevel?: number;
}

export interface IDamage {
  turbine: string;
  blade: string;
  side: string;
  imageUrl: string;
  imagePublicId: string;
  annotations: IAnnotation[];
  filters?: {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
    grayscale: number;
    hueRotate: number;
  };
}

export interface IReport extends Document {
  clientName: string;
  createdAt: Date;
  damages: IDamage[];
}

const AnnotationSchema = new Schema<IAnnotation>({
  type: { type: String, required: true, enum: ["square", "polygon"] },
  points: { type: [[Number]], required: true },
  color: { type: String, required: true },
  crackLevel: { type: Number, min: 1, max: 5 },
});

const DamageSchema = new Schema<IDamage>({
  turbine: { type: String, required: true },
  blade: { type: String, required: true },
  side: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true },
  annotations: [AnnotationSchema],
  filters: {
    brightness: Number,
    contrast: Number,
    saturate: Number,
    blur: Number,
    grayscale: Number,
    hueRotate: Number,
  },
});

const ReportSchema = new Schema<IReport>({
  clientName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  damages: [DamageSchema],
});

// Prevent recompilation of model
const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
