import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "vikas8520-coder/ImagePro";

export async function POST(req: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
    }

    const { feedbackId, type, priority, summary, message, component, sentiment } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Build labels
    const labels: string[] = [];
    if (type === "bug") labels.push("bug");
    else if (type === "feature") labels.push("enhancement");
    else labels.push("feedback");

    if (priority) labels.push(priority);
    if (component) labels.push(`component:${component}`);

    // Build issue body
    const title = summary || `[${(type || "feedback").toUpperCase()}] ${message.slice(0, 60)}`;
    const body = [
      `## Feedback`,
      ``,
      message,
      ``,
      `---`,
      `| Field | Value |`,
      `|-------|-------|`,
      `| Type | ${type || "general"} |`,
      `| Priority | ${priority || "unset"} |`,
      `| Sentiment | ${sentiment || "unknown"} |`,
      `| Component | ${component || "unknown"} |`,
      ``,
      `_Auto-created by ImagePro feedback agent_`,
    ].join("\n");

    // Create GitHub issue
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `GitHub API: ${err}` }, { status: res.status });
    }

    const issue = await res.json();

    // Update feedback row with GitHub issue URL
    if (feedbackId) {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        const sql = neon(dbUrl);
        await sql`
          UPDATE feedback SET
            github_issue_url = ${issue.html_url},
            status = 'tracked'
          WHERE id = ${feedbackId}
        `;
      }
    }

    return NextResponse.json({
      issue: {
        number: issue.number,
        url: issue.html_url,
        title: issue.title,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create issue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
