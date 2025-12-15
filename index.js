export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
      // 1️⃣ 处理 CORS 预检请求（非常关键）
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // 2️⃣ GET：读取地图数据
      if (request.method === "GET") {
        const data = await env.MAP_DATA.get("map");
        return new Response(data || "[]", {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      // 3️⃣ POST：写入地图数据
      if (request.method === "POST") {
        const body = await request.text();
        await env.MAP_DATA.put("map", body);

        return new Response("ok", {
          status: 200,
          headers: corsHeaders,
        });
      }

      // 4️⃣ 其他方法
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });

    } catch (err) {
      // 🔥 防止 1101 的关键兜底
      return new Response(
        JSON.stringify({
          error: "Worker exception",
          message: err.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
