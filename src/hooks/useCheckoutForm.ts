"use client";

import { useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkoutSchema,
  type CheckoutFormData,
} from "@/lib/validations/checkout";

const STORAGE_KEY = "glamo-checkout-form";

function loadDraft(): Partial<CheckoutFormData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(data: Partial<CheckoutFormData>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — ignore
  }
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const defaultValues: CheckoutFormData = {
  name: "",
  email: "",
  phone: "",
  province: "Bagmati",
  district: "Kathmandu",
  city: "Kathmandu",
  ward: "",
  address: "",
  giftWrap: false,
  notes: "",
  payment: "Cash on Delivery",
};

export function useCheckoutForm() {
  const draft = useRef(loadDraft());

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: draft.current
      ? { ...defaultValues, ...draft.current }
      : defaultValues,
  });

  const { watch, reset } = form;
  const formData = watch();

  const saveKey = useCallback(() => {
    saveDraft(formData);
  }, [formData]);

  useEffect(() => {
    saveKey();
  }, [saveKey]);

  const resetForm = useCallback(() => {
    reset(defaultValues);
    clearCheckoutDraft();
  }, [reset]);

  return { form, formData, resetForm, clearDraft: clearCheckoutDraft };
}