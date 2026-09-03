import { redirect } from "next/navigation";

/** Legacy route — Knowledge base lives at /dashboard/knowledge */
export default function LegacyInsightsPage() {
  redirect("/dashboard/knowledge");
}
