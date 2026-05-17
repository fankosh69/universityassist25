import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import BlogImage from "./BlogImage";

export interface BlogCardItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  heroImageUrl?: string | null;
}

export default function BlogCard({ post }: { post: BlogCardItem }) {
  return (
    <Link to={`/${post.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <BlogImage
            src={post.heroImageUrl ?? null}
            alt={post.title}
            category={post.category}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
            {post.category}
          </div>
          <h3 className="font-[var(--font-heading)] text-lg md:text-xl font-bold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1 text-primary font-medium opacity-70 group-hover:opacity-100 transition-opacity">
              Read <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
