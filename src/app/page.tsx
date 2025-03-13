"use client";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.replace("/properties"); // Redirect to /properties if logged in
            } else {
                router.replace("/login"); // Redirect to login if not logged in
            }
        });

        return () => unsubscribe(); // Cleanup subscription
    }, [router]);

    return (
        <div className="h-screen flex items-center justify-center">
            <p className="text-gray-600">Redirecting...</p>
        </div>
    );
}