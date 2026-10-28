import { NextResponse } from "next/server";
import { getAlertStats, DatabaseError } from "@/lib/supabase";

export async function GET() {
  try {
    const stats = await getAlertStats();
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof DatabaseError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 500 }
      );
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
