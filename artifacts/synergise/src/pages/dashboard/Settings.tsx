import { useAuth } from "@/hooks/use-auth";
import { useGetOnboarding } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { user } = useAuth();
  const { data: onboarding } = useGetOnboarding();

  const isTrial = user?.subscriptionTier === "Trial";
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
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input readOnly value={onboarding?.businessName || ""} className="bg-synergise-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input readOnly value={onboarding?.industry || ""} className="bg-synergise-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Input readOnly value={onboarding?.region || ""} className="bg-synergise-background" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Revenue Stage</Label>
                    <Input readOnly value={onboarding?.revenueStage || ""} className="bg-synergise-background" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="border-synergise-border max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription className="mt-1">You are currently on the <strong className="text-synergise-text">{user?.subscriptionTier}</strong> plan.</CardDescription>
                  </div>
                  <Badge variant={isTrial ? "secondary" : "default"} className={isTrial ? "" : "bg-synergise-primary"}>
                    {user?.subscriptionTier}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isTrial ? (
                  <div className="bg-synergise-accent border border-synergise-primary-light/50 rounded-lg p-6 text-center space-y-4">
                    <h3 className="text-xl font-bold text-synergise-primary">Upgrade to Professional</h3>
                    <p className="text-synergise-text">Your trial ends in <strong>{trialDaysRemaining} days</strong>. Upgrade now to keep access to all features.</p>
                    <ul className="text-sm text-synergise-text-muted space-y-2 inline-block text-left mb-4 mt-2">
                      <li>✓ Unlimited financial models</li>
                      <li>✓ Full management accounts</li>
                      <li>✓ Complete benchmarking</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-synergise-text">Your subscription is active and renews monthly.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-synergise-background border-t border-synergise-border flex justify-end px-6 py-4">
                {isTrial ? (
                  <Button className="bg-synergise-primary hover:bg-synergise-primary-dark">Upgrade for $29/mo</Button>
                ) : (
                  <Button variant="outline" className="text-synergise-error hover:bg-red-50 hover:text-synergise-error border-red-200">Cancel Subscription</Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
