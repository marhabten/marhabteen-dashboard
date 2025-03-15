"use client";
import { PlusCircle, SearchIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createAdminUser, deleteUserById, fetchUsers } from "../../service";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  useEffect(() => {
    async function loadUsers() {
      const data = await fetchUsers();
      setUsers(data);
      setFilteredUsers(data); // Initialize filteredUsers with all users
      setLoading(false);
    }
    loadUsers();
  }, []);

  // Handle search filtering
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
        setFilteredUsers((prev) => prev.filter((u) => u.id !== userId)); // Update filtered results
      }
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

      // Reload users
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

      {/* USER LIST FOR ALL SCREEN SIZES */}
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
                </div>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 p-4">No users found.</p>
        )}
      </div>

      {/* Create Admin Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4">
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-sm"
              placeholder="Enter password"
            />

            <label className="block mb-2 text-sm">Retype Password:</label>
            <input
              type="password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-sm"
              placeholder="Retype password"
            />

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
