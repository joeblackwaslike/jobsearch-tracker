import Anthropic from "@anthropic-ai/sdk";
import { createServerFn } from "@tanstack/react-start";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const approveTask = createServerFn({ method: "POST" })
  .inputValidator((input: { taskId: string }) => input)
  .handler(async ({ data: { taskId } }) => {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();
    if (fetchError) throw fetchError;

    if (task.status !== "awaiting_approval") {
      throw new Error(`Cannot approve task with status: ${task.status}`);
    }

    if (task.document_id) {
      await supabase
        .from("documents")
        .update({ status: "approved" as const })
        .eq("id", task.document_id)
        .eq("user_id", user.id);
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ status: "approved" as const })
      .eq("id", taskId)
      .select()
      .single();
    if (updateError) throw updateError;

    return updatedTask;
  });

export const terminateTask = createServerFn({ method: "POST" })
  .inputValidator((input: { taskId: string; reason: string }) => input)
  .handler(async ({ data: { taskId, reason } }) => {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update({
        status: "terminated" as const,
        termination_reason: reason,
      })
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw error;

    return updatedTask;
  });

export const refineDocument = createServerFn({ method: "POST" })
  .inputValidator((input: { taskId: string; feedback: string }) => input)
  .handler(async ({ data: { taskId, feedback } }) => {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();
    if (taskError) throw taskError;

    if (!task.document_id) {
      throw new Error("Task has no associated document");
    }

    await supabase
      .from("tasks")
      .update({ status: "running" as const })
      .eq("id", taskId);

    try {
      const { data: currentDoc, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", task.document_id)
        .single();
      if (docError) throw docError;

      const { data: application } = await supabase
        .from("applications")
        .select("*, company:companies(name)")
        .eq("id", task.application_id)
        .single();

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
          .eq("id", taskId);
        throw new Error("No Anthropic API key configured.");
      }

      const companyName = (application?.company as { name: string } | null)?.name ?? "Unknown";

      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You previously generated the following company research document for ${companyName}:\n\n${currentDoc.content}\n\nThe user has requested the following changes:\n\n${feedback}\n\nPlease generate a revised version of the document incorporating the feedback. Keep the same markdown structure and improve the content based on the feedback.`,
          },
        ],
      });

      const revisedContent = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n\n");

      const revisionNumber = currentDoc.revision
        ? `v${Number.parseInt(currentDoc.revision.replace("v", ""), 10) + 1}`
        : "v2";

      const { data: newDoc, error: newDocError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          name: currentDoc.name,
          type: currentDoc.type,
          content: revisedContent,
          source: "ai_generated" as const,
          status: "draft" as const,
          parent_id: currentDoc.id,
          revision: revisionNumber,
          tags: currentDoc.tags as string[],
        })
        .select()
        .single();
      if (newDocError) throw newDocError;

      const taskMeta =
        typeof task.metadata === "object" && task.metadata !== null
          ? (task.metadata as Record<string, unknown>)
          : {};

      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update({
          status: "awaiting_approval" as const,
          document_id: newDoc.id,
          metadata: {
            ...taskMeta,
            revision_count: ((taskMeta.revision_count as number) ?? 0) + 1,
            last_feedback: feedback,
          },
        })
        .eq("id", taskId)
        .select()
        .single();
      if (updateError) throw updateError;

      return updatedTask;
    } catch (error) {
      const isBlocked = error instanceof Error && error.message.includes("No Anthropic API key");

      if (!isBlocked) {
        const taskMeta =
          typeof task.metadata === "object" && task.metadata !== null
            ? (task.metadata as Record<string, unknown>)
            : {};

        await supabase
          .from("tasks")
          .update({
            status: "failed" as const,
            metadata: {
              ...taskMeta,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          })
          .eq("id", taskId);
      }

      throw error;
    }
  });
