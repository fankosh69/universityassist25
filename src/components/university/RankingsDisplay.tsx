import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface RankingData {
  name: string;
  rank?: number;
  totalRanked?: number;
  score?: number;
  year?: number;
  details?: {
    label: string;
    score: number;
  }[];
}

interface RankingsDisplayProps {
  rankings: RankingData[];
  accreditations?: string[];
  awards?: string[];
}

export function RankingsDisplay({ rankings, accreditations, awards }: RankingsDisplayProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">
        🏆 Rankings & Recognition
      </h2>

      {/* Rankings */}
      <div className="space-y-4">
        {rankings.map((ranking, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {ranking.name}
                </h3>
                {ranking.year && (
                  <p className="text-sm text-muted-foreground">
                    {ranking.year}
                  </p>
                )}
              </div>
              {ranking.rank && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    #{ranking.rank}
                  </div>
                  {ranking.totalRanked && (
                    <div className="text-sm text-muted-foreground">
                      of {ranking.totalRanked.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {ranking.score && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Overall Score
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {ranking.score} / 100
                  </span>
                </div>
                <Progress value={ranking.score} className="h-2" />
              </div>
            )}

            {ranking.details && ranking.details.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                {ranking.details.map((detail, detailIndex) => (
                  <div key={detailIndex}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        {detail.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {detail.score}
                      </span>
                    </div>
                    <Progress value={detail.score} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Accreditations */}
      {accreditations && accreditations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            📜 Accreditations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accreditations.map((accreditation, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold">✓</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {accreditation}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Awards & Recognition */}
      {awards && awards.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            🥇 Awards & Recognition
          </h3>
          <div className="space-y-3">
            {awards.map((award, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="text-2xl">🏆</div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{award}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
