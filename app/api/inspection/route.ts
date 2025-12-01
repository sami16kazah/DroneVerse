import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Inspection from '../../../models/Inspection';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const inspection = await Inspection.create(body);

    return NextResponse.json({ success: true, data: inspection }, { status: 201 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const inspections = await Inspection.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: inspections }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 400 });
  }
}

import fs from 'fs';
import path from 'path';

function logToFile(message: string) {
  const logPath = path.join(process.cwd(), 'debug_log.txt');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

export async function DELETE(request: Request) {
  try {
    logToFile("DELETE /api/inspection called");
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      logToFile("Error: Inspection ID is required");
      return NextResponse.json({ success: false, error: 'Inspection ID is required' }, { status: 400 });
    }

    logToFile(`Attempting to delete inspection with ID: ${id}`);
    const inspection = await Inspection.findById(id);

    if (!inspection) {
      logToFile("Error: Inspection not found");
      return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 });
    }

    // Collect all public IDs
    const publicIds: string[] = [];
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

    logToFile(`Found ${publicIds.length} images to delete from Cloudinary`);

    // Delete images from Cloudinary
    if (publicIds.length > 0) {
        try {
            // Import cloudinary dynamically to ensure env vars are loaded
            const cloudinaryModule = await import('../../../lib/cloudinary');
            const cloudinary = cloudinaryModule.default;
            logToFile(`Cloudinary config: cloud_name=${process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}, api_key=${process.env.CLOUDINARY_API_KEY ? "***" : "MISSING"}`);
            
            const result = await cloudinary.api.delete_resources(publicIds);
            logToFile(`Cloudinary delete result: ${JSON.stringify(result)}`);
        } catch (cloudinaryError) {
            logToFile(`Cloudinary Error: ${JSON.stringify(cloudinaryError)}`);
            console.error("Cloudinary Error:", cloudinaryError);
        }
    }

    await Inspection.findByIdAndDelete(id);
    logToFile("Inspection deleted from MongoDB");

    return NextResponse.json({ success: true, message: 'Inspection deleted successfully' }, { status: 200 });
  } catch (error) {
    logToFile(`Delete Error: ${error}`);
    console.error('Delete Error:', error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}
