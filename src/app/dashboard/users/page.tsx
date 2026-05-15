"use client";
import { createAdminUser, deleteUserById, fetchUsers, updateUserWallet } from "../../service";
import { Eye, EyeOff, Pencil, PlusCircle, Search, Trash2, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create admin modal
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Wallet modal
  const [walletUser, setWalletUser] = useState<any | null>(null);
  const [walletMode, setWalletMode] = useState<"set" | "topup">("topup");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  useEffect(() => {
    fetchUsers().then(({ users: data, lastDoc: cursor, hasMore: more }) => {
      setUsers(data);
      setLastDoc(cursor);
      setHasMore(more);
      setLoading(false);
    });
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const { users: more, lastDoc: newCursor, hasMore: stillMore } = await fetchUsers(lastDoc as string);
    setUsers(prev => [...prev, ...more]);
    setLastDoc(newCursor);
    setHasMore(stillMore);
    setLoadingMore(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      // Reset to normal paginated list
      setLoading(true);
      fetchUsers().then(({ users: data, lastDoc: cursor, hasMore: more }) => {
        setUsers(data);
        setLastDoc(cursor);
        setHasMore(more);
        setLoading(false);
      });
      return;
    }

    // Debounce 350 ms then search server-side across ALL users
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/users/list?search=${encodeURIComponent(query.trim())}`);
      const { users: results } = await res.json();
      setUsers(results);
      setLastDoc(null);
      setHasMore(false);
      setSearching(false);
    }, 350);
  };

  const openEditModal = (user: any) => {
    setEditUser(user);
    setEditName(user["1_name"] || "");
    setEditPhone(user["3_phoneNumber"] || "");
    setEditPassword("");
    setShowEditPassword(false);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editUser.id,
          name: editName,
          phone: editPhone,
          ...(editPassword ? { password: editPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Update failed'); return; }
      const updated = { ...editUser, "1_name": editName, "3_phoneNumber": editPhone };
      setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u));
      setEditUser(null);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const success = await deleteUserById(userId);
    if (success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const handleWalletSave = async () => {
    if (!walletUser) return;
    const parsed = parseFloat(walletAmount);
    if (isNaN(parsed) || parsed < 0) { alert("Please enter a valid amount."); return; }
    const newBalance = walletMode === "topup" ? parseFloat(walletUser.wallet ?? 0) + parsed : parsed;
    setWalletSaving(true);
    const success = await updateUserWallet(walletUser.id, newBalance);
    setWalletSaving(false);
    if (success) {
      const updated = { ...walletUser, wallet: newBalance };
      setUsers((prev) => prev.map((u) => u.id === walletUser.id ? updated : u));
      setWalletUser(null);
    } else {
      alert("Failed to update wallet.");
    }
  };

  const handleCreateAdmin = async () => {
    if (password !== retypePassword) { alert("Passwords do not match!"); return; }
    const success = await createAdminUser(adminEmail, password);
    if (success) {
      alert("Admin created successfully!");
      setShowCreateAdmin(false);
      setAdminEmail(""); setPassword(""); setRetypePassword("");
      const { users: updated, lastDoc: cursor, hasMore: more } = await fetchUsers();
      setUsers(updated); setLastDoc(cursor); setHasMore(more);
    } else {
      alert("Failed to create admin.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="p-4 md:p-8 space-y-6 md:mt-0 mt-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowCreateAdmin(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition flex-shrink-0"
        >
          <PlusCircle size={16} /> Create Admin
        </button>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-4 flex-wrap">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
        />
      </div>
      {searching
        ? <p className="text-sm text-gray-400 flex-shrink-0">Searching…</p>
        : <p className="text-sm text-gray-400 flex-shrink-0">{users.length} loaded{hasMore ? " · more available" : ""}</p>
      }
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium">Phone</th>
              <th className="text-left px-5 py-3 font-medium">Verified</th>
              <th className="text-left px-5 py-3 font-medium">Wallet</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-12 text-sm">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={u["10_imageUrl"] || "/default-profile.png"}
                        alt={u["1_name"]}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{u["1_name"] || "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{u["2_email"] || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{u["3_phoneNumber"] || "—"}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      label={u["7_verified"] ? "Verified" : "Unverified"}
                      colorClass={u["7_verified"] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}
                    />
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-blue-600">
                    {u.wallet !== undefined ? `${parseFloat(u.wallet ?? 0).toFixed(2)} LYD` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setWalletUser(u); setWalletMode("topup"); setWalletAmount(""); }}
                        className="text-gray-300 hover:text-emerald-500 transition" title="Manage wallet"
                      >
                        <Wallet size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-gray-300 hover:text-blue-500 transition" title="Edit user"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/users/${u.id}`)}
                        className="text-gray-300 hover:text-blue-500 transition" title="View user"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No users found.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img src={u["10_imageUrl"] || "/default-profile.png"} alt={u["1_name"]} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800">{u["1_name"] || "—"}</p>
                    <p className="text-xs text-gray-400">{u["2_email"] || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setWalletUser(u); setWalletMode("topup"); setWalletAmount(""); }} className="text-gray-300 hover:text-emerald-500 transition"><Wallet size={16} /></button>
                  <button onClick={() => openEditModal(u)} className="text-gray-300 hover:text-blue-500 transition"><Pencil size={16} /></button>
                  <button onClick={() => router.push(`/dashboard/users/${u.id}`)} className="text-gray-300 hover:text-blue-500 transition"><Eye size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={u["7_verified"] ? "Verified" : "Unverified"} colorClass={u["7_verified"] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"} />
                {u.wallet !== undefined && <p className="text-xs font-semibold text-blue-600">{parseFloat(u.wallet ?? 0).toFixed(2)} LYD</p>}
                {u["3_phoneNumber"] && <p className="text-xs text-gray-500">{u["3_phoneNumber"]}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : `Load more users`}
          </button>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">Edit User</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editUser["2_email"]}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone Number</label>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="+218 91 234 5678"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">New Password <span className="text-gray-400">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Min. 6 characters"
                  />
                  <button onClick={() => setShowEditPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setEditUser(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {walletUser && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setWalletUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Manage Wallet</h2>
              <button onClick={() => setWalletUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">
                {walletUser["1_name"]} — balance:{" "}
                <span className="font-semibold text-gray-800">{parseFloat(walletUser.wallet ?? 0).toFixed(2)} LYD</span>
              </p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button onClick={() => setWalletMode("topup")} className={`flex-1 py-2 text-sm font-medium transition ${walletMode === "topup" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Top Up</button>
                <button onClick={() => setWalletMode("set")} className={`flex-1 py-2 text-sm font-medium transition ${walletMode === "set" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Set Balance</button>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{walletMode === "topup" ? "Amount to add (LYD)" : "New balance (LYD)"}</label>
                <input
                  type="number" min="0" step="0.01" value={walletAmount}
                  onChange={e => setWalletAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00" autoFocus
                />
                {walletAmount !== "" && !isNaN(parseFloat(walletAmount)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    New balance: <span className="font-semibold text-gray-800">
                      {(walletMode === "topup" ? parseFloat(walletUser.wallet ?? 0) + parseFloat(walletAmount) : parseFloat(walletAmount)).toFixed(2)} LYD
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setWalletUser(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleWalletSave} disabled={walletSaving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                {walletSaving ? "Saving…" : walletMode === "topup" ? "Top Up" : "Set Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateAdmin(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Create Admin</h2>
              <button onClick={() => setShowCreateAdmin(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Password" />
                  <button onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Retype Password</label>
                <div className="relative">
                  <input type={showRetypePassword ? "text" : "password"} value={retypePassword} onChange={e => setRetypePassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Retype password" />
                  <button onClick={() => setShowRetypePassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showRetypePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setShowCreateAdmin(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleCreateAdmin} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Add Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
