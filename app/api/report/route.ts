import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Report from "../../../models/Report";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

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

export async function POST(request: Request) {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const report = await Report.create({ ...body, userId });
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("DELETE /api/report called");
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      console.log("Error: Report ID is required");
      return NextResponse.json({ success: false, error: 'Report ID is required' }, { status: 400 });
    }

    console.log(`Attempting to delete report with ID: ${id}`);
    const report = await Report.findOne({ _id: id, userId });

    if (!report) {
      console.log("Error: Report not found or unauthorized");
      return NextResponse.json({ success: false, error: 'Report not found or unauthorized' }, { status: 404 });
    }

    // Collect all public IDs
    const publicIds: string[] = [];
    if (report.damages) {
        report.damages.forEach((damage: any) => {
            if (damage.imagePublicId) {
                publicIds.push(damage.imagePublicId);
            }
        });
    }

    console.log(`Found ${publicIds.length} images to delete from Cloudinary`);

    // Delete images from Cloudinary
    if (publicIds.length > 0) {
        try {
            const cloudinaryModule = await import('../../../lib/cloudinary');
            const cloudinary = cloudinaryModule.default;
            console.log("Cloudinary config:", {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY ? "***" : "MISSING",
            });

            const result = await cloudinary.api.delete_resources(publicIds);
            console.log("Cloudinary delete result:", result);
        } catch (cloudinaryError) {
            console.error("Cloudinary Error:", cloudinaryError);
        }
    }

    await Report.findOneAndDelete({ _id: id, userId });
    console.log("Report deleted from MongoDB");

    return NextResponse.json({ success: true, message: 'Report deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}
