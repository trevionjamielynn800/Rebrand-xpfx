import { useEffect } from "react";
import { Link } from "wouter";
import {
  useGetAdminStats,
  useGetAdminUsers,
  useGetAdminAlerts,
  useMarkAllAdminAlertsRead,
  getGetAdminAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  TrendingDown,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  const cls =
    severity === "critical"
      ? "bg-destructive/15 text-destructive"
      : severity === "warning"
        ? "bg-amber-500/15 text-amber-500"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${cls}`}>{severity}</span>
  );
}

export function DashboardPage() {
  // Live alert tray polls every 10s so newly-pushed admin alerts (signups,
  // KYC, withdrawal events, live-chat handoffs, suspicious flags, …) show
  // up without a manual refresh. Each alert is a deep-link to the most
  // relevant admin-portal page (defaults to /users/{userId}).
  const qc = useQueryClient();
  const { data: stats, isLoading } = useGetAdminStats();
  const { data: users } = useGetAdminUsers();
  const { data: alerts } = useGetAdminAlerts();
  // Poll the admin-alert stream every 10s so newly-pushed events
  // (signups, KYC, withdrawal requests, live-chat handoffs, …) appear
  // without a manual refresh. Implemented via setInterval+invalidate
  // instead of the generated hook's `refetchInterval` option because
  // the generated `query` option requires the full UseQueryOptions
  // shape (including `queryKey`).
  useEffect(() => {
    const t = setInterval(() => {
      qc.invalidateQueries({ queryKey: getGetAdminAlertsQueryKey() });
    }, 10_000);
    return () => clearInterval(t);
  }, [qc]);
  const markAllRead = useMarkAllAdminAlertsRead();

  const recent = (users ?? []).slice(0, 8);
  const unreadCount = (alerts ?? []).filter((a) => !a.read).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and key metrics</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={users?.length ?? 0} icon={Users} color="bg-primary/20 text-primary" />
          <StatCard label="Total Deposits" value={`$${((stats?.totalDeposits ?? 0) / 1000).toFixed(1)}k`} icon={TrendingUp} color="bg-green-500/20 text-green-400" />
          <StatCard label="Total Withdrawals" value={`$${((stats?.totalWithdrawals ?? 0) / 1000).toFixed(1)}k`} icon={TrendingDown} color="bg-blue-500/20 text-blue-400" />
          <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} icon={Clock} color="bg-yellow-500/20 text-yellow-400" />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending KYC" value={stats?.pendingKyc ?? 0} icon={ShieldCheck} color="bg-orange-500/20 text-orange-400" />
        <StatCard label="Active Trades" value={stats?.activeTrades ?? 0} icon={TrendingUp} color="bg-purple-500/20 text-purple-400" />
        <StatCard label="Unread Alerts" value={unreadCount} icon={AlertTriangle} color="bg-amber-500/20 text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section
          className="bg-card border border-card-border rounded-xl overflow-hidden lg:col-span-2"
          data-testid="dashboard-alert-tray"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Live admin alerts
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </h2>
            <button
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={unreadCount === 0 || markAllRead.isPending}
              onClick={async () => {
                await markAllRead.mutateAsync();
                qc.invalidateQueries({ queryKey: getGetAdminAlertsQueryKey() });
              }}
              data-testid="button-dashboard-mark-read"
            >
              Mark all read
            </button>
          </div>
          <ul className="divide-y divide-border max-h-96 overflow-y-auto">
            {(!alerts || alerts.length === 0) && (
              <li className="px-5 py-4 text-sm text-muted-foreground">No alerts yet.</li>
            )}
            {(alerts ?? []).slice(0, 30).map((a) => {
              const body = (
                <div className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityPill severity={a.severity} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {a.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
                    {a.userEmail && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {a.userEmail}
                      </p>
                    )}
                  </div>
                  {a.linkUrl && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </div>
              );
              return (
                <li
                  key={a.id}
                  className={a.read ? "opacity-60" : ""}
                  data-testid={`dashboard-alert-${a.kind}`}
                >
                  {a.linkUrl ? <Link href={a.linkUrl}>{body}</Link> : body}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Users</h2>
          </div>
          <div className="divide-y divide-border">
            {recent.map((u) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="px-5 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">${u.balance.toLocaleString()}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    u.kycStatus === "approved" ? "bg-green-500/20 text-green-400" :
                    u.kycStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {u.kycStatus}
                  </span>
                </div>
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No users yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
