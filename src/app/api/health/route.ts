import { NextResponse } from "next/server";
import { isDemoAuthEnabled, isDemoMode, usesPersistentDatabase } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    demoMode: isDemoMode(),
    demoAuth: isDemoAuthEnabled(),
    persistentDatabase: usesPersistentDatabase(),
  });
}
