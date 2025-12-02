import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import User from "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://samikazah:samikazah@cluster0.h628p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    console.log(`Login attempt for email: ${email}`);

    // Try to find user (case-insensitive for robustness)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
    
    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log(`User found: ${user.email}, Verified: ${user.isVerified}`);

    if (!user.isVerified) {
      return NextResponse.json({ error: "Please verify your email first." }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      console.log("Password mismatch");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set Cookie
    const cookie = serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "strict",
    });

    const response = NextResponse.json({ success: true, user: { name: user.name, email: user.email } });
    response.headers.set("Set-Cookie", cookie);

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
