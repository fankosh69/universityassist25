import { useParams, Navigate } from "react-router-dom";
import LegacyBlogPostPage from "./LegacyBlogPost";
import { getLegacyBlogPostBySlug } from "@/content/legacy-blog-posts";

/**
 * Route wrapper that resolves a legacy-blog slug from the URL and renders
 * the matching post. Used by `<Route path="/:legacySlug" />` registrations
 * in App.tsx so each legacy post URL keeps its original path verbatim
 * (e.g. /karlsruhe-a-city-of-history) for SEO continuity.
 */
export default function LegacyBlogRoute({ slug: explicitSlug }: { slug?: string }) {
  const params = useParams();
  const raw = explicitSlug ?? params.legacySlug ?? "";
  const slug = raw.replace(/\/+$/g, ""); // strip trailing slashes
  const post = getLegacyBlogPostBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;
  return <LegacyBlogPostPage post={post} />;
}