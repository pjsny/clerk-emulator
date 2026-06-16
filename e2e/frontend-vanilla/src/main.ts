import { Clerk } from "@clerk/clerk-js";

// Vanilla clerk-js demo. Drives the SignIn/SignUp resources on clerk.client
// directly (no React) and exposes the same data-testids as the React apps so
// the shared Playwright suite runs unchanged.
//
// The forms node is built once and detached/reattached (never recreated) so the
// inputs keep their values across clerk state changes — clerk-react keeps
// controlled inputs in React state; here we own the DOM. Only one panel (forms
// or signed-in) is ever in the document, so the suite's `pw-submit, sign-out`
// .first() selector resolves unambiguously.
const publishableKey = "pk_test_ZW11bGF0ZS5leGFtcGxlLmNvbSQ";
const clerk = new Clerk(publishableKey, { proxyUrl: "/__clerk" });
const app = document.getElementById("app")!;
app.innerHTML = "<h1>Clerk Emulator — Vanilla JS</h1>";

const forms = document.createElement("div");
forms.innerHTML = `
  <div id="pw-block">
    <input data-testid="pw-email" id="pw-email" value="alice@example.com" />
    <input data-testid="pw-password" id="pw-password" type="password" value="alice123" />
    <button data-testid="pw-submit" id="pw-submit" type="button">Sign In</button>
  </div>
  <div id="mfa-block" hidden>
    <input data-testid="mfa-code" id="mfa-code" placeholder="TOTP" />
    <button data-testid="mfa-submit" id="mfa-submit" type="button">Verify</button>
  </div>
  <div id="otp-block">
    <input data-testid="otp-email" id="otp-email" value="alice@example.com" />
    <button data-testid="otp-send" id="otp-send" type="button">Send code</button>
  </div>
  <div id="otp-code-block" hidden>
    <input data-testid="otp-code" id="otp-code" placeholder="code" />
    <button data-testid="otp-verify" id="otp-verify" type="button">Verify</button>
  </div>
  <div id="su-block">
    <button data-testid="su-create" id="su-create" type="button">Create account</button>
  </div>
  <div id="su-code-block" hidden>
    <input data-testid="su-code" id="su-code" placeholder="code" />
    <button data-testid="su-verify" id="su-verify" type="button">Verify</button>
  </div>
  <p id="err" style="color:red"></p>`;
app.appendChild(forms);

const q = (sel: string) => forms.querySelector(sel) as HTMLElement;
const val = (sel: string) => (forms.querySelector(sel) as HTMLInputElement).value;
const show = (sel: string, on: boolean) => void (q(sel).hidden = !on);
const showErr = (e: any) => void (q("#err").textContent = e?.errors?.[0]?.message ?? e?.message ?? String(e));
const signIn = () => (clerk as any).client.signIn;
const signUp = () => (clerk as any).client.signUp;
const activate = async (res: any) => {
  if (res?.status === "complete") await clerk.setActive({ session: res.createdSessionId });
};

let signedEl: HTMLElement | null = null;
function sync() {
  const user = clerk.user as any;
  if (user) {
    if (forms.parentNode) forms.remove();
    if (!signedEl) {
      signedEl = document.createElement("div");
      signedEl.innerHTML = `
        <h3 data-testid="signed-in">Signed In</h3>
        <p id="who"></p>
        <div data-testid="org-list" id="org"></div>
        <button data-testid="sign-out" id="sign-out" type="button">Sign Out</button>`;
      signedEl.querySelector("#sign-out")!.addEventListener("click", () => void clerk.signOut());
      app.appendChild(signedEl);
    }
    signedEl.querySelector("#who")!.textContent = `${user.firstName ?? ""} ${user.lastName ?? ""}`;
    const memberships = user.organizationMemberships ?? [];
    signedEl.querySelector("#org")!.textContent = memberships.map((m: any) => `${m.organization?.name} — ${m.role}`).join(", ");
  } else {
    if (signedEl) {
      signedEl.remove();
      signedEl = null;
    }
    if (!forms.parentNode) app.appendChild(forms);
  }
}

const guard = (fn: () => Promise<void>) => async () => {
  try {
    await fn();
  } catch (e) {
    showErr(e);
  }
};

q("#pw-submit").addEventListener(
  "click",
  guard(async () => {
    let res = await signIn().create({ identifier: val("#pw-email"), strategy: "password", password: val("#pw-password") });
    if (res.status === "needs_first_factor") res = await signIn().attemptFirstFactor({ strategy: "password", password: val("#pw-password") });
    if (res.status === "needs_second_factor") {
      show("#pw-block", false);
      show("#mfa-block", true);
      return;
    }
    await activate(res);
  }),
);
q("#mfa-submit").addEventListener(
  "click",
  guard(async () => activate(await signIn().attemptSecondFactor({ strategy: "totp", code: val("#mfa-code") }))),
);
q("#otp-send").addEventListener(
  "click",
  guard(async () => {
    const si = await signIn().create({ identifier: val("#otp-email") });
    const factor = si.supportedFirstFactors?.find((f: any) => f.strategy === "email_code");
    await signIn().prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
    show("#otp-block", false);
    show("#otp-code-block", true);
  }),
);
q("#otp-verify").addEventListener(
  "click",
  guard(async () => activate(await signIn().attemptFirstFactor({ strategy: "email_code", code: val("#otp-code") }))),
);
q("#su-create").addEventListener(
  "click",
  guard(async () => {
    await signUp().create({ emailAddress: `new-${Math.floor(Math.random() * 1e9)}@example.com`, password: "newpass123" });
    await signUp().prepareEmailAddressVerification({ strategy: "email_code" });
    show("#su-block", false);
    show("#su-code-block", true);
  }),
);
q("#su-verify").addEventListener(
  "click",
  guard(async () => activate(await signUp().attemptEmailAddressVerification({ code: val("#su-code") }))),
);

// No-op router so clerk never navigates the page on sign-in/out. Default
// clerk-js navigates to afterSignOutUrl ("/"), which reloads and would reset our
// hand-managed DOM (and any value the test just typed). React keeps inputs in
// component state and is unaffected; here we suppress the navigation instead.
const noop = async () => {};
await clerk.load({ routerPush: noop, routerReplace: noop });
sync();
clerk.addListener(() => sync());
