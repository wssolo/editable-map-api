export default {
  async fetch(request) {
    return new Response("editable-map-api 已上线！", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
