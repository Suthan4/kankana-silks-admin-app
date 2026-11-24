import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Download, RefreshCw, BarChart3, Users, Eye, ShoppingCart, IndianRupee } from "lucide-react";
import { toast } from "react-hot-toast";
import { MainLayout } from "@/components/layouts/mainLayout";
import { BackButton } from "@/components/ui/BackButton";
import { analyticsApi } from "@/lib/api/analytics.api";

const toDateInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const AnalyticsReportsPage: React.FC = () => {
  const today = new Date();
  const [endDate, setEndDate] = useState(toDateInput(today));
  const [startDate, setStartDate] = useState(toDateInput(new Date(today.getTime() - 6 * 86400000)));
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics-report", startDate, endDate],
    queryFn: () => analyticsApi.getReport(startDate, endDate),
    enabled: Boolean(startDate && endDate && startDate <= endDate),
  });

  const rows = data?.ga4.rows ?? [];
  const totals = rows.reduce((acc, row) => {
    for (const key of ["sessions", "totalUsers", "screenPageViews", "addToCarts", "checkouts", "ecommercePurchases", "purchaseRevenue"] as const) {
      acc[key] = Number(acc[key] ?? 0) + Number(row[key] ?? 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const exportFile = async (format: "csv" | "xlsx") => {
    try {
      setDownloading(format);
      await analyticsApi.download(startDate, endDate, format);
    } catch {
      toast.error("Unable to download analytics report");
    } finally {
      setDownloading(null);
    }
  };

  const cards = [
    { label: "Sessions", value: totals.sessions ?? 0, icon: BarChart3 },
    { label: "Users", value: totals.totalUsers ?? 0, icon: Users },
    { label: "Page views", value: totals.screenPageViews ?? 0, icon: Eye },
    { label: "Add to carts", value: totals.addToCarts ?? 0, icon: ShoppingCart },
    { label: "Purchases", value: totals.ecommercePurchases ?? 0, icon: ShoppingCart },
    { label: "Purchase revenue", value: `₹${(totals.purchaseRevenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, icon: IndianRupee },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="mt-1 text-sm text-gray-600">Website traffic, ecommerce performance and customer experience</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportFile("csv")} disabled={downloading !== null || !data} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
              <Download className="h-4 w-4" /> {downloading === "csv" ? "Preparing..." : "CSV"}
            </button>
            <button onClick={() => exportFile("xlsx")} disabled={downloading !== null || !data} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">
              <Download className="h-4 w-4" /> {downloading === "xlsx" ? "Preparing..." : "Excel"}
            </button>
          </div>
        </div>

        <section className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm text-gray-600">From
            <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border px-3 py-2 text-gray-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-600">To
            <input type="date" value={endDate} min={startDate} max={toDateInput(today)} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border px-3 py-2 text-gray-900" />
          </label>
          <button onClick={() => refetch()} className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <span className="text-xs text-gray-500 sm:ml-auto"><CalendarDays className="mr-1 inline h-4 w-4" /> GA4 date range · {data?.ga4.propertyId ? `Property ${data.ga4.propertyId}` : "Waiting for data"}</span>
        </section>

        {isLoading && <div className="rounded-xl border bg-white p-10 text-center text-gray-500">Loading analytics...</div>}
        {error && <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">Unable to load analytics. Check GA4 credentials and API access, then refresh.</div>}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border bg-white p-5">
                  <div className="flex items-center justify-between text-sm text-gray-500"><span>{label}</span><Icon className="h-5 w-5" /></div>
                  <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border bg-white">
              <div className="border-b p-4"><h2 className="font-semibold text-gray-900">Traffic by day and channel</h2></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600"><tr>{["Date", "Channel", "Sessions", "Users", "Views", "Add to carts", "Checkouts", "Purchases", "Revenue"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
                  <tbody className="divide-y">
                    {rows.map((row, index) => <tr key={`${row.date}-${row.channel}-${index}`}><td className="px-4 py-3">{String(row.date ?? "")}</td><td className="px-4 py-3">{String(row.channel ?? "")}</td>{["sessions", "totalUsers", "screenPageViews", "addToCarts", "checkouts", "ecommercePurchases", "purchaseRevenue"].map((key) => <td key={key} className="whitespace-nowrap px-4 py-3">{Number(row[key] ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>)}</tr>)}
                    {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No GA4 rows returned for this date range.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold text-gray-900">Microsoft Clarity · Last 3 days</h2>
              {!data.clarity.configured && <p className="mt-2 text-sm text-gray-500">{data.clarity.limitation}</p>}
              {data.clarity.error && <p className="mt-2 text-sm text-amber-700">{data.clarity.error}</p>}
              {data.clarity.data && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.clarity.data.map((metric, index) => <div key={`${metric.metricName}-${index}`} className="rounded-lg bg-gray-50 p-3"><p className="text-sm font-medium text-gray-800">{metric.metricName}</p><p className="mt-1 text-xs text-gray-500">{metric.information?.length ?? 0} breakdown rows</p></div>)}</div>}
              <p className="mt-3 text-xs text-gray-500">Clarity's export API only provides the previous 1–3 days. This section is not historical monthly reporting.</p>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default AnalyticsReportsPage;
