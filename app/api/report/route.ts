import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Report from "../../../models/Report";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const report = await Report.create(body);
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
    const reports = await Report.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
