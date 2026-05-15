'use client';

import { fetchUsers, createManualBooking } from '@/app/service';
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, Loader2, Search, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DateEntry = { date: string; isAvailable: boolean; isBooked: boolean; price: number; isCustomPrice: boolean };
type AnyProperty = { id: string; locationTitle?: string; imageUrl?: string; images?: string[]; hostId?: string; userPropertyId?: string; [key: string]: any };
type AnyUser = { id: string; [key: string]: any };

interface Props {
  properties: AnyProperty[];
  onClose: () => void;
  onCreated: (booking: any) => void;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function htmlToFs(html: string) {
  // YYYY-MM-DD → dd/MM/yyyy
  if (!html) return '';
  const [y, m, d] = html.split('-');
  return `${d}/${m}/${y}`;
}

function fsToDate(fs: string): Date {
  const [d, m, y] = fs.split('/').map(Number);
  return new Date(y, m - 1, d);
}

function dateToFs(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function htmlToDate(html: string): Date {
  const [y, m, d] = html.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function nightsBetween(checkInHtml: string, checkOutHtml: string): string[] {
  if (!checkInHtml || !checkOutHtml) return [];
  const start = htmlToDate(checkInHtml);
  const end = htmlToDate(checkOutHtml);
  if (end <= start) return [];
  const nights: string[] = [];
  const cur = new Date(start);
  while (cur < end) {
    nights.push(dateToFs(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepDot({ n, current }: { n: number; current: number }) {
  const done = n < current;
  const active = n === current;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition
      ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-400'}`}>
      {done ? <Check size={14} /> : n}
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const labels = ['Property', 'Guest', 'Dates & Payment'];
  return (
    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <div className={`h-0.5 w-6 rounded ${i < step ? 'bg-blue-500' : 'bg-gray-200'}`} />}
          <div className="flex items-center gap-1.5">
            <StepDot n={i + 1} current={step} />
            <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ManualBookingModal({ properties, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);

  // Step 1 — property
  const [propSearch, setPropSearch] = useState('');
  const [selectedProp, setSelectedProp] = useState<AnyProperty | null>(null);

  // Step 2 — guest
  const [allUsers, setAllUsers] = useState<AnyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AnyUser | null>(null);
  const [guestMode, setGuestMode] = useState<'search' | 'manual'>('search');
  const [guestForm, setGuestForm] = useState({ fullName: '', email: '', phoneNumber: '', guests: 1, guestId: '' });

  // Step 3 — dates + payment
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [billingMethod, setBillingMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [manualTotal, setManualTotal] = useState<string>('');
  const [manualPaid, setManualPaid] = useState<string>('');
  const [manualRemaining, setManualRemaining] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load users when entering step 2
  useEffect(() => {
    if (step === 2 && allUsers.length === 0) {
      setLoadingUsers(true);
      fetchUsers().then(({ users: u }) => { setAllUsers(u as AnyUser[]); setLoadingUsers(false); });
    }
  }, [step]);

  // ── Price calculation ──────────────────────────────────────────────────────

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const propertyDates: DateEntry[] = selectedProp?.dates || [];

  const nightlyPrices = useMemo(() =>
    nights.map((dateStr) => {
      const entry = propertyDates.find((d) => d.date === dateStr);
      return { date: dateStr, price: entry?.price ?? 0, booked: entry?.isBooked ?? false };
    }),
    [nights, propertyDates]
  );

  const hasBookedConflict = nightlyPrices.some((n) => n.booked);

  const baseTotal = nightlyPrices.reduce((s, n) => s + n.price, 0);
  const appFee = baseTotal * 0.02;
  const calcTotal = baseTotal + appFee;
  const isCash = billingMethod === 'cash';
  const calcAdvance = isCash ? 0 : baseTotal * 0.10 + appFee;
  const calcRemaining = isCash ? calcTotal : calcTotal - calcAdvance;

  // When calc values change, sync manual fields if not overridden
  useEffect(() => {
    if (!manualTotal) setManualTotal('');
    if (!manualPaid) setManualPaid('');
    if (!manualRemaining) setManualRemaining('');
  }, [billingMethod]);

  const finalTotal = manualTotal !== '' ? parseFloat(manualTotal) : calcTotal;
  const finalPaid = manualPaid !== '' ? parseFloat(manualPaid) : calcAdvance;
  const finalRemaining = manualRemaining !== '' ? parseFloat(manualRemaining) : calcRemaining;

  // ── Filtered lists ─────────────────────────────────────────────────────────

  const filteredProps = useMemo(() => {
    const q = propSearch.toLowerCase();
    return properties.filter((p) =>
      !q || (p.locationTitle || '').toLowerCase().includes(q)
    );
  }, [properties, propSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return allUsers.filter((u) => {
      const name = ((u['1_name'] as string) || (u['name'] as string) || '').toLowerCase();
      const phone = ((u['3_phoneNumber'] as string) || '').toLowerCase();
      const email = ((u['2_email'] as string) || (u['email'] as string) || '').toLowerCase();
      return !q || name.includes(q) || phone.includes(q) || email.includes(q);
    }).slice(0, 30);
  }, [allUsers, userSearch]);

  // ── Step navigation ────────────────────────────────────────────────────────

  const canNext1 = !!selectedProp;
  const canNext2 = guestMode === 'search' ? !!selectedUser : guestForm.fullName.trim() !== '' && guestForm.phoneNumber.trim() !== '';
  const canSave = nights.length > 0 && checkIn && checkOut;

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => { setStep((s) => s - 1); setError(''); };

  const selectUser = (u: AnyUser) => {
    setSelectedUser(u);
    setGuestForm({
      fullName: (u['1_name'] as string) || (u['name'] as string) || '',
      email: (u['2_email'] as string) || (u['email'] as string) || '',
      phoneNumber: (u['3_phoneNumber'] as string) || '',
      guests: 1,
      guestId: u.id,
    });
  };

  const handleSave = async () => {
    setError('');
    if (!selectedProp || !checkIn || !checkOut) { setError('Please fill all required fields.'); return; }

    setSaving(true);
    const bookingId = Date.now().toString();
    const hostId = selectedProp.userPropertyId || selectedProp.hostId || '';

    const booking = {
      id: bookingId,
      fullName: guestForm.fullName,
      email: guestForm.email,
      phoneNumber: guestForm.phoneNumber,
      guests: guestForm.guests,
      checkIn: htmlToFs(checkIn),
      checkOut: htmlToFs(checkOut),
      billingMethod,
      paymentStatus,
      notes,
      propertyId: selectedProp.id,
      hostId,
      guestId: guestForm.guestId,
      totalPrice: finalTotal,
      remainingToPay: finalRemaining,
      paid: finalPaid,
    };

    const ok = await createManualBooking(booking);
    setSaving(false);

    if (ok) {
      onCreated({ ...booking, hostStatus: 'pending', guestStatus: 'pending' });
      onClose();
    } else {
      setError('Failed to save booking. Please try again.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-800 text-lg">Manual Booking</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <StepBar step={step} />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Property ── */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  placeholder="Search property name…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredProps.map((p) => {
                  const img = p.images?.[0] || p.imageUrl;
                  const active = selectedProp?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProp(p)}
                      className={`text-left rounded-xl border-2 overflow-hidden transition ${active ? 'border-blue-500 shadow-md' : 'border-gray-100 hover:border-blue-200'}`}
                    >
                      {img && <img src={img} alt="" className="w-full h-28 object-cover" />}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-800 truncate">{p.locationTitle || p.id}</p>
                          {active && <Check size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {p.location?.address || p.location?.locationDescription || ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {filteredProps.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8 col-span-2">No properties found.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Guest ── */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              {/* Mode tabs */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button
                  onClick={() => setGuestMode('search')}
                  className={`flex-1 py-2 text-sm font-medium transition ${guestMode === 'search' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Search Existing User
                </button>
                <button
                  onClick={() => setGuestMode('manual')}
                  className={`flex-1 py-2 text-sm font-medium transition ${guestMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Enter Manually
                </button>
              </div>

              {guestMode === 'search' ? (
                <>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, phone or email…"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={22} className="animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <ul className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredUsers.map((u) => {
                        const name = (u['1_name'] as string) || (u['name'] as string) || 'Unknown';
                        const sub = (u['3_phoneNumber'] as string) || (u['2_email'] as string) || (u['email'] as string) || '';
                        const active = selectedUser?.id === u.id;
                        return (
                          <li key={u.id}>
                            <button
                              onClick={() => selectUser(u)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition border-2 ${active ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                            >
                              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                                {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
                              </div>
                              {active && <Check size={15} className="text-blue-600 flex-shrink-0" />}
                            </button>
                          </li>
                        );
                      })}
                      {filteredUsers.length === 0 && !loadingUsers && (
                        <p className="text-center text-gray-400 text-sm py-6">No users found.</p>
                      )}
                    </ul>
                  )}
                  {selectedUser && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
                      <User size={14} />
                      <span className="font-medium">{guestForm.fullName}</span>
                      <span className="text-blue-400">·</span>
                      <span>{guestForm.phoneNumber}</span>
                    </div>
                  )}
                  {/* Editable fields even when user is selected */}
                  {selectedUser && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                        <input value={guestForm.fullName} onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                        <input value={guestForm.phoneNumber} onChange={(e) => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Email <span className="text-gray-300">(optional)</span></label>
                        <input value={guestForm.email} onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Guests</label>
                        <input type="number" min={1} value={guestForm.guests} onChange={(e) => setGuestForm({ ...guestForm, guests: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Manual entry */
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
                    <input value={guestForm.fullName} onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                    <input value={guestForm.phoneNumber} onChange={(e) => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Email <span className="text-gray-300">(optional)</span></label>
                    <input value={guestForm.email} onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Number of Guests</label>
                    <input type="number" min={1} value={guestForm.guests} onChange={(e) => setGuestForm({ ...guestForm, guests: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Dates & Payment ── */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Check-in *</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Check-out *</label>
                  <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Conflict warning */}
              {hasBookedConflict && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
                  ⚠️ Some dates in this range are already booked. The booking will still be created — verify with the host.
                </div>
              )}

              {/* Nightly breakdown */}
              {nights.length > 0 && (
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-2">
                    Nightly Breakdown — {nights.length} night{nights.length !== 1 ? 's' : ''}
                  </p>
                  <div className="max-h-36 overflow-y-auto px-4 pb-3 space-y-1">
                    {nightlyPrices.map((n) => (
                      <div key={n.date} className="flex items-center justify-between text-sm">
                        <span className={`text-gray-600 ${n.booked ? 'line-through text-orange-400' : ''}`}>{n.date}</span>
                        <span className={`font-medium ${n.booked ? 'text-orange-400' : 'text-gray-800'}`}>
                          {n.booked ? 'Booked' : `${n.price} LYD`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Billing Method</label>
                  <select value={billingMethod} onChange={(e) => { setBillingMethod(e.target.value); setManualPaid(''); setManualRemaining(''); }}
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
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Price summary */}
              {nights.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base total ({nights.length} nights)</span>
                    <span className="font-medium">{baseTotal.toFixed(2)} LYD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">App fee (2%)</span>
                    <span className="font-medium">{appFee.toFixed(2)} LYD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-blue-200">
                    <span>Total</span>
                    <span className="text-blue-700">{calcTotal.toFixed(2)} LYD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{isCash ? 'Advance (cash)' : 'Advance (12%)'}</span>
                    <span className={isCash ? 'text-gray-400' : 'font-medium'}>{calcAdvance.toFixed(2)} LYD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-medium">{calcRemaining.toFixed(2)} LYD</span>
                  </div>
                </div>
              )}

              {/* Manual price overrides */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Override Amounts (optional)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Total (LYD)</label>
                    <input type="number" placeholder={calcTotal.toFixed(2)} value={manualTotal} onChange={(e) => setManualTotal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Paid (LYD)</label>
                    <input type="number" placeholder={calcAdvance.toFixed(2)} value={manualPaid} onChange={(e) => setManualPaid(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Remaining (LYD)</label>
                    <input type="number" placeholder={calcRemaining.toFixed(2)} value={manualRemaining} onChange={(e) => setManualRemaining(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Any notes for this booking…"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
              </div>

              {/* Booking summary card */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm space-y-1.5">
                <p className="font-semibold text-gray-700 mb-2">Summary</p>
                <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium truncate max-w-[60%] text-right">{selectedProp?.locationTitle}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Guest</span><span className="font-medium">{guestForm.fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{guestForm.phoneNumber}</span></div>
                {guestForm.email && <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{guestForm.email}</span></div>}
                {checkIn && checkOut && <div className="flex justify-between"><span className="text-gray-500">Dates</span><span>{htmlToFs(checkIn)} → {htmlToFs(checkOut)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Guests</span><span>{guestForm.guests}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="capitalize">{billingMethod}</span></div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          {step > 1 && (
            <button onClick={goBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
            >
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition min-w-[140px] justify-center"
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Check size={15} /> Create Booking</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
