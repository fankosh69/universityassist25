import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Testimonial {
  id: string;
  studentName: string;
  studentPhoto?: string;
  nationality?: string;
  programName?: string;
  testimonial: string;
  rating: number;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-foreground">
        💬 Student Testimonials
      </h3>

      <Carousel className="w-full">
        <CarouselContent>
          {testimonials.map((testimonial) => (
            <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
              <Card className="p-6 h-full flex flex-col">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < testimonial.rating
                          ? "fill-accent text-accent"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-sm text-muted-foreground mb-4 flex-1 italic">
                  "{testimonial.testimonial}"
                </p>

                {/* Student Info */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Avatar>
                    <AvatarImage src={testimonial.studentPhoto} alt={testimonial.studentName} />
                    <AvatarFallback>
                      {testimonial.studentName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-foreground">
                      {testimonial.studentName}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {testimonial.programName && (
                        <span className="text-xs text-muted-foreground">
                          {testimonial.programName}
                        </span>
                      )}
                      {testimonial.nationality && (
                        <Badge variant="outline" className="text-xs">
                          {testimonial.nationality}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
