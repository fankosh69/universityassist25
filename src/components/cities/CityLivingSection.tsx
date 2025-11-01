import { Card, CardContent } from "@/components/ui/card";

interface CityLivingSectionProps {
  cityName: string;
  livingText?: string;
}

export function CityLivingSection({ cityName, livingText }: CityLivingSectionProps) {
  if (!livingText) return null;

  return (
    <div className="my-12">
      <h2 className="text-3xl font-bold mb-6">LIVING IN {cityName.toUpperCase()}</h2>
      <Card>
        <CardContent className="p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {livingText.split('\n\n').map((paragraph, index) => (
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