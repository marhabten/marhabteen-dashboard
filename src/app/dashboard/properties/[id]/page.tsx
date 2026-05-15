"use client";
import {
  blockAllAvailableDates,
  deleteExternalBooking,
  deletePropertyById,
  deletePropertyImage,
  fetchExternalBookings,
  fetchPropertyById,
  toggleFeatured,
  updatePropertyDescription,
  updatePropertyDetails,
  updatePropertyTitle,
} from "@/app/service";
import { Ban, CalendarX, Pencil, Save, Star, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DateEntry {
  date: string;       // "dd/MM/yyyy"
  isAvailable: boolean;
  isBooked: boolean;
  price: number;
  bookingId?: string | null;
  isCustomPrice?: boolean;
}

interface RentalUnit {
  bedroom?: number;
  beds?: number;
  bathroom?: number;
  people?: number;
  kitchens?: number;
  livingRooms?: number;
  [key: string]: unknown;
}

interface Location {
  address?: string;
  locationDescription?: string;
  latitude?: number;
  longitude?: number;
}

interface Property {
  id: string;
  locationTitle: string;
  locationDescription: string;
  location?: Location;
  imageUrl: string;
  images: string[];
  ownerPropertyName: string;
  placeType: string;
  hostingType: string;
  email: string;
  isAvailable: boolean;
  isBooked: boolean;
  facilitiesName?: string[];
  rentalUnit?: RentalUnit;
  reviewData?: Record<string, unknown>;
  squareFeet?: string;
  cancelationPolicy?: string;
  isFeatured?: boolean;
  dates?: DateEntry[];
}

// ── Editable form state mirrors the fields the admin can change ──
interface DetailsForm {
  ownerPropertyName: string;
  email: string;
  placeType: string;
  hostingType: string;
  isAvailable: boolean;
  isBooked: boolean;
  squareFeet: string;
  cancelationPolicy: string;
  bedroom: number;
  beds: number;
  bathroom: number;
  people: number;
  locationTitleEn: string;
  locationTitleAr: string;
}

function formFromProperty(p: Property): DetailsForm {
  const ru = p.rentalUnit ?? {};
  return {
    ownerPropertyName: p.ownerPropertyName ?? "",
    email: p.email ?? "",
    placeType: p.placeType ?? "",
    hostingType: p.hostingType ?? "",
    isAvailable: p.isAvailable ?? false,
    isBooked: p.isBooked ?? false,
    squareFeet: p.squareFeet ?? "",
    cancelationPolicy: p.cancelationPolicy ?? "",
    bedroom: (ru.bedroom as number) ?? 1,
    beds: (ru.beds as number) ?? 1,
    bathroom: (ru.bathroom as number) ?? 1,
    people: (ru.people as number) ?? 0,
    locationTitleEn: p.location?.address ?? "",
    locationTitleAr: p.location?.locationDescription ?? "",
  };
}

// ── Small primitives ─────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-500 mb-1">{children}</label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
    />
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
    />
  );
}

