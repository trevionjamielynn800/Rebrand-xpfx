import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    mutation.mutate(email.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">X</span>
            </div>
            <span className="text-white font-bold text-xl">XpressPro FX</span>
          </div>
        </div>

        <Card className="bg-slate-800/60 border-slate-700 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-white text-center">
              {sent ? "Check your email" : "Forgot password"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              {sent
                ? "A reset link has been sent if that address is registered."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {sent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="text-slate-300 text-sm text-center">
                    Check your inbox for a link to reset your password. The link expires in{" "}
                    <strong>30 minutes</strong>.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => { setSent(false); setEmail(""); mutation.reset(); }}
                >
                  Send another link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mutation.isError && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-400 text-sm">
                      {mutation.error instanceof Error
                        ? mutation.error.message
                        : "Something went wrong. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending…</>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}

            <div className="flex justify-center pt-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-green-400 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
