"use client";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Home, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const SideBar = () => {
    const currentPath = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login"); // Redirect to login after logout
    };

    const toggleSidebar = () => setIsOpen(!isOpen);

    // Define menu items
    const menuItems = [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={24} /> },
        { name: "Properties", path: "/dashboard/properties", icon: <Home size={24} /> },
        { name: "Users", path: "/dashboard/users", icon: <Users size={24} /> },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button onClick={toggleSidebar} className="lg:hidden p-3 fixed top-4 left-4 bg-gray-200 rounded-md">
                <Menu size={24} />
            </button>

            {/* Sidebar Overlay (Only visible on mobile when open) */}
            {isOpen && <div className="fixed md:hidden inset-0 bg-black bg-opacity-40 z-40" onClick={toggleSidebar}></div>}

            {/* Sidebar */}
            <div
                className={`fixed md:relative top-0 left-0 h-screen w-64 bg-gray-100 shadow-md p-6 flex flex-col justify-between transition-transform z-50
                ${isOpen ? "translate-x-0" : "-translate-x-64"} lg:translate-x-0`}
            >
                {/* Close Button (Mobile Only) */}
                <button onClick={toggleSidebar} className="lg:hidden absolute top-4 right-4">
                    <X size={24} />
                </button>

                {/* Logo */}
                <div>
                    <img className="w-48 mx-auto mb-10" src="/logo.png" alt="Logo" />

                    {/* Menu Items */}
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.path}
                                    onClick={toggleSidebar} // Close sidebar when clicking a link
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                                        currentPath === item.path
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-700 hover:bg-blue-100"
                                    }`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                    <LogOut size={24} />
                    <span>Logout</span>
                </button>
            </div>
        </>
    );
};

export default SideBar;