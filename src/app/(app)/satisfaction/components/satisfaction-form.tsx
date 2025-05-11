// src/app/(app)/satisfaction/components/satisfaction-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { analyzeCustomerFeedback } from "@/ai/flows/customer-satisfaction-analysis";
import type { AnalyzeCustomerFeedbackOutput } from "@/ai/flows/customer-satisfaction-analysis";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Smile, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const satisfactionFormSchema = z.object({
  feedback: z.string().min(10, "Feedback must be at least 10 characters long."),
});

type SatisfactionFormValues = z.infer<typeof satisfactionFormSchema>;

export function SatisfactionForm() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCustomerFeedbackOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SatisfactionFormValues>({
    resolver: zodResolver(satisfactionFormSchema),
    defaultValues: {
      feedback: "",
    },
  });

  async function onSubmit(values: SatisfactionFormValues) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeCustomerFeedback({ feedback: values.feedback });
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "Customer feedback has been successfully analyzed.",
      });
    } catch (err) {
      console.error("Error analyzing feedback:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getSentimentBadgeColor = (sentiment: string | undefined) => {
    if (!sentiment) return "bg-gray-500";
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-green-500";
      case "negative":
        return "bg-red-500";
      case "neutral":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };


  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Enter Customer Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste or type customer feedback here... e.g., 'The internet was a bit slow today, but the coffee is great!'"
                    className="min-h-[150px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze Feedback"}
          </Button>
        </form>
      </Form>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Analysis Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <Smile className="mr-2 h-5 w-5 text-primary" /> Overall Sentiment
              </h3>
              <Badge className={`text-base px-3 py-1 text-white ${getSentimentBadgeColor(analysisResult.overallSentiment)}`}>
                {analysisResult.overallSentiment || "N/A"}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Key Trends
              </h3>
              {analysisResult.keyTrends && analysisResult.keyTrends.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {analysisResult.keyTrends.map((trend, index) => (
                    <li key={index}>{trend}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No specific trends identified.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <Lightbulb className="mr-2 h-5 w-5 text-primary" /> Suggested Improvements
              </h3>
              {analysisResult.suggestedImprovements && analysisResult.suggestedImprovements.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {analysisResult.suggestedImprovements.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No specific improvements suggested.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
