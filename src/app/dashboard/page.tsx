"use client";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { fetchPropertyStats, fetchUserStats } from ".././service";

export default function DashboardPage() {
    const [totalProperties, setTotalProperties] = useState(0);
    const [recentProperties, setRecentProperties] = useState<any[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        async function loadStats() {
            const { totalProperties, recentProperties } = await fetchPropertyStats();
            const { totalUsers } = await fetchUserStats();

            setTotalProperties(totalProperties);
            setRecentProperties(recentProperties);
            setTotalUsers(totalUsers);
            setLoading(false);
        }

        loadStats();
    }, []);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserEmail(user.email || "");
            } else {
                setUserEmail("");
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <p className="text-center mt-10">Loading dashboard data...</p>;

    return (
        <div className="p-6 bg-white shadow-md rounded-lg md:mt-0 mt-12">
            {userEmail && (
                <p className="text-sm text-gray-700 mb-2">Logged in as: {userEmail}</p>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Marhabteen Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your properties, users, and more.</p>

            {/* Dashboard Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-500 text-white rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold">Total Properties</h2>
                    <p className="text-2xl font-bold">{totalProperties}</p>
                </div>

                <div className="p-4 bg-blue-500 text-white rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold">Total Users</h2>
                    <p className="text-2xl font-bold">{totalUsers}</p>
                </div>

                <div className="p-4 bg-purple-500 text-white rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold">Total Bookings</h2>
                    <ul className="text-sm">
                        {recentProperties.length > 0 ? (
                            recentProperties.map((property, index) => (
                                <li key={index} className="mt-1">
                                    🏡 {property.locationTitle}
                                </li>
                            ))
                        ) : (
                            <li>No bookings</li>
                        )}
                    </ul>
                </div>

                <div className="p-4 bg-green-500 text-white rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold">Total Revenue</h2>
                    <p className="text-2xl font-bold">0 LYD</p>
                </div>
            </div>
        </div>
    );
}