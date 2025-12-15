export default {
  async fetch(req, env) {
    const url = new URL(req.url);

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
      const body = await req.json();

      // 上传照片
      if (body.imageBase64) {
        const buffer = Uint8Array.from(
          atob(body.imageBase64.split(",")[1]),
          c => c.charCodeAt(0)
        );
        const key = `photos/${crypto.randomUUID()}.jpg`;
        await env.PHOTO_BUCKET.put(key, buffer, {
          httpMetadata: { contentType: "image/jpeg" }
        });
        body.imageUrl = `/photo/${key}`;
        delete body.imageBase64;
      }

      await env.MAP_DATA.put("map", JSON.stringify(body.data));
      return new Response(JSON.stringify(body.imageUrl || null), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 读取照片
    if (url.pathname.startsWith("/photo/")) {
      const key = url.pathname.slice(1);
      const obj = await env.PHOTO_BUCKET.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, {
        headers: { "Content-Type": "image/jpeg" }
      });
    }

    return new Response("Not allowed", { status: 405 });
  }
};
