import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useGetOnboarding, useSaveOnboarding, getGetOnboardingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const onboardingSchema = z.object({
  businessName: z.string().min(1, { message: "Business name is required" }),
  industry: z.string().min(1, { message: "Please select an industry" }),
  region: z.string().min(1, { message: "Please select a region" }),
  revenueStage: z.string().min(1, { message: "Please select a revenue stage" }),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const saveMutation = useSaveOnboarding();
  const [step, setStep] = useState(1);
  
  const { data: onboardingProfile, isLoading } = useGetOnboarding();

  useEffect(() => {
    if (!isLoading && onboardingProfile?.onboardingCompletedAt) {
      setLocation("/dashboard");
    }
  }, [onboardingProfile, isLoading, setLocation]);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: "",
      industry: "",
      region: "",
      revenueStage: "",
    },
  });

  const handleNext = async (currentStepFields: (keyof z.infer<typeof onboardingSchema>)[]) => {
    const isValid = await form.trigger(currentStepFields);
    if (isValid) {
      setStep((s) => Math.min(s + 1, 4));
    }
  };

  const handleComplete = (values: z.infer<typeof onboardingSchema>) => {
    saveMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOnboardingQueryKey() });
        setLocation("/dashboard");
      }
    });
  };

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-synergise-background p-4">
      <Card className="w-full max-w-lg border-synergise-border shadow-lg">
        <div className="px-6 pt-6">
          <Progress value={(step / 4) * 100} className="h-2" />
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleComplete)}>
            {step === 1 && (
              <>
                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-3xl font-bold">Welcome to Synergise, {user?.fullName?.split(' ')[0]}</CardTitle>
                  <CardDescription className="text-lg mt-2">Let's personalise your experience. It takes 60 seconds.</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center pt-8 pb-8">
                  <Button type="button" size="lg" className="bg-synergise-primary hover:bg-synergise-primary-dark w-full max-w-xs" onClick={() => setStep(2)}>
                    Let's go →
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Tell us about your business</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Wellness & Lifestyle">Wellness & Lifestyle</SelectItem>
                            <SelectItem value="Consumer Products & Apparel">Consumer Products & Apparel</SelectItem>
                            <SelectItem value="Membership & Experiences">Membership & Experiences</SelectItem>
                            <SelectItem value="Professional Services">Professional Services</SelectItem>
                            <SelectItem value="F&B & Hospitality">F&B & Hospitality</SelectItem>
                            <SelectItem value="E-commerce & Retail">E-commerce & Retail</SelectItem>
                            <SelectItem value="Technology & SaaS">Technology & SaaS</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button type="button" className="bg-synergise-primary" onClick={() => handleNext(['businessName', 'industry'])}>Next →</Button>
                </CardFooter>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Region & Scale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Singapore">Singapore</SelectItem>
                            <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                            <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                            <SelectItem value="Global">Global</SelectItem>
                            <SelectItem value="North America">North America</SelectItem>
                            <SelectItem value="Europe">Europe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="revenueStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Revenue Stage (Annual)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select revenue stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pre-revenue">Pre-revenue</SelectItem>
                            <SelectItem value="Under SGD 500k">Under SGD 500k</SelectItem>
                            <SelectItem value="SGD 500k–2M">SGD 500k–2M</SelectItem>
                            <SelectItem value="Over SGD 2M">Over SGD 2M</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button type="button" className="bg-synergise-primary" onClick={() => handleNext(['region', 'revenueStage'])}>Next →</Button>
                </CardFooter>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl font-bold">You're all set, {user?.fullName?.split(' ')[0]}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Your dashboard is personalised for {form.getValues('industry')} businesses in {form.getValues('region')}.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center pt-8 pb-8">
                  <Button type="submit" size="lg" className="bg-synergise-primary w-full max-w-xs" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Setting up..." : "Go to my Dashboard →"}
                  </Button>
                </CardFooter>
              </>
            )}
          </form>
        </Form>
      </Card>
    </div>
  );
}
