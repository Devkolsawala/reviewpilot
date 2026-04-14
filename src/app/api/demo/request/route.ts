import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";

const NOTIFY_EMAIL = "dev.kolsawala45@gmail.com";

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, company, message } = body;

  if (!firstName || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const result = await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New Demo Request — ${fullName} from ${company || "unknown company"}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="background:#0d9488;padding:16px 24px;border-radius:6px 6px 0 0;margin:-24px -24px 24px -24px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">New Demo Request · ReviewPilot</h2>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Name</td>
            <td style="padding:8px 0;font-size:14px;font-weight:600;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td>
            <td style="padding:8px 0;font-size:14px;">
              <a href="mailto:${email}" style="color:#0d9488;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Company</td>
            <td style="padding:8px 0;font-size:14px;">${company || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;vertical-align:top;">Message</td>
            <td style="padding:8px 0;font-size:14px;">${message ? message.replace(/\n/g, "<br/>") : "—"}</td>
          </tr>
        </table>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
          Submitted via reviewpilot.co.in/demo
        </div>
      </div>
    `,
  });

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
