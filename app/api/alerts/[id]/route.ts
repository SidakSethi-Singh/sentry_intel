import { NextResponse } from "next/server";
import { getAlertById, DatabaseError } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0 || !/^[a-zA-Z0-9_\-\.]+$/.test(id)) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "Malformed or invalid alert ID" } },
        { status: 400 }
      );
    }

    const alert = await getAlertById(id);
    if (!alert) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Alert not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(alert);
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
