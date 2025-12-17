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
      /* ========== 工具函数 ========== */

      async function loadState() {
        let raw = await env.MAP_DATA.get("map");
        if (!raw) {
          const init = {
            version: 1,
            spots: [],
            invalids: []
          };
          await env.MAP_DATA.put("map", JSON.stringify(init));
          return init;
        }

        let data = JSON.parse(raw);

        // 自动补字段（防止老数据炸）
        if (typeof data.version !== "number") data.version = 1;
        if (!Array.isArray(data.spots)) data.spots = [];
        if (!Array.isArray(data.invalids)) data.invalids = [];

        // invalid 旧结构迁移（lat/lng → geo）
        data.invalids = data.invalids.map(inv => {
          if (inv.geo) return inv;
          if (typeof inv.lat === "number" && typeof inv.lng === "number") {
            return {
              id: inv.id || crypto.randomUUID(),
              geo: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: [inv.lng, inv.lat]
                }
              },
              createdAt: inv.createdAt || Date.now()
            };
          }
          return inv;
        });

        return data;
      }

      async function saveState(state) {
        await env.MAP_DATA.put("map", JSON.stringify(state));
      }

      /* ========== 获取全部数据 ========== */
      if (request.method === "GET" && url.pathname === "/") {
        const state = await loadState();
        return new Response(JSON.stringify(state), { headers });
      }

      /* ========== 保存数据（带版本冲突检测） ========== */
      if (request.method === "POST" && url.pathname === "/save") {
        const body = await request.json();
        const current = await loadState();

        if (
          typeof body.version !== "number" ||
          body.version < current.version
        ) {
          return new Response(
            JSON.stringify({ error: "version_conflict" }),
            { status: 409, headers }
          );
        }

        body.version = current.version + 1;
        await saveState(body);

        return new Response(
          JSON.stringify({ ok: true, version: body.version }),
          { headers }
        );
      }

      /* ========== 图片上传（R2 可选） ========== */
      if (request.method === "POST" && url.pathname === "/upload") {
        if (!env.PHOTO_BUCKET) {
          return new Response(
            JSON.stringify({ error: "R2_not_configured" }),
            { status: 501, headers }
          );
        }

        const form = await request.formData();
        const file = form.get("file");

        if (!file || !["image/jpeg", "image/png"].includes(file.type)) {
          return new Response(
            JSON.stringify({ error: "invalid_file" }),
            { status: 400, headers }
          );
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

      /* ========== 图片访问 ========== */
      if (request.method === "GET" && url.pathname.startsWith("/photo/")) {
        if (!env.PHOTO_BUCKET) {
          return new Response("R2 not configured", { status: 501, headers });
        }

        const key = url.pathname.replace("/photo/", "");
        const obj = await env.PHOTO_BUCKET.get(key);
        if (!obj) return new Response("Not found", { status: 404, headers });

        return new Response(obj.body, {
          headers: {
            "Content-Type": obj.httpMetadata.contentType,
            "Cache-Control": "public, max-age=31536000"
          }
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
