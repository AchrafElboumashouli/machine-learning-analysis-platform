"use client"

import { useState, useCallback } from "react"
import Sidebar from "@/components/sidebar"
import DatasetManager from "@/components/dataset-manager"
import DataAnalysis from "@/components/data-analysis"
import TargetSelection from "@/components/target-selection"
import DataSplitting from "@/components/data-splitting"
import DataPreprocessing from "@/components/data-preprocessing"
import ViewPreprocessedDataset from "@/components/view-preprocessed-dataset"
import AlgorithmPanel from "@/components/algorithm-panel"
import ModelTraining from "@/components/model-training"
import ResultsView from "@/components/results-view"
import ExportSection from "@/components/export-section"
import Documentation from "@/components/documentation"
import ViewDataset from "@/components/view-dataset"
import ComprehensiveVisualization from "@/components/comprehensive-visualization"

type Tab =
  | "dataset"
  | "view-dataset"
  | "analysis"
  | "target"
  | "splitting"
  | "preprocessing"
  | "view-preprocessed-dataset"
  | "algorithm"
  | "training"
  | "visualization"
  | "results"
  | "export"
  | "docs"

interface PreprocessingConfig {
  missingValueStrategy: "mean" | "median" | "drop" | "forward_fill"
  encodingMethod: "onehot" | "ordinal" | "label"
  scalingMethod: "standard" | "minmax" | "none"
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dataset")
  const [dataset, setDataset] = useState<any>(null)
  const [dataStats, setDataStats] = useState<any>(null)
  const [targetVariable, setTargetVariable] = useState<string | null>(null)
  const [problemType, setProblemType] = useState<string | null>(null)
  const [trainSplitPercentage, setTrainSplitPercentage] = useState(80)
  const [isSplitConfirmed, setIsSplitConfirmed] = useState(false)
  const [kMeansCluster, setKMeansCluster] = useState<number>(3)

