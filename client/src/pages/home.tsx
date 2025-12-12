import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Shield, Clock, Award, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StatsCounter } from "@/components/stats-counter";
import { TestCard } from "@/components/test-card";
import type { Test } from "@shared/schema";

const features = [
  {
    icon: Shield,
    title: "NABL Accredited",
    description: "Quality assured testing with nationally recognized accreditation",
  },
  {
    icon: Clock,
    title: "Quick Results",
    description: "Most reports ready within 24-48 hours of sample collection",
  },
  {
    icon: Truck,
    title: "Home Collection",
    description: "Free home sample collection for your convenience",
  },
  {
    icon: Award,
    title: "Expert Team",
    description: "Experienced pathologists and trained technicians",
  },
];

export default function Home() {
  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const popularTests = tests?.slice(0, 6) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-20 md:py-32">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-hero-title">
            Your Health, Our Priority
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Trusted diagnostic services with accurate results. 
            Book tests online and get reports delivered to your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-hero-book">
                Book a Test
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/tests">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" data-testid="button-hero-tests">
                View All Tests
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <StatsCounter />

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">Why Choose Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine advanced technology with expert care to deliver accurate and timely results
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold mb-2">Popular Tests</h2>
              <p className="text-muted-foreground">Book from our most requested diagnostic tests</p>
            </div>
            <Link href="/tests">
              <Button variant="outline" className="gap-2" data-testid="button-view-all-tests">
                View All Tests
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Ready to Book Your Test?</h2>
          <p className="opacity-90 mb-8 max-w-xl mx-auto">
            Schedule your diagnostic test today with our easy online booking system. 
            Home sample collection available.
          </p>
          <Link href="/book">
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-book">
              Book Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
