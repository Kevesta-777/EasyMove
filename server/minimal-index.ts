import express from "express";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { setupSimpleVite, serveStatic } from "./simple-vite";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

async function startServer() {
  try {
    console.log("Starting EasyMove server...");
    
    const httpServer = await registerRoutes(app);
    
    // Setup Vite dev server or static files
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupSimpleVite(app, httpServer);
    }
    
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`EasyMove server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();