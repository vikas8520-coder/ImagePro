import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

// Auto-create table on first request
async function ensureTable(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      rating INTEGER DEFAULT 0,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// GET — fetch all feedback
export async function GET() {
  try {
    const sql = getDb();
    await ensureTable(sql);
    const rows = await sql`SELECT * FROM feedback ORDER BY created_at DESC`;
    return NextResponse.json({ feedback: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — submit new feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, rating } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const validTypes = ["bug", "feature", "general"];
    const feedbackType = validTypes.includes(type) ? type : "general";
    const feedbackRating = typeof rating === "number" && rating >= 0 && rating <= 5 ? rating : 0;
    const userAgent = req.headers.get("user-agent") || "";

    const sql = getDb();
    await ensureTable(sql);

    const rows = await sql`
      INSERT INTO feedback (type, message, rating, user_agent)
      VALUES (${feedbackType}, ${message.trim()}, ${feedbackRating}, ${userAgent})
      RETURNING *
    `;

    return NextResponse.json({ feedback: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — delete feedback by id
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM feedback WHERE id = ${parseInt(id)}`;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
