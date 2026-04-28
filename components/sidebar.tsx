"use client"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  Database,
  BarChart3,
  Target,
  SplitIcon,
  Wand2,
  Cpu,
  Zap,
  TrendingUp,
  Download,
  BookOpen,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: any) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isDatasetReady: boolean
  isAnalysisComplete: boolean
  isTargetSelected: boolean
  isSplittingComplete: boolean
  isPreprocessingConfigured: boolean
  isAlgorithmSelected: boolean
  isTrainingComplete: boolean
  problemType?: string | null
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  isDatasetReady,
  isAnalysisComplete,
  isTargetSelected,
  isSplittingComplete,
  isPreprocessingConfigured,
  isAlgorithmSelected,
  isTrainingComplete,
  problemType,
}: SidebarProps) {
  const menuItems = [
    { id: "dataset", label: "1. Upload Dataset", icon: Database, step: 1, ready: true, completed: isDatasetReady },
    {
      id: "analysis",
      label: "2. Data Analysis",
      icon: BarChart3,
      step: 2,
      ready: isDatasetReady,
      completed: isAnalysisComplete,
    },
    {
      id: "target",
      label: "3. Select Target",
      icon: Target,
      step: 3,
      ready: isAnalysisComplete,
      completed: isTargetSelected,
    },
    {
      id: "splitting",
      label: "4. Configure Split",
      icon: SplitIcon,
      step: 4,
      ready: isTargetSelected && problemType !== "Clustering",
      completed: isSplittingComplete,
      hidden: problemType === "Clustering",
    },
    {
      id: "preprocessing",
      label: problemType === "Clustering" ? "4. Preprocessing" : "5. Preprocessing",
      icon: Wand2,
      step: problemType === "Clustering" ? 4 : 5,
      ready: problemType === "Clustering" ? isTargetSelected : isSplittingComplete,
      completed: isPreprocessingConfigured,
    },
    {
      id: "algorithm",
      label: problemType === "Clustering" ? "5. Choose Algorithm" : "6. Choose Algorithm",
      icon: Cpu,
      step: problemType === "Clustering" ? 5 : 6,
      ready: isPreprocessingConfigured,
      completed: isAlgorithmSelected,
    },
    {
      id: "training",
      label: problemType === "Clustering" ? "6. Train Model" : "7. Train Model",
      icon: Zap,
      step: problemType === "Clustering" ? 6 : 7,
      ready: isAlgorithmSelected,
      completed: isTrainingComplete,
    },
    {
      id: "visualization",
      label: problemType === "Clustering" ? "7. Visualize Results" : "8. Visualize Results",
      icon: TrendingUp,
      step: problemType === "Clustering" ? 7 : 8,
      ready: isTrainingComplete,
      completed: isTrainingComplete,
    },
    {
      id: "results",
      label: problemType === "Clustering" ? "8. View Results" : "9. View Results",
      icon: TrendingUp,
      step: problemType === "Clustering" ? 8 : 9,
      ready: isTrainingComplete,
      completed: isTrainingComplete,
    },
    {
      id: "export",
      label: problemType === "Clustering" ? "9. Export Data" : "10. Export Data",
      icon: Download,
      step: problemType === "Clustering" ? 9 : 10,
      ready: isTrainingComplete,
      completed: isTrainingComplete,
    },
    { id: "docs", label: "Documentation", icon: BookOpen, step: 11, ready: true, completed: false },
  ].filter((item) => !item.hidden)

  // Calculate progress
  const completedCount = menuItems.filter((item) => item.completed && item.step <= 10).length
  const totalSteps = menuItems.filter((item) => item.step <= 10).length
  const progressPercentage = (completedCount / totalSteps) * 100

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative h-screen w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        text-white transition-all duration-300 z-40 shadow-2xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                DataMind AI
              </h1>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Overall Progress</span>
                <span className="text-cyan-400 font-semibold">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {completedCount} of {totalSteps} steps completed
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isDisabled = !item.ready
              const isActive = activeTab === item.id
              const isCompleted = item.completed

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(item.id)
                      setSidebarOpen(false)
                    }
                  }}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left relative
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                        : isDisabled
                          ? "text-slate-600 cursor-not-allowed opacity-40"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                    }
                  `}
                >
                  {/* Step indicator or completion icon */}
                  <div
                    className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0
                    ${
                      isCompleted
                        ? "bg-green-500/20 text-green-400"
                        : isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-700 text-slate-400"
                    }
                  `}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span>{item.step}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{item.label}</span>
                  </div>

                  {/* Arrow indicator for active item */}
                  {isActive && <ChevronRight className="h-4 w-4 animate-pulse" />}

                  {/* Completion checkmark */}
                  {isCompleted && !isActive && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 text-center">ML Data Analysis Platform</p>
              <p className="text-xs text-slate-500 text-center mt-1">v2.0 Final</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
