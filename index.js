export default {
  async fetch(req, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (req.method === "GET") {
      const data = await env.MAP_DATA.get("map");
      return new Response(data || "[]", {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    if (req.method === "POST") {
      const body = await req.text();
      await env.MAP_DATA.put("map", body);
      return new Response("ok", { headers });
    }

    return new Response("Not allowed", { status: 405, headers });
  }
};
