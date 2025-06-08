import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/animations.css";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QuoteProvider } from "./contexts/QuoteContext";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" attribute="class">
      <QuoteProvider>
        <App />
      </QuoteProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
