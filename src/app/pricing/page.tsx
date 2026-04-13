import Link from "next/link";
import { Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing | TaskFlow",
  description: "Simple, transparent pricing for teams of all sizes.",
};

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      description: "Perfect for individuals and small side projects.",
      price: "$0",
      period: "forever",
      features: [
        "Up to 2 Projects",
        "Up to 50 Tasks per project",
        "Kanban Board view",
        "Due dates & Priorities",
        "Basic drag & drop",
        "Dark mode optimized",
      ],
      notIncluded: [
        "Team collaboration",
        "File attachments",
        "Advanced Analytics",
        "Custom Themes",
      ],
      cta: "Get Started Free",
      href: "/register",
      popular: false,
    },
    {
      name: "Pro",
      description: "For professionals and teams needing power and flexibility.",
      price: "$12",
      period: "per user / month",
      features: [
        "Unlimited Projects",
        "Unlimited Tasks",
        "Team collaboration & Roles",
        "List, Calendar & Board views",
        "File attachments (up to 1GB)",
        "Advanced Analytics & Logs",
        "Dark & Light mode themes",
        "Priority Support",
      ],
      notIncluded: [],
      cta: "Start 7-Day Trial",
      href: "/register?plan=pro",
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Simple Header */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">TaskFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Button asChild variant="default" size="sm" className="rounded-full">
              <Link href="/register">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Always know what you'll pay.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-3xl border ${plan.popular ? 'border-primary ring-1 ring-primary shadow-xl shadow-primary/10' : 'border-border'} bg-card p-8 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-8 transform -translate-y-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm min-h-[40px]">{plan.description}</p>
                </div>
                
                <div className="mb-8 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">/{plan.period}</span>
                </div>
                
                <Button 
                  asChild 
                  variant={plan.popular ? "default" : "outline"} 
                  className={`w-full rounded-xl h-12 mb-8 ${!plan.popular && 'bg-muted/50'}`}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
                
                <div className="space-y-4 flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-foreground">What's included</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <li key={`not-${i}`} className="flex items-start gap-3 opacity-40">
                        <Check className="h-5 w-5 shrink-0" />
                        <span className="text-sm line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-20 text-center text-muted-foreground w-full max-w-3xl mx-auto p-8 rounded-2xl bg-muted/30 border border-border">
            <h4 className="font-semibold text-foreground mb-2">Need a custom enterprise solution?</h4>
            <p className="text-sm mb-4">We offer dedicated support, custom SLAs, and tailored deployments for large teams.</p>
            <Link href="mailto:contact@taskflow.inc" className="text-primary font-medium hover:underline">
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
