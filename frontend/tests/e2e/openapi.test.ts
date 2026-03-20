import { expect, test } from "@playwright/test";

test("GET /api/openapi returns valid OpenAPI 3.1 spec", async ({ request }) => {
  const res = await request.get("/api/openapi");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");

  const spec = await res.json();
  expect(spec.openapi).toMatch(/^3\.1\./);
  expect(spec.info.title).toBe("Job Search Tracker Extension API");
  expect(spec.paths["/extension/signin"]).toBeDefined();
  expect(spec.paths["/extension/refresh"]).toBeDefined();
  expect(spec.paths["/extension/track"]).toBeDefined();
});

test("GET /api/docs returns Scalar HTML", async ({ request }) => {
  const res = await request.get("/api/docs");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/html");

  const html = await res.text();
  expect(html).toContain("@scalar/api-reference");
  expect(html).toContain("/api/openapi");
});
