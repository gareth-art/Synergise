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
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              <Card className="border-synergise-border shadow-sm flex flex-col">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-semibold text-synergise-text">Trial</CardTitle>
                  <CardDescription className="text-4xl font-bold text-synergise-text mt-4">$0 <span className="text-lg font-normal text-synergise-text-muted">for 14 days</span></CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4 text-synergise-text-muted">
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Full access to all 3 modules</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Up to 3 financial models</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Basic benchmarking</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Email support</li>
                  </ul>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/signup">Start Free Trial</Link>
                  </Button>
                </div>
              </Card>

              <Card className="border-2 border-synergise-primary shadow-lg relative flex flex-col">
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-synergise-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
                </div>
                <CardHeader className="text-center pb-8 pt-10">
                  <CardTitle className="text-2xl font-semibold text-synergise-text">Professional</CardTitle>
                  <CardDescription className="text-4xl font-bold text-synergise-text mt-4">$29<span className="text-lg font-normal text-synergise-text-muted">/month</span></CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4 text-synergise-text-muted">
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Unlimited financial models</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Full management accounts</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Complete benchmarking with percentile charts</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> AI-powered analysis</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> PDF exports</li>
                    <li className="flex items-center gap-3"><span className="text-synergise-primary font-bold">✓</span> Priority support</li>
                  </ul>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button asChild className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white">
                    <Link href="/signup">Get Started</Link>
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
