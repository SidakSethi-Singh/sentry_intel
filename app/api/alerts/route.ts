import { NextResponse } from "next/server";
import { getCachedAlerts } from "@/lib/ask";

export async function GET() {
  try {
    const alerts = getCachedAlerts();
    return NextResponse.json(alerts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
