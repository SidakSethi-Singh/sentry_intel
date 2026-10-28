import { NextResponse } from "next/server";
import { askSentry, generateMorningBrief } from "@/lib/ask";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { question, action } = body;

    if (action === "morning_brief") {
      const brief = await generateMorningBrief();
      return NextResponse.json(brief);
    }

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question query parameter is required." },
        { status: 400 }
      );
    }

    const result = await askSentry(question.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ask Sentry API error:", error);
    return NextResponse.json(
      { error: "Internal server error processing question." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query 'q'" }, { status: 400 });
  }

  const result = await askSentry(q);
  return NextResponse.json(result);
}
