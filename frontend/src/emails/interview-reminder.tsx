import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InterviewReminderEmailProps {
  candidateName: string;
  companyName: string;
  position: string;
  interviewType: string;
  scheduledAt: string;
  durationMinutes?: number;
  interviewers?: string[];
  meetingUrl?: string;
  applicationUrl: string;
}

export function InterviewReminderEmail({
  candidateName,
  companyName,
  position,
  interviewType,
  scheduledAt,
  durationMinutes,
  interviewers,
  meetingUrl,
  applicationUrl,
}: InterviewReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Interview reminder: {interviewType} at {companyName} tomorrow</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", margin: "0 auto", padding: "24px", maxWidth: "600px" }}>
          <Heading style={{ fontSize: "24px", marginBottom: "8px" }}>
            Interview Reminder
          </Heading>
          <Text>Hi {candidateName},</Text>
          <Text>
            You have an interview scheduled for tomorrow. Here are the details:
          </Text>
          <Section style={{ backgroundColor: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <Text style={{ margin: "4px 0" }}><strong>Company:</strong> {companyName}</Text>
            <Text style={{ margin: "4px 0" }}><strong>Role:</strong> {position}</Text>
            <Text style={{ margin: "4px 0" }}><strong>Type:</strong> {interviewType}</Text>
            <Text style={{ margin: "4px 0" }}><strong>Time:</strong> {scheduledAt}</Text>
            {durationMinutes && (
              <Text style={{ margin: "4px 0" }}><strong>Duration:</strong> {durationMinutes} minutes</Text>
            )}
            {interviewers && interviewers.length > 0 && (
              <Text style={{ margin: "4px 0" }}><strong>Interviewers:</strong> {interviewers.join(", ")}</Text>
            )}
          </Section>
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Button
              href={applicationUrl}
              style={{ backgroundColor: "#000000", color: "#ffffff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none" }}
            >
              View Application
            </Button>
            {meetingUrl && (
              <>
                {" "}
                <Button
                  href={meetingUrl}
                  style={{ backgroundColor: "#ffffff", color: "#000000", padding: "12px 24px", borderRadius: "6px", border: "1px solid #000000", textDecoration: "none" }}
                >
                  Join Meeting
                </Button>
              </>
            )}
          </Section>
          <Hr />
          <Text style={{ color: "#888888", fontSize: "12px" }}>
            You're receiving this because you have email reminders enabled in THRIVE.
            You can update your preferences in Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
