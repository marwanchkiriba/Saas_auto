"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiFetch, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal,
  Upload,
  ArrowLeft,
  Car,
  Gauge,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Receipt,
  ImagePlus,
  Plus,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  purchasePrice: number;
  salePrice: number | null;
  mileage: number;
  status: string;
  mainPhotoUrl: string | null;
  costs: {
    id: string;
    label: string;
    amount: number;
    category: string;
    incurredAt: string;
  }[];
  photos: { id: string; url: string; position: number }[];
  totalCost: number;
  margin: number | null;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showCostForm, setShowCostForm] = useState(false);
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costCategory, setCostCategory] = useState("repair");
  const [addingCost, setAddingCost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const id = params?.id as string;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const data = await apiFetch<{ vehicle: Vehicle }>(`/api/vehicles/${id}`);
        setVehicle(data.vehicle);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function updateStatus(status: string) {
    if (!vehicle) return;
    let salePriceValue = vehicle.salePrice;
    if (status === "sold" && salePriceValue == null) {
      const input = window.prompt("Prix de vente (en euros) ?");
      if (!input) return;
      const parsed = Number(input);
      if (Number.isNaN(parsed) || parsed <= 0) {
        setError("Prix de vente invalide");
        return;
      }
      salePriceValue = Math.round(parsed * 100);
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          salePrice: salePriceValue ?? undefined,
        }),
      });
      const refreshed = await apiFetch<{ vehicle: Vehicle }>(
        `/api/vehicles/${vehicle.id}`
      );
      setVehicle(refreshed.vehicle);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhotos(fileList: FileList) {
    const formData = new FormData();
    Array.from(fileList).forEach((file) => formData.append("files", file));
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("saas_auto_token") || ""
            }`,
        },
        body: formData,
      }
    );
    if (!res.ok) throw new Error("Upload échoué");
    const data = await res.json();
    return data.urls as string[];
  }

  async function addPhotos(fileList: FileList) {
    if (!vehicle) return;
    setAddingPhotos(true);
    setError(null);
    try {
      const urls = await uploadPhotos(fileList);
      const merged = [...vehicle.photos.map((p) => p.url), ...urls];
      await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({
          photos: merged,
          mainPhotoUrl: vehicle.mainPhotoUrl || urls[0],
        }),
      });
      const refreshed = await apiFetch<{ vehicle: Vehicle }>(
        `/api/vehicles/${vehicle.id}`
      );
      setVehicle(refreshed.vehicle);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAddingPhotos(false);
    }
  }

  async function deleteVehicle() {
    if (!vehicle) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule?"))
      return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      router.push("/stock");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addCost() {
    if (!vehicle || !costLabel.trim() || !costAmount) return;
    const amount = Math.round(parseFloat(costAmount) * 100);
    if (isNaN(amount) || amount <= 0) {
      setError("Montant invalide");
      return;
    }
    setAddingCost(true);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}/costs`, {
        method: "POST",
        body: JSON.stringify({
          label: costLabel.trim(),
          amount,
          category: costCategory,
          incurredAt: new Date().toISOString(),
        }),
      });
      const refreshed = await apiFetch<{ vehicle: Vehicle }>(
        `/api/vehicles/${vehicle.id}`
      );
      setVehicle(refreshed.vehicle);
      setShowCostForm(false);
      setCostLabel("");
      setCostAmount("");
      setCostCategory("repair");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAddingCost(false);
    }
  }

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

  if (error || !vehicle) {
    return (
      <div className="container mx-auto p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error ?? "Véhicule introuvable"}</p>
            <Button asChild>
              <Link href="/stock">Retour au stock</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-lg">
            <Link href={vehicle.status === "sold" ? "/archive" : "/stock"}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={vehicle.status} />
              <span className="text-muted-foreground">
                {vehicle.year} • {vehicle.mileage.toLocaleString("fr-FR")} km
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`http://localhost:4000/api/export/${vehicle.id}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline">Export PDF</Button>
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
              {vehicle.status !== "stock" && (
                <DropdownMenuItem
                  onClick={() => updateStatus("stock")}
                  disabled={saving}
                >
                  ✓ Mettre en stock
                </DropdownMenuItem>
              )}
              {vehicle.status !== "preparation" && (
                <DropdownMenuItem
                  onClick={() => updateStatus("preparation")}
                  disabled={saving}
                >
                  🔧 Mettre en préparation
                </DropdownMenuItem>
              )}
              {vehicle.status !== "sold" && (
                <DropdownMenuItem
                  onClick={() => updateStatus("sold")}
                  disabled={saving}
                >
                  💰 Marquer vendu
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={deleteVehicle}
                disabled={saving}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Photo Gallery */}
          {(vehicle.mainPhotoUrl || vehicle.photos.length > 0) && (
            <div className="space-y-3">
              {/* Main Image */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-secondary/30">
                <Image
                  src={selectedPhoto || vehicle.mainPhotoUrl || vehicle.photos[0]?.url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover transition-all duration-300"
                />
                {/* Navigation arrows for multiple photos */}
                {vehicle.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const currentUrl = selectedPhoto || vehicle.mainPhotoUrl || vehicle.photos[0]?.url;
                        const allUrls = vehicle.photos.map(p => p.url);
                        const currentIndex = allUrls.indexOf(currentUrl);
                        const prevIndex = currentIndex <= 0 ? allUrls.length - 1 : currentIndex - 1;
                        setSelectedPhoto(allUrls[prevIndex]);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                      style={{ opacity: 0.7 }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const currentUrl = selectedPhoto || vehicle.mainPhotoUrl || vehicle.photos[0]?.url;
                        const allUrls = vehicle.photos.map(p => p.url);
                        const currentIndex = allUrls.indexOf(currentUrl);
                        const nextIndex = currentIndex >= allUrls.length - 1 ? 0 : currentIndex + 1;
                        setSelectedPhoto(allUrls[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full transition-all"
                      style={{ opacity: 0.7 }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnails + Upload Button */}
              <div className="flex gap-2 items-center">
                <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                  {vehicle.photos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPhoto(p.url)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${(selectedPhoto || vehicle.mainPhotoUrl) === p.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/50 hover:border-primary/50"
                        }`}
                    >
                      <Image
                        alt="Miniature"
                        src={p.url}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
                {/* Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    addPhotos(e.target.files);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={addingPhotos}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0 h-20 w-20 rounded-lg border-dashed border-2 hover:border-primary hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={addingPhotos}
                >
                  {addingPhotos ? (
                    <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox
              icon={<DollarSign className="h-4 w-4" />}
              label="Prix d'achat"
              value={formatMoney(vehicle.purchasePrice)}
            />
            <StatBox
              icon={<Tag className="h-4 w-4" />}
              label="Prix de vente"
              value={vehicle.salePrice != null ? formatMoney(vehicle.salePrice) : "—"}
            />
            <StatBox
              icon={<Receipt className="h-4 w-4" />}
              label="Coût total"
              value={formatMoney(vehicle.totalCost)}
            />
            <StatBox
              icon={vehicle.margin != null && vehicle.margin >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              label="Marge"
              value={vehicle.margin != null ? formatMoney(vehicle.margin) : "—"}
              highlight={vehicle.margin != null}
              positive={vehicle.margin != null && vehicle.margin >= 0}
            />
          </div>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full" />
                Coûts
              </CardTitle>
              <div className="flex items-center gap-2">
                <CardDescription>
                  {vehicle.costs.length} coût{vehicle.costs.length !== 1 ? "s" : ""}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCostForm(!showCostForm)}
                >
                  {showCostForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Cost Form */}
              {showCostForm && (
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Libellé (ex: Vidange)"
                      value={costLabel}
                      onChange={(e) => setCostLabel(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Montant (€)"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value)}
                    />
                    <select
                      value={costCategory}
                      onChange={(e) => setCostCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="repair">Réparation</option>
                      <option value="parts">Pièces</option>
                      <option value="maintenance">Entretien</option>
                      <option value="administrative">Administratif</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCostForm(false);
                        setCostLabel("");
                        setCostAmount("");
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={addCost}
                      disabled={addingCost || !costLabel.trim() || !costAmount}
                    >
                      {addingCost ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Costs Table */}
              {vehicle.costs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.costs.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.label}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                            {c.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatMoney(c.amount)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(c.incurredAt).toLocaleDateString("fr-FR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : !showCostForm && (
                <div className="text-center py-8">
                  <Receipt className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucun coût enregistré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    stock: { bg: "bg-green-500/20", text: "text-green-500", label: "En stock" },
    preparation: { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "Préparation" },
    sold: { bg: "bg-blue-500/20", text: "text-blue-500", label: "Vendu" },
  };
  const c = config[status.toLowerCase()] || { bg: "bg-gray-500/20", text: "text-gray-500", label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.text.replace("text-", "bg-")}`} />
      {c.label}
    </span>
  );
}

function StatBox({
  icon,
  label,
  value,
  highlight,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${highlight
      ? positive
        ? "border-green-500/30 bg-green-500/5"
        : "border-red-500/30 bg-red-500/5"
      : "border-border/50 bg-secondary/30"
      }`}>
      <div className={`inline-flex p-2 rounded-lg mb-2 ${highlight
        ? positive
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500"
        : "bg-secondary text-muted-foreground"
        }`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold ${highlight
        ? positive
          ? "text-green-500"
          : "text-red-500"
        : ""
        }`}>{value}</p>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
