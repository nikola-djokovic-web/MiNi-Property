// src/app/register/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";

function RegisterContent() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const { login } = useCurrentUser();
  
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Enhanced debugging in useEffect to avoid SSR issues
  useEffect(() => {
    console.log("Registration page loaded");
    console.log("Current URL:", window.location.href);
    console.log("Search params:", sp.toString());
    console.log("Token from params:", token);
    console.log("All URL params:", Object.fromEntries(sp.entries()));
  }, [sp, token]);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/invites/verify?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Invite invalid or expired");
        setEmail(j.data.email);
      } catch (e: any) {
        setError(e?.message || "Invite invalid or expired");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const canSubmit = password.length >= 8 && password === confirm;

  const onSubmit = async () => {
    setError(null);
    try {
      const res = await fetch("/api/invites/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          name: name.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok)
        throw new Error(j?.error || "Failed to complete registration");
      
      // Auto-login the user
      if (j.user) {
        login(j.user);
        setOk(true);
        setTimeout(() => router.push(`/${lang}/dashboard`), 1200);
      } else {
        setOk(true);
        setTimeout(() => router.push(`/${lang}/login`), 1200);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to complete registration");
    }
  };

  if (loading) return <div className="p-6">Checking your invite…</div>;
  if (error) return <div className="p-6 text-destructive">Error: {error}</div>;
  if (ok)
    return (
      <div className="p-6 text-green-600">
        Registration complete! Logging you in...
      </div>
    );

  return (
    <div className="mx-auto max-w-md p-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">Finish registration</h1>
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div>
            <Label>Name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label>Password (min 8 chars)</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {password && confirm && password !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          <div className="pt-2">
            <Button onClick={onSubmit} disabled={!canSubmit}>
              Create account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
