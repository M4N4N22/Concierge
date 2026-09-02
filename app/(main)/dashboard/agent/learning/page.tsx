import { redirect } from "next/navigation";

/** Learning merged into Chat. */
export default function LearningRedirectPage() {
  redirect("/dashboard/advisor/chat");
}
