import { redirect } from "next/navigation";

/** Recommendations merged into Chat tips. */
export default function RecommendationsRedirectPage() {
  redirect("/dashboard/advisor/chat");
}
