'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search, Trash2, Users, DollarSign, BookOpen, X, Building2, Plus, Pencil } from 'lucide-react';
import { deleteBookingById, fetchBookings, fetchProperties } from '../../service';
import ManualBookingModal from './ManualBookingModal';
import EditBookingModal from './EditBookingModal';

type Booking = {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  billingMethod?: string;
  paymentStatus?: string;
  paid?: number;
  totalPrice?: number;
  remainingToPay?: number;
  propertyId?: string;
  hostId?: string;
  guestId?: string;
  hostStatus?: string;
  guestStatus?: string;
  notes?: string;
};

const STATUS_LABELS: Record<string, string> = {
  notCheckedIn: "Not Checked In",
  checkedIn: "Checked In",
  canceled: "Canceled",
  CanceledFirst: "Canceled (First)",
};

const PAYMENT_COLORS: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-yellow-100 text-yellow-700',
  Refunded: 'bg-red-100 text-red-600',
  refunded: 'bg-red-100 text-red-600',
};

const STATUS_COLORS: Record<string, string> = {
  checkedIn: 'bg-green-100 text-green-700',
  notCheckedIn: 'bg-red-100 text-red-600',
  canceled: 'bg-red-100 text-red-600',
  CanceledFirst: 'bg-orange-100 text-orange-600',
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-sm flex items-center gap-4 ${color}`}>
      <div className="bg-white/20 rounded-xl p-3 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [propertyNames, setPropertyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'property'>('date');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [allProperties, setAllProperties] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetchBookings(), fetchProperties()]).then(([bookingData, propertyData]) => {
      const filtered = (bookingData as Booking[]).filter((b) => b.billingMethod !== 'external');
      filtered.sort((a, b) => {
        if (!a.checkIn && !b.checkIn) return 0;
        if (!a.checkIn) return 1;
        if (!b.checkIn) return -1;
        return b.checkIn.localeCompare(a.checkIn);
      });
      setBookings(filtered);
      // Build propertyId → name map
      const nameMap: Record<string, string> = {};
      (propertyData as { id: string; locationTitle?: string }[]).forEach((p) => {
        nameMap[p.id] = p.locationTitle || p.id;
      });
      setPropertyNames(nameMap);
      setAllProperties(propertyData as any[]);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const revenue = bookings.reduce((s, b) => s + (b.paid ?? 0), 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = bookings.filter((b) => {
      if (!b.checkIn) return false;
      const [d, m, y] = b.checkIn.split('/').map(Number);
      return new Date(y, m - 1, d) >= today;
    }).length;
    const guests = bookings.reduce((s, b) => s + (b.guests ?? 1), 0);
    return { total, revenue, upcoming, guests };
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = bookings.filter((b) => {
      const propName = (propertyNames[b.propertyId || ''] || '').toLowerCase();
      const matchSearch =
        !q ||
        b.fullName?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.phoneNumber?.includes(q) ||
        propName.includes(q) ||
        b.propertyId?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      const matchStatus =
        filterStatus === 'all' ||
        b.paymentStatus?.toLowerCase() === filterStatus;
      return matchSearch && matchStatus;
    });
    if (sortBy === 'property') {
      result.sort((a, b) => {
        const na = propertyNames[a.propertyId || ''] || '';
        const nb = propertyNames[b.propertyId || ''] || '';
        return na.localeCompare(nb);
      });
    }
    return result;
  }, [bookings, search, filterStatus, sortBy, propertyNames]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    setDeleting(id);
    const success = await deleteBookingById(id);
    if (success) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (selectedBooking?.id === id) setSelectedBooking(null);
    }
    setDeleting(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <button
          onClick={() => setShowManualBooking(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition flex-shrink-0"
        >
          <Plus size={16} />
          Manual Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={stats.total} icon={<BookOpen size={20} />} color="bg-blue-600" />
        <StatCard label="Upcoming Bookings" value={stats.upcoming} icon={<CalendarDays size={20} />} color="bg-emerald-500" />
        <StatCard label="Total Revenue" value={`${stats.revenue.toLocaleString()} LYD`} icon={<DollarSign size={20} />} color="bg-purple-500" />
        <StatCard label="Total Guests" value={stats.guests} icon={<Users size={20} />} color="bg-indigo-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name, email, phone, property…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'property')}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
        >
          <option value="date">Sort: Date</option>
          <option value="property">Sort: Property</option>
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Guest</th>
              <th className="text-left px-5 py-3 font-medium">Property</th>
              <th className="text-left px-5 py-3 font-medium">Dates</th>
              <th className="text-left px-5 py-3 font-medium">Amount</th>
              <th className="text-left px-5 py-3 font-medium">Payment</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                  No bookings found.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="hover:bg-blue-50/40 cursor-pointer transition"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800">{b.fullName || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.email || b.phoneNumber || ''}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate max-w-[140px]" title={propertyNames[b.propertyId || ''] || b.propertyId}>
                        {propertyNames[b.propertyId || ''] || b.propertyId || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <CalendarDays size={13} className="text-gray-400" />
                      <span>{b.checkIn || '—'}</span>
                    </div>
                    {b.checkOut && (
                      <p className="text-xs text-gray-400 mt-0.5 pl-5">→ {b.checkOut}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-blue-600">{b.paid ?? b.totalPrice ?? 0} LYD</p>
                    {(b.remainingToPay ?? 0) > 0 && (
                      <p className="text-xs text-orange-500 mt-0.5">{b.remainingToPay} remaining</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      label={b.paymentStatus || 'Pending'}
                      colorClass={PAYMENT_COLORS[b.paymentStatus || ''] || 'bg-gray-100 text-gray-600'}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    {b.hostStatus ? (
                      <Badge
                        label={STATUS_LABELS[b.hostStatus] || b.hostStatus}
                        colorClass={STATUS_COLORS[b.hostStatus] || 'bg-gray-100 text-gray-600'}
                      />
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBooking(b); }}
                        className="text-gray-300 hover:text-blue-500 transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                        disabled={deleting === b.id}
                        className="text-gray-300 hover:text-red-500 transition disabled:opacity-40"
                        title="Delete"
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

      {/* Card layout — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No bookings found.</p>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-800">{b.fullName || '—'}</p>
                  <p className="text-xs text-gray-400">{b.email || b.phoneNumber || ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    label={b.paymentStatus || 'Pending'}
                    colorClass={PAYMENT_COLORS[b.paymentStatus || ''] || 'bg-gray-100 text-gray-600'}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingBooking(b); }}
                    className="text-gray-300 hover:text-blue-500 transition"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                    disabled={deleting === b.id}
                    className="text-gray-300 hover:text-red-500 transition disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} className="text-gray-400" />
                  {b.checkIn || '—'} → {b.checkOut || '—'}
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600">{b.paid ?? b.totalPrice ?? 0} LYD</p>
            </div>
          ))
        )}
      </div>

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          propertyName={propertyNames[editingBooking.propertyId || '']}
          onClose={() => setEditingBooking(null)}
          onSaved={(updated) => {
            setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
            setSelectedBooking((prev) => prev?.id === updated.id ? updated : prev);
            setEditingBooking(null);
          }}
        />
      )}

      {showManualBooking && (
        <ManualBookingModal
          properties={allProperties}
          onClose={() => setShowManualBooking(false)}
          onCreated={(booking) => {
            setBookings((prev) => [booking, ...prev]);
            // Update property name map if needed
            setPropertyNames((prev) => ({ ...prev, [booking.propertyId]: allProperties.find(p => p.id === booking.propertyId)?.locationTitle || booking.propertyId }));
          }}
        />
      )}

      {/* Detail drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Guest */}
              <Section title="Guest">
                <Row label="Name" value={selectedBooking.fullName} />
                <Row label="Email" value={selectedBooking.email} />
                <Row label="Phone" value={selectedBooking.phoneNumber} />
                <Row label="Guests" value={String(selectedBooking.guests ?? 1)} />
              </Section>

              {/* Booking */}
              <Section title="Booking">
                <Row label="Check-in" value={selectedBooking.checkIn} />
                <Row label="Check-out" value={selectedBooking.checkOut} />
                <Row label="Property ID" value={selectedBooking.propertyId} />
                <Row label="Booking ID" value={selectedBooking.id} />
                <Row label="Notes" value={selectedBooking.notes} />
              </Section>

              {/* Payment */}
              <Section title="Payment">
                <Row label="Total Price" value={`${selectedBooking.totalPrice ?? 0} LYD`} />
                <Row label="Paid" value={`${selectedBooking.paid ?? 0} LYD`} />
                <Row label="Remaining" value={`${selectedBooking.remainingToPay ?? 0} LYD`} />
                <Row label="Billing Method" value={selectedBooking.billingMethod} />
                <Row label="Payment Status" value={selectedBooking.paymentStatus} />
              </Section>

              {/* Status */}
              <Section title="Check-in Status">
                <Row label="Host Status" value={STATUS_LABELS[selectedBooking.hostStatus || ''] || selectedBooking.hostStatus} />
                <Row label="Guest Status" value={STATUS_LABELS[selectedBooking.guestStatus || ''] || selectedBooking.guestStatus} />
              </Section>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setEditingBooking(selectedBooking)}
                className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Pencil size={15} />
                Edit Booking
              </button>
              <button
                onClick={() => handleDelete(selectedBooking.id)}
                disabled={deleting === selectedBooking.id}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                {deleting === selectedBooking.id ? 'Deleting…' : 'Delete Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-800 text-right break-all">{value}</span>
    </div>
  );
}
