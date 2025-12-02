import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "@/models/User";
import { sendVerificationEmail } from "@/utils/mailjet";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://samikazah:samikazah@cluster0.h628p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email: rawEmail, password } = await req.json();
    const email = rawEmail?.toLowerCase();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    try {
        await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
        console.error("Failed to send verification email. User created but email failed.", emailError);
        // We still create the user, but maybe warn client? Or delete user?
        // For now, let's keep user but they need to resend verification later (feature for future)
        return NextResponse.json({ success: true, message: "User registered, but failed to send verification email. Please contact support." });
    }

    return NextResponse.json({ success: true, message: "User registered. Please check your email to verify." });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
