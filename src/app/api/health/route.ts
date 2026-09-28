import { NextResponse } from "next/server";
import { isDemoAuthEnabled, isDemoMode, usesPersistentDatabase } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/config/app-url";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    demoMode: isDemoMode(),
    demoAuth: isDemoAuthEnabled(),
    supabaseConfigured: isSupabaseConfigured(),
    persistentDatabase: usesPersistentDatabase(),
  });
}
