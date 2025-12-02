import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
    return NextResponse.json({ user: { _id: decoded.userId, name: decoded.name, email: decoded.email } });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
