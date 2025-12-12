import { Link } from "wouter";
import { Phone, Mail, MapPin, Clock, FlaskConical } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-8 w-8 text-primary" />
              <span className="font-semibold text-lg">Archana Pathology</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Trusted diagnostic services with accurate results. 
              NABL accredited laboratory serving patients since 2010.
            </p>
            <div className="flex gap-4">
              <div className="bg-muted rounded-md px-3 py-1 text-xs font-medium">NABL</div>
              <div className="bg-muted rounded-md px-3 py-1 text-xs font-medium">ISO 9001</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground text-sm" data-testid="link-footer-home">
                Home
              </Link>
              <Link href="/tests" className="text-muted-foreground hover:text-foreground text-sm" data-testid="link-footer-tests">
                Our Tests
              </Link>
              <Link href="/book" className="text-muted-foreground hover:text-foreground text-sm" data-testid="link-footer-book">
                Book a Test
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm" data-testid="link-footer-login">
                Patient Login
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <a 
                href="tel:+919876543210" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
                data-testid="link-phone"
              >
                <Phone className="h-4 w-4 text-primary" />
                +91 98765 43210
              </a>
              <a 
                href="mailto:info@archanapathology.com" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
                data-testid="link-email"
              >
                <Mail className="h-4 w-4 text-primary" />
                info@archanapathology.com
              </a>
              <div className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>123 Health Street, Medical District, New Delhi - 110001</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Working Hours</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Mon - Sat: 7:00 AM - 9:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Sunday: 8:00 AM - 2:00 PM</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Sample collection available at home</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Archana Pathology Lab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
