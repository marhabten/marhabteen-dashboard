"use client";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteUserById, fetchUsers } from "../../service";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-center mt-10">Loading users...</p>;

  return (
    <div className="p-0 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-center lg:text-left">
        Users
      </h1>

      {/* SEARCH BAR */}
      <div className="mb-4 flex items-center justify-center lg:justify-start relative w-full md:w-1/2 mx-auto">
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

      {/* TABLE FOR LARGE SCREENS */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-100">
              <th className="border p-2">Profile</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Verified</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="text-center">
                  <td className="border p-2">
                    <img
                      src={user["10_imageUrl"] || "/default-profile.png"}
                      alt={user["1_name"]}
                      className="w-16 h-16 object-cover rounded-full"
                    />
                  </td>
                  <td className="border p-2">{user["1_name"]}</td>
                  <td className="border p-2">{user["2_email"]}</td>
                  <td className="border p-2">
                    {user["3_phoneNumber"] || "N/A"}
                  </td>
                  <td className="border p-2">
                    {user["7_verified"] ? (
                      <span className="text-green-500">✔ Verified</span>
                    ) : (
                      <span className="text-red-500">✖ Not Verified</span>
                    )}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDelete(user.id)}
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
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CARDS FOR MOBILE */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white shadow-md rounded-lg p-4 flex flex-col"
            >
              <div className="flex items-center gap-4">
                <img
                  src={user["10_imageUrl"] || "/default-profile.png"}
                  alt={user["1_name"]}
                  className="w-16 h-16 object-cover rounded-full"
                />
                <div>
                  <h2 className="text-lg font-semibold">{user["1_name"]}</h2>
                  <p className="text-gray-600 text-sm">{user["2_email"]}</p>
                  <p className="text-sm text-gray-700">
                    Phone: {user["3_phoneNumber"] || "N/A"}
                  </p>
                  <p
                    className={`text-sm font-semibold mt-2 ${
                      user["7_verified"] ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {user["7_verified"] ? "✔ Verified" : "✖ Not Verified"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(user.id)}
                className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete User
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No users found.</p>
        )}
      </div>
    </div>
  );
}
