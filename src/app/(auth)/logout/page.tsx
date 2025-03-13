"use client";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Logout() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">
                Logout
            </button>
        </div>
    );
}