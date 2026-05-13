import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, BookOpen, Target } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-synergise-background font-sans text-synergise-text">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8 max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-synergise-text sm:text-5xl md:text-6xl lg:text-[48px] leading-tight">
                Financial clarity, powered by intelligence.
              </h1>
              <p className="text-lg leading-relaxed text-synergise-text-muted md:text-xl">
                The financial co-pilot for founder-operators in Southeast Asia. Model your business, track performance, and benchmark against your peers — without needing a CFO.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-synergise-primary hover:bg-synergise-primary-dark text-white w-full sm:w-auto font-semibold">
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold border-synergise-border" asChild>
                  <a href="#features">See How It Works</a>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
              <div className="aspect-video overflow-hidden rounded-xl border border-synergise-border bg-white shadow-xl flex items-center justify-center">
                <div className="text-center text-synergise-text-muted flex flex-col items-center gap-4">
                  <BarChart3 className="h-12 w-12 opacity-20" />
                  <p className="font-medium text-lg">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y border-synergise-border bg-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <span className="text-sm font-semibold text-synergise-text-muted uppercase tracking-wider">Built for founders in:</span>
              <div className="flex flex-wrap justify-center gap-3">
                {["Wellness", "Hospitality", "Apparel", "Memberships", "Professional Services", "E-commerce", "SaaS"].map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-synergise-background text-synergise-text hover:bg-synergise-border font-medium px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-synergise-text sm:text-4xl lg:text-[36px]">Everything you need to grow confidently.</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-synergise-border shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-synergise-background text-synergise-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-[28px] font-semibold text-synergise-text">Model your business, your way</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-synergise-text-muted leading-relaxed">
                  Industry-specific financial models built for how your business actually works. No generic spreadsheets — inputs designed for your vertical.
                </p>
              </CardContent>
            </Card>
            <Card className="border-synergise-border shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-synergise-background text-synergise-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle className="text-[28px] font-semibold text-synergise-text">Know your numbers, every month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-synergise-text-muted leading-relaxed">
                  Founder-lite P&L tracking that shows gross margin, burn rate, and profitability without requiring an accounting degree.
                </p>
              </CardContent>
            </Card>
            <Card className="border-synergise-border shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-synergise-background text-synergise-primary">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-[28px] font-semibold text-synergise-text">See where you stand</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-synergise-text-muted leading-relaxed">
                  Benchmark your key metrics against real peer businesses in your industry and region. Know if your margins are strong or lagging.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-20 md:py-32 border-t border-synergise-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-synergise-text sm:text-4xl lg:text-[36px]">Simple, transparent pricing.</h2>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {/* Trial */}
              <Card className="border-synergise-border shadow-sm flex flex-col">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl font-semibold text-synergise-text">Trial</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-synergise-text">$0</span>
                    <span className="text-base font-normal text-synergise-text-muted"> for 14 days</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-synergise-text-muted">
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> 3 financial models</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Basic P&amp;L tracking</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Burn rate metric</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Industry benchmarks (overview)</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Email support</li>
                  </ul>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/signup">Start Free Trial</Link>
                  </Button>
                </div>
              </Card>

              {/* Professional — Most Popular */}
              <Card className="border-2 border-synergise-primary shadow-lg relative flex flex-col">
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-synergise-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
                </div>
                <CardHeader className="text-center pb-6 pt-10">
                  <CardTitle className="text-xl font-semibold text-synergise-text">Professional</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-synergise-text">$49</span>
                    <span className="text-base font-normal text-synergise-text-muted">/month</span>
                  </div>
                  <p className="text-xs text-synergise-text-muted mt-2 italic">Less than Xero Standard. More than just accounting.</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-synergise-text-muted">
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Unlimited financial models</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Unit economics calculator</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Full management accounts + trends</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Complete benchmarking with percentile charts</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Burn rate + working capital metrics</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> 50 AI credits/month</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> PDF exports</li>
                    <li className="flex items-start gap-2"><span className="text-synergise-primary font-bold shrink-0">✓</span> Priority support</li>
                  </ul>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button asChild className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white font-semibold">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              </Card>

              {/* CFO Suite — Premium */}
              <Card className="bg-synergise-primary text-white border-0 shadow-xl flex flex-col relative">
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-white text-synergise-primary text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">For serious operators</span>
                </div>
                <CardHeader className="text-center pb-6 pt-10">
                  <CardTitle className="text-xl font-semibold text-white">CFO Suite</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$149</span>
                    <span className="text-base font-normal text-white/70">/month</span>
                  </div>
                  <p className="text-xs text-white/60 mt-2 italic">Full CFO analysis at a fraction of the cost.</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-white/80">
                    <li className="flex items-start gap-2"><span className="font-bold shrink-0">✓</span> Everything in Professional</li>
                    <li className="flex items-start gap-2"><span className="font-bold shrink-0">✓</span> Full CFO dashboard (12 metrics)</li>
                    <li className="flex items-start gap-2"><span className="font-bold shrink-0">✓</span> Scenario planning &amp; what-if modelling</li>
                    <li className="flex items-start gap-2"><span className="font-bold shrink-0">✓</span> 200 AI credits/month</li>
                    <li className="flex items-start gap-2"><span className="font-bold shrink-0">✓</span> Dedicated onboarding call</li>
                    <li className="flex items-start gap-2"><span className="font-bold shrink-0">✓</span> White-label PDF exports</li>
                  </ul>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button asChild className="w-full bg-white text-synergise-primary hover:bg-gray-100 font-semibold">
                    <Link href="/signup">Get CFO Suite</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
