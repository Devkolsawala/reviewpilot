import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyConnection } from "@/lib/google/playstore";
import { checkUsageLimit } from "@/lib/usage";

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
    const { type, packageName, appName, connectionMethod, credentials } = body;
    // connectionMethod: 'invite_email' | 'own_service_account'

    // ── Google Business Profile stub ─────────────────────────────────────────
    if (type === "google_business") {
      return NextResponse.json({
        valid: true,
        reviewCount: 0,
        message:
          "Google Business Profile connection saved. OAuth verification happens at sync time.",
        stub: true,
      });
    }

    if (type !== "play_store" && !connectionMethod) {
      return NextResponse.json(
        { valid: false, error: "Only Play Store connections supported currently" },
        { status: 400 }
      );
    }

    // ── Package name validation ───────────────────────────────────────────────
    if (!packageName || !packageName.includes(".")) {
      return NextResponse.json({
        valid: false,
        error: "Invalid package name. It should look like com.example.myapp",
      });
    }

    // ── Own service account: validate JSON fields ─────────────────────────────
    if (connectionMethod === "own_service_account") {
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
    }

    // ── Verify connection (null creds = use shared env key) ───────────────────
    const userCreds =
      connectionMethod === "own_service_account" ? credentials : null;
    const result = await verifyConnection(packageName, userCreds);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error });
    }

    // ── Ensure profile exists ─────────────────────────────────────────────────
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

    // ── Connection limit check (new connections only) ─────────────────────────
    const { data: existingCheck } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("external_id", packageName)
      .single();

    if (!existingCheck) {
      const connCheck = await checkUsageLimit(user.id, "connections", supabase);
      if (!connCheck.allowed) {
        return NextResponse.json(
          {
            valid: false,
            error: `Your ${connCheck.planName} plan allows ${connCheck.limit} active connection(s). Upgrade to add more.`,
            upgradeNeeded: true,
          },
          { status: 429 }
        );
      }
    }

    // ── Upsert connection ─────────────────────────────────────────────────────
    let connectionId: string;

    const connectionData = {
      user_id: user.id,
      type: "play_store" as const,
      name: appName || packageName,
      external_id: packageName,
      // Store credentials ONLY if user brought their own.
      // NULL means the shared ReviewPilot service account is used.
      credentials:
        connectionMethod === "own_service_account" ? credentials : null,
      is_active: true,
    };

    if (existingCheck) {
      await supabase
        .from("connections")
        .update(connectionData)
        .eq("id", existingCheck.id);
      connectionId = existingCheck.id;
    } else {
      const { data: newConn, error: insertError } = await supabase
        .from("connections")
        .insert({
          ...connectionData,
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

    // ── Create default app context if missing ─────────────────────────────────
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
