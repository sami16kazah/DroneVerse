import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://samikazah:samikazah@cluster0.h628p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    user.isVerified = true;
    user.verificationToken = undefined; // Clear token
    await user.save();

    // Redirect to login page with success message? Or just return JSON?
    // Let's return JSON and let frontend handle it, or redirect.
    // Since this is likely clicked from email, redirect is better.
    return NextResponse.redirect(new URL("/login?verified=true", req.url));

  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
