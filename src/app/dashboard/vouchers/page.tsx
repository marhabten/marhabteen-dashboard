"use client";
import { addVouchers, deleteVoucher, fetchVouchers, updateVoucherExportStatus } from "@/app/service";
import { saveAs } from "file-saver";
import { Download, PlusCircle, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Voucher {
    id: string;
    code: string;
    createdAt: string | { seconds: number };
    isRedeemed: boolean;
    redemptionDate?: string | { seconds: number };
    value: number;
    exported: boolean;
}

const getFormattedDate = () => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
        </span>
    );
}

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedValue, setSelectedValue] = useState(50);
    const [quantity, setQuantity] = useState(1);
    const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);

    useEffect(() => {
        async function loadVouchers() {
            const data = await fetchVouchers();
            const formatted = data.map((v: any) => ({
                id: v.id,
                code: v.code || "",
                createdAt: v.createdAt || { seconds: 0 },
                isRedeemed: v.isRedeemed || false,
                redemptionDate: v.redemptionDate || null,
                value: v.value || 0,
                exported: v.exported || false,
            }));
            setVouchers(formatted.sort((a, b) => Number(a.exported) - Number(b.exported)));
            setLoading(false);
        }
        loadVouchers();
    }, []);

    const handleCreateVoucher = async (exportImmediately = false) => {
        const success = await addVouchers(selectedValue, quantity, exportImmediately);
        if (success) {
            const updated = await fetchVouchers() as Voucher[];
            setVouchers(updated.sort((a, b) => Number(a.exported) - Number(b.exported)));
            if (exportImmediately) {
                const newVouchers = updated.slice(-quantity);
                let csv = "Code,Value,Status,Exported\n";
                newVouchers.forEach(v => { csv += `${v.code},${v.value} LYD,${v.isRedeemed ? "Redeemed" : "Active"},Yes\n`; });
                saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `marhabteen-codes : ${getFormattedDate()}.csv`);
            }
        }
        setShowPopup(false);
    };

    const handleDeleteVoucher = async (id: string) => {
        if (!confirm("Are you sure you want to delete this voucher?")) return;
        const success = await deleteVoucher(id);
        if (success) setVouchers(prev => prev.filter(v => v.id !== id));
    };

    const handleDownloadCSV = async (onlySelected = false) => {
        const toExport = onlySelected
            ? vouchers.filter(v => selectedVouchers.includes(v.id))
            : vouchers.filter(v => !v.exported);
        if (toExport.length === 0) { alert("No unexported vouchers available."); return; }
        let csv = "Code,Value,Status,Exported\n";
        toExport.forEach(v => { csv += `${v.code},${v.value} LYD,${v.isRedeemed ? "Redeemed" : "Active"},${v.exported ? "Yes" : "No"}\n`; });
        saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `marhabteen-codes : ${getFormattedDate()}.csv`);
        await updateVoucherExportStatus(toExport.map(v => v.id));
        const updated = await fetchVouchers() as Voucher[];
        setVouchers(updated.sort((a, b) => Number(a.exported) - Number(b.exported)));
        if (onlySelected) setSelectedVouchers([]);
    };

    const toggleSelect = (id: string) =>
        setSelectedVouchers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const allExported = vouchers.length > 0 && vouchers.every(v => v.exported);

    if (loading)
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );

    return (
        <div className="p-4 md:p-8 space-y-6 md:mt-0 mt-12">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => handleDownloadCSV(false)}
                        disabled={allExported}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-40"
                    >
                        <Download size={15} /> Export All
                    </button>
                    <button
                        onClick={() => handleDownloadCSV(true)}
                        disabled={selectedVouchers.length === 0}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-40"
                    >
                        <Download size={15} /> Export Selected ({selectedVouchers.length})
                    </button>
                    <button
                        onClick={() => setShowPopup(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                    >
                        <PlusCircle size={16} /> Create Voucher
                    </button>
                </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                            <th className="px-5 py-3 text-left font-medium w-10">
                                <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={selectedVouchers.length === vouchers.length && vouchers.length > 0}
                                    onChange={() =>
                                        setSelectedVouchers(
                                            selectedVouchers.length === vouchers.length ? [] : vouchers.map(v => v.id)
                                        )
                                    }
                                />
                            </th>
                            <th className="px-5 py-3 text-left font-medium">Code</th>
                            <th className="px-5 py-3 text-left font-medium">Value</th>
                            <th className="px-5 py-3 text-left font-medium">Status</th>
                            <th className="px-5 py-3 text-left font-medium">Export</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {vouchers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-gray-400 py-12 text-sm">No vouchers found.</td>
                            </tr>
                        ) : (
                            vouchers.map((v) => (
                                <tr
                                    key={v.id}
                                    className={`hover:bg-blue-50/40 transition cursor-pointer ${selectedVouchers.includes(v.id) ? "bg-blue-50" : ""}`}
                                    onClick={() => toggleSelect(v.id)}
                                >
                                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" className="rounded" checked={selectedVouchers.includes(v.id)} onChange={() => toggleSelect(v.id)} />
                                    </td>
                                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-800">{v.code}</td>
                                    <td className="px-5 py-3.5 font-semibold text-blue-600">{v.value} LYD</td>
                                    <td className="px-5 py-3.5">
                                        <Badge
                                            label={v.isRedeemed ? "Redeemed" : "Active"}
                                            colorClass={v.isRedeemed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}
                                        />
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <Badge
                                            label={v.exported ? "Exported" : "Pending"}
                                            colorClass={v.exported ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}
                                        />
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDeleteVoucher(v.id); }}
                                            className="text-gray-300 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {vouchers.map((v) => (
                    <div
                        key={v.id}
                        onClick={() => toggleSelect(v.id)}
                        className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition space-y-2 ${selectedVouchers.includes(v.id) ? "border-blue-400 bg-blue-50" : "border-gray-100"}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <p className="font-mono font-semibold text-gray-800">{v.code}</p>
                            <div className="flex items-center gap-2">
                                <Badge label={v.isRedeemed ? "Redeemed" : "Active"} colorClass={v.isRedeemed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"} />
                                <button onClick={e => { e.stopPropagation(); handleDeleteVoucher(v.id); }} className="text-gray-300 hover:text-red-500 transition">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-blue-600">{v.value} LYD</p>
                            <Badge label={v.exported ? "Exported" : "Pending"} colorClass={v.exported ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Voucher Modal */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowPopup(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800">Create Voucher</h2>
                            <button onClick={() => setShowPopup(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Value (LYD)</label>
                                <input type="number" min="1" value={selectedValue} onChange={e => setSelectedValue(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Quantity</label>
                                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                            </div>
                        </div>
                        <div className="px-6 pb-5 flex gap-3">
                            <button onClick={() => setShowPopup(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
                            <button onClick={() => handleCreateVoucher(false)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Create</button>
                            <button onClick={() => handleCreateVoucher(true)} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">Create & Export</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