  const [preprocessingConfig, setPreprocessingConfig] = useState<PreprocessingConfig>({
    missingValueStrategy: "mean",
    encodingMethod: "onehot",
    scalingMethod: "standard",
  })
  const [isPreprocessingConfigured, setIsPreprocessingConfigured] = useState(false)
  const [preprocessedDataset, setPreprocessedDataset] = useState<any>(null)

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null)
  const [modelResults, setModelResults] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isDatasetReady = !!dataset
  const isAnalysisComplete = !!dataStats
  const isTargetSelected = !!targetVariable || problemType === "Clustering"
  const isSplittingComplete = isSplitConfirmed || problemType === "Clustering"
  const isPreprocessingConfigured_ = isPreprocessingConfigured
  const isAlgorithmSelected = !!selectedAlgorithm
  const isTrainingComplete = !!modelResults

  const handleAlgorithmSelect = useCallback((algo: string) => {
    setSelectedAlgorithm(algo)
  }, [])

  const handleSplitConfirm = useCallback(() => {
    setIsSplitConfirmed(true)
  }, [])

  const handleDataAnalysis = useCallback((stats: any) => {
    setDataStats(stats)
  }, [])

  const handleDatasetChange = useCallback((newDataset: any) => {
    setDataset(newDataset)
    setDataStats(null)
    setTargetVariable(null)
    setProblemType(null)
    setIsSplitConfirmed(false)
    setIsPreprocessingConfigured(false)
    setSelectedAlgorithm(null)
    setModelResults(null)
    setPreprocessedDataset(null)
    setKMeansCluster(3)
  }, [])

  const handleDataStatsChange = useCallback((stats: any) => {
    setDataStats(stats)
  }, [])

  const handlePreprocessingConfig = useCallback((config: PreprocessingConfig) => {
    setPreprocessingConfig(config)
    setIsPreprocessingConfigured(true)
    setPreprocessedDataset(null)
  }, [])

  const handlePreprocessedDataset = useCallback((preprocessedData: any) => {
    setPreprocessedDataset(preprocessedData)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isDatasetReady={isDatasetReady}
        isAnalysisComplete={isAnalysisComplete}
        isTargetSelected={isTargetSelected}
        isSplittingComplete={isSplittingComplete}
        isPreprocessingConfigured={isPreprocessingConfigured_}
        isAlgorithmSelected={isAlgorithmSelected}
        isTrainingComplete={isTrainingComplete}
        problemType={problemType}
      />

      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? "ml-0" : "ml-0"}`}>
        <div className="min-h-screen p-6 md:p-8">
          {activeTab === "dataset" && (
            <DatasetManager
              dataset={dataset}
              setDataset={handleDatasetChange}
              onViewDataset={() => setActiveTab("view-dataset")}
            />
          )}
          {activeTab === "view-dataset" && (
            <ViewDataset
              dataset={dataset}
              dataStats={dataStats}
              onBack={() => setActiveTab("dataset")}
              preprocessingStatus={isPreprocessingConfigured ? "Configured" : undefined}
            />
          )}
          {activeTab === "analysis" && (
            <DataAnalysis dataset={dataset} dataStats={dataStats} setDataStats={handleDataAnalysis} />
          )}
          {activeTab === "target" && (
            <TargetSelection
              dataset={dataset}
              targetVariable={targetVariable}
              setTargetVariable={setTargetVariable}
              dataStats={dataStats}
              problemType={problemType}
              setProblemType={setProblemType}
            />
          )}
          {activeTab === "splitting" && (
            <DataSplitting
              dataset={dataset}
              targetVariable={targetVariable}
              trainSplitPercentage={trainSplitPercentage}
              setTrainSplitPercentage={setTrainSplitPercentage}
              onSplitConfirm={handleSplitConfirm}
            />
          )}
          {activeTab === "preprocessing" && (
            <DataPreprocessing
              dataset={dataset}
              dataStats={dataStats}
              currentConfig={preprocessingConfig}
              onConfigUpdate={handlePreprocessingConfig}
              onViewDataset={() => setActiveTab("view-dataset")}
              onViewPreprocessedDataset={() => setActiveTab("view-preprocessed-dataset")}
              targetVariable={targetVariable}
              onPreprocessedDatasetReady={handlePreprocessedDataset}
            />
          )}
          {activeTab === "view-preprocessed-dataset" && (
            <ViewPreprocessedDataset
              dataset={dataset}
              dataStats={dataStats}
              preprocessingConfig={preprocessingConfig}
              onBack={() => setActiveTab("preprocessing")}
              targetVariable={targetVariable}
            />
          )}
          {activeTab === "algorithm" && (
            <AlgorithmPanel
              dataset={dataset}
              selectedAlgorithm={selectedAlgorithm}
              onSelectAlgorithm={handleAlgorithmSelect}
              targetVariable={targetVariable}
              dataStats={dataStats}
              problemType={problemType}
              kMeansCluster={kMeansCluster}
              onKMeansClusterChange={setKMeansCluster}
            />
          )}
          {activeTab === "training" && (
            <ModelTraining
              selectedAlgorithm={selectedAlgorithm}
              dataset={dataset}
              targetVariable={targetVariable}
              trainSplitPercentage={trainSplitPercentage}
              preprocessingConfig={preprocessingConfig}
              setModelResults={setModelResults}
              problemType={problemType}
              kMeansCluster={kMeansCluster}
            />
          )}
          {activeTab === "visualization" && (
            <ComprehensiveVisualization
              modelResults={modelResults}
              problemType={problemType}
              modelName={selectedAlgorithm || "Unknown"}
              dataset={dataset}
              targetVariable={targetVariable}
            />
          )}
          {activeTab === "results" && <ResultsView modelResults={modelResults} problemType={problemType} />}
          {activeTab === "export" && <ExportSection modelResults={modelResults} problemType={problemType} />}
          {activeTab === "docs" && <Documentation />}
        </div>
      </main>
    </div>
  )
}