function Toggle({
  checked,
  onChange,
  labelOn,
  labelOff,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{checked ? labelOn : labelOff}</span>
    </button>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Static display row ───────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-400 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || "—"}</span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────

export default function PropertyDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState<Property | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState(false);
  const [form, setForm] = useState<DetailsForm | null>(null);
  const [externalBookings, setExternalBookings] = useState<any[]>([]);
  const [deletingBooking, setDeletingBooking] = useState<string | null>(null);
  const [blockingDates, setBlockingDates] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      const [data, extBookings] = await Promise.all([
        fetchPropertyById(id),
        fetchExternalBookings(id),
      ]);
      if (data) {
        const p = data as Property;
        setProperty(p);
        setTitle(p.locationTitle || "");
        setDescription(p.locationDescription || "");
        setForm(formFromProperty(p));
      }
      setExternalBookings(extBookings);
      setLoading(false);
    }
    loadProperty();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  if (!property || !form)
    return <p className="text-center mt-10 text-gray-500">Property not found.</p>;

  // ── Handlers ──────────────────────────────────────────────────

  const handleDeleteImage = async (imageUrl: string) => {
    const success = await deletePropertyImage(property.id, imageUrl);
    if (success)
      setProperty((prev) => ({
        ...prev!,
        images: prev!.images.filter((img) => img !== imageUrl),
      }));
  };

  const handleUpdateTitle = async () => {
    const success = await updatePropertyTitle(property.id, title);
    if (success) {
      setProperty((prev) => ({ ...prev!, locationTitle: title }));
      setEditingTitle(false);
    }
  };

  const handleUpdateDescription = async () => {
    const success = await updatePropertyDescription(property.id, description);
    if (success) {
      setProperty((prev) => ({ ...prev!, locationDescription: description }));
      setEditingDescription(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!form) return;
    setSaving(true);

    const rentalUnit = {
      ...(property.rentalUnit ?? {}),
      bedroom: form.bedroom,
      beds: form.beds,
      bathroom: form.bathroom,
      people: form.people,
    };

    const success = await updatePropertyDetails(property.id, {
      ownerPropertyName: form.ownerPropertyName,
      email: form.email,
      placeType: form.placeType,
      hostingType: form.hostingType,
      isAvailable: form.isAvailable,
      isBooked: form.isBooked,
      squreFeet: form.squareFeet,       // Firestore uses this spelling
      cancelationPolicy: form.cancelationPolicy,
      location: {
        ...(property.location ?? {}),
        address: form.locationTitleEn,
        locationDescription: form.locationTitleAr,
      },
      rentalUnit,
    });

    if (success) {
      setProperty((prev) => ({
        ...prev!,
        ownerPropertyName: form.ownerPropertyName,
        email: form.email,
        placeType: form.placeType,
        hostingType: form.hostingType,
        isAvailable: form.isAvailable,
        isBooked: form.isBooked,
        squareFeet: form.squareFeet,
        cancelationPolicy: form.cancelationPolicy,
        rentalUnit,
      }));
      setEditingDetails(false);
    }
    setSaving(false);
  };

  const handleCancelDetails = () => {
    setForm(formFromProperty(property));
    setEditingDetails(false);
  };

  const handleToggleFeatured = async () => {
    setTogglingFeatured(true);
    const newValue = !property.isFeatured;
    const success = await toggleFeatured(property.id, newValue);
    if (success) setProperty((prev) => ({ ...prev!, isFeatured: newValue }));
    setTogglingFeatured(false);
  };

  const handleDeleteProperty = async () => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    const success = await deletePropertyById(property.id);
    if (success) router.push("/dashboard/properties");
  };

  const handleDeleteExternalBooking = async (bookingId: string) => {
    if (!confirm("Delete this external booking and free the dates?")) return;
    setDeletingBooking(bookingId);
    const success = await deleteExternalBooking(bookingId, property.id);
    if (success) setExternalBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setDeletingBooking(null);
  };

  const handleBlockAllAvailableDates = async () => {
    const dates = property.dates ?? [];
    const availableCount = dates.filter((d) => d.isAvailable && !d.isBooked).length;
    if (availableCount === 0) return;
    if (!confirm(`Mark all ${availableCount} available date(s) as unavailable? Booked dates will not be affected.`)) return;
    setBlockingDates(true);
    const updated = await blockAllAvailableDates(property.id, dates);
    if (updated) {
      setProperty((prev) => ({ ...prev!, dates: updated as DateEntry[] }));
    }
    setBlockingDates(false);
  };

  const set = <K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const rentalUnit = property.rentalUnit as RentalUnit | undefined;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="mt-12 md:mt-0 p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
      >
        ← Back to Properties
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-64 shadow-md">
        <img src={property.imageUrl || ""} alt={title} className="w-full h-full object-cover" />
        {property.isFeatured && (
          <span className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            <Star size={12} fill="white" /> Featured
          </span>
        )}
      </div>

      {/* Title + description + featured */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {/* Title */}
        {editingTitle ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 flex-1 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button onClick={handleUpdateTitle} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">Save</button>
            <button onClick={() => setEditingTitle(false)} className="text-gray-400 px-3 py-2 hover:text-gray-600 text-sm">Cancel</button>
          </div>
        ) : (
          <h1
            className="text-2xl font-bold flex items-center gap-2 cursor-pointer hover:text-blue-600 transition"
            onClick={() => setEditingTitle(true)}
          >
            {title || "Untitled"}
            <Pencil size={15} className="text-gray-300" />
          </h1>
        )}

        {/* Description */}
        {editingDescription ? (
          <div className="flex gap-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border border-gray-200 rounded-lg p-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex flex-col gap-2">
              <button onClick={handleUpdateDescription} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">Save</button>
              <button onClick={() => setEditingDescription(false)} className="text-gray-400 px-3 py-2 hover:text-gray-600 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <p
            className="text-gray-500 text-sm cursor-pointer flex items-start gap-2 hover:text-gray-700 transition"
            onClick={() => setEditingDescription(true)}
          >
            <span className="flex-1">{description || "No description. Click to add."}</span>
            <Pencil size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
          </p>
        )}

        {/* Featured toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-700">Featured Property</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Appears at the top of the home screen when 3+ properties are featured.
            </p>
          </div>
          <button
            onClick={handleToggleFeatured}
            disabled={togglingFeatured}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${
              property.isFeatured
                ? "bg-amber-400 text-white hover:bg-amber-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Star size={15} fill={property.isFeatured ? "white" : "none"} />
            {togglingFeatured ? "Saving…" : property.isFeatured ? "Remove Featured" : "Mark as Featured"}
          </button>
        </div>
      </div>

      {/* Property Details — view or edit */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Property Details</h2>
          {!editingDetails ? (
            <button
              onClick={() => setEditingDetails(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelDetails}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {editingDetails ? (
          /* ── Edit form ── */
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Owner Name</Label>
                <TextInput value={form.ownerPropertyName} onChange={(v) => set("ownerPropertyName", v)} />
              </div>
              <div>
                <Label>Email</Label>
                <TextInput value={form.email} onChange={(v) => set("email", v)} />
              </div>
              <div>
                <Label>Place Type</Label>
                <TextInput value={form.placeType} onChange={(v) => set("placeType", v)} placeholder="e.g. rest_house, villa, apartment" />
              </div>
              <div>
                <Label>Hosting Type</Label>
                <SelectInput
                  value={form.hostingType}
                  onChange={(v) => set("hostingType", v)}
                  options={[
                    { value: "all", label: "All" },
                    { value: "family", label: "Family" },
                    { value: "men_only", label: "Men Only" },
                    { value: "women_only", label: "Women Only" },
                  ]}
                />
              </div>
              <div>
                <Label>Square Feet</Label>
                <TextInput value={form.squareFeet} onChange={(v) => set("squareFeet", v)} placeholder="e.g. 250" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Address (English)</Label>
                <TextInput value={form.locationTitleEn} onChange={(v) => set("locationTitleEn", v)} placeholder="e.g. Tripoli, Libya" />
              </div>
              <div>
                <Label>Address (Arabic)</Label>
                <TextInput value={form.locationTitleAr} onChange={(v) => set("locationTitleAr", v)} placeholder="e.g. طرابلس، ليبيا" />
              </div>
            </div>

            <div>
              <Label>Cancellation Policy</Label>
              <textarea
                value={form.cancelationPolicy}
                onChange={(e) => set("cancelationPolicy", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Bedrooms</Label>
                <NumberInput value={form.bedroom} onChange={(v) => set("bedroom", v)} />
              </div>
              <div>
                <Label>Beds</Label>
                <NumberInput value={form.beds} onChange={(v) => set("beds", v)} />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <NumberInput value={form.bathroom} onChange={(v) => set("bathroom", v)} />
              </div>
              <div>
                <Label>Max Guests</Label>
                <NumberInput value={form.people} onChange={(v) => set("people", v)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <div className="flex items-center gap-3">
                <Toggle
                  checked={form.isAvailable}
                  onChange={(v) => set("isAvailable", v)}
                  labelOn="Available"
                  labelOff="Not Available"
                />
                <span className="text-sm text-gray-700">
                  {form.isAvailable ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={form.isBooked}
                  onChange={(v) => set("isBooked", v)}
                  labelOn="Booked"
                  labelOff="Not Booked"
                />
                <span className="text-sm text-gray-700">
                  {form.isBooked ? "Booked" : "Not Booked"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Read-only view ── */
          <div>
            <InfoRow label="Address (EN)" value={property.location?.address} />
            <InfoRow label="Address (AR)" value={property.location?.locationDescription} />
            <InfoRow label="Owner" value={property.ownerPropertyName} />
            <InfoRow label="Email" value={property.email} />
            <InfoRow label="Place Type" value={property.placeType} />
            <InfoRow label="Hosting Type" value={property.hostingType} />
            <InfoRow label="Availability" value={property.isAvailable ? "Available" : "Not Available"} />
            <InfoRow label="Booked" value={property.isBooked ? "Yes" : "No"} />
            <InfoRow label="Square Feet" value={property.squareFeet} />
            <InfoRow label="Cancellation Policy" value={property.cancelationPolicy} />
            {rentalUnit && (
              <>
                <InfoRow label="Bedrooms" value={String(rentalUnit.bedroom ?? "—")} />
                <InfoRow label="Beds" value={String(rentalUnit.beds ?? "—")} />
                <InfoRow label="Bathrooms" value={String(rentalUnit.bathroom ?? "—")} />
                <InfoRow label="Max Guests" value={String(rentalUnit.people ?? "—")} />
              </>
            )}
            {property.reviewData && (
              <InfoRow label="Rating" value={`${(property.reviewData.rating as number) ?? 0} / 5`} />
            )}
          </div>
        )}
      </div>

      {/* Facilities */}
      {(property.facilitiesName?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Facilities</h2>
          <div className="flex flex-wrap gap-2">
            {property.facilitiesName!.map((f) => (
              <span key={f} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Images ({property.images?.length ?? 0})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {property.images?.map((img) => (
            <div key={img} className="relative group rounded-xl overflow-hidden">
              <img src={img} alt="Property" className="w-full h-32 object-cover" />
              <button
                onClick={() => handleDeleteImage(img)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Available Dates */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parseDMY = (s: string) => {
          const [d, m, y] = s.split("/").map(Number);
          return new Date(y, m - 1, d);
        };

        const allDates = property.dates ?? [];
        const availableDates = allDates
          .filter((d) => d.isAvailable && !d.isBooked && parseDMY(d.date) >= today)
          .sort((a, b) => parseDMY(a.date).getTime() - parseDMY(b.date).getTime());

        const bookedCount = allDates.filter((d) => d.isBooked).length;

        // Group available dates by month
        const byMonth: Record<string, DateEntry[]> = {};
        for (const d of availableDates) {
          const dt = parseDMY(d.date);
          const key = dt.toLocaleString("en", { month: "long", year: "numeric" });
          if (!byMonth[key]) byMonth[key] = [];
          byMonth[key].push(d);
        }

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-700">
                  Available Dates
                  <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {availableDates.length} upcoming
                  </span>
                  {bookedCount > 0 && (
                    <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {bookedCount} booked
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Future dates where the property is open for bookings.
                </p>
              </div>
              <button
                onClick={handleBlockAllAvailableDates}
                disabled={blockingDates || availableDates.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {blockingDates ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Ban size={15} />
                )}
                Block All Available
              </button>
            </div>

            {availableDates.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No upcoming available dates.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(byMonth).map(([month, entries]) => (
                  <div key={month}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{month}</p>
                    <div className="flex flex-wrap gap-2">
                      {entries.map((d) => (
                        <span
                          key={d.date}
                          className="inline-flex flex-col items-center bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 text-xs"
                        >
                          <span className="font-medium text-green-800">{d.date.slice(0, 5)}</span>
                          {d.price > 0 && (
                            <span className="text-green-600 mt-0.5">{d.price} LYD</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* External Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarX size={17} className="text-orange-500" />
          <h2 className="text-base font-semibold text-gray-700">
            External Bookings
            {externalBookings.length > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {externalBookings.length}
              </span>
            )}
          </h2>
        </div>

        {externalBookings.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No external bookings for this property.</p>
        ) : (
          <div className="space-y-3">
            {externalBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {b.fullName || "Guest"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.checkIn} → {b.checkOut}
                    {b.phoneNumber ? ` · ${b.phoneNumber}` : ""}
                  </p>
                  {b.totalPrice > 0 && (
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">
                      {b.totalPrice.toLocaleString()} LYD
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteExternalBooking(b.id)}
                  disabled={deletingBooking === b.id}
                  title="Delete booking and free dates"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium transition disabled:opacity-50"
                >
                  {deletingBooking === b.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete property */}
      <button
        onClick={handleDeleteProperty}
        className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 py-3 rounded-xl transition font-medium text-sm"
      >
        Delete Property
      </button>
    </div>
  );
}
