// frontend/src/lib/extension/cors.ts
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function corsJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS })
}

export function corsOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
