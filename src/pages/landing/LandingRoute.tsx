import { useParams, Navigate } from "react-router-dom";
import LandingPageView from "./LandingPage";
import { getLandingPageBySlug } from "@/content/landing-pages";

export default function LandingRoute({ slug: explicitSlug }: { slug?: string }) {
  const params = useParams();
  const raw = explicitSlug ?? params.landingSlug ?? "";
  const slug = raw.replace(/\/+$/g, "");
  const page = getLandingPageBySlug(slug);
  if (!page) return <Navigate to="/" replace />;
  return <LandingPageView page={page} />;
}