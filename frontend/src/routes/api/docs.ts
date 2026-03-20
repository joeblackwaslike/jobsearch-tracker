import { createFileRoute } from "@tanstack/react-router";

const HTML = `<!doctype html>
<html>
  <head>
    <title>Extension API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export const Route = createFileRoute("/api/docs")({
  server: {
    handlers: {
      GET: async () =>
        new Response(HTML, {
          headers: { "Content-Type": "text/html" },
        }),
    },
  },
});
