import { NextResponse } from "next/server";

export const DB_UNAVAILABLE = "The database is temporarily unavailable. Please try again in a moment.";

// Runs a DB-backed route handler and turns database failures into a friendly 503.
export async function withDb(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (e) {
    console.error("Database error:", e);
    return NextResponse.json({ error: DB_UNAVAILABLE }, { status: 503 });
  }
}

// Server-component helper: returns null instead of throwing when the DB is down.
export async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error("Database error:", e);
    return null;
  }
}
