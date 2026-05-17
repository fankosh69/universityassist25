import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import BlogImage from "./BlogImage";
import type { BlogCardItem } from "./BlogCard";

export default function BlogFeaturedCard({ post }: { post: BlogCardItem }) {
  return (
    <Link to={`/${post.slug}`} className="group block">
      <Card className="overflow-hidden grid md:grid-cols-2 transition-all duration-300 hover:shadow-xl hover:border-primary/40">
        <div className="aspect-[16/10] md:aspect-auto overflow-hidden bg-muted">
          <BlogImage
            src={post.heroImageUrl ?? null}
            alt={post.title}
            category={post.category}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
        </div>
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider px-3 py-1">
              Featured
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {post.category}
            </span>
          </div>
          <h2 className="font-[var(--font-heading)] text-2xl md:text-4xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-muted-foreground line-clamp-3 mb-5">{post.excerpt}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {post.readingMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
              Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
