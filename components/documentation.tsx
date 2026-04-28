"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen } from "lucide-react"

export default function Documentation() {
  const tutorials = [
    {
      title: "Getting Started",
      description: "Learn the basics of uploading and exploring your data",
      steps: ["Upload CSV file", "Explore dataset statistics", "Visualize distributions"],
    },
    {
      title: "Data Preprocessing",
      description: "Master data cleaning and feature engineering techniques",
      steps: ["Handle missing values", "Detect and remove outliers", "Normalize features"],
    },
    {
      title: "Model Selection",
      description: "Choose the right algorithm for your problem",
      steps: ["Understand problem type", "Review algorithm comparisons", "Configure hyperparameters"],
    },
    {
      title: "Model Evaluation",
      description: "Interpret and validate your model performance",
      steps: ["Review performance metrics", "Analyze confusion matrix", "Optimize model"],
    },
  ]

  const algorithms = [
    { name: "Linear Regression", use: "Continuous value prediction", complexity: "Low" },
    { name: "Logistic Regression", use: "Binary classification", complexity: "Low" },
    { name: "Decision Trees", use: "Classification & Regression", complexity: "Medium" },
    { name: "Random Forest", use: "Ensemble learning", complexity: "Medium" },
    { name: "K-Means", use: "Unsupervised clustering", complexity: "Medium" },
    { name: "SVM", use: "Linear & non-linear classification", complexity: "High" },
    { name: "Naïve Bayes", use: "Probabilistic classification", complexity: "Low" },
    { name: "KNN", use: "Instance-based learning", complexity: "Low" },
    { name: "Neural Networks", use: "Deep learning problems", complexity: "Very High" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Documentation</h1>
        <p className="text-muted-foreground">Learn how to use the platform and understand ML algorithms</p>
      </div>

      <Tabs defaultValue="tutorials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
        </TabsList>

        {/* Tutorials */}
        <TabsContent value="tutorials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutorials.map((tutorial, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <CardTitle>{tutorial.title}</CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {tutorial.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-xs">
                          {stepIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Algorithms Guide */}
        <TabsContent value="algorithms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Reference Guide</CardTitle>
              <CardDescription>Overview of all available machine learning algorithms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Algorithm</th>
                      <th className="text-left py-3 px-4 font-semibold">Use Case</th>
                      <th className="text-left py-3 px-4 font-semibold">Complexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {algorithms.map((algo, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-foreground">{algo.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{algo.use}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              algo.complexity === "Low"
                                ? "bg-green-100 text-green-700"
                                : algo.complexity === "Medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : algo.complexity === "High"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                          >
                            {algo.complexity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>Tips for successful machine learning projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-foreground mb-1">📊 Data Quality</p>
                  <p className="text-sm text-muted-foreground">
                    Always clean and preprocess your data before training. Remove duplicates, handle missing values, and
                    normalize features.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="font-semibold text-foreground mb-1">✅ Model Selection</p>
                  <p className="text-sm text-muted-foreground">
                    Start with simple models before trying complex ones. Compare multiple algorithms and use
                    cross-validation.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="font-semibold text-foreground mb-1">📈 Hyperparameter Tuning</p>
                  <p className="text-sm text-muted-foreground">
                    Use grid search or random search to find optimal hyperparameters. Monitor training and validation
                    metrics.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <p className="font-semibold text-foreground mb-1">🎯 Evaluation Metrics</p>
                  <p className="text-sm text-muted-foreground">
                    Choose appropriate metrics based on your problem. Use accuracy, precision, recall, F1-score for
                    classification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
