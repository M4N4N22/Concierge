import { redirect } from "next/navigation";

export default function VaultChatRedirect() {
  redirect("/dashboard/advisor/chat");
}
