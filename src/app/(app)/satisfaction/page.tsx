import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SatisfactionForm } from "./components/satisfaction-form";

export default function SatisfactionPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Customer Satisfaction Analysis</h1>
        <p className="text-muted-foreground">
          Use our AI-powered tool to analyze customer feedback for sentiment and key trends.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Feedback Analyzer</CardTitle>
          <CardDescription>
            Input customer feedback below to get an automated analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SatisfactionForm />
        </CardContent>
      </Card>
    </div>
  );
}
