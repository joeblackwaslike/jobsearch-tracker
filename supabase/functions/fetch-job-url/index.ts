const BROWSERLESS_API_KEY = Deno.env.get("BROWSERLESS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!BROWSERLESS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BROWSERLESS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      `https://chrome.browserless.io/content?token=${BROWSERLESS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: `Browserless error: ${response.status}`, detail: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = await response.text();

    return new Response(
      JSON.stringify({ html }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
