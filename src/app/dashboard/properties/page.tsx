"use client";
import { blockAllPropertiesAvailableDates, deletePropertyById, fetchProperties, updatePropertyStatus } from "@/app/service";
import { CheckCircle, Eye, LayoutGrid, Map, MessageCircle, Search, ShieldAlert, Star, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PropertiesMap = dynamic(() => import("./PropertiesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl bg-gray-100" style={{ height: "70vh" }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  ),
});

type Tab = "all" | "pending" | "approved" | "rejected";

async function sendStatusEmail(property: any, status: "approved" | "rejected") {
  const hostEmail = property.email;
  if (!hostEmail) return;

  const subject = status === "approved"
    ? `Your property "${property.locationTitle}" has been approved`
    : `Your property "${property.locationTitle}" requires changes`;

  const html = status === "approved"
    ? `<p>Hi ${property.ownerPropertyName || "Host"},</p>
       <p>Great news! Your property <strong>${property.locationTitle}</strong> has been reviewed and <strong style="color:green">approved</strong>. It is now live on Marhabten.</p>
       <p>Thank you for listing with us!</p>
       <br/><p>– The Marhabten Team</p>`
    : `<p>Hi ${property.ownerPropertyName || "Host"},</p>
       <p>Your property <strong>${property.locationTitle}</strong> has been <strong style="color:red">rejected</strong> after review. Please update your listing to meet our guidelines and resubmit.</p>
       <p>If you have questions, contact us at <a href="mailto:support@marhabten.net">support@marhabten.net</a>.</p>
       <br/><p>– The Marhabten Team</p>`;

  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: hostEmail, subject, html }),
    });
  } catch (e) {
    console.error("[Email] Failed to notify host:", e);
  }
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"grid" | "map">("grid");
    const [tab, setTab] = useState<Tab>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [scriptRunning, setScriptRunning] = useState(false);
    const [scriptResult, setScriptResult] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadProperties() {
            const data = await fetchProperties();
            setProperties(data);
            setLoading(false);
        }
        loadProperties();
    }, []);

    const filtered = properties
        .filter((p) => {
            if (tab === "pending") return p.status === "pending";
            if (tab === "approved") return p.status === "approved";
            if (tab === "rejected") return p.status === "rejected";
            return true;
        })
        .filter((p) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                p.locationTitle?.toLowerCase().includes(q) ||
                p.locationDescription?.toLowerCase().includes(q)
            );
        });

    const pendingCount = properties.filter((p) => p.status === "pending").length;

    const handleDelete = async (propertyId: string) => {
        const confirmed = confirm("Are you sure you want to delete this property?");
        if (confirmed) {
            const success = await deletePropertyById(propertyId);
            if (success) setProperties((prev) => prev.filter((p) => p.id !== propertyId));
        }
    };

    const handleBlockAllDates = async () => {
        if (!confirm("⚠️ DANGEROUS ACTION\n\nThis will mark ALL available (non-booked) dates across EVERY property as unavailable.\n\nThis cannot be undone. Are you sure?")) return;
        if (!confirm("Final confirmation: Block all available dates on all properties?")) return;
        setScriptRunning(true);
        setScriptResult(null);
        const { updated, skipped, errors } = await blockAllPropertiesAvailableDates();
        setScriptResult(`Done — ${updated} properties updated, ${skipped} already blocked, ${errors} errors.`);
        setScriptRunning(false);
    };

    const handleStatusUpdate = async (property: any, status: "approved" | "rejected") => {
        setActionLoading(property.id + status);
        const success = await updatePropertyStatus(property.id, status);
        if (success) {
            setProperties((prev) =>
                prev.map((p) => (p.id === property.id ? { ...p, status } : p))
            );
            await sendStatusEmail(property, status);
        }
        setActionLoading(null);
    };

    if (loading) return <p className="text-center mt-10">Loading properties...</p>;

    const TABS: { key: Tab; label: string }[] = [
        { key: "all", label: "All" },
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Approved" },
        { key: "rejected", label: "Rejected" },
    ];

    return (
        <div className="p-0 md:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h1 className="text-2xl font-bold">Properties</h1>
                <button
                    onClick={handleBlockAllDates}
                    disabled={scriptRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition disabled:opacity-50"
                >
                    {scriptRunning ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <ShieldAlert size={15} />
                    )}
                    {scriptRunning ? "Running…" : "Block All Dates"}
                </button>
                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setView("grid")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === "grid" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <LayoutGrid size={15} /> Grid
                    </button>
                    <button
                        onClick={() => setView("map")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === "map" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <Map size={15} /> Map
                    </button>
                </div>
            </div>

            {scriptResult && (
                <div className="mb-4 flex items-center justify-between bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2.5 rounded-lg">
                    <span>{scriptResult}</span>
                    <button onClick={() => setScriptResult(null)} className="text-yellow-600 hover:text-yellow-800 ml-4">✕</button>
                </div>
            )}

            {/* TABS */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
                {TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`relative px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                            tab === key
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {label}
                        {key === "pending" && pendingCount > 0 && (
                            <span className="ml-1.5 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* SEARCH */}
            <div className="mb-4 relative w-full md:w-1/2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Search by title or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* MAP VIEW */}
            {view === "map" && <PropertiesMap properties={filtered} />}

            {/* GRID VIEW */}
            {view === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.length > 0 ? (
                        filtered.map((property) => (
                            <div
                                key={property.id}
                                className="bg-white shadow-md rounded-lg p-4 cursor-pointer transition hover:shadow-lg"
                                onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                            >
                                <div className="relative">
                                    <img
                                        src={property.images?.[0] || property.imageUrl}
                                        alt={property.locationTitle}
                                        className="w-full h-40 object-cover rounded-lg"
                                    />
                                    {property.isFeatured && (
                                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            <Star size={10} fill="white" /> Featured
                                        </span>
                                    )}
                                    {/* Status badge */}
                                    {property.status && (
                                        <span className={`absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                                            property.status === "approved"
                                                ? "bg-green-500 text-white"
                                                : property.status === "rejected"
                                                ? "bg-red-500 text-white"
                                                : "bg-yellow-400 text-white"
                                        }`}>
                                            {property.status}
                                        </span>
                                    )}
                                    {property.uid && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/conversations?userId=${property.uid}`); }}
                                            title="Chat with host"
                                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-blue-600 rounded-full p-1.5 shadow transition"
                                        >
                                            <MessageCircle size={16} />
                                        </button>
                                    )}
                                </div>

                                <h2 className="text-lg font-semibold mt-2">{property.locationTitle}</h2>
                                {(property.location?.address || property.locationDescription) && (
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                                        📍 {property.location?.address || property.locationDescription}
                                    </p>
                                )}
                                <p className="text-sm font-semibold mt-2">Owner: {property.ownerPropertyName}</p>
                                <p className="text-sm text-gray-700">Type: {property.placeType}</p>

                                {/* Pending actions */}
                                {property.status === "pending" && (
                                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => handleStatusUpdate(property, "approved")}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
                                        >
                                            {actionLoading === property.id + "approved"
                                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <><CheckCircle size={15} /> Approve</>}
                                        </button>
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => handleStatusUpdate(property, "rejected")}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
                                        >
                                            {actionLoading === property.id + "rejected"
                                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <><XCircle size={15} /> Reject</>}
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/properties/${property.id}`); }}
                                    className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition text-sm"
                                >
                                    <Eye size={16} /> View Property
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 py-10">No properties found.</p>
                    )}
                </div>
            )}
        </div>
    );
}
