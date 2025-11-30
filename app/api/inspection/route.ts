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
