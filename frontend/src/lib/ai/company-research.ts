import Anthropic from "@anthropic-ai/sdk";
import { createServerFn } from "@tanstack/react-start";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const generateCompanyResearch = createServerFn({ method: "POST" })
  .inputValidator((input: { applicationId: string }) => input)
  .handler(async ({ data: { applicationId } }) => {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        application_id: applicationId,
        type: "company_research" as const,
        status: "pending" as const,
        payload: {},
        metadata: {},
      })
      .select()
      .single();
    if (taskError) throw taskError;

    try {
      await supabase
        .from("tasks")
        .update({ status: "running" as const })
        .eq("id", task.id);

      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*, company:companies(*)")
        .eq("id", applicationId)
        .single();
      if (appError) throw appError;

      const { data: settings } = await supabase
        .from("user_settings")
        .select("anthropic_api_key")
        .eq("user_id", user.id)
        .single();

      const apiKey = settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        await supabase
          .from("tasks")
          .update({ status: "blocked" as const })
          .eq("id", task.id);
        throw new Error("No Anthropic API key configured. Add one in Settings > AI.");
      }

      const company = application.company as {
        name: string;
        description?: string | null;
        industry?: string | null;
        size?: string | null;
        tech_stack?: string | null;
        culture?: string | null;
        founded?: string | null;
        locations?: string[] | null;
      };

      const prompt = buildResearchPrompt({
        companyName: company.name,
        companyDescription: company.description ?? undefined,
        companyIndustry: company.industry ?? undefined,
        companySize: company.size ?? undefined,
        companyTechStack: company.tech_stack ?? undefined,
        companyCulture: company.culture ?? undefined,
        companyFounded: company.founded ?? undefined,
        companyLocations: company.locations ?? undefined,
        position: application.position,
        jobDescription: application.job_description ?? undefined,
      });

      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const researchContent = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n\n");

      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          name: `Company Research: ${company.name}`,
          type: "company_research",
          content: researchContent,
          source: "ai_generated" as const,
          status: "draft" as const,
          tags: ["ai-generated", "company-research", company.name],
        })
        .select()
        .single();
      if (docError) throw docError;

      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update({
          status: "awaiting_approval" as const,
          document_id: document.id,
          payload: {
            company_name: company.name,
            position: application.position,
          },
        })
        .eq("id", task.id)
        .select()
        .single();
      if (updateError) throw updateError;

      return updatedTask;
    } catch (error) {
      const isBlocked = error instanceof Error && error.message.includes("No Anthropic API key");

      if (!isBlocked) {
        await supabase
          .from("tasks")
          .update({
            status: "failed" as const,
            metadata: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          })
          .eq("id", task.id);
      }

      throw error;
    }
  });

function buildResearchPrompt(context: {
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  companySize?: string;
  companyTechStack?: string;
  companyCulture?: string;
  companyFounded?: string;
  companyLocations?: string[];
  position: string;
  jobDescription?: string;
}): string {
  const parts = [
    `Generate a comprehensive company research document for **${context.companyName}** to prepare for a **${context.position}** role.`,
  ];

  if (context.companyDescription) {
    parts.push(`\nKnown company description: ${context.companyDescription}`);
  }
  if (context.companyIndustry) {
    parts.push(`Industry: ${context.companyIndustry}`);
  }
  if (context.companySize) {
    parts.push(`Company size: ${context.companySize}`);
  }
  if (context.companyTechStack) {
    parts.push(`Known tech stack: ${context.companyTechStack}`);
  }
  if (context.companyCulture) {
    parts.push(`Culture notes: ${context.companyCulture}`);
  }
  if (context.companyFounded) {
    parts.push(`Founded: ${context.companyFounded}`);
  }
  if (context.companyLocations?.length) {
    parts.push(`Locations: ${context.companyLocations.join(", ")}`);
  }
  if (context.jobDescription) {
    parts.push(`\nJob Description:\n${context.jobDescription}`);
  }

  parts.push(`
Please structure the research as markdown with these sections:

## Company Overview
Mission, products/services, funding stage, key metrics, and market position.

## Recent News & Developments
Notable recent events, product launches, partnerships, or press coverage.

## Technical Stack & Engineering Culture
Known technologies, engineering blog posts, open source contributions, development practices.

## Interview Preparation Tips
Common interview formats at this company, culture fit signals, questions to ask.

## Fit Analysis
How the candidate's background might align with this role and company, potential talking points, and areas to research further.

Use the provided context where available, and supplement with general knowledge. Mark any speculative information clearly. Write in a professional but approachable tone.`);

  return parts.join("\n");
}
