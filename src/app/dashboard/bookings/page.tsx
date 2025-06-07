'use client'

type Booking = {
  id: string;
  checkIn?: string;
  billingMethod?: string;
  hostStatus?: string;
  guestStatus?: string;
  paymentStatus?: string;
};

import { useEffect, useState } from "react";
import { fetchBookings } from "../../service"; // adjust path as needed

const statusTextMap: { [key: string]: string } = {
  notCheckedIn: "Didn't CheckIn",
  checkedIn: "CheckedIn",
  canceled: "Canceled",
  CanceledFirst: "Canceled First",
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings().then((data) => {
      const filtered = data.filter((b: Booking) => b.billingMethod !== "external");
      setBookings(filtered);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Bookings</h1>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12">
      <h1 className="text-2xl font-semibold mb-4">Bookings</h1>

      {/* Table for desktop */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 border-b">Booking ID</th>
              <th className="text-left px-4 py-2 border-b">Check-in Date</th>
              <th className="text-left px-4 py-2 border-b">Status</th>
              <th className="text-left px-4 py-2 border-b">Host Confirmation</th>
              <th className="text-left px-4 py-2 border-b">Guest Confirmation</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const hostStatusText = statusTextMap[booking.hostStatus || ""] || booking.hostStatus || "";
              const guestStatusText = statusTextMap[booking.guestStatus || ""] || booking.guestStatus || "";
              const hostStatusColor = booking.hostStatus === "notCheckedIn" || booking.hostStatus === "canceled" || booking.hostStatus === "CanceledFirst" ? "text-red-600" : "text-green-700";
              const guestStatusColor = booking.guestStatus === "notCheckedIn" || booking.guestStatus === "canceled" || booking.guestStatus === "CanceledFirst" ? "text-red-600" : "text-red-700";

              return (
                <tr key={booking.id}>
                  <td className="px-4 py-2 border-b">{booking.id}</td>
                  <td className="px-4 py-2 border-b">{booking.checkIn}</td>
                  <td className="px-4 py-2 border-b">{booking.paymentStatus}</td>
                  <td className={`px-4 py-2 border-b ${hostStatusColor}`}>{hostStatusText}</td>
                  <td className={`px-4 py-2 border-b ${guestStatusColor}`}>{guestStatusText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Card layout for mobile */}
      <div className="block sm:hidden space-y-4">
        {bookings.map((booking) => {
          const hostStatusText = statusTextMap[booking.hostStatus || ""] || booking.hostStatus || "";
          const guestStatusText = statusTextMap[booking.guestStatus || ""] || booking.guestStatus || "";
          const hostStatusColor = booking.hostStatus === "notCheckedIn" || booking.hostStatus === "canceled" || booking.hostStatus === "CanceledFirst" ? "text-red-600" : "text-green-700";
          const guestStatusColor = booking.guestStatus === "notCheckedIn" || booking.guestStatus === "canceled" || booking.guestStatus === "CanceledFirst" ? "text-red-600" : "text-green-700";

          return (
            <div key={booking.id} className="border rounded-lg p-4 shadow-sm">
              <p className="font-semibold">Booking ID: <span className="font-normal">{booking.id}</span></p>
              <p>Check-in Date: {booking.checkIn}</p>
              <p>Payment Method: {booking.billingMethod}</p>
              <p className={hostStatusColor}>
                Host: {hostStatusText}
              </p>
              <p className={guestStatusColor}>
                Guest: {guestStatusText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingsPage;