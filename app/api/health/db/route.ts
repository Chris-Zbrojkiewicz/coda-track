import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("select now() as now");

    return NextResponse.json({
      status: "ok",
      db: "connected",
      time: result.rows[0]?.now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        error: message,
      },
      { status: 500 }
    );
  }
}
