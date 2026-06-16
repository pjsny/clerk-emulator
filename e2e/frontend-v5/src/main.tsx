import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

// Non-secret test values for the emulator. pk_test_ encodes "emulate.example.com$".
// proxyUrl must be relative — clerk-js forces https on absolute proxy URLs, so we
// use /__clerk and let Vite forward it to the emulator (see vite.config.ts).
const publishableKey = "pk_test_ZW11bGF0ZS5leGFtcGxlLmNvbSQ";
const proxyUrl = "/__clerk";
// Pin a full clerk-js version so the bundle URL is exact rather than the `@5`
// range (jsDelivr serves ranges via a 301 redirect chain).
const clerkJSVersion = import.meta.env.VITE_CLERK_JS_VERSION ?? "5.125.13";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} proxyUrl={proxyUrl} clerkJSVersion={clerkJSVersion}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);
