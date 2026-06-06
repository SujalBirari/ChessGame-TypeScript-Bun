Bun.serve({
  port: 3000,

  fetch(req) {
    const url = new URL(req.url);

    const path =
      url.pathname === "/" ? "./dist/index.html" : `./dist${url.pathname}`;

    return new Response(Bun.file(path));
  },
});

console.log("Server running");
