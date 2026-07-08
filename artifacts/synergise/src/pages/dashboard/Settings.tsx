import { useAuth } from "@/hooks/use-auth";
import { useGetOnboarding } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const { data: onboarding, isError } = useGetOnboarding();
  const [, setLocation] = useLocation();
  const profileMissing = isError || !onboarding;

  const isTrial = user?.subscriptionTier === "trial";
  const isProfessional = user?.subscriptionTier === "professional";
  const isCfoSuite = user?.subscriptionTier === "cfo-suite";
  const trialDaysRemaining = user?.trialStartDate 
    ? Math.max(0, 14 - Math.floor((new Date().getTime() - new Date(user.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-synergise-text-muted mt-2">Manage your account and subscription</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-synergise-border">
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input readOnly value={user?.fullName || ""} className="bg-synergise-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input readOnly value={user?.email || ""} className="bg-synergise-background" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-synergise-border">
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileMissing ? (
                    <div className="rounded-lg border border-dashed border-synergise-border bg-synergise-background p-6 text-center">
                      <p className="text-sm text-synergise-text-muted mb-3">
                        Your business profile hasn't been set up yet.
                      </p>
                      <Button
                        size="sm"
                        className="bg-synergise-primary hover:bg-synergise-primary-dark text-white"
                        onClick={() => setLocation("/onboarding")}
                      >
                        Complete Your Profile
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input readOnly value={onboarding.businessName || ""} className="bg-synergise-background" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Industry</Label>
                          <Input readOnly value={onboarding.industry || ""} className="bg-synergise-background" />
                        </div>
                        <div className="space-y-2">
                          <Label>Region</Label>
                          <Input readOnly value={onboarding.region || ""} className="bg-synergise-background" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Revenue Stage</Label>
                        <Input readOnly value={onboarding.revenueStage || ""} className="bg-synergise-background" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="space-y-6 max-w-2xl">
              <Card className="border-synergise-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription className="mt-1">
                        You are currently on the{" "}
                        <strong className="text-synergise-text">
                          {isTrial ? "Trial" : isProfessional ? "Professional" : "CFO Suite"}
                        </strong>{" "}
                        plan.
                      </CardDescription>
                    </div>
                    <Badge
                      variant={isTrial ? "secondary" : "default"}
                      className={!isTrial ? "bg-synergise-primary" : ""}
                    >
                      {isTrial ? "Trial" : isProfessional ? "Professional" : "CFO Suite"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isTrial && (
                    <div className="bg-synergise-accent border border-synergise-primary-light/50 rounded-lg p-6 space-y-4">
                      <h3 className="text-xl font-bold text-synergise-primary">Your trial ends in {trialDaysRemaining} days</h3>
                      <p className="text-synergise-text-muted text-sm">Upgrade to keep access to your models and unlock more powerful tools.</p>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="border border-synergise-border rounded-lg p-4 bg-white">
                          <p className="font-semibold text-synergise-text mb-1">Professional</p>
                          <p className="text-2xl font-bold text-synergise-primary mb-3">$49<span className="text-sm font-normal text-synergise-text-muted">/mo</span></p>
                          <ul className="text-sm text-synergise-text-muted space-y-1">
                            <li>✓ Unlimited financial models</li>
                            <li>✓ Unit economics calculator</li>
                            <li>✓ Full management accounts</li>
                            <li>✓ Percentile benchmarking</li>
                            <li>✓ 50 AI credits/month</li>
                            <li>✓ PDF exports</li>
                          </ul>
                          <Button className="w-full mt-4 bg-synergise-primary hover:bg-synergise-primary-dark text-white text-sm">
                            Upgrade for $49/mo
                          </Button>
                        </div>
                        <div className="border-2 border-synergise-primary rounded-lg p-4 bg-synergise-primary text-white">
                          <p className="font-semibold mb-1">CFO Suite</p>
                          <p className="text-2xl font-bold mb-3">$149<span className="text-sm font-normal opacity-70">/mo</span></p>
                          <ul className="text-sm opacity-80 space-y-1">
                            <li>✓ Everything in Professional</li>
                            <li>✓ Full CFO dashboard (12 metrics)</li>
                            <li>✓ Scenario & what-if modelling</li>
                            <li>✓ 200 AI credits/month</li>
                            <li>✓ White-label PDF exports</li>
                            <li>✓ Dedicated onboarding call</li>
                          </ul>
                          <Button className="w-full mt-4 bg-white text-synergise-primary hover:bg-gray-100 text-sm font-semibold">
                            Upgrade for $149/mo
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {isProfessional && (
                    <div className="space-y-4">
                      <p className="text-synergise-text">Your Professional plan is active and renews monthly at <strong>$49/month</strong>.</p>
                      <div className="bg-synergise-accent border border-synergise-primary-light/50 rounded-lg p-4">
                        <p className="font-semibold text-synergise-text mb-2">Upgrade to CFO Suite — $149/mo</p>
                        <ul className="text-sm text-synergise-text-muted space-y-1 mb-3">
                          <li>✓ Full CFO dashboard (12 metrics)</li>
                          <li>✓ Scenario & what-if modelling</li>
                          <li>✓ 200 AI credits/month</li>
                          <li>✓ White-label PDF exports</li>
                          <li>✓ Dedicated onboarding call</li>
                        </ul>
                        <Button className="bg-synergise-primary hover:bg-synergise-primary-dark text-white text-sm">
                          Upgrade to CFO Suite
                        </Button>
                      </div>
                    </div>
                  )}
                  {isCfoSuite && (
                    <div className="space-y-4">
                      <p className="text-synergise-text">Your CFO Suite plan is active and renews monthly at <strong>$149/month</strong>.</p>
                      <p className="text-sm text-synergise-text-muted">You have access to all features including the full CFO dashboard, scenario planning, 200 AI credits, white-label PDF exports, and your dedicated onboarding call.</p>
                    </div>
                  )}
                </CardContent>
                {(isProfessional || isCfoSuite) && (
                  <CardFooter className="bg-synergise-background border-t border-synergise-border flex justify-end px-6 py-4">
                    <Button variant="outline" className="text-synergise-error hover:bg-red-50 hover:text-synergise-error border-red-200">Cancel Subscription</Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
