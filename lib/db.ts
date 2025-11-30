import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ Please define MONGODB_URI in .env.local");
}

declare global {
  // This allows us to add custom globals in TypeScript
  // and prevents duplicate connection instances in dev mode.
  // eslint-disable-next-line no-var
  var _mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

if (!global._mongoose) {
  global._mongoose = { conn: null, promise: null };
}

export default async function dbConnect(): Promise<Mongoose> {
  if (global._mongoose!.conn) {
    return global._mongoose!.conn as Mongoose;
  }

  if (!global._mongoose!.promise) {
    global._mongoose!.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "droneverse", // IMPORTANT — must match the DB name in Atlas
      })
      .then((mongoose) => {
        console.log("✅ MongoDB Connected");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        throw err;
      });
  }

  global._mongoose!.conn = await global._mongoose!.promise;
  return global._mongoose!.conn as Mongoose;
}
