import { useAuth, useUser, useClerk, useSignIn, useSignUp, useOrganizationList } from "@clerk/clerk-react";
import { useState } from "react";

// Core 2 (@clerk/clerk-react v5) demo. Uses the classic SignIn/SignUp API
// (create + attemptFirstFactor/attemptSecondFactor + setActive) rather than the
// v6 method-style API (signIn.password()). Same data-testids as the v6 app so
// the Playwright suite is shared.

const box: React.CSSProperties = { maxWidth: 420, border: "1px solid #ddd", borderRadius: 8, padding: 16, margin: "12px 0" };
const input: React.CSSProperties = { width: "100%", padding: 8, margin: "4px 0", boxSizing: "border-box" };

function useErr() {
  const [error, setError] = useState("");
  const show = (e: any) => setError(e?.errors?.[0]?.message ?? e?.message ?? String(e));
  return { error, setError, show };
}

// --- Password sign-in (+ MFA second factor) ---
function PasswordSignIn() {
  const { signIn } = useSignIn() as any;
  const { setActive } = useClerk() as any;
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("alice123");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [code, setCode] = useState("");
  const { error, setError, show } = useErr();

  const complete = async (res: any) => {
    if (res.status === "needs_second_factor") {
      setNeedsMfa(true);
      return;
    }
    if (res.status === "complete") await setActive({ session: res.createdSessionId });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      let res = await signIn.create({ identifier: email, strategy: "password", password });
      if (res.status === "needs_first_factor") res = await signIn.attemptFirstFactor({ strategy: "password", password });
      await complete(res);
    } catch (err) {
      show(err);
    }
  };

  const submitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await signIn.attemptSecondFactor({ strategy: "totp", code });
      await complete(res);
    } catch (err) {
      show(err);
    }
  };

  if (needsMfa) {
    return (
      <form style={box} onSubmit={submitMfa}>
        <h3>Two-factor (TOTP)</h3>
        <p>Enter your authenticator code (emulator: 424242)</p>
        <input style={input} placeholder="TOTP code" value={code} onChange={(e) => setCode(e.target.value)} data-testid="mfa-code" />
        <button type="submit" data-testid="mfa-submit">Verify</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    );
  }

  return (
    <form style={box} onSubmit={submit}>
      <h3>Password sign-in</h3>
      <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="pw-email" />
      <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="pw-password" />
      <button type="submit" data-testid="pw-submit">Sign In</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

// --- Email-code (OTP) sign-in ---
function EmailCodeSignIn() {
  const { signIn } = useSignIn() as any;
  const { setActive } = useClerk() as any;
  const [email, setEmail] = useState("alice@example.com");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const { error, setError, show } = useErr();

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const si = await signIn.create({ identifier: email });
      const factor = si.supportedFirstFactors?.find((f: any) => f.strategy === "email_code");
      await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
      setSent(true);
    } catch (err) {
      show(err);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (res.status === "complete") await setActive({ session: res.createdSessionId });
    } catch (err) {
      show(err);
    }
  };

  return (
    <form style={box} onSubmit={sent ? verify : send}>
      <h3>Email-code sign-in</h3>
      {!sent ? (
        <>
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="otp-email" />
          <button type="submit" data-testid="otp-send">Send code</button>
        </>
      ) : (
        <>
          <p>Code sent (emulator: 424242)</p>
          <input style={input} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} data-testid="otp-code" />
          <button type="submit" data-testid="otp-verify">Verify</button>
        </>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

// --- Sign-up ---
function SignUpForm() {
  const { signUp } = useSignUp() as any;
  const { setActive } = useClerk() as any;
  const [email, setEmail] = useState(`new-${Math.floor(Math.random() * 1e9)}@example.com`);
  const [password, setPassword] = useState("newpass123");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const { error, setError, show } = useErr();

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setSent(true);
    } catch (err) {
      show(err);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") await setActive({ session: res.createdSessionId });
    } catch (err) {
      show(err);
    }
  };

  return (
    <form style={box} onSubmit={sent ? verify : create}>
      <h3>Sign up</h3>
      {!sent ? (
        <>
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="su-email" />
          <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="su-password" />
          <button type="submit" data-testid="su-create">Create account</button>
        </>
      ) : (
        <>
          <p>Verify your email (emulator: 424242)</p>
          <input style={input} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} data-testid="su-code" />
          <button type="submit" data-testid="su-verify">Verify</button>
        </>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

function OrgMemberships() {
  const { userMemberships, isLoaded } = useOrganizationList({ userMemberships: true }) as any;
  if (!isLoaded) return <p>Loading orgs…</p>;
  const data = userMemberships?.data ?? [];
  return (
    <div data-testid="org-list">
      <h4>Organization memberships ({data.length})</h4>
      <ul>
        {data.map((m: any) => (
          <li key={m.id}>
            {m.organization.name} — {m.role}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserInfo() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { userId, orgId, orgRole } = useAuth();

  return (
    <div style={box}>
      <h3 data-testid="signed-in">Signed In</h3>
      <p>
        <strong>
          {user?.firstName} {user?.lastName}
        </strong>{" "}
        ({user?.primaryEmailAddress?.emailAddress})
      </p>
      <p>User: <code>{userId}</code></p>
      <p>Org: <code>{orgId ?? "none"}</code> {orgRole ?? ""}</p>
      <OrgMemberships />
      <button onClick={() => signOut()} data-testid="sign-out">Sign Out</button>
    </div>
  );
}

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p>Loading Clerk...</p>;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      <h1>Clerk Emulator — React Demo (Core 2 / v5)</h1>
      {isSignedIn ? (
        <UserInfo />
      ) : (
        <>
          <PasswordSignIn />
          <EmailCodeSignIn />
          <SignUpForm />
        </>
      )}
    </div>
  );
}

export default App;
