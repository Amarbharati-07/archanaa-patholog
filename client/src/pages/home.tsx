import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Shield, Clock, Award, Truck, Star, Quote, FlaskConical, Users, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StatsCounter } from "@/components/stats-counter";
import { TestCard } from "@/components/test-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
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

const customerReviews = [
  {
    name: "Priya Sharma",
    initials: "PS",
    rating: 5,
    review: "Excellent service! The home collection was on time and the staff was very professional. Got my reports within 24 hours.",
    location: "Mumbai",
  },
  {
    name: "Rajesh Kumar",
    initials: "RK",
    rating: 5,
    review: "Very impressed with the accuracy and quick turnaround. The online booking system made everything so convenient.",
    location: "Delhi",
  },
  {
    name: "Anita Desai",
    initials: "AD",
    rating: 5,
    review: "Best diagnostic center in the city. The prices are reasonable and the quality of service is top-notch.",
    location: "Bangalore",
  },
  {
    name: "Vikram Singh",
    initials: "VS",
    rating: 4,
    review: "Great experience overall. The technician was skilled and made the blood collection painless. Highly recommend!",
    location: "Pune",
  },
];

const advertisementSlides = [
  {
    id: 1,
    icon: FlaskConical,
    title: "State-of-the-Art Laboratory",
    subtitle: "Advanced Equipment & Technology",
    description: "Our NABL accredited lab uses the latest diagnostic equipment for accurate and reliable results",
    gradient: "from-blue-600 to-cyan-500",
    cta: "Learn More",
    link: "/tests",
  },
  {
    id: 2,
    icon: BadgePercent,
    title: "Special Offers This Month",
    subtitle: "Up to 30% OFF on Health Packages",
    description: "Book comprehensive health checkups at discounted prices. Limited time offer!",
    gradient: "from-emerald-600 to-teal-500",
    cta: "View Offers",
    link: "/tests",
  },
  {
    id: 3,
    icon: Users,
    title: "Trusted by 15,000+ Customers",
    subtitle: "Join Our Growing Family",
    description: "Experience why thousands choose us for their diagnostic needs. Quality care you can trust.",
    gradient: "from-purple-600 to-pink-500",
    cta: "Book Now",
    link: "/book",
  },
  {
    id: 4,
    icon: Truck,
    title: "Free Home Collection",
    subtitle: "Convenience at Your Doorstep",
    description: "Skip the queue! Our trained phlebotomists will collect samples from your home at no extra cost.",
    gradient: "from-orange-500 to-red-500",
    cta: "Schedule Now",
    link: "/book",
  },
];

export default function Home() {
  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const popularTests = tests?.slice(0, 6) || [];

  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

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

      <section className="py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
            data-testid="carousel-advertisement"
          >
            <CarouselContent>
              {advertisementSlides.map((slide) => (
                <CarouselItem key={slide.id} className="md:basis-1/2 lg:basis-1/2">
                  <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${slide.gradient} p-6 md:p-8 h-full min-h-[200px]`}>
                    <div className="absolute top-4 right-4 opacity-20">
                      <slide.icon className="h-24 w-24 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium mb-1">{slide.subtitle}</p>
                        <h3 className="text-white text-xl md:text-2xl font-bold mb-3">{slide.title}</h3>
                        <p className="text-white/90 text-sm md:text-base max-w-md">{slide.description}</p>
                      </div>
                      <div className="mt-4">
                        <Link href={slide.link}>
                          <Button 
                            variant="secondary" 
                            className="gap-2"
                            data-testid={`button-ad-${slide.id}`}
                          >
                            {slide.cta}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 bg-white/90 border-0" />
            <CarouselNext className="right-2 bg-white/90 border-0" />
          </Carousel>
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

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands of patients for accurate and reliable diagnostic services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {customerReviews.map((review, index) => (
              <Card key={index} className="relative" data-testid={`card-review-${index}`}>
                <CardContent className="pt-6">
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {review.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.review}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
