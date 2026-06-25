import { redirect } from "next/navigation";

export default function CheckoutSuccessRedirect() {
  redirect("/order-confirmation/latest");
}