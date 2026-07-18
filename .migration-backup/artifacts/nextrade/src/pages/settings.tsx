import { useEffect, useState } from "react";
import {
  useGetCurrentUser,
  useGetSelectedManager,
  useGetWallets,
  useUpdateOwnProfile,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ShieldCheck, Mail, MapPin, Wallet, ArrowRight, CreditCard, KeyRound, Loader2, Lock } from "lucide-react";
import { format } from "date-fns";

async function apiPost(path: string, body: Record<string, string>) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

async function apiPatch(path: string, body: Record<string, string>) {
  const res = await fetch(`/api${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

async function apiDelete(path: string, body: Record<string, string>) {
  const res = await fetch(`/api${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function SecurityCard() {
  const { toast } = useToast();

  const [cpForm, setCpForm] = useState({ current: "", next: "", confirm: "" });
  const [pinForm, setPinForm] = useState({ pin: "", confirm: "", password: "" });
  const [rmPinPw, setRmPinPw] = useState("");
  const [cpOpen, setCpOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const pinStatus = useQuery({
    queryKey: ["/api/auth/pin/status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/pin/status", { credentials: "include" });
      return res.json() as Promise<{ pinEnabled: boolean }>;
    },
  });
  const qc = useQueryClient();

  const changePw = useMutation({
    mutationFn: () => apiPatch("/auth/password", { currentPassword: cpForm.current, newPassword: cpForm.next }),
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your password has been updated." });
      setCpForm({ current: "", next: "", confirm: "" });
      setCpOpen(false);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const setupPin = useMutation({
    mutationFn: () => apiPost("/auth/pin/setup", { pin: pinForm.pin, currentPassword: pinForm.password }),
    onSuccess: () => {
      toast({ title: "PIN set up", description: "Your login PIN is now active." });
      setPinForm({ pin: "", confirm: "", password: "" });
      setPinOpen(false);
      qc.invalidateQueries({ queryKey: ["/api/auth/pin/status"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const removePin = useMutation({
    mutationFn: () => apiDelete("/auth/pin", { currentPassword: rmPinPw }),
    onSuccess: () => {
      toast({ title: "PIN removed" });
      setRmPinPw("");
      qc.invalidateQueries({ queryKey: ["/api/auth/pin/status"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const pinEnabled = pinStatus.data?.pinEnabled ?? false;
  const cpMismatch = cpForm.confirm.length > 0 && cpForm.next !== cpForm.confirm;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-between items-center text-sm">
          <span>Two-Factor Auth (OTP)</span>
          <Badge variant="outline">Enabled</Badge>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Withdrawal Whitelist</span>
          <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
        </div>

        <hr className="border-border" />

        {/* Change Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-2"><KeyRound className="h-3.5 w-3.5" /> Change Password</span>
            <Button variant="outline" size="sm" onClick={() => setCpOpen((v) => !v)}>
              {cpOpen ? "Cancel" : "Change"}
            </Button>
          </div>
          {cpOpen && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">Current password</Label>
                <Input type="password" value={cpForm.current} onChange={(e) => setCpForm((f) => ({ ...f, current: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New password</Label>
                <Input type="password" value={cpForm.next} onChange={(e) => setCpForm((f) => ({ ...f, next: e.target.value }))} minLength={8} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Confirm new password</Label>
                <Input type="password" value={cpForm.confirm} onChange={(e) => setCpForm((f) => ({ ...f, confirm: e.target.value }))} className={cpMismatch ? "border-destructive" : ""} />
                {cpMismatch && <p className="text-destructive text-xs">Passwords don't match.</p>}
              </div>
              <Button size="sm" className="w-full" disabled={changePw.isPending || cpMismatch || !cpForm.current || !cpForm.next || !cpForm.confirm} onClick={() => changePw.mutate()}>
                {changePw.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Update password
              </Button>
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* Login PIN */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Login PIN
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">4–8 digit numeric PIN for extra security</p>
            </div>
            <div className="flex gap-2 items-center">
              {pinStatus.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                <Badge variant="outline" className={pinEnabled ? "text-green-600 border-green-600" : "text-muted-foreground"}>
                  {pinEnabled ? "Active" : "Not set"}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setPinOpen((v) => !v)}>
                {pinOpen ? "Cancel" : pinEnabled ? "Manage" : "Set up"}
              </Button>
            </div>
          </div>
          {pinOpen && (
            <div className="space-y-3 pt-1">
              {!pinEnabled ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">New PIN (4–8 digits)</Label>
                    <Input type="password" inputMode="numeric" pattern="\d{4,8}" maxLength={8} value={pinForm.pin} onChange={(e) => setPinForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))} placeholder="e.g. 1234" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Confirm PIN</Label>
                    <Input type="password" inputMode="numeric" maxLength={8} value={pinForm.confirm} onChange={(e) => setPinForm((f) => ({ ...f, confirm: e.target.value.replace(/\D/g, "") }))} />
                    {pinForm.confirm.length > 0 && pinForm.pin !== pinForm.confirm && <p className="text-destructive text-xs">PINs don't match.</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Current password (required)</Label>
                    <Input type="password" value={pinForm.password} onChange={(e) => setPinForm((f) => ({ ...f, password: e.target.value }))} />
                  </div>
                  <Button size="sm" className="w-full" disabled={setupPin.isPending || pinForm.pin.length < 4 || pinForm.pin !== pinForm.confirm || !pinForm.password} onClick={() => setupPin.mutate()}>
                    {setupPin.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    Activate PIN
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Enter your password to remove the PIN.</p>
                  <Input type="password" placeholder="Current password" value={rmPinPw} onChange={(e) => setRmPinPw(e.target.value)} />
                  <Button variant="destructive" size="sm" className="w-full" disabled={removePin.isPending || !rmPinPw} onClick={() => removePin.mutate()}>
                    {removePin.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    Remove PIN
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Settings() {
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: managerRes, isLoading: isLoadingManager } = useGetSelectedManager();
  const { data: wallets, isLoading: isLoadingWallets } = useGetWallets();
  const updateProfile = useUpdateOwnProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [moonpayEmail, setMoonpayEmail] = useState("");
  useEffect(() => {
    setMoonpayEmail(user?.moonpayEmail ?? "");
  }, [user?.moonpayEmail]);

  const handleSaveMoonpayEmail = async () => {
    const trimmed = moonpayEmail.trim();
    const payload = trimmed.length === 0 ? null : trimmed;
    if (payload && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload)) {
      toast({
        title: "Invalid email",
        description: "Enter a valid email address or leave blank to clear.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateProfile.mutateAsync({ data: { moonpayEmail: payload } });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({
        title: "MoonPay email saved",
        description: payload
          ? `Buy Crypto checkouts will pre-fill ${payload}.`
          : "MoonPay email cleared.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update MoonPay email.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and platform preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingUser ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-2xl">{user?.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-2xl font-bold">{user?.fullName}</h3>
                      <p className="text-muted-foreground">@{user?.username}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {user?.kycVerified ? (
                          <Badge variant="outline" className="text-success border-success bg-success/10"><ShieldCheck className="h-3 w-3 mr-1" /> KYC Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning bg-warning/10">KYC Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</div>
                      <div className="font-medium">{user?.email}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Country</div>
                      <div className="font-medium">{user?.country}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Member Since</div>
                      <div className="font-medium">{user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : '-'}</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-moonpay-email">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> MoonPay Checkout Email
              </CardTitle>
              <CardDescription>
                Optional: pre-fill this email when launching the
                MoonPay-hosted Buy Crypto flow. Leave blank to use your
                account email each time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingUser ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="moonpay-email">MoonPay email</Label>
                    <Input
                      id="moonpay-email"
                      type="email"
                      placeholder="you@example.com"
                      value={moonpayEmail}
                      onChange={(e) => setMoonpayEmail(e.target.value)}
                      data-testid="input-moonpay-email"
                    />
                    <p className="text-xs text-muted-foreground">
                      Account email on file: {user?.email}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveMoonpayEmail}
                      disabled={
                        updateProfile.isPending ||
                        (moonpayEmail.trim() === (user?.moonpayEmail ?? ""))
                      }
                      data-testid="button-save-moonpay-email"
                    >
                      {updateProfile.isPending ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Wallets</CardTitle>
              <CardDescription>Accounts linked to your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWallets ? (
                <Skeleton className="h-20 w-full" />
              ) : wallets?.length === 0 ? (
                <p className="text-muted-foreground">No wallets connected.</p>
              ) : (
                <div className="space-y-4">
                  {wallets?.map(w => (
                    <div key={w.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium capitalize">{w.label} <Badge variant="secondary" className="ml-2 text-[10px]">{w.type}</Badge></div>
                          <div className="text-xs text-muted-foreground font-mono">{w.address.slice(0,6)}...{w.address.slice(-4)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{w.balance.toLocaleString()} {w.currency}</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/wallets" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                      Manage wallets <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Social Manager</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingManager ? (
                <Skeleton className="h-32 w-full" />
              ) : managerRes?.manager ? (
                <div className="space-y-4 text-center">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={managerRes.manager.avatarUrl} />
                    <AvatarFallback>{managerRes.manager.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">{managerRes.manager.name}</h4>
                    <p className="text-sm text-muted-foreground">{managerRes.manager.title}</p>
                  </div>
                  <Link href="/managers" className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Change Manager
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-4">No account manager selected for copy trading.</p>
                  <Link href="/managers" className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Browse Managers
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <SecurityCard />
        </div>
      </div>
    </div>
  );
}
