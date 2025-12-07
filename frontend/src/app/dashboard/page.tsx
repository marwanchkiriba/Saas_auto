"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import {
  Car,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Package,
  Archive as ArchiveIcon,
  ArrowRight,
  Gauge,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type DashboardData = {
  totalVehicles: number;
  statusBreakdown: { status: string; count: number }[];
  totals: {
    purchase: number;
    sale: number;
    cost: number;
    potentialMargin: number;
  };
};

type MeResponse = { user: { email: string; name: string | null } };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "day" | "week" | "month">(
    "all"
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        setLoading(true);
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
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorFallback message={error} />;
  }

  return (
    <div className="container mx-auto p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, <span className="text-primary">{me?.name || "Utilisateur"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici un aperçu de votre parc automobile
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes périodes</SelectItem>
            <SelectItem value="day">Dernier jour</SelectItem>
            <SelectItem value="week">Dernière semaine</SelectItem>
            <SelectItem value="month">Dernier mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Véhicules"
          value={data?.statusBreakdown?.filter(s => s.status !== "sold").reduce((acc, s) => acc + s.count, 0) ?? 0}
          icon={<Car className="h-5 w-5" />}
          description="en stock / préparation"
          accent
        />
        <StatCard
          title="Valeur du parc"
          value={formatMoney(data?.totals.purchase ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          description="investissement total"
        />
        <StatCard
          title="Coûts totaux"
          value={formatMoney(data?.totals.cost ?? 0)}
          icon={<Gauge className="h-5 w-5" />}
          description="achat + frais"
        />
        <StatCard
          title="Marge potentielle"
          value={formatMoney(data?.totals.potentialMargin ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          description="profit estimé"
          positive={(data?.totals.potentialMargin ?? 0) > 0}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full" />
              Actions rapides
            </CardTitle>
            <CardDescription>
              Accédez rapidement aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <ActionCard
              href="/vehicles/new"
              icon={<PlusCircle className="h-6 w-6" />}
              title="Ajouter"
              description="Nouveau véhicule"
            />
            <ActionCard
              href="/stock"
              icon={<Package className="h-6 w-6" />}
              title="Stock"
              description="Voir les véhicules"
            />
            <ActionCard
              href="/archive"
              icon={<ArchiveIcon className="h-6 w-6" />}
              title="Archive"
              description="Véhicules vendus"
            />
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full" />
              Répartition
            </CardTitle>
            <CardDescription>Statuts des véhicules</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.statusBreakdown && data.statusBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(s.status)}`} />
                      <span className="capitalize font-medium">{translateStatus(s.status)}</span>
                    </div>
                    <span className="text-2xl font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun véhicule pour l'instant</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/vehicles/new">Ajouter un véhicule</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full" />
              Synthèse financière
            </CardTitle>
            <CardDescription>Résumé des coûts et ventes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Coûts totaux</p>
                  <p className="text-sm text-muted-foreground/70">achat + frais</p>
                </div>
                <p className="text-2xl font-bold">{formatMoney(data?.totals.cost ?? 0)}</p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground">Gains de ventes</p>
                  <p className="text-sm text-muted-foreground/70">revenus réalisés</p>
                </div>
                <p className="text-2xl font-bold text-primary">{formatMoney(data?.totals.sale ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ErrorFallback({ message }: { message: string | null }) {
  return (
    <div className="container mx-auto p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erreur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <Button asChild>
            <a href="/login">Revenir à la connexion</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  accent,
  positive,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  accent?: boolean;
  positive?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`p-2 rounded-lg ${accent ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {icon}
          </span>
        </div>
        <div className="space-y-1">
          <p className={`text-3xl font-bold ${positive ? "text-green-500" : ""}`}>{value}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-xs text-muted-foreground/70">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/30 transition-all duration-300"
    >
      <span className="p-3 rounded-full bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300">
        {icon}
      </span>
      <div className="text-center">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "stock":
      return "bg-green-500";
    case "preparation":
    case "préparation":
      return "bg-yellow-500";
    case "sold":
    case "vendu":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

function translateStatus(status: string) {
  switch (status.toLowerCase()) {
    case "stock":
      return "En stock";
    case "preparation":
      return "En préparation";
    case "sold":
      return "Vendu";
    default:
      return status;
  }
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
