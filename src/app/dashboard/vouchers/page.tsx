"use client";
import { addVouchers, deleteVoucher, fetchVouchers } from "@/app/service";
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
}

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedValue, setSelectedValue] = useState(50);
    const [quantity, setQuantity] = useState(1);

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
            }));
            setVouchers(formattedData);
            setLoading(false);
        }
        loadVouchers();
    }, []);

    const togglePopup = () => setShowPopup(!showPopup);

    const handleCreateVoucher = async () => {
        const success = await addVouchers(selectedValue, quantity);
        if (success) {
            const updatedVouchers = await fetchVouchers();
            setVouchers(updatedVouchers as [Voucher]);
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

    const handleDownloadCSV = () => {
        if (vouchers.length === 0) {
            alert("No vouchers available to download.");
            return;
        }

        // Prepare CSV content
        let csvContent = "data:text/csv;charset=utf-8,Code,Value,Status\n";
        vouchers.forEach(voucher => {
            csvContent += `${voucher.code},${voucher.value} LYD,${voucher.isRedeemed ? "Redeemed" : "Active"}\n`;
        });

        // Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "vouchers.csv");
    };

    return (
        <div className="p-0 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h1 className="text-xl md:text-3xl font-bold mb-3 sm:mb-0">Vouchers</h1>
                <div className="flex gap-2">
                    <button
                        onClick={togglePopup}
                        className="bg-blue-600 text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-700 text-sm md:text-base"
                    >
                        <PlusCircle size={18} /> Create Voucher
                    </button>
                    <button
                        onClick={handleDownloadCSV}
                        className="bg-gray-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 text-sm md:text-base"
                    >
                        📤 Share CSV
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
                            <div key={voucher.id} className="bg-white shadow-md rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold">{voucher.code}</p>
                                    <p className="text-xs text-gray-600">{voucher.value} LYD</p>
                                    <p className={`text-xs font-semibold ${voucher.isRedeemed ? "text-red-500" : "text-green-500"}`}>
                                        {voucher.isRedeemed ? "Redeemed" : "Active"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteVoucher(voucher.id)}
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
                                    <th className="pb-2 md:pb-3">Code</th>
                                    <th className="pb-2 md:pb-3">Value</th>
                                    <th className="pb-2 md:pb-3">Status</th>
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
                                        <td className="py-2 md:py-3">{voucher.code}</td>
                                        <td className="py-2 md:py-3 font-semibold">{voucher.value} LYD</td>
                                        <td className={`py-2 md:py-3 font-semibold ${voucher.isRedeemed ? "text-red-500" : "text-green-500"}`}>
                                            {voucher.isRedeemed ? "Redeemed" : "Active"}
                                        </td>
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

                        <div className="flex justify-between">
                            <button onClick={togglePopup} className="bg-gray-400 text-white px-3 py-2 rounded text-sm md:text-base">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVoucher}
                                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm md:text-base"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
