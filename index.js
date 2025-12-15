export default {
  async fetch(req, env) {
    if (req.method === "GET") {
      const data = await env.MAP_DATA.get("map");
      return new Response(data || "[]", {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    if (req.method === "POST") {
      const body = await req.text();
      await env.MAP_DATA.put("map", body);
      return new Response("ok", {
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response("Not allowed", { status: 405 });
  }
};
