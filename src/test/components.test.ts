import { describe, it, expect } from "vitest";
import { orderStatusToVariant, stockStatusToVariant } from "@/components/admin/shared/StatusPill";

describe("orderStatusToVariant", () => {
  it("maps pending to warning", () => {
    expect(orderStatusToVariant("pending")).toBe("warning");
  });

  it("maps confirmed to info", () => {
    expect(orderStatusToVariant("confirmed")).toBe("info");
  });

  it("maps processing to info", () => {
    expect(orderStatusToVariant("processing")).toBe("info");
  });

  it("maps shipped to info", () => {
    expect(orderStatusToVariant("shipped")).toBe("info");
  });

  it("maps delivered to success", () => {
    expect(orderStatusToVariant("delivered")).toBe("success");
  });

  it("maps cancelled to error", () => {
    expect(orderStatusToVariant("cancelled")).toBe("error");
  });

  it("maps unknown status to neutral", () => {
    expect(orderStatusToVariant("unknown")).toBe("neutral");
  });

  it("is case-insensitive", () => {
    expect(orderStatusToVariant("PENDING")).toBe("warning");
    expect(orderStatusToVariant("Delivered")).toBe("success");
  });
});

describe("stockStatusToVariant", () => {
  it("maps active to success", () => {
    expect(stockStatusToVariant("active")).toBe("success");
  });

  it("maps healthy to success", () => {
    expect(stockStatusToVariant("healthy")).toBe("success");
  });

  it("maps 'in stock' to success", () => {
    expect(stockStatusToVariant("in stock")).toBe("success");
  });

  it("maps low to warning", () => {
    expect(stockStatusToVariant("low")).toBe("warning");
  });

  it("maps watch to warning", () => {
    expect(stockStatusToVariant("watch")).toBe("warning");
  });

  it("maps 'low stock' to warning", () => {
    expect(stockStatusToVariant("low stock")).toBe("warning");
  });

  it("maps out to error", () => {
    expect(stockStatusToVariant("out")).toBe("error");
  });

  it("maps 'out of stock' to error", () => {
    expect(stockStatusToVariant("out of stock")).toBe("error");
  });

  it("maps unknown status to neutral", () => {
    expect(stockStatusToVariant("unknown")).toBe("neutral");
  });

  it("is case-insensitive", () => {
    expect(stockStatusToVariant("ACTIVE")).toBe("success");
    expect(stockStatusToVariant("LOW STOCK")).toBe("warning");
  });
});