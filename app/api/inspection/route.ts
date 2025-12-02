import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Inspection from '@/models/Inspection';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://samikazah:samikazah@cluster0.h628p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

const getUserId = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId();
    console.log("POST /api/inspection - UserId from token:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("POST /api/inspection - Body:", JSON.stringify(body));

    const newInspection = await Inspection.create({ ...body, userId });
    console.log("POST /api/inspection - Created:", newInspection);
    
    return NextResponse.json({ success: true, data: newInspection });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId();
    console.log("GET /api/inspection - UserId from token:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inspections = await Inspection.find({ userId }).sort({ createdAt: -1 });
    console.log(`GET /api/inspection - Found ${inspections.length} inspections for user ${userId}`);
    
    return NextResponse.json({ success: true, data: inspections });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const inspection = await Inspection.findOne({ _id: id, userId });
    
    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found or unauthorized" }, { status: 404 });
    }

    // Collect all public IDs
    const publicIds: string[] = [];
    if (inspection.turbine) {
        inspection.turbine.forEach((turb: any) => {
            turb.blades.forEach((blade: any) => {
                blade.sides.forEach((side: any) => {
                    side.images.forEach((img: any) => {
                        if (img.publicId) {
                            publicIds.push(img.publicId);
                        }
                    });
                });
            });
        });
    }

    // Delete images from Cloudinary
    if (publicIds.length > 0) {
        try {
            const cloudinaryModule = await import('../../../lib/cloudinary');
            const cloudinary = cloudinaryModule.default;
            await cloudinary.api.delete_resources(publicIds);
        } catch (cloudinaryError) {
            console.error("Cloudinary Error:", cloudinaryError);
        }
    }

    await Inspection.findOneAndDelete({ _id: id, userId });

    return NextResponse.json({ success: true, message: "Inspection deleted" });
  } catch (error) {
    console.error("Error deleting inspection:", error);
    return NextResponse.json({ error: "Failed to delete inspection" }, { status: 500 });
  }
}
