"use client";

import { FormEvent, Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const lang = usePathname().split("/")[1] || "en";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8 || password !== confirm) {
      setError(password.length < 8 ? "Password must be at least 8 characters" : "Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error || "Unable to reset password");
    setDone(true);
    setTimeout(() => router.push(`/${lang}/login`), 1500);
  }

  return <div className="min-h-screen flex items-center justify-center p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Reset password</CardTitle></CardHeader><CardContent>
    {done ? <p className="text-sm text-green-700">Password reset successfully. Redirecting to sign in...</p> : <form onSubmit={submit} className="space-y-4">
      <div><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <div><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={loading || !token}>{loading ? "Resetting..." : "Reset password"}</Button>
    </form>}
  </CardContent></Card></div>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Loading...</div>}><ResetPasswordForm /></Suspense>;
}