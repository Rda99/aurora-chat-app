import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import the server handler
import("./dist/server/index.js")
  .then((m) => {
    // Determine the actual handler, TanStack typically exports the request handler directly or under .default.fetch
    const fetchHandler =
      typeof m.default === "function"
        ? m.default
        : m.default && m.default.fetch
          ? m.default.fetch
          : m.fetch;

    if (typeof fetchHandler !== "function") {
      throw new Error("Could not find a valid fetch handler in dist/server/index.js");
    }

    const port = process.env.PORT || 3000;

    const mimeTypes = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".wav": "audio/wav",
      ".mp4": "video/mp4",
      ".woff": "application/font-woff",
      ".ttf": "application/font-ttf",
      ".eot": "application/vnd.ms-fontobject",
      ".otf": "application/font-otf",
      ".wasm": "application/wasm",
    };

    createServer(async (req, res) => {
      try {
        // 1. Try to serve static files from dist/client
        if (req.url && req.method === "GET") {
          const urlPath = req.url.split("?")[0]; // Remove query params
          let filePath = join(__dirname, "dist", "client", urlPath);

          try {
            const stat = statSync(filePath);
            if (stat.isFile()) {
              const ext = String(filePath.match(/\.[^.]+$/)).toLowerCase();
              const contentType = mimeTypes[ext] || "application/octet-stream";

              res.writeHead(200, { "Content-Type": contentType });
              res.end(readFileSync(filePath));
              return;
            }
          } catch (e) {
            // File not found, fall through to SSR
          }
        }

        // 2. Convert Node.js IncomingMessage to web Fetch Request
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const url = `${protocol}://${req.headers.host}${req.url}`;

        const webReq = new Request(url, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
          duplex: "half",
        });

        // 3. Let TanStack handle it
        const webRes = await fetchHandler(webReq, process.env, {});

        res.statusCode = webRes.status;
        res.statusMessage = webRes.statusText;

        // Copy headers
        webRes.headers.forEach((value, key) => {
          if (key === "set-cookie") {
            const cookies = webRes.headers.getSetCookie();
            res.setHeader(key, cookies);
          } else {
            res.setHeader(key, value);
          }
        });

        if (webRes.body) {
          for await (const chunk of webRes.body) {
            res.write(chunk);
          }
        }
        res.end();
      } catch (error) {
        console.error("Server Error:", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to load server.js", err);
  });
