'use client';

import { updateBooking } from '@/app/service';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';

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

interface Props {
  booking: Booking;
  propertyName?: string;
  onClose: () => void;
  onSaved: (updated: Booking) => void;
}

// "dd/MM/yyyy" → "YYYY-MM-DD" (HTML date input value)
function fsToHtml(fs: string): string {
  if (!fs) return '';
  const [d, m, y] = fs.split('/');
  if (!d || !m || !y) return '';
  return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" → "dd/MM/yyyy"
function htmlToFs(html: string): string {
  if (!html) return '';
  const [y, m, d] = html.split('-');
  return `${d}/${m}/${y}`;
}

function nightsBetween(checkInHtml: string, checkOutHtml: string): number {
  if (!checkInHtml || !checkOutHtml) return 0;
  const a = new Date(checkInHtml);
  const b = new Date(checkOutHtml);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export default function EditBookingModal({ booking, propertyName, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    fullName: booking.fullName ?? '',
    email: booking.email ?? '',
    phoneNumber: booking.phoneNumber ?? '',
    guests: booking.guests ?? 1,
    checkIn: fsToHtml(booking.checkIn ?? ''),
    checkOut: fsToHtml(booking.checkOut ?? ''),
    billingMethod: booking.billingMethod ?? 'cash',
    paymentStatus: booking.paymentStatus ?? 'pending',
    hostStatus: booking.hostStatus ?? 'notCheckedIn',
    guestStatus: booking.guestStatus ?? 'notCheckedIn',
    notes: booking.notes ?? '',
    totalPrice: String(booking.totalPrice ?? 0),
    paid: String(booking.paid ?? 0),
    remainingToPay: String(booking.remainingToPay ?? 0),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const datesChanged =
    htmlToFs(form.checkIn) !== (booking.checkIn ?? '') ||
    htmlToFs(form.checkOut) !== (booking.checkOut ?? '');

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.checkIn || !form.checkOut) { setError('Check-in and check-out are required.'); return; }
    if (nights < 1) { setError('Check-out must be after check-in.'); return; }
    setError('');
    setSaving(true);

    const payload = {
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      guests: Number(form.guests),
      checkIn: htmlToFs(form.checkIn),
      checkOut: htmlToFs(form.checkOut),
      billingMethod: form.billingMethod,
      paymentStatus: form.paymentStatus,
      hostStatus: form.hostStatus,
      guestStatus: form.guestStatus,
      notes: form.notes,
      totalPrice: parseFloat(form.totalPrice) || 0,
      paid: parseFloat(form.paid) || 0,
      remainingToPay: parseFloat(form.remainingToPay) || 0,
      propertyId: booking.propertyId ?? '',
    };

    const ok = await updateBooking(
      booking.id,
      booking.checkIn ?? '',
      booking.checkOut ?? '',
      payload,
    );

    setSaving(false);

    if (ok) {
      onSaved({ ...booking, ...payload });
      onClose();
    } else {
      setError('Failed to save changes. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Edit Booking</h2>
            {propertyName && <p className="text-xs text-gray-400 mt-0.5">{propertyName}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Guest info */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Guest Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                <input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input value={form.email} onChange={(e) => set('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Guests</label>
                <input type="number" min={1} value={form.guests} onChange={(e) => set('guests', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
          </section>

          {/* Dates */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dates</p>
              {datesChanged && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  Dates changed — property availability will be updated
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Check-in *</label>
                <input type="date" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Check-out *</label>
                <input type="date" value={form.checkOut} min={form.checkIn} onChange={(e) => set('checkOut', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
            {nights > 0 && (
              <p className="text-xs text-gray-400 mt-2">{nights} night{nights !== 1 ? 's' : ''}</p>
            )}
          </section>

          {/* Payment */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Billing Method</label>
                <select value={form.billingMethod} onChange={(e) => set('billingMethod', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="cash">Cash on Arrival</option>
                  <option value="wallet">Wallet</option>
                  <option value="sedaad">Sedaad</option>
                  <option value="tadawel">Tadawel</option>
                  <option value="edfaa">Edfaa</option>
                  <option value="bidaka">Bidaka</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Payment Status</label>
                <select value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Total (LYD)</label>
                <input type="number" value={form.totalPrice} onChange={(e) => set('totalPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Paid (LYD)</label>
                <input type="number" value={form.paid} onChange={(e) => set('paid', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Remaining (LYD)</label>
                <input type="number" value={form.remainingToPay} onChange={(e) => set('remainingToPay', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
          </section>

          {/* Status */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Check-in Status</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Host Status</label>
                <select value={form.hostStatus} onChange={(e) => set('hostStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="pending">Pending</option>
                  <option value="notCheckedIn">Not Checked In</option>
                  <option value="checkedIn">Checked In</option>
                  <option value="canceled">Canceled</option>
                  <option value="CanceledFirst">Canceled (First)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Guest Status</label>
                <select value={form.guestStatus} onChange={(e) => set('guestStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="pending">Pending</option>
                  <option value="notCheckedIn">Not Checked In</option>
                  <option value="checkedIn">Checked In</option>
                  <option value="canceled">Canceled</option>
                  <option value="CanceledFirst">Canceled (First)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition min-w-[130px] justify-center"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Check size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
