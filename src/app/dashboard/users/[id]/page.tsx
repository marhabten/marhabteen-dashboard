"use client";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AppUser {
  id: string;
  [key: string]: any;
}

interface Booking {
  id: string;
  [key: string]: any;
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 break-all">{value}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [user, setUser] = useState<AppUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [userSnap, bookingsSnap] = await Promise.all([
        getDoc(doc(db, "users", id)),
        getDocs(query(collection(db, "bookings"), where("guestId", "==", id))),
      ]);
      if (userSnap.exists()) setUser({ id: userSnap.id, ...userSnap.data() });
      setBookings(bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  if (!user)
    return <p className="text-center mt-10 text-gray-500">User not found.</p>;

  const name = user["1_name"] || user["name"] || "Unknown";
  const email = user["2_email"] || user["email"] || "";
  const phone = user["3_phoneNumber"] || user["phoneNumber"] || "";
  const imageUrl = user["10_imageUrl"] || "";
  const verified = user["7_verified"];
  const wallet = user["wallet"] ?? user["walletBalance"];
  const role = user["role"] || "guest";

  return (
    <div className="mt-12 md:mt-0 p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
      >
        ← Back to Users
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex items-center gap-6">
        <img
          src={imageUrl || "/default-profile.png"}
          alt={name}
          className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-blue-100"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <p className="text-sm text-gray-500">{email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {verified ? "✔ Verified" : "✖ Not Verified"}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Account Info</h2>
        <Field label="Full Name" value={name} />
        <Field label="Email" value={email} />
        <Field label="Phone" value={phone} />
        <Field label="Role" value={role} />
        {wallet != null && <Field label="Wallet Balance" value={`${wallet} LYD`} />}
        <Field label="User ID" value={user.id} />
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Bookings ({bookings.length})
        </h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400">No bookings found for this user.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const checkIn = b.checkIn?.toDate?.()?.toLocaleDateString() ?? b.checkIn ?? "—";
              const checkOut = b.checkOut?.toDate?.()?.toLocaleDateString() ?? b.checkOut ?? "—";
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {b.propertyTitle || b.propertyId || "Property"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {checkIn} → {checkOut}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{b.paid ?? b.totalPrice ?? 0} LYD</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : b.paymentStatus === "Refunded"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {b.paymentStatus || "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
