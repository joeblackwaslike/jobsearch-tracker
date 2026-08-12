import server from "../dist/server/server.js";

export default async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers.host;
  const url = `${proto}://${host}${req.url}`;

  // Collect request body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  // Build Web Fetch Request from Node's IncomingMessage
  const webReq = new Request(url, {
    method: req.method,
    headers: new Headers(
      Object.fromEntries(
        Object.entries(req.headers).flatMap(([k, v]) =>
          v == null ? [] : [[k, Array.isArray(v) ? v.join(", ") : v]],
        ),
      ),
    ),
    body: body.length > 0 ? body : undefined,
    ...(body.length > 0 ? { duplex: "half" } : {}),
  });

  const webRes = await server.fetch(webReq);

  res.statusCode = webRes.status;
  for (const [k, v] of webRes.headers.entries()) {
    res.setHeader(k, v);
  }

  if (webRes.body) {
    for await (const chunk of webRes.body) {
      res.write(chunk);
    }
  }
  res.end();
}

export const config = {
  maxDuration: 30,
};
