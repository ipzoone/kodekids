// Proxy untuk development: meneruskan panggilan API ke gateway EdgeOne (8088).
// xfwd tidak diaktifkan agar header X-Forwarded-* tidak terduplikasi
// (runtime node-function EdgeOne error jika X-Forwarded-Proto berisi "http,http").
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const opts = {
    target: "http://localhost:8088",
    changeOrigin: false,
    xfwd: false,
  };
  app.use("/api", createProxyMiddleware(opts));
  app.use("/runner", createProxyMiddleware(opts));
  app.use("/auth", createProxyMiddleware(opts));
};
