import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2, Lock } from "lucide-react";

function useTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("token");
}

async function doReset(payload: {
  token: string;
  newPassword: string;
}): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Reset failed.");
  return data;
}

export function ResetPassword() {
  const token = useTokenFromUrl();
  const [, navigate] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: doReset,
    onSuccess: () => {
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) return;
    if (!token) return;
    mutation.mutate({ token, newPassword });
  };

  const mismatch = confirm.length > 0 && newPassword !== confirm;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="bg-slate-800/60 border-slate-700 shadow-2xl backdrop-blur w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <p className="text-red-400">Invalid or missing reset token.</p>
            <Link href="/forgot-password" className="text-green-400 hover:underline text-sm">
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {done ? "Password reset!" : "Set a new password"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              {done
                ? "Redirecting you to login…"
                : "Choose a strong password for your account."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <p className="text-slate-300 text-sm text-center">
                  Your password has been updated successfully.
                </p>
                <Link href="/login" className="text-green-400 hover:underline text-sm">
                  Go to login now
                </Link>
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
                  <Label htmlFor="newPassword" className="text-slate-300">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type={showPw ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                      className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-slate-300">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500 ${mismatch ? "border-red-500" : ""}`}
                  />
                  {mismatch && (
                    <p className="text-red-400 text-xs">Passwords do not match.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold"
                  disabled={mutation.isPending || mismatch || !newPassword || !confirm}
                >
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating…</>
                  ) : (
                    "Set new password"
                  )}
                </Button>
              </form>
            )}

            {!done && (
              <div className="flex justify-center pt-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-green-400 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
