import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

// NOTE: InterviewReminderEmail must be a standalone module importable in Deno.
// For now, inline a minimal version or import from a shared location.
// A full React-email render in Deno Edge Functions requires careful module resolution.
// Use a string template as fallback if JSX doesn't work in the edge runtime.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://thrive.app";

const TYPE_LABELS: Record<string, string> = {
  screening_interview: "Screening Interview",
  technical_interview: "Technical Interview",
  behavioral_interview: "Behavioral Interview",
  online_test: "Online Test",
  take_home: "Take Home",
  onsite: "Onsite Interview",
};

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  // Interviews scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: interviews, error } = await supabase
    .from("events")
    .select(`
      *,
      application:applications(
        id, position, status,
        company:companies(name),
        user_id
      )
    `)
    .gte("scheduled_at", tomorrowStart.toISOString())
    .lte("scheduled_at", tomorrowEnd.toISOString())
    .neq("application.status", "archived");

  if (error) {
    console.error("Error fetching interviews:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;

  for (const interview of (interviews ?? [])) {
    const app = interview.application;
    if (!app || app.status === "archived") continue;

    // Check user settings
    const { data: settings } = await supabase
      .from("user_settings")
      .select("email_reminders, notify_interview")
      .eq("user_id", app.user_id)
      .single();

    if (!settings?.email_reminders || !settings?.notify_interview) continue;

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(app.user_id);
    if (!user?.email) continue;

    const applicationUrl = `${APP_URL}/applications/${app.id}`;
    const scheduledAt = interview.scheduled_at
      ? new Date(interview.scheduled_at).toLocaleString("en-US", {
          weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
        })
      : "TBD";

    const emailHtml = `
      <h2>Interview Reminder</h2>
      <p>You have a ${TYPE_LABELS[interview.type] ?? interview.type} scheduled for tomorrow.</p>
      <ul>
        <li><strong>Company:</strong> ${app.company?.name ?? "Unknown"}</li>
        <li><strong>Role:</strong> ${app.position}</li>
        <li><strong>Time:</strong> ${scheduledAt}</li>
        ${interview.duration_minutes ? `<li><strong>Duration:</strong> ${interview.duration_minutes} minutes</li>` : ""}
      </ul>
      <p><a href="${applicationUrl}">View Application</a></p>
    `;

    await resend.emails.send({
      from: "THRIVE <reminders@thrive.app>",
      to: user.email,
      subject: `Interview tomorrow: ${app.position} at ${app.company?.name ?? "Unknown"}`,
      html: emailHtml,
    });

    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
