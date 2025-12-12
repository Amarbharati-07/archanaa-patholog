import { Link } from "wouter";
import { Clock, IndianRupee } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Test } from "@shared/schema";

const categoryIcons: Record<string, string> = {
  "Hematology": "droplet",
  "Biochemistry": "activity",
  "Thyroid": "heart",
  "Urine": "beaker",
  "Diabetes": "pill",
};

interface TestCardProps {
  test: Test;
  onBookClick?: () => void;
}

export function TestCard({ test, onBookClick }: TestCardProps) {
  return (
    <Card className="h-full flex flex-col hover-elevate transition-shadow duration-200" data-testid={`card-test-${test.code}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2">{test.category}</Badge>
            <h3 className="font-semibold text-lg leading-tight">{test.name}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        {test.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{test.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-primary font-semibold">
            <IndianRupee className="h-4 w-4" />
            <span data-testid={`price-${test.code}`}>{Number(test.price).toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{test.duration}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        {onBookClick ? (
          <Button className="w-full" onClick={onBookClick} data-testid={`button-book-${test.code}`}>
            Book Now
          </Button>
        ) : (
          <Link href={`/book?test=${test.code}`} className="w-full">
            <Button className="w-full" data-testid={`button-book-${test.code}`}>
              Book Now
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
