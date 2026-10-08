import { redirect } from "next/navigation";
import { getSectionRoute } from "../core/module-registry";

export default function LegacyLibraryPage() {
  redirect(getSectionRoute("virds"));
}

