import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from './App.tsx'
import './index.css'

// Non-secret test values for the emulator. pk_test_ encodes "emulate.example.com$".
// proxyUrl must be relative — clerk-js forces https:// on absolute proxy URLs, so we
// use /__clerk and let Vite forward it to the emulator (see vite.config.ts).
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? 'pk_test_ZW11bGF0ZS5leGFtcGxlLmNvbSQ'
const proxyUrl = import.meta.env.VITE_CLERK_PROXY_URL ?? '/__clerk'
// Pin a full clerk-js version so the bundle URL is exact (e.g. .../clerk-js@6.17.0/...)
// rather than the `@6` range, which jsDelivr serves via a 301 redirect chain.
const clerkJSVersion = import.meta.env.VITE_CLERK_JS_VERSION ?? '6.17.0'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} proxyUrl={proxyUrl} clerkJSVersion={clerkJSVersion}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
