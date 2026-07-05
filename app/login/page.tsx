import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login"
};

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <Image src="/parareport-logo.svg" alt="" width={38} height={38} priority />
          <span>ParaReport</span>
        </div>
        <span className="intro-kicker">Operator access</span>
        <h1 id="login-title">Sign in to your civic workspace.</h1>
        <p>
          Continue to the ward dashboard, report queue, and department-ready civic packets.
        </p>

        <form className="login-form" action="/dashboard">
          <label className="field-label">
            Email
            <input type="email" name="email" placeholder="operator@parareport.local" autoComplete="email" />
          </label>
          <label className="field-label">
            Password
            <input type="password" name="password" placeholder="Enter password" autoComplete="current-password" />
          </label>
          <div className="login-options">
            <label>
              <input type="checkbox" name="remember" /> Keep me signed in
            </label>
            <Link href="/dashboard">Use demo access</Link>
          </div>
          <button type="submit" className="login-submit">
            Continue
          </button>
        </form>
      </section>

      <aside className="login-aside" aria-label="Workspace summary">
        <div className="login-signal">
          <span>Today</span>
          <strong>Drainage cluster detected</strong>
          <p>Three verified waterlogging reports share location, mode, and department routing.</p>
        </div>
        <div className="login-stack">
          <span>Complaint packet</span>
          <span>Bengali warning</span>
          <span>Ward dashboard</span>
        </div>
      </aside>
    </main>
  );
}
