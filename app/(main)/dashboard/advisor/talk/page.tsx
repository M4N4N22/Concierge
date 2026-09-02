import { redirect } from "next/navigation";

export default function AdvisorTalkRedirect() {
  redirect("/dashboard/advisor/chat");
}
