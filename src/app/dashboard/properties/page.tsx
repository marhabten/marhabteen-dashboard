"use client";
import { deletePropertyById, fetchProperties } from "@/app/service";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function PropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProperties() {
            const data = await fetchProperties();
            setProperties(data);
            setFilteredProperties(data); // Initialize with all properties
            setLoading(false);
        }
        loadProperties();
    }, []);

    // Handle search filtering
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
                setFilteredProperties((prev) => prev.filter((p) => p.id !== propertyId)); // Update filtered list
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

            {/* TABLE FOR LARGE SCREENS */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-blue-100">
                            <th className="border p-2">Image</th>
                            <th className="border p-2">Title</th>
                            <th className="border p-2">Location</th>
                            <th className="border p-2">Owner</th>
                            <th className="border p-2">Type</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map((property) => (
                                <tr key={property.id} className="text-center">
                                    <td className="border p-2">
                                        <img
                                            src={property.imageUrl}
                                            alt={property.locationTitle}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    </td>
                                    <td className="border p-2">{property.locationTitle}</td>
                                    <td className="border p-2">{property.locationDescription}</td>
                                    <td className="border p-2">{property.ownerPropertyName}</td>
                                    <td className="border p-2">{property.placeType}</td>
                                    <td className="border p-2">
                                        <button
                                            onClick={() => handleDelete(property.id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center text-gray-500 p-4">
                                    No properties found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CARDS FOR MOBILE */}
            <div className="lg:hidden space-y-4">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                        <div key={property.id} className="bg-white shadow-md rounded-lg p-4 flex flex-col">
                            <img
                                src={property.imageUrl}
                                alt={property.locationTitle}
                                className="w-full h-40 object-cover rounded-lg"
                            />
                            <h2 className="text-lg font-semibold mt-2">{property.locationTitle}</h2>
                            <p className="text-gray-600 text-sm">{property.locationDescription}</p>
                            <p className="text-sm font-semibold mt-2">Owner: {property.ownerPropertyName}</p>
                            <p className="text-sm text-gray-700">Type: {property.placeType}</p>

                            <button
                                onClick={() => handleDelete(property.id)}
                                className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-700 transition"
                            >
                                Delete Property
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