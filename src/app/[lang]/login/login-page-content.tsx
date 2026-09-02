"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser, UserRole } from "@/hooks/use-current-user";
import { useTranslation } from "@/hooks/use-translation";

export default function LoginPageContent() {
  const dict = useTranslation();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const router = useRouter();
  const { login } = useCurrentUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Safe access with type assertion and fallbacks
  const loginData = (dict as any)?.login;
  const title = loginData?.title || "Sign In";
  const description =
    loginData?.description || "Welcome back! Please sign in to your account.";
  const emailLabel = loginData?.email || "Email";
  const passwordLabel = loginData?.password || "Password";
  const signInButton = loginData?.signIn || "Sign In";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Login successful
      login(data.user);
      router.push(`/${lang}/dashboard`);

    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetSent(true);
    } catch {
      setError("Unable to process the request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Building className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Card>
          <CardHeader />
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your email and we will send a password reset link.</p>
                <Label htmlFor="reset-email">{emailLabel}</Label>
                <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                {resetSent && <p className="text-sm text-green-700">If an account exists for that email, a reset link has been sent.</p>}
                {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Sending..." : "Send reset link"}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setShowForgotPassword(false); setResetSent(false); setError(""); }}>Back to sign in</Button>
              </form>
            ) : <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{passwordLabel}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="button" className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setShowForgotPassword(true); setError(""); }}>
                Forgot password?
              </button>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : signInButton}
              </Button>
            </form>}
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>Demo credentials:</p>
              <p>Email: admin@example.com</p>
              <p>Password: admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
