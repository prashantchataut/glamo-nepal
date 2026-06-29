"use client";

import { type UseFormReturn } from "react-hook-form";
import type { CheckoutFormData } from "@/lib/validations/checkout";
import type { Address } from "@/lib/api/contracts";
import { PROVINCES, getDistrictsForProvince, getMunicipalitiesForDistrict, type Province, type District } from "@/lib/nepal-locations";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 md:rounded-[1.5rem] md:py-3 md:text-sm";
const labelClass =
  "mb-1.5 block text-sm font-medium text-neutral-700 md:mb-2";
const errorClass = "mt-1 text-xs text-error";

interface ShippingStepProps {
  form: UseFormReturn<CheckoutFormData>;
  savedAddresses: Address[];
  onApplySavedAddress: (addressId: string) => void;
  onContinue: () => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
}

export function ShippingStep({
  form,
  savedAddresses,
  onApplySavedAddress,
  onContinue,
  headingRef,
}: ShippingStepProps) {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const formData = watch();
  const districtOptions = getDistrictsForProvince(formData.province as Province);
  const municipalityNames = getMunicipalitiesForDistrict(formData.district as District).map((m) => m.name);

  function updateProvince(province: string) {
    const districts = getDistrictsForProvince(province as Province);
    setValue("province", province, { shouldValidate: true });
    setValue("district", districts[0] || "Kathmandu", { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
  }

  function updateDistrict(district: string) {
    setValue("district", district, { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl"
        onFocus={(e) => e.target.blur()}
      >
        Contact & shipping
      </h2>

      {savedAddresses.length > 0 && (
        <div>
          <label htmlFor="savedAddress" className={labelClass}>
            Use a saved address
          </label>
          <select
            id="savedAddress"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onApplySavedAddress(e.target.value);
            }}
            className={inputClass}
          >
            <option value="">Enter a new address</option>
            {savedAddresses.map((addr) => (
              <option key={addr.id} value={addr.id ?? ""}>
                {addr.fullName} - {addr.addressLine1}, {addr.city}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input
            id="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
            className={inputClass}
            placeholder="Your full name"
            autoComplete="name"
          />
          {errors.name && <p id="name-error" className={errorClass} role="alert">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone number</label>
          <input
            id="phone"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
            className={inputClass}
            placeholder="98XXXXXXXX"
            autoComplete="tel"
          />
          {errors.phone && <p id="phone-error" className={errorClass} role="alert">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
          className={inputClass}
          placeholder="your@email.com"
          autoComplete="email"
        />
        {errors.email && <p id="email-error" className={errorClass} role="alert">{errors.email.message}</p>}
        <p className="mt-1 text-xs text-neutral-500">For order confirmation and delivery updates.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <div>
          <label htmlFor="province" className={labelClass}>Province</label>
          <select id="province" {...register("province")} onChange={(e) => updateProvince(e.target.value)} className={inputClass}>
            {PROVINCES.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="district" className={labelClass}>District</label>
          <select
            id="district"
            aria-invalid={!!errors.district}
            aria-describedby={errors.district ? "district-error" : undefined}
            {...register("district")}
            onChange={(e) => updateDistrict(e.target.value)}
            className={inputClass}
          >
            {districtOptions.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
          {errors.district && <p id="district-error" className={errorClass} role="alert">{errors.district.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <div>
          <label htmlFor="city" className={labelClass}>City / municipality</label>
          <select
            id="city"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : undefined}
            {...register("city")}
            className={inputClass}
          >
            {municipalityNames.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
          {errors.city && <p id="city-error" className={errorClass} role="alert">{errors.city.message}</p>}
        </div>
        <div>
          <label htmlFor="ward" className={labelClass}>Ward</label>
          <input
            id="ward"
            aria-invalid={!!errors.ward}
            aria-describedby={errors.ward ? "ward-error" : undefined}
            {...register("ward")}
            className={inputClass}
            placeholder="Ward number"
            autoComplete="address-line2"
          />
          {errors.ward && <p id="ward-error" className={errorClass} role="alert">{errors.ward.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>Street address</label>
        <input
          id="address"
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "address-error" : undefined}
          {...register("address")}
          className={inputClass}
          placeholder="House no., street, locality"
          autoComplete="street-address"
        />
        {errors.address && <p id="address-error" className={errorClass} role="alert">{errors.address.message}</p>}
      </div>

      <button
        type="button"
        onClick={async () => {
          const valid = await trigger(["name", "phone", "province", "district", "city", "ward", "address"]);
          if (valid) onContinue();
        }}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-neutral-50 transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-neutral-300 md:w-auto"
      >
        Continue to delivery
      </button>
    </div>
  );
}