// Renders the post hero image, or a deterministic on-brand gradient fallback
// based on the category when no image is available.

const GRADIENTS: Record<string, string> = {
  Cities: "from-primary/80 via-secondary/60 to-accent/40",
  Universities: "from-primary via-primary/70 to-secondary/60",
  "Study tips": "from-secondary via-accent/70 to-primary/40",
  Costs: "from-accent/70 via-secondary/60 to-primary/50",
  Visa: "from-primary/70 via-primary/40 to-accent/40",
  Language: "from-secondary/80 via-primary/60 to-accent/50",
  Careers: "from-accent via-primary/60 to-secondary/60",
  Company: "from-primary via-secondary to-accent",
};

export default function BlogImage({
  src,
  alt,
  category,
  className,
  loading = "lazy",
}: {
  src: string | null;
  alt: string;
  category?: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={className}
      />
    );
  }
  const grad = GRADIENTS[category ?? ""] ?? "from-primary via-primary/60 to-secondary";
  return (
    <div
      aria-label={alt}
      role="img"
      className={`bg-gradient-to-br ${grad} relative ${className ?? ""}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-[var(--font-heading)] text-white/90 text-lg font-bold uppercase tracking-widest drop-shadow">
          {category ?? "Article"}
        </span>
      </div>
    </div>
  );
}
