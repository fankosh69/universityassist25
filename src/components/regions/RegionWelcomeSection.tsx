import { Card, CardContent } from "@/components/ui/card";

interface RegionWelcomeSectionProps {
  regionName: string;
  welcomeText?: string;
}

export function RegionWelcomeSection({ regionName, welcomeText }: RegionWelcomeSectionProps) {
  if (!welcomeText) return null;

  return (
    <div className="my-12">
      <h2 className="text-3xl font-bold mb-6">WELCOME TO {regionName.toUpperCase()}</h2>
      <Card>
        <CardContent className="p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {welcomeText.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
