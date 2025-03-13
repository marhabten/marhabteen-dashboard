"use client";

import SideBar from "@/components/sidebar";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.replace("/login"); // Redirect if not logged in
                return;
            }

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().role === "admin") {
                setIsAdmin(true);
            } else {
                router.replace("/login"); // Redirect if not an admin
            }

            setLoading(false);
        };

        checkAdmin();
    }, [router]);

    if (loading) return <p className="text-center mt-10">Checking permissions...</p>;

    return (
        <div className="flex h-screen">
            <SideBar />
            <main className="flex-1 p-6 overflow-y-auto bg-gray-50">{children}</main>
        </div>
    );
}