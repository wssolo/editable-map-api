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

    const url = new URL(request.url);

    try {
      // 获取全部数据
      if (request.method === "GET" && url.pathname === "/") {
        let raw = await env.MAP_DATA.get("map");
        if (!raw) {
          raw = JSON.stringify({
            version: 1,
            spots: [],
            invalids: []
          });
          await env.MAP_DATA.put("map", raw);
        }
        return new Response(raw, { headers });
      }

      // 保存数据（带版本）
      if (request.method === "POST" && url.pathname === "/save") {
        const body = await request.json();
        const current = JSON.parse(await env.MAP_DATA.get("map"));

        if (body.version < current.version) {
          return new Response(
            JSON.stringify({ error: "version_conflict" }),
            { status: 409, headers }
          );
        }

        body.version = current.version + 1;
        await env.MAP_DATA.put("map", JSON.stringify(body));

        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // 图片上传
      if (request.method === "POST" && url.pathname === "/upload") {
        const form = await request.formData();
        const file = form.get("file");

        if (!file || !["image/jpeg", "image/png"].includes(file.type)) {
          return new Response("Invalid file", { status: 400, headers });
        }

        const key = `${Date.now()}-${crypto.randomUUID()}`;
        await env.PHOTO_BUCKET.put(key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        return new Response(
          JSON.stringify({ url: `/photo/${key}` }),
          { headers }
        );
      }

      // 图片访问
      if (request.method === "GET" && url.pathname.startsWith("/photo/")) {
        const key = url.pathname.replace("/photo/", "");
        const obj = await env.PHOTO_BUCKET.get(key);
        if (!obj) return new Response("Not found", { status: 404 });

        return new Response(obj.body, {
          headers: { "Content-Type": obj.httpMetadata.contentType }
        });
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
