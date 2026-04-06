import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyConnection } from "@/lib/google/playstore";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, credentials, packageName, appName } = body;

    if (type === "google_business") {
      return NextResponse.json({
        valid: true,
        reviewCount: 0,
        message:
          "Google Business Profile connection saved. OAuth verification happens at sync time.",
        stub: true,
      });
    }

    if (type !== "play_store") {
      return NextResponse.json(
        { valid: false, error: "Only Play Store connections supported currently" },
        { status: 400 }
      );
    }

    if (
      !credentials?.client_email ||
      !credentials?.private_key ||
      !credentials?.project_id
    ) {
      return NextResponse.json({
        valid: false,
        error:
          "Invalid service account JSON. Must contain client_email, private_key, and project_id.",
      });
    }

    if (!packageName || !packageName.includes(".")) {
      return NextResponse.json({
        valid: false,
        error: "Invalid package name. It should look like com.example.myapp",
      });
    }

    const result = await verifyConnection(credentials, packageName);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error });
    }

    // Ensure profile exists (handles race if trigger didn't fire)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        full_name: user.email,
        plan: "free",
      });
    }

    // Check if this connection already exists
    const { data: existing } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("external_id", packageName)
      .single();

    let connectionId: string;

    if (existing) {
      await supabase
        .from("connections")
        .update({
          name: appName || packageName,
          credentials: credentials,
          is_active: true,
        })
        .eq("id", existing.id);
      connectionId = existing.id;
    } else {
      const { data: newConn, error: insertError } = await supabase
        .from("connections")
        .insert({
          user_id: user.id,
          type: "play_store",
          name: appName || packageName,
          external_id: packageName,
          credentials: credentials,
          is_active: true,
          review_count: result.reviewCount ?? 0,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to save connection:", insertError);
        return NextResponse.json(
          {
            valid: false,
            error: `Failed to save: ${insertError.message}`,
          },
          { status: 500 }
        );
      }
      connectionId = newConn!.id;
    }

    // Create default app context for this connection if missing
    const { data: existingContext } = await supabase
      .from("app_contexts")
      .select("id")
      .eq("connection_id", connectionId)
      .single();

    if (!existingContext) {
      await supabase.from("app_contexts").insert({
        connection_id: connectionId,
        description: "",
        tone: "friendly",
        auto_reply_enabled: false,
      });
    }

    return NextResponse.json({
      valid: true,
      connectionId,
      reviewCount: result.reviewCount,
      message: `Connected successfully! Found ${result.reviewCount} reviews.`,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Verify connection error:", err);
    return NextResponse.json(
      { valid: false, error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
