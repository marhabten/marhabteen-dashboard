"use client";
import { Eye, EyeOff, PlusCircle, SearchIcon, Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminUser, deleteUserById, fetchUsers, updateUserWallet } from "../../service";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  // Wallet modal state
  const [walletUser, setWalletUser] = useState<any | null>(null);
  const [walletMode, setWalletMode] = useState<"set" | "topup">("set");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      const data = await fetchUsers();
      setUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    }
    loadUsers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user["1_name"]?.toLowerCase().includes(lowerCaseQuery) ||
            user["2_email"]?.toLowerCase().includes(lowerCaseQuery)
        )
      );
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = confirm("Are you sure you want to delete this user?");
    if (confirmed) {
      const success = await deleteUserById(userId);
      if (success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setFilteredUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    }
  };

  const openWalletModal = (user: any) => {
    setWalletUser(user);
    setWalletMode("topup");
    setWalletAmount("");
  };

  const closeWalletModal = () => {
    setWalletUser(null);
    setWalletAmount("");
  };

  const handleWalletSave = async () => {
    if (!walletUser) return;
    const parsed = parseFloat(walletAmount);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const currentBalance = parseFloat(walletUser.wallet ?? 0);
    const newBalance = walletMode === "topup" ? currentBalance + parsed : parsed;

    setWalletSaving(true);
    const success = await updateUserWallet(walletUser.id, newBalance);
    setWalletSaving(false);

    if (success) {
      const updated = { ...walletUser, wallet: newBalance };
      setUsers((prev) => prev.map((u) => u.id === walletUser.id ? updated : u));
      setFilteredUsers((prev) => prev.map((u) => u.id === walletUser.id ? updated : u));
      closeWalletModal();
    } else {
      alert("Failed to update wallet. Please try again.");
    }
  };

  const togglePopup = () => setShowPopup(!showPopup);

  const handleCreateAdmin = async () => {
    if (password !== retypePassword) {
      alert("Passwords do not match!");
      return;
    }
    const success = await createAdminUser(adminEmail, password);
    if (success) {
      alert("Admin created successfully!");
      togglePopup();
      setAdminEmail("");
      setPassword("");
      setRetypePassword("");
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    } else {
      alert("Failed to create admin. Please try again.");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading users...</p>;

  return (
    <div className="mt-12 md:mt-0 p-0 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-left w-full md:w-3/4 lg:w-1/2 mx-auto gap-3">
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <SearchIcon size={20} />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-10 py-2 border border-blue-500 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={togglePopup}
          className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 w-full md:w-1/3"
        >
          <PlusCircle size={18} /> Create Admin
        </button>
      </div>

      {/* USER LIST */}
      <div className="bg-white shadow-md rounded-lg">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`p-4 flex items-center justify-between ${index < filteredUsers.length - 1 ? "border-b border-black/10" : ""}`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={user["10_imageUrl"] || "/default-profile.png"}
                  alt={user["1_name"]}
                  className="w-12 h-12 object-cover rounded-full"
                />
                <div>
                  <h2 className="text-md font-semibold">{user["1_name"]}</h2>
                  <p className="text-sm text-gray-600">{user["2_email"]}</p>
                  <p className="text-xs text-gray-500">
                    {user["3_phoneNumber"] || "N/A"}
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      user["7_verified"] ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {user["7_verified"] ? "✔ Verified" : "✖ Not Verified"}
                  </p>
                  {user.wallet !== undefined && (
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      Wallet: {parseFloat(user.wallet ?? 0).toFixed(2)} LYD
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openWalletModal(user)}
                  className="text-green-600 hover:text-green-800 transition"
                  title="Manage wallet"
                >
                  <Wallet size={20} />
                </button>
                <button
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  className="text-blue-500 hover:text-blue-700 transition"
                  title="View user"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 p-4">No users found.</p>
        )}
      </div>

      {/* Wallet Modal */}
      {walletUser && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Manage Wallet</h2>
            <p className="text-sm text-gray-500 mb-4">
              {walletUser["1_name"]} — current balance:{" "}
              <span className="font-semibold text-gray-800">
                {parseFloat(walletUser.wallet ?? 0).toFixed(2)} LYD
              </span>
            </p>

            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4">
              <button
                onClick={() => setWalletMode("topup")}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  walletMode === "topup"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Top Up
              </button>
              <button
                onClick={() => setWalletMode("set")}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  walletMode === "set"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Set Balance
              </button>
            </div>

            <label className="block text-sm mb-1 text-gray-700">
              {walletMode === "topup" ? "Amount to add (LYD)" : "New balance (LYD)"}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="0.00"
              autoFocus
            />

            {walletAmount !== "" && !isNaN(parseFloat(walletAmount)) && (
              <p className="text-xs text-gray-500 mb-4">
                New balance will be:{" "}
                <span className="font-semibold text-gray-800">
                  {(
                    walletMode === "topup"
                      ? parseFloat(walletUser.wallet ?? 0) + parseFloat(walletAmount)
                      : parseFloat(walletAmount)
                  ).toFixed(2)}{" "}
                  LYD
                </span>
              </p>
            )}
            {(walletAmount === "" || isNaN(parseFloat(walletAmount))) && <div className="mb-4" />}

            <div className="flex justify-between gap-3">
              <button
                onClick={closeWalletModal}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWalletSave}
                disabled={walletSaving}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60"
              >
                {walletSaving ? "Saving..." : walletMode === "topup" ? "Top Up" : "Set Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Create Admin</h2>

            <label className="block mb-2 text-sm">Email:</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-sm"
              placeholder="Enter admin email"
            />

            <label className="block mb-2 text-sm">Password:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded mb-4 text-sm pr-10"
                placeholder="Enter password"
              />
              <div className="absolute top-2.5 right-0 flex items-center pr-2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>

            <label className="block mb-2 text-sm">Retype Password:</label>
            <div className="relative">
              <input
                type={showRetypePassword ? "text" : "password"}
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                className="w-full border p-2 rounded mb-4 text-sm pr-10"
                placeholder="Retype password"
              />
              <div className="absolute top-2.5 right-0 flex align-middle justify-center self-center items-center pr-2 cursor-pointer" onClick={() => setShowRetypePassword(!showRetypePassword)}>
                {showRetypePassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={togglePopup}
                className="bg-gray-400 text-white px-3 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
