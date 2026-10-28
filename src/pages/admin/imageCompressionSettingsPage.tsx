import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { MainLayout } from "@/components/layouts/mainLayout";
import apiClient from "@/lib/api/api.base.service";

type UploadType = "product" | "category" | "banner" | "bulk";
interface CompressionSetting {
  id?: string;
  uploadType: UploadType;
  imgCompressionEnabled: boolean;
  imgQuality: number;
}

const labels: Record<UploadType, { title: string; description: string }> = {
  product: { title: "Product images", description: "Photos used in product galleries and variants." },
  category: { title: "Category images", description: "Images displayed on category tiles and listings." },
  banner: { title: "Banner images", description: "Hero and promotional banner artwork." },
  bulk: { title: "Bulk product images", description: "Images processed during bulk product imports." },
};

export default function ImageCompressionSettingsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["image-compression-settings"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/image-compression-settings");
      return response.data.data as CompressionSetting[];
    },
  });
  const save = useMutation({
    mutationFn: async (setting: CompressionSetting) => {
      const response = await apiClient.put(
        `/admin/image-compression-settings/${setting.uploadType}`,
        { imgCompressionEnabled: setting.imgCompressionEnabled, imgQuality: setting.imgQuality },
      );
      return response.data.data as CompressionSetting;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<CompressionSetting[]>(["image-compression-settings"], (current) =>
        (current ?? []).map((item) => item.uploadType === saved.uploadType ? saved : item),
      );
      toast.success("Compression settings saved.");
    },
    onError: () => toast.error("Could not save settings. Please try again."),
  });

  const updateLocal = (type: UploadType, patch: Partial<CompressionSetting>) => {
    queryClient.setQueryData<CompressionSetting[]>(["image-compression-settings"], (current) =>
      (current ?? []).map((item) => item.uploadType === type ? { ...item, ...patch } : item),
    );
  };

  return (
    <MainLayout>
      <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <header className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Settings2 className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Image compression settings</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Control optimization separately for product, category, banner, and bulk uploads. Changes apply to subsequent uploads.
            </p>
          </div>
        </header>
        {query.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading saved settings…</div>
        ) : query.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Settings could not be loaded. Check your connection and refresh.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(query.data ?? []).map((setting) => (
              <section key={setting.uploadType} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="font-semibold text-slate-900">{labels[setting.uploadType].title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{labels[setting.uploadType].description}</p>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="text-sm font-medium text-slate-700">Enable compression</span>
                  <input
                    type="checkbox"
                    checked={setting.imgCompressionEnabled}
                    onChange={(event) => updateLocal(setting.uploadType, { imgCompressionEnabled: event.target.checked })}
                    className="h-4 w-4 accent-indigo-600"
                  />
                </label>
                <label className="block">
                  <span className="flex items-center justify-between text-sm font-medium text-slate-700">
                    Encoder quality <span className="font-semibold tabular-nums">{setting.imgQuality}/100</span>
                  </span>
                  <input
                    type="range" min={1} max={100} step={1}
                    value={setting.imgQuality}
                    disabled={!setting.imgCompressionEnabled}
                    onChange={(event) => updateLocal(setting.uploadType, { imgQuality: Number(event.target.value) })}
                    className="mt-3 w-full accent-indigo-600 disabled:opacity-40"
                  />
                  <span className="mt-1 flex justify-between text-xs text-slate-500"><span>Smaller file</span><span>Higher detail</span></span>
                </label>
                {!setting.imgCompressionEnabled && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    Original image bytes will be uploaded unchanged after file-signature validation. Large uploads still depend on server and proxy limits.
                  </p>
                )}
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => save.mutate(setting)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save {labels[setting.uploadType].title.toLowerCase()}
                </button>
              </section>
            ))}
          </div>
        )}
        <p className="text-xs leading-5 text-slate-500">
          Quality is an encoder setting, not a guaranteed output size. Disabling compression preserves the source bytes; it does not bypass upload-size limits or security validation.
        </p>
      </main>
    </MainLayout>
  );
}
