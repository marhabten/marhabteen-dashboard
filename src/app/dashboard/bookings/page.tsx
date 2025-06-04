'use client'

type Booking = {
  id: string;
  checkIn?: string;
  billingMethod?: string;
  hostStatus?: string;
  guestStatus?: string;
};

import { useEffect, useState } from "react";
import { fetchBookings } from "../../service"; // adjust path as needed

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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Bookings</h1>

      {/* Table for desktop */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 border-b">Booking ID</th>
              <th className="text-left px-4 py-2 border-b">Check-in Date</th>
              <th className="text-left px-4 py-2 border-b">Payment Method</th>
              <th className="text-left px-4 py-2 border-b">Host Confirmation</th>
              <th className="text-left px-4 py-2 border-b">Guest Confirmation</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-4 py-2 border-b">{booking.id}</td>
                <td className="px-4 py-2 border-b">{booking.checkIn}</td>
                <td className="px-4 py-2 border-b">{booking.billingMethod}</td>
                <td className={`px-4 py-2 border-b ${booking.hostStatus == "notCheckedIn" ? "text-red-600" : "text-green-700"}`}>{booking.hostStatus == "notCheckedIn" ? "Didn't CheckIn" : "CheckedIn"}</td>
                <td className={`px-4 py-2 border-b ${booking.guestStatus == "notCheckedIn" ? "text-red-600" : "text-green-700"}`}>{booking.guestStatus == "notCheckedIn" ? "Didn't CheckIn" : "CheckedIn"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card layout for mobile */}
      <div className="block sm:hidden space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="border rounded-lg p-4 shadow-sm">
            <p className="font-semibold">Booking ID: <span className="font-normal">{booking.id}</span></p>
            <p>Check-in Date: {booking.checkIn}</p>
            <p>Payment Method: {booking.billingMethod}</p>
            <p className={booking.hostStatus === "notCheckedIn" ? "text-red-600" : "text-green-700"}>
              Host: {booking.hostStatus === "notCheckedIn" ? "Didn't CheckIn" : "CheckedIn"}
            </p>
            <p className={booking.guestStatus === "notCheckedIn" ? "text-red-600" : "text-green-700"}>
              Guest: {booking.guestStatus === "notCheckedIn" ? "Didn't CheckIn" : "CheckedIn"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingsPage;