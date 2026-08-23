import { LandingPage } from "@/components/landing-components.js";
import componentPlan from "@/content/components.json";
import plan from "@/content/plan.json";
import site from "@/content/site.json";

export default function Home() {
  return <LandingPage site={site} plan={plan} componentPlan={componentPlan} />;
}
