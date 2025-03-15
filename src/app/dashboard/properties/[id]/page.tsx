"use client";
import { deletePropertyImage, fetchPropertyById, updatePropertyDescription, updatePropertyTitle } from "@/app/service"; // Import the function
import { Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Property {
    id: string;
    locationTitle: string;
    locationDescription: string;
    imageUrl: string;
    images: string[];
    ownerPropertyName: string;
    placeType: string;
    hostingType: string;
    email: string;
    isAvailable: boolean;
    isBooked: boolean;
    facilitiesName?: string[];
    rentalUnit?: string;
    reviewData?: Record<string, any>;
    squareFeet?: string;
    cancelationPolicy?: string;
}

export default function PropertyDetailsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [property, setProperty] = useState<Property | null>(null);

    useEffect(() => {
        async function loadProperty() {
            if (!id) return;
            console.log("Fetching property with ID:", id);
            const data = await fetchPropertyById(id);
            if (data) {
                setProperty(data as Property);
                setTitle(data.locationTitle || "");
                setDescription(data.locationDescription || "");
            }
            setLoading(false);
        }
        loadProperty();
    }, [id]);

    if (loading) return <p className="text-center mt-10">Loading property details...</p>;
    if (!property) return <p className="text-center mt-10">Property not found.</p>;

    const handleDeleteImage = async (imageUrl: string) => {
        if (!property) return;
        
        const success = await deletePropertyImage(property.id, imageUrl);
        if (success) {
            setProperty((prev) => ({
                ...prev!,
                images: prev!.images.filter((img) => img !== imageUrl),
            }));
        }
    };

    const handleUpdateTitle = async () => {
        if (!property) return;

        const success = await updatePropertyTitle(property.id, title);
        if (success) {
            setProperty((prev) => ({ ...prev!, locationTitle: title }));
            setEditingTitle(false);
        }
    };

    const handleUpdateDescription = async () => {
        if (!property) return;

        const success = await updatePropertyDescription(property.id, description);
        if (success) {
            setProperty((prev) => ({ ...prev!, locationDescription: description }));
            setEditingDescription(false);
        }
    };

    return (
        <div className="mt-12 md:mt-0 p-0 md:p-6 md:max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="text-blue-500 mb-4">← Back to Properties</button>

            <div className="bg-white shadow-md rounded-lg p-6">
                {/* MAIN IMAGE */}
                <img src={property.imageUrl || ""} alt={title} className="w-full h-64 object-cover rounded-lg" />

                {/* TITLE EDIT */}
                {editingTitle ? (
                    <div className="flex gap-2 mt-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        <button onClick={handleUpdateTitle} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
                    </div>
                ) : (
                    <h1 className="text-2xl font-bold mt-4 cursor-pointer flex items-center gap-2" onClick={() => setEditingTitle(true)}>
                        {title} <Pencil size={16} className="text-gray-500" />
                    </h1>
                )}

                {/* DESCRIPTION EDIT */}
                {editingDescription ? (
                    <div className="flex gap-2 mt-2">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="border p-2 rounded w-full"
                        />
                        <button onClick={handleUpdateDescription} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
                    </div>
                ) : (
                    <p className="text-gray-600 mt-2 cursor-pointer flex items-center gap-2" onClick={() => setEditingDescription(true)}>
                        {description} <Pencil size={14} className="text-gray-500" />
                    </p>
                )}

                <p className="text-sm font-semibold mt-2">Owner: {property.ownerPropertyName}</p>
                <p className="text-sm text-gray-700">Type: {property.placeType}</p>
                <p className="text-sm text-gray-700">Hosting Type: {property.hostingType}</p>
                <p className="text-sm text-gray-700">Email: {property.email}</p>
                <p className="text-sm text-gray-700">Availability: {property.isAvailable ? "Available" : "Not Available"}</p>
                <p className="text-sm text-gray-700">Booked: {property.isBooked ? "Yes" : "No"}</p>
                <p className="text-sm text-gray-700">Square Feet: {property.squareFeet || "N/A"}</p>
                <p className="text-sm text-gray-700">Facilities: {property.facilitiesName?.join(", ") || "N/A"}</p>
                <p className="text-sm text-gray-700">Cancellation Policy: {property.cancelationPolicy || "N/A"}</p>

                {/* PROPERTY IMAGES */}
                <h2 className="text-lg font-semibold mt-6">Property Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {property.images?.map((img) => (
                        <div key={img} className="relative">
                            <img src={img} alt="Property" className="w-full h-32 object-cover rounded-lg" />
                            <button
                                onClick={() => handleDeleteImage(img)}
                                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded flex items-center"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}