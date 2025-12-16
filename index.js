export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      const url = new URL(request.url);

      // 读取数据
      if (request.method === "GET") {
        let data = await env.MAP_DATA.get("map");
        if (!data) {
          data = JSON.stringify({ spots: [], invalids: [] });
          await env.MAP_DATA.put("map", data);
        }
        return new Response(data, { headers });
      }

      // 保存数据
      if (request.method === "POST") {
        const body = await request.json();
        await env.MAP_DATA.put("map", JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      return new Response("Not Found", { status: 404, headers });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message }),
        { status: 500, headers }
      );
    }
  }
};
