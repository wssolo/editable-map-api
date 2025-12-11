export default {
  async fetch(request) {
    const url = new URL(request.url);
    const key = "markers"; // 用 KV 模拟数据库（免费）

    if (url.pathname === "/markers") {
      if (request.method === "GET") {
        let data = await MY_KV.get(key);
        const markers = data ? JSON.parse(data) : [];
        return new Response(JSON.stringify(markers), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      if (request.method === "POST") {
        const body = await request.json();
        let markers = [];
        const existing = await MY_KV.get(key);
        if (existing) markers = JSON.parse(existing);
        markers.push({ lat: body.lat, lng: body.lng });
        await MY_KV.put(key, JSON.stringify(markers));
        return new Response("OK", { status: 200 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
