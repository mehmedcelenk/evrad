import { redirect } from "next/navigation";
import { getSectionRoute } from "../core/module-registry";

export default function GamesPage() {
  redirect(getSectionRoute("virds"));
}

