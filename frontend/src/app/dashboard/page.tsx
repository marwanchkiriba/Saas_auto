"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type DashboardData = {
  totalVehicles: number;
  statusBreakdown: { status: string; count: number }[];
  totals: {
    purchase: number;
    sale: number;
    cost: number;
    potentialMargin: number;
  };
  sales: {
    totalRevenue: number;
    totalCosts: number;
    totalMargin: number;
    history: { month: string; revenue: number; costs: number; margin: number }[];
  };
};

type MeResponse = { user: { email: string; name: string | null } };

// Financial chart config
const chartConfig = {
  ventes: {
    label: "Chiffre d'affaires",
    color: "hsl(142, 76%, 36%)",
  },
  couts: {
    label: "Coûts totaux",
    color: "hsl(0, 85%, 55%)",
  },
  marge: {
    label: "Marge réelle",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "day" | "week" | "month">("all");
  const [activeChart, setActiveChart] = useState<"ventes" | "couts" | "marge">("ventes");

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

  // Use real financial data from API
  const financialData = useMemo(() => {
    if (!data?.sales?.history) return [];

    // Format month names in French
    const monthNames: Record<string, string> = {
      "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr",
      "05": "Mai", "06": "Juin", "07": "Juil", "08": "Août",
      "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc"
    };

    return data.sales.history.map(h => ({
      month: monthNames[h.month.slice(5, 7)] || h.month,
      ventes: h.revenue / 100, // Convertir en euros
      couts: h.costs / 100,
      marge: h.margin / 100,
    }));
  }, [data]);

  const totals = useMemo(() => ({
    ventes: data?.sales?.totalRevenue ?? 0,
    couts: data?.sales?.totalCosts ?? 0,
    marge: data?.sales?.totalMargin ?? 0,
  }), [data]);

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

  const stockCount = data?.statusBreakdown?.filter(s => s.status !== "sold").reduce((acc, s) => acc + s.count, 0) ?? 0;

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
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as typeof period)}
        >
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Véhicules"
          value={stockCount.toString()}
          icon={<Car className="h-6 w-6" />}
          description="en stock / préparation"
        />
        <StatCard
          title="Valeur du parc"
          value={formatMoney(data?.totals.purchase ?? 0)}
          icon={<DollarSign className="h-6 w-6" />}
          description="investissement total"
        />
        <StatCard
          title="Coûts totaux"
          value={formatMoney(data?.totals.cost ?? 0)}
          icon={<Gauge className="h-6 w-6" />}
          description="achat + frais"
        />
        <StatCard
          title="Marge potentielle"
          value={formatMoney(data?.totals.potentialMargin ?? 0)}
          icon={<TrendingUp className="h-6 w-6" />}
          description="profit estimé"
          highlight
          positive={(data?.totals.potentialMargin ?? 0) > 0}
        />
      </div>

      {/* Financial Chart - Full Width */}
      <Card className="mb-8 py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-4">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full" />
              Performance Financière
            </CardTitle>
            <CardDescription>
              Évolution des ventes et coûts sur les derniers mois
            </CardDescription>
          </div>
          <div className="flex">
            {(["ventes", "couts", "marge"] as const).map((key) => (
              <button
                key={key}
                data-active={activeChart === key}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 transition-colors hover:bg-muted/30"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[key].label}
                </span>
                <span className={`text-lg leading-none font-bold sm:text-2xl ${key === "ventes" ? "text-green-500" :
                    key === "couts" ? "text-red-500" :
                      "text-blue-500"
                  }`}>
                  {formatMoney(totals[key])}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart
              data={financialData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} stroke="hsl(220, 10%, 20%)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="hsl(220, 10%, 55%)"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    labelFormatter={(value) => `Mois: ${value}`}
                  />
                }
              />
              <Bar
                dataKey={activeChart}
                fill={chartConfig[activeChart].color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Chart + Quick Actions Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Chart - Left */}
        {data?.statusBreakdown && data.statusBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full" />
                Répartition des véhicules
              </CardTitle>
              <CardDescription>
                Distribution par statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.statusBreakdown.map((s) => ({
                      name:
                        s.status === "stock"
                          ? "En stock"
                          : s.status === "preparation"
                            ? "Préparation"
                            : s.status === "sold"
                              ? "Vendu"
                              : s.status,
                      count: s.count,
                      status: s.status,
                    }))}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="hsl(220, 10%, 55%)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(220, 10%, 55%)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 15%, 10%)",
                        border: "1px solid hsl(220, 10%, 20%)",
                        borderRadius: "8px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                      cursor={{ fill: "hsla(220, 10%, 20%, 0.3)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {data.statusBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === "stock"
                              ? "hsl(142, 76%, 36%)"
                              : entry.status === "preparation"
                                ? "hsl(45, 93%, 47%)"
                                : entry.status === "sold"
                                  ? "hsl(221, 83%, 53%)"
                                  : "hsl(220, 10%, 40%)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-3">
                {data.statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        backgroundColor:
                          s.status === "stock"
                            ? "hsl(142, 76%, 36%)"
                            : s.status === "preparation"
                              ? "hsl(45, 93%, 47%)"
                              : s.status === "sold"
                                ? "hsl(221, 83%, 53%)"
                                : "hsl(220, 10%, 40%)",
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {s.status === "stock"
                        ? "En stock"
                        : s.status === "preparation"
                          ? "Préparation"
                          : s.status === "sold"
                            ? "Vendu"
                            : s.status}{" "}
                      ({s.count})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Right */}
        <div className="flex flex-col gap-4">
          <ActionCard
            title="Nouveau véhicule"
            description="Ajouter un véhicule au parc"
            icon={<PlusCircle className="h-6 w-6" />}
            href="/vehicles/new"
          />
          <ActionCard
            title="Gérer le stock"
            description="Voir et modifier les véhicules"
            icon={<Package className="h-6 w-6" />}
            href="/stock"
          />
          <ActionCard
            title="Consulter les archives"
            description="Historique des ventes"
            icon={<ArchiveIcon className="h-6 w-6" />}
            href="/archive"
          />
        </div>
      </div>
    </div>
  );
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="container mx-auto p-6 lg:p-8">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Erreur</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/login">Retour à la connexion</Link>
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
  highlight,
  positive,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <Card className={highlight ? (positive ? "border-green-500/30" : "border-red-500/30") : ""}>
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <p className={`text-3xl font-bold ${highlight ? (positive ? "text-green-500" : "text-red-500") : ""
              }`}>
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          </div>
          <div className={`p-3 rounded-xl ${highlight
            ? positive
              ? "bg-green-500/20 text-green-500"
              : "bg-red-500/20 text-red-500"
            : "bg-primary/20 text-primary"
            }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-glow cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">
              {icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
