import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    // Security: Don't reveal if user exists or not, but for this specific "resend verification" flow,
    // it's often helpful to know. However, standard practice is generic message.
    // But if user is already verified, we should probably tell them.
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Email is already verified. Please login." }, { status: 400 });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    return NextResponse.json({ success: true, message: "Verification email sent." });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
