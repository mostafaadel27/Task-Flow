import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Billing | TaskFlow",
  description: "Manage your subscription and billing.",
};

export default function BillingPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>

      {/* Current plan */}
      <section aria-labelledby="plan-heading" className="space-y-4">
        <h2 id="plan-heading" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current plan</h2>
        
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-lg font-semibold">Free</p>
            <p className="text-sm text-muted-foreground mt-0.5">2 projects · Unlimited tasks</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-semibold tabular-nums">$0</span>
            <span className="text-sm text-muted-foreground"> / month</span>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Upgrade */}
      <section aria-labelledby="upgrade-heading" className="space-y-5">
        <h2 id="upgrade-heading" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pro plan</h2>
        
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-semibold">Pro</p>
          <div className="text-right">
            <span className="text-2xl font-semibold tabular-nums">$12</span>
            <span className="text-sm text-muted-foreground"> / month</span>
          </div>
        </div>

        <ul className="space-y-2.5" role="list">
          {[
            "Unlimited projects",
            "Team collaboration",
            "Calendar & list views",
            "Priority support",
          ].map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <Check className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>

        <Button className="w-full">Upgrade to Pro</Button>
      </section>
    </div>
  );
}
