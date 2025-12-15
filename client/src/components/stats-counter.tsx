import { useEffect, useState, useRef } from "react";
import { Users, FlaskConical, Award, Clock } from "lucide-react";

const stats = [
  { icon: FlaskConical, label: "Tests Conducted", value: 10000, suffix: "+" },
  { icon: Users, label: "Happy Patients", value: 9874, suffix: "+" },
  { icon: Award, label: "Years of Service", value: 5, suffix: "" },
  { icon: Clock, label: "Reports Delivered", value: 12586, suffix: "+" },
];

function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!start) return;
    
    let startTime: number | null = null;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);
  
  return count;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix, 
  inView 
}: { 
  icon: typeof Users; 
  label: string; 
  value: number; 
  suffix: string;
  inView: boolean;
}) {
  const count = useCountUp(value, 2000, inView);
  
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}

export function StatsCounter() {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <section ref={containerRef} className="py-16 bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
