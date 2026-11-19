import { useState, type FormEvent } from "react";
import { authClient, authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "closed" | "sign-in" | "sign-up";

const MIN_PASSWORD_LENGTH = 8;
const HEADING = "mt-4 mb-2 px-1 text-xs font-medium tracking-wide text-subtle uppercase";

// Email-and-password account panel. Lives in the sidebar and the mobile menu.
// Every button that must NOT close the mobile menu carries data-keep-open.
export function AccountPanel() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<Mode>("closed");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!authEnabled) return null;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const trimmedEmail = email.trim();
    if (mode === "sign-up" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ email: trimmedEmail, password, name: name.trim() })
          : await authClient.signIn.email({ email: trimmedEmail, password });
      if (result.error) {
        setError(result.error.message || "Something went wrong. Please try again.");
        return;
      }
      setName("");
      setPassword("");
      setMode("closed");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    setBusy(true);
    try {
      await signOut();
    } catch {
      setError("Couldn't sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  let body;
  if (isPending) {
    body = <p className="px-1 text-xs text-subtle">Checking sign-in…</p>;
  } else if (user) {
    body = (
      <div className="rounded-md border border-border p-3">
        <p className="text-xs text-subtle">Signed in as</p>
        <p className="mt-0.5 text-sm font-medium break-words">{user.displayName ?? user.primaryEmail}</p>
        {user.displayName && user.primaryEmail ? (
          <p className="text-xs text-muted break-all">{user.primaryEmail}</p>
        ) : null}
        <p className="mt-2 text-[11px] leading-relaxed text-subtle">
          Saving your results to your account isn't switched on yet — your progress still clears when you reload.
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-status-red">
            {error}
          </p>
        ) : null}
        <Button type="button" variant="ghost" size="sm" className="mt-2" disabled={busy} onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    );
  } else if (mode === "closed") {
    body = (
      <Button type="button" variant="secondary" size="sm" data-keep-open onClick={() => switchMode("sign-in")}>
        Sign in or create account
      </Button>
    );
  } else {
    const creating = mode === "sign-up";
    body = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-border p-3" noValidate>
        <p className="text-sm font-medium">{creating ? "Create your account" : "Sign in"}</p>
        {creating ? (
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
          />
        ) : null}
        <Input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          autoComplete={creating ? "new-password" : "current-password"}
        />
        {creating ? <p className="text-[11px] text-subtle">At least {MIN_PASSWORD_LENGTH} characters.</p> : null}
        {error ? (
          <p role="alert" className="text-xs text-status-red">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={busy} data-keep-open>
          {busy ? "Please wait…" : creating ? "Create account" : "Sign in"}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-keep-open
            onClick={() => switchMode(creating ? "sign-in" : "sign-up")}
          >
            {creating ? "I already have an account" : "Create an account"}
          </Button>
          <Button type="button" variant="ghost" size="sm" data-keep-open onClick={() => switchMode("closed")}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <p className={HEADING}>Account</p>
      {body}
    </>
  );
}
