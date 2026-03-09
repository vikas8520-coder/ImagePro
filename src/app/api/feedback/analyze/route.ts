import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";

interface AnalysisResult {
  summary: string;
  topIssues: string[];
  topRequests: string[];
  sentiment: { positive: number; neutral: number; negative: number };
  recommendations: string[];
}

const ANALYZE_SYSTEM = `You are a product analyst for ImagePro, a photo/video post preparation studio.
Analyze the feedback entries and respond with JSON:
{
  "summary": "2-3 sentence overall summary",
  "topIssues": ["top 3 bugs/problems reported"],
  "topRequests": ["top 3 feature requests"],
  "sentiment": { "positive": N, "neutral": N, "negative": N },
  "recommendations": ["3 actionable recommendations for the dev team"]
}`;

export async function GET() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });

    const sql = neon(url);
    const rows = await sql`SELECT type, message, rating, priority, sentiment, component, created_at FROM feedback ORDER BY created_at DESC LIMIT 50`;

    if (rows.length === 0) {
      return NextResponse.json({ analysis: null, message: "No feedback to analyze" });
    }

    const feedbackText = rows.map((r, i) =>
      `${i + 1}. [${r.type}] ${r.message} (rating: ${r.rating}, priority: ${r.priority || "unset"}, sentiment: ${r.sentiment || "unknown"})`
    ).join("\n");

    const { data, model, provider } = await aiJSON<AnalysisResult>(
      `Analyze these ${rows.length} feedback entries:\n\n${feedbackText}`,
      ANALYZE_SYSTEM
    );

    return NextResponse.json({
      analysis: data,
      feedbackCount: rows.length,
      ai: { model, provider },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
