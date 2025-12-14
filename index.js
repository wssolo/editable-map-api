export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 读取数据
    if (request.method === "GET") {
      const data = await env.MAP_DATA.get("markers");
      return new Response(data || "[]", {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 新增标记
    if (request.method === "POST") {
      const body = await request.json();
      const oldData = await env.MAP_DATA.get("markers");
      const list = oldData ? JSON.parse(oldData) : [];

      list.push({
        lat: body.lat,
        lng: body.lng,
        text: body.text
      });

      await env.MAP_DATA.put("markers", JSON.stringify(list));

      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response("Not allowed", { status: 405 });
  }
};
