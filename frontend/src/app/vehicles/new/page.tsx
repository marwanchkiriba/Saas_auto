"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Car,
  DollarSign,
  Gauge,
  Calendar,
  ImagePlus,
  X,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewVehiclePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    purchasePrice: "",
    mileage: "",
    salePrice: "",
    status: "stock",
    mainPhotoUrl: "",
    gallery: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadFiles(fileList: FileList) {
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: Number(form.year),
          purchasePrice: Math.round(Number(form.purchasePrice) * 100),
          mileage: Number(form.mileage),
          salePrice: form.salePrice
            ? Math.round(Number(form.salePrice) * 100)
            : undefined,
          status: form.status,
          mainPhotoUrl: form.mainPhotoUrl || uploadedUrls[0] || undefined,
          photos: uploadedUrls.length > 0
            ? uploadedUrls
            : form.gallery
              ? form.gallery
                .split("\\n")
                .map((u) => u.trim())
                .filter(Boolean)
              : [],
        }),
      });
      router.push("/stock");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function removePhoto(url: string) {
    setUploadedUrls((prev) => prev.filter((u) => u !== url));
    if (form.mainPhotoUrl === url) {
      setForm((f) => ({ ...f, mainPhotoUrl: "" }));
    }
  }

  return (
    <div className="container mx-auto p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="icon" className="rounded-lg">
          <Link href="/stock">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-lg bg-primary/20 text-primary">
              <Car className="h-6 w-6" />
            </span>
            Nouveau véhicule
          </h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un véhicule à votre parc
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full" />
                Informations du véhicule
              </CardTitle>
              <CardDescription>
                Renseignez les détails du véhicule
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Make & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Marque</Label>
                  <Input
                    id="make"
                    placeholder="Ex: BMW, Mercedes, Audi..."
                    required
                    value={form.make}
                    onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    placeholder="Ex: Série 3, Classe C..."
                    required
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  />
                </div>
              </div>

              {/* Year & Mileage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Année
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    required
                    value={form.year}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, year: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage" className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    Kilométrage
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="Ex: 75000"
                    required
                    value={form.mileage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mileage: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Prix d'achat (€)
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 15000"
                    required
                    value={form.purchasePrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, purchasePrice: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Prix de vente (€, optionnel)
                  </Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 18500"
                    value={form.salePrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, salePrice: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Statut initial</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">En stock</SelectItem>
                    <SelectItem value="preparation">En préparation</SelectItem>
                    <SelectItem value="sold">Vendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full" />
                Photos
              </CardTitle>
              <CardDescription>
                Ajoutez des photos du véhicule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Zone */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  try {
                    setLoading(true);
                    const urls = await uploadFiles(e.target.files);
                    setUploadedUrls((prev) => [...prev, ...urls]);
                    if (!form.mainPhotoUrl && urls[0]) {
                      setForm((f) => ({ ...f, mainPhotoUrl: urls[0] }));
                    }
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    if (fileInputRef.current)
                      fileInputRef.current.value = "";
                    setLoading(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full h-32 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {loading ? "Upload en cours..." : "Cliquez pour ajouter des photos"}
                </p>
              </button>

              {/* Uploaded Photos Grid */}
              {uploadedUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {uploadedUrls.map((url, i) => (
                    <div key={url} className="relative group aspect-square">
                      <Image
                        src={url}
                        alt={`Photo ${i + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                      {form.mainPhotoUrl === url && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-xs text-primary-foreground rounded-md">
                          Principal
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {form.mainPhotoUrl !== url && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, mainPhotoUrl: url }))}
                          className="absolute bottom-2 left-2 right-2 py-1 bg-background/80 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
                        >
                          Définir principal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Manual URL Input */}
              <div className="space-y-2 pt-4 border-t border-border/50">
                <Label htmlFor="mainPhotoUrl" className="text-xs text-muted-foreground">
                  Ou URL directe (optionnel)
                </Label>
                <Input
                  id="mainPhotoUrl"
                  placeholder="https://..."
                  value={form.mainPhotoUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mainPhotoUrl: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Section */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-destructive">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              variant="luxury"
              disabled={loading}
              className="w-full sm:w-auto"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ajout en cours...
                </span>
              ) : (
                "Ajouter le véhicule"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
