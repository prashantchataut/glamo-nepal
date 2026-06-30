// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewStep } from "@/components/checkout/steps/ReviewStep";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { GlamoApiError } from "@/lib/api/client";
import type { ApiResponse, Order } from "@/lib/api/contracts";

vi.mock("@/lib/api/checkout", () => ({
  createCheckoutOrder: vi.fn(),
  validateCoupon: vi.fn(),
}));

import { createCheckoutOrder } from "@/lib/api/checkout";

describe("checkout retry UX", () => {
  beforeEach(() => {
    useCheckoutStore.setState({
      status: "idle",
      error: null,
      errorCode: null,
      lastOrder: null,
      orders: [],
      couponCode: null,
      discountAmount: 0,
      couponError: null,
      couponLoading: false,
    });
    vi.clearAllMocks();
  });

  const orderBase = {
    orderNumber: "GLM-2025-TEST01",
    total: 1500,
    paymentMethod: "Cash on Delivery",
    shippingAddress: "Test Address, Ward 1, Kathmandu, Bagmati, Bagmati Province, Nepal",
    customerName: "Test User",
    customerPhone: "9800000000",
    items: [
      { name: "Test Serum", brand: "Test Brand", image: "/test.jpg", price: 1500, quantity: 1 },
    ],
  };

  const payload = {
    customer: { name: "Test User", email: "test@example.com", phone: "9800000000" },
    shippingAddress: {
      fullName: "Test User",
      phone: "9800000000",
      province: "Bagmati Province",
      district: "Kathmandu",
      city: "Kathmandu",
      ward: "1",
      addressLine1: "Test Address",
    },
    items: [
      {
        productId: "prod-1",
        name: "Test Serum",
        price: 1500,
        quantity: 1,
        image: "/test.jpg",
        brand: "Test Brand",
      },
    ],
    paymentMethod: "cod",
    deliveryFee: 0,
    subtotal: 1500,
    grandTotal: 1500,
    currency: "NPR" as const,
  };

  it("surfaces the server error message and allows retry", async () => {
    const mockedCreate = vi.mocked(createCheckoutOrder);
    mockedCreate.mockRejectedValueOnce(
      new GlamoApiError({ status: "error", message: "INSUFFICIENT_STOCK: Only 2 left", code: "INSUFFICIENT_STOCK" }, 422),
    );

    const { placeOrder } = useCheckoutStore.getState();
    await expect(placeOrder(orderBase, payload)).rejects.toBeTruthy();

    expect(useCheckoutStore.getState().status).toBe("failed");
    expect(useCheckoutStore.getState().error).toBe("INSUFFICIENT_STOCK: Only 2 left");
    expect(useCheckoutStore.getState().errorCode).toBe("INSUFFICIENT_STOCK");

    // Retry succeeds
    mockedCreate.mockResolvedValueOnce({
      status: "success",
      data: {
        id: "order-123",
        orderNumber: orderBase.orderNumber,
        total: orderBase.total,
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "pending",
        subtotal: orderBase.total,
        shippingCharge: 0,
        codFee: 0,
        giftWrapFee: 0,
        discountAmount: 0,
        totalAmount: orderBase.total,
        createdAt: new Date().toISOString(),
      },
    } as unknown as ApiResponse<Order>);

    await placeOrder(orderBase, payload);

    expect(useCheckoutStore.getState().status).toBe("success");
    expect(useCheckoutStore.getState().error).toBeNull();
    expect(useCheckoutStore.getState().errorCode).toBeNull();
    expect(useCheckoutStore.getState().lastOrder).toMatchObject({ id: "order-123" });
  });

  it("ReviewStep renders the server error and keeps submit enabled", () => {
    const onSubmit = vi.fn();
    const onBack = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ReviewStep
        form={{
          name: "Test User",
          email: "test@example.com",
          phone: "9800000000",
          province: "Bagmati Province",
          district: "Kathmandu",
          city: "Kathmandu",
          ward: "1",
          address: "Test Address",
          payment: "Cash on Delivery",
          giftWrap: false,
          notes: "",
        }}
        items={[
          {
            product: { id: "prod-1", name: "Test Serum", brand: "Test Brand", price: 1500, image: "/test.jpg" },
            quantity: 1,
          },
        ] as unknown as Parameters<typeof ReviewStep>[0]["items"]}
        subtotal={1500}
        deliveryFee={0}
        giftWrapFee={0}
        codFee={0}
        discountAmount={0}
        total={1500}
        isSubmitting={false}
        canSubmit={true}
        submitError="INSUFFICIENT_STOCK: Only 2 left"
        onBack={onBack}
        onSubmit={onSubmit}
        onDismissError={onDismiss}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("INSUFFICIENT_STOCK: Only 2 left");
    const tryAgain = screen.getByRole("button", { name: /try again/i });
    expect(tryAgain).toBeEnabled();

    fireEvent.click(tryAgain);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    const placeOrderBtn = screen.getByRole("button", { name: /place order/i });
    expect(placeOrderBtn).toBeEnabled();
  });

  it("ReviewStep disables the submit button only while submitting", () => {
    const { rerender } = render(
      <ReviewStep
        form={{
          name: "Test User",
          email: "test@example.com",
          phone: "9800000000",
          province: "Bagmati Province",
          district: "Kathmandu",
          city: "Kathmandu",
          ward: "1",
          address: "Test Address",
          payment: "Cash on Delivery",
          giftWrap: false,
          notes: "",
        }}
        items={[]}
        subtotal={0}
        deliveryFee={0}
        giftWrapFee={0}
        codFee={0}
        discountAmount={0}
        total={0}
        isSubmitting={true}
        canSubmit={true}
        submitError={null}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
        onDismissError={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /placing order/i })).toBeDisabled();

    rerender(
      <ReviewStep
        form={{
          name: "Test User",
          email: "test@example.com",
          phone: "9800000000",
          province: "Bagmati Province",
          district: "Kathmandu",
          city: "Kathmandu",
          ward: "1",
          address: "Test Address",
          payment: "Cash on Delivery",
          giftWrap: false,
          notes: "",
        }}
        items={[]}
        subtotal={0}
        deliveryFee={0}
        giftWrapFee={0}
        codFee={0}
        discountAmount={0}
        total={0}
        isSubmitting={false}
        canSubmit={true}
        submitError={null}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
        onDismissError={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /place order/i })).toBeEnabled();
  });
});
