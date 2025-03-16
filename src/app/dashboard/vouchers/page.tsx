"use client";
import { addVouchers, deleteVoucher, fetchVouchers, updateVoucherExportStatus } from "@/app/service";
import { saveAs } from "file-saver";
import { PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Voucher {
    id: string;
    code: string;
    createdAt: string | { seconds: number };
    isRedeemed: boolean;
    redemptionDate?: string | { seconds: number };
    value: number;
    exported: boolean; // Added exported property
}

const getFormattedDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedValue, setSelectedValue] = useState(50);
    const [quantity, setQuantity] = useState(1);
    const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]); // Added state for selected vouchers

    useEffect(() => {
        async function loadVouchers() {
            const data = await fetchVouchers();
            const formattedData = data.map((voucher: any) => ({
                id: voucher.id,
                code: voucher.code || "",
                createdAt: voucher.createdAt || { seconds: 0 },
                isRedeemed: voucher.isRedeemed || false,
                redemptionDate: voucher.redemptionDate || null,
                value: voucher.value || 0,
                exported: voucher.exported || false, // Ensure exported property is included
            }));
            setVouchers(formattedData.sort((a, b) => Number(a.exported) - Number(b.exported))); // Sort vouchers
            setLoading(false);
        }
        loadVouchers();
    }, []);

    const togglePopup = () => setShowPopup(!showPopup);

    const handleCreateVoucher = async (exportImmediately = false) => {
        const success = await addVouchers(selectedValue, quantity, exportImmediately);
        if (success) {
            const updatedVouchers = await fetchVouchers() as [Voucher];
            setVouchers(updatedVouchers.sort((a, b) => Number(a.exported) - Number(b.exported)));

            // If exported immediately, download only the newly created vouchers
            if (exportImmediately) {
                const newVouchers = updatedVouchers.slice(-quantity); // Get last generated vouchers
                let csvContent = "Code,Value,Status,Exported\n";
                newVouchers.forEach(voucher => {
                    csvContent += `${voucher.code},${voucher.value} LYD,${voucher.isRedeemed ? "Redeemed" : "Active"},Yes\n`;
                });

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                saveAs(blob, `marhabteen-codes : ${getFormattedDate()}.csv`);
            }
        }
        setShowPopup(false);
    };

    const handleDeleteVoucher = async (id: string) => {
        const confirmed = confirm("Are you sure you want to delete this voucher?");
        if (confirmed) {
            const success = await deleteVoucher(id);
            if (success) {
                setVouchers(prev => prev.filter(voucher => voucher.id !== id));
            }
        }
    };

    const handleDownloadCSV = async (onlySelected = false) => {
        const vouchersToExport = onlySelected ? vouchers.filter(v => selectedVouchers.includes(v.id)) : vouchers.filter(v => !v.exported); // Export only unexported vouchers

        if (vouchersToExport.length === 0) {
            alert("No unexported vouchers available for export.");
            return;
        }

        let csvContent = "Code,Value,Status,Exported\n";
        vouchersToExport.forEach(voucher => {
            csvContent += `${voucher.code},${voucher.value} LYD,${voucher.isRedeemed ? "Redeemed" : "Active"},${voucher.exported ? "Yes" : "No"}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `marhabteen-codes : ${getFormattedDate()}.csv`);

        // Update Firebase to mark exported vouchers and refetch data
        const exportIds = vouchersToExport.map(v => v.id);
        await updateVoucherExportStatus(exportIds);
        
        // Refetch vouchers and sort with non-exported first
        const updatedVouchers = await fetchVouchers() as [Voucher];
        setVouchers(updatedVouchers.sort((a, b) => Number(a.exported) - Number(b.exported)));

        // Deselect all selected vouchers after exporting a selection
        if (onlySelected) {
            setSelectedVouchers([]);
        }
    };

    const toggleVoucherSelection = (id: string) => {
        setSelectedVouchers(prev =>
            prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
        );
    };

    // Check if all vouchers are exported
    const allVouchersExported = vouchers.length > 0 && vouchers.every(v => v.exported);

    return (
        <div className="p-0 md:p-6 mt-12 md:mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h1 className="text-xl md:text-3xl font-bold mb-3 sm:mb-0">Vouchers</h1>
                <div className="flex flex-col md:flex-row w-full  gap-2 justify-start sm:justify-end">
                    <button
                        onClick={togglePopup}
                        className="bg-blue-600 text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-700 text-sm md:text-base"
                    >
                        <PlusCircle size={18} /> Create Voucher
                    </button>
                    <button
                        onClick={() => handleDownloadCSV(false)}
                        className={`bg-gray-600 text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 text-sm md:text-base ${allVouchersExported ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={allVouchersExported}
                    >
                        📤 Export All
                    </button>
                    <button
                        onClick={() => handleDownloadCSV(true)}
                        className={`bg-gray-600 text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 text-sm md:text-base ${selectedVouchers.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={selectedVouchers.length === 0}
                    >
                        📤 Export Selected
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-sm md:text-base">Loading vouchers...</p>
            ) : (
                <>
                    {/* Mobile View: List Style */}
                    <div className="md:hidden space-y-2">
                        {vouchers.map((voucher) => (
                            <div
                                key={voucher.id}
                                className={`bg-white shadow-md rounded-lg p-3 flex border-2 border-blue-100 justify-between items-center transition duration-500 ${selectedVouchers.includes(voucher.id) ? "bg-blue-300 border-2 border-blue-500" : ""}`}
                                onClick={() => toggleVoucherSelection(voucher.id)}
                            >
                                <div>
                                    <p className="text-sm font-semibold">{voucher.code} - <span className={`${voucher.exported ? "text-green-700" : "text-red-800"}`}> {voucher.exported ? "Exported" : "Awaiting for export"} </span></p>
                                    <p className="text-xs text-gray-600">{voucher.value} LYD</p>
                                    <p className={`text-xs font-semibold ${voucher.isRedeemed ? "text-red-500" : "text-green-500"}`}>
                                        {voucher.isRedeemed ? "Redeemed" : "Active"}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteVoucher(voucher.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 transition"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View: Table Style */}
                    <div className="hidden md:block bg-white shadow-md rounded-lg p-3 md:p-4">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-700 uppercase text-xs md:text-sm border-b">
                                    <th className="pb-2 md:pb-3">Select</th>
                                    <th className="pb-2 md:pb-3">Code</th>
                                    <th className="pb-2 md:pb-3">Value</th>
                                    <th className="pb-2 md:pb-3">Status</th>
                                    <th className="pb-2 md:pb-3">Exported</th>
                                    <th className="pb-2 md:pb-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vouchers.map((voucher, index) => (
                                    <tr
                                        key={voucher.id}
                                        className={`border-b text-xs md:text-base ${
                                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                        } hover:bg-gray-100 transition`}
                                    >
                                        <td className="py-2 md:py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedVouchers.includes(voucher.id)}
                                                onChange={() => toggleVoucherSelection(voucher.id)}
                                            />
                                        </td>
                                        <td className="py-2 md:py-3">{voucher.code}</td>
                                        <td className="py-2 md:py-3 font-semibold">{voucher.value} LYD</td>
                                        <td className={`py-2 md:py-3 font-semibold ${voucher.isRedeemed ? "text-red-500" : "text-green-500"}`}>
                                            {voucher.isRedeemed ? "Redeemed" : "Active"}
                                        </td>
                                        <td className="py-2 md:py-3">{voucher.exported ? "Yes" : "No"}</td>
                                        <td className="py-2 md:py-3 text-center">
                                            <button
                                                onClick={() => handleDeleteVoucher(voucher.id)}
                                                className="text-red-500 hover:text-red-700 transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Create Voucher Popup */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/10 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm">
                        <h2 className="text-lg md:text-xl font-semibold mb-4">Create Voucher</h2>

                        <label className="block mb-2 text-sm md:text-base">Value (LYD):</label>
                        <input
                            type="number"
                            min="1"
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(Number(e.target.value))}
                            className="w-full border p-2 rounded mb-4 text-sm md:text-base"
                            placeholder="Enter voucher value"
                        />

                        <label className="block mb-2 text-sm md:text-base">Quantity:</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full border p-2 rounded mb-4 text-sm md:text-base"
                        />

                        <div className="flex justify-between gap-2">
                            <button onClick={togglePopup} className="bg-gray-400 text-white px-3 py-2 rounded text-sm md:text-base">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleCreateVoucher(false)}
                                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm md:text-base"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => handleCreateVoucher(true)}
                                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm md:text-base"
                            >
                                Create & Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
