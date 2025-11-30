"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { GlassCard } from "@/components/GlassCard";
import { QuickButton } from "@/components/QuickButton";
import { AreaChart, BarChart3, TrendingUp, PlusCircle, PackageSearch, Archive as ArchiveIcon } from "lucide-react";

type DashboardData = {
  totalVehicles: number;
  statusBreakdown: { status: string; count: number }[];
  totals: { purchase: number; sale: number; cost: number; potentialMargin: number };
};

type MeResponse = { user: { email: string; name: string | null } };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "day" | "week" | "month">("all");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const meResp = await apiFetch<MeResponse>("/api/me");
        const qs = period === "all" ? "" : `?period=${period}`;
        const dash = await apiFetch<DashboardData>(`/api/dashboard${qs}`);
        setMe(meResp.user);
        setData(dash);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, period]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorFallback message={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {me && (
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-600/10 to-slate-900 border border-slate-800 px-6 py-4 shadow-xl shadow-cyan-500/10">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Pilote connecté</p>
              <p className="text-xl font-semibold text-white">
                {me.name || "Compte"} · {me.email}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-300">Période</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="rounded-full border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm shadow-inner"
              >
                <option value="all">Toutes périodes</option>
                <option value="day">Dernier jour</option>
                <option value="week">Dernière semaine</option>
                <option value="month">Dernier mois</option>
              </select>
            </div>
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <Card title="Véhicules" value={data?.totalVehicles ?? 0} accent="from-cyan-400 to-blue-500" icon={<BarChart3 className="h-5 w-5 text-cyan-200" />} />
          <Card title="Valeur du parc auto" value={formatMoney(data?.totals.purchase ?? 0)} accent="from-emerald-400 to-teal-500" icon={<AreaChart className="h-5 w-5 text-emerald-200" />} />
          <Card title="Marge effectuée" value={formatMoney(data?.totals.potentialMargin ?? 0)} accent="from-pink-500 to-rose-500" icon={<TrendingUp className="h-5 w-5 text-rose-200" />} />
        </section>

        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Actions rapides</p>
              <h2 className="text-lg font-semibold text-white">Commandes principales</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>Période</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="rounded-full border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm shadow-inner"
              >
                <option value="all">Toutes</option>
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <QuickButton href="/vehicles/new" label="Ajouter un véhicule" icon={<PlusCircle className="h-4 w-4" />} />
            <QuickButton href="/stock" label="Voir le stock" icon={<PackageSearch className="h-4 w-4" />} />
            <QuickButton href="/archive" label="Archive vendus" icon={<ArchiveIcon className="h-4 w-4" />} />
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Répartition statuts</h2>
          </div>
          <StatusChart breakdown={data?.statusBreakdown ?? []} />
          <MiniBarChart breakdown={data?.statusBreakdown ?? []} />
        </GlassCard>

        <section className="grid gap-3 md:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Statuts</h2>
            <div className="space-y-3">
              {data?.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-slate-200">
                  <span className="capitalize">{s.status}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
              ))}
              {data?.statusBreakdown.length === 0 && (
                <p className="text-sm text-slate-400">Aucun véhicule pour l’instant.</p>
              )}
            </div>
          </GlassCard>
          <GlassCard className="p-5 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-4">Synthèse coûts / ventes</h2>
            <Item label="Coûts totaux (achat + frais)" value={formatMoney(data?.totals.cost ?? 0)} />
            <Item label="Gains de ventes" value={formatMoney(data?.totals.sale ?? 0)} />
          </GlassCard>
        </section>
      </main>
    </div>
  );
}

function ErrorFallback({ message }: { message: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
        <p className="text-red-600 font-medium">Erreur: {message}</p>
        <a href="/login" className="text-sm text-slate-700 underline">
          Revenir à la connexion
        </a>
      </div>
    </div>
  );
}

function Card({ title, value, accent, icon }: { title: string; value: string | number; accent: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-xl shadow-black/30 p-5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-300">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <div className={`h-1 w-full rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-200">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function StatusChart({ breakdown }: { breakdown: { status: string; count: number }[] }) {
  const total = breakdown.reduce((acc, b) => acc + b.count, 0);
  if (total === 0) {
    return <p className="text-sm text-slate-400">Aucune donnée.</p>;
  }
  return (
    <div className="space-y-3">
      {breakdown.map((b) => {
        const pct = total ? Math.round((b.count / total) * 100) : 0;
        return (
          <div key={b.status} className="space-y-1">
            <div className="flex items-center justify-between text-sm text-slate-200">
              <span className="capitalize">{b.status}</span>
              <span>
                {b.count} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniBarChart({ breakdown }: { breakdown: { status: string; count: number }[] }) {
  const max = breakdown.reduce((acc, b) => Math.max(acc, b.count), 0);
  const colors: Record<string, string> = {
    stock: "bg-blue-500",
    preparation: "bg-amber-500",
    sold: "bg-emerald-500",
  };
  if (breakdown.length === 0) return null;
  return (
    <div className="grid grid-cols-6 gap-2 items-end h-28">
      {breakdown.map((b) => {
        const height = max ? Math.max((b.count / max) * 100, 8) : 0;
        return (
          <div key={b.status} className="flex flex-col items-center gap-1">
            <div className={`w-full rounded-md ${colors[b.status] ?? "bg-slate-400"}`} style={{ height: `${height}%` }} />
            <span className="text-xs text-slate-300 capitalize">{b.status}</span>
          </div>
        );
      })}
    </div>
  );
}
