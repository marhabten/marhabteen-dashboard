"use client";
import { deletePropertyById, fetchProperties } from "@/app/service";
import { Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadProperties() {
            const data = await fetchProperties();
            setProperties(data);
            setFilteredProperties(data);
            setLoading(false);
        }
        loadProperties();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredProperties(properties);
        } else {
            const lowerCaseQuery = query.toLowerCase();
            setFilteredProperties(
                properties.filter(
                    (property) =>
                        property.locationTitle?.toLowerCase().includes(lowerCaseQuery) ||
                        property.locationDescription?.toLowerCase().includes(lowerCaseQuery)
                )
            );
        }
    };

    const handleDelete = async (propertyId: string) => {
        const confirmed = confirm("Are you sure you want to delete this property?");
        if (confirmed) {
            const success = await deletePropertyById(propertyId);
            if (success) {
                setProperties((prev) => prev.filter((p) => p.id !== propertyId));
                setFilteredProperties((prev) => prev.filter((p) => p.id !== propertyId));
            }
        }
    };

    if (loading) return <p className="text-center mt-10">Loading properties...</p>;

    return (
        <div className="p-0 md:p-6">
            <h1 className="text-2xl font-bold mb-4 text-center lg:text-left">Properties</h1>

            {/* SEARCH BAR */}
            <div className="mb-4 flex items-center justify-center lg:justify-start relative w-full md:w-1/2 mx-auto">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search by title or location..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-10 py-2 border border-blue-500 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* PROPERTY GRID LIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                        <div
                            key={property.id}
                            className="bg-white shadow-md rounded-lg p-4 cursor-pointer transition hover:shadow-lg"
                            onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                        >
                            <img
                                src={property.imageUrl}
                                alt={property.locationTitle}
                                className="w-full h-40 object-cover rounded-lg"
                            />
                            <h2 className="text-lg font-semibold mt-2">{property.locationTitle}</h2>
                            <p className="text-sm font-semibold mt-2">Owner: {property.ownerPropertyName}</p>
                            <p className="text-sm text-gray-700">Type: {property.placeType}</p>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click navigation
                                    router.push(`/dashboard/properties/${property.id}`);
                                }}
                                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                            >
                                <Eye size={18} />
                                View Property
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">No properties found.</p>
                )}
            </div>
        </div>
    );
}