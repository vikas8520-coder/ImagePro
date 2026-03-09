import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";

interface TriageResult {
  type: "bug" | "feature" | "general";
  priority: "P0" | "P1" | "P2" | "P3";
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  response: string;
  component: string;
}

const TRIAGE_SYSTEM = `You are a feedback triage agent for ImagePro, a photo/video post preparation studio.
ImagePro features: media import, grid/list views, crop tool (1:1, 4:5, 16:9, 9:16), captions, hashtags, post types, batch editing, ZIP export, drag-to-reorder, timeline view, calendar filter.

Classify user feedback and respond with JSON:
{
  "type": "bug" | "feature" | "general",
  "priority": "P0" (critical/blocking) | "P1" (important) | "P2" (nice to have) | "P3" (low),
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "1-line summary of the feedback",
  "response": "Friendly response acknowledging the feedback (2-3 sentences)",
  "component": "which part of the app this relates to (e.g. crop, import, export, grid, editor, sidebar, timeline)"
}`;

export async function POST(req: NextRequest) {
  try {
    const { message, feedbackId } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const { data, model, provider } = await aiJSON<TriageResult>(
      `Triage this feedback:\n\n"${message}"`,
      TRIAGE_SYSTEM
    );

    // Update feedback row with triage data if feedbackId provided
    if (feedbackId) {
      const url = process.env.DATABASE_URL;
      if (url) {
        const sql = neon(url);
        await sql`
          UPDATE feedback SET
            type = ${data.type},
            priority = ${data.priority},
            sentiment = ${data.sentiment},
            ai_response = ${data.response},
            ai_summary = ${data.summary},
            component = ${data.component},
            status = 'triaged'
          WHERE id = ${feedbackId}
        `;
      }
    }

    return NextResponse.json({
      triage: data,
      ai: { model, provider },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Triage failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
