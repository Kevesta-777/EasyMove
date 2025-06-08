import { createServer as createViteServer } from "vite";
import type { Express } from "express";
import type { Server } from "http";

export async function setupSimpleVite(app: Express, server: Server) {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: './client',
      build: {
        outDir: '../dist/public',
      },
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    // Fallback for SPA
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      
      try {
        const url = req.originalUrl;
        const template = await vite.transformIndexHtml(url, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EasyMove</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    console.log("Vite dev server configured");
  } catch (error) {
    console.error("Failed to setup Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  // Production static file serving - simplified
  app.use('/', (req, res) => {
    res.send('Production mode - static files would be served here');
  });
}