import { createFileRoute } from "@tanstack/react-router";
import { openApiSpec } from "@/lib/openapi/spec";

export const Route = createFileRoute("/api/openapi")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(openApiSpec), {
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
