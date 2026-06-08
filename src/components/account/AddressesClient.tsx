"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPinned, Plus, Pencil, Trash2, Star, Check } from "lucide-react";
import type { Address } from "@/lib/api/contracts";
import { customerApi, type CreateAddressPayload } from "@/lib/api/customer";
import { GlamoApiError } from "@/lib/api/client";
import { getUserMessage } from "@/lib/api/error-handler";

const NEPAL_PROVINCES = [
  "Province 1",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

const emptyForm: CreateAddressPayload = {
  fullName: "",
  phone: "",
  province: "Bagmati Province",
  district: "",
  city: "",
  ward: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
};

export function AddressesClient() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAddressPayload>(emptyForm);
  const [isSaving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await customerApi.addresses();
      setAddresses(res.data || []);
    } catch (err) {
      setLoadError(getUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(addr: Address) {
    setEditingId(addr.id || null);
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      city: addr.city,
      ward: addr.ward,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await customerApi.updateAddress(editingId, form);
        toast.success("Address updated");
      } else {
        await customerApi.createAddress(form);
        toast.success("Address added");
      }
      const res = await customerApi.addresses();
      setAddresses(res.data || []);
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      const msg = err instanceof GlamoApiError ? err.message : "Failed to save address";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await customerApi.deleteAddress(id);
      toast.success("Address removed");
      const res = await customerApi.addresses();
      setAddresses(res.data || []);
    } catch {
      toast.error("Failed to remove address");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await customerApi.setDefaultAddress(id);
      const res = await customerApi.addresses();
      setAddresses(res.data || []);
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to set default");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-8 rounded-[2rem] border border-error/30 bg-error/5 p-12 text-center">
        <p className="text-sm text-error">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadAddresses()}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-label text-primary">Addresses</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-neutral-900 md:text-5xl">Saved delivery addresses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">Manage your Nepal delivery addresses for faster checkout.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} /> Add address
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-editorial md:p-8">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            {editingId ? "Edit address" : "New address"}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Full Name *</label>
              <input id="fullName" type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Full name" />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Phone *</label>
              <input id="phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="98XXXXXXXX" />
            </div>
            <div>
              <label htmlFor="province" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Province *</label>
              <select id="province" required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
                {NEPAL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="district" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">District *</label>
              <input id="district" type="text" required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Kathmandu" />
            </div>
            <div>
              <label htmlFor="city" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">City/Municipality *</label>
              <input id="city" type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Kathmandu" />
            </div>
            <div>
              <label htmlFor="ward" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Ward No. *</label>
              <input id="ward" type="text" required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="4" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine1" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Street Address *</label>
              <input id="addressLine1" type="text" required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="House no., street name" />
            </div>
            <div>
              <label htmlFor="addressLine2" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Address Line 2</label>
              <input id="addressLine2" type="text" value={form.addressLine2 || ""} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Apartment, suite (optional)" />
            </div>
            <div>
              <label htmlFor="landmark" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">Landmark</label>
              <input id="landmark" type="text" value={form.landmark || ""} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Near Thamel, etc." />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
              {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check size={16} />}
              {isSaving ? "Saving..." : editingId ? "Update address" : "Add address"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="mt-8 border border-primary/20 bg-primary/5 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-primary/10 text-primary"><MapPinned size={24} /></div>
          <p className="mt-4 font-display text-xl font-semibold text-neutral-900">No saved addresses yet</p>
          <p className="mt-2 text-sm leading-7 text-neutral-600">Add a delivery address for faster checkout.</p>
          <button type="button" onClick={startCreate} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">Add your first address &rarr;</button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className={`relative rounded-[1.5rem] border bg-white p-5 shadow-editorial transition ${addr.isDefault ? "border-primary ring-2 ring-primary/20" : "border-neutral-200"}`}>
              {addr.isDefault && (
                <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Star size={10} /> Default
                </div>
              )}
              <p className="font-semibold text-neutral-900">{addr.fullName}</p>
              <p className="mt-1 text-sm text-neutral-600">{addr.phone}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
                {addr.ward}, {addr.city}, {addr.district}<br />
                {addr.province}
                {addr.landmark ? ` — Near ${addr.landmark}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(addr)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50">
                  <Pencil size={12} /> Edit
                </button>
                {!addr.isDefault && (
                  <button type="button" onClick={() => handleSetDefault(addr.id!)} className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5">
                    <Star size={12} /> Set default
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(addr.id!)} disabled={deletingId === addr.id} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                  {deletingId === addr.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" /> : <Trash2 size={12} />}
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}