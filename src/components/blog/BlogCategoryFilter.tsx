import { Button } from "@/components/ui/button";

export default function BlogCategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <Button
            key={c}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onChange(c)}
            className={`rounded-full ${isActive ? "" : "bg-card hover:bg-accent/40"}`}
          >
            {c}
          </Button>
        );
      })}
    </div>
  );
}
