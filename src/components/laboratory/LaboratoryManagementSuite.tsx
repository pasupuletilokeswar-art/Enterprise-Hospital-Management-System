import React, { useState, useEffect, useMemo } from "react"
import {
  FlaskConical,
  LayoutDashboard,
  ClipboardList,
  Microscope,
  FileCheck2,
  Boxes,
  LineChart,
  Settings,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  CreditCard,
  Syringe,
  Info,
  X,
} from "lucide-react"
import LabDashboardView from "./LabDashboardView"
import LabOrdersAndCollectionView from "./LabOrdersAndCollectionView"
import LabWorkbenchView from "./LabWorkbenchView"
import LabReportsView from "./LabReportsView"
import LaboratoryInventory from "./LaboratoryInventory"
import QualityControlView from "./QualityControlView"
import AdminConfigurationView from "./AdminConfigurationView"
import { LabOrder, LabOrderDatabase, LabOrderTest } from "../../services/labOrdersDb"
import { LabLisService, SpecimenRecord, CriticalAlertRecord } from "../../services/labLisService"

interface LaboratoryManagementSuiteProps {
  technician?: string
  activeSubPage?: string
  onNavigate?: (module: string) => void
}

export type LisSubModule =
  | "lab_dashboard"
  | "lab_orders_collection"
  | "lab_workbench"
  | "lab_reports"
  | "lab_inventory"
  | "lab_quality_analytics"
  | "lab_admin_config"
  // Legacy / granular keys for seamless routing:
  | "lab_orders"
  | "lab_sample_collection"
  | "lab_worklists"
  | "lab_analyzers"
  | "lab_result_entry"
  | "lab_pathologist_review"
  | "lab_critical_alerts"
  | "lab_review_reports"
  | "lab_test_master"
  | "lab_settings"
  | "lab_tat"

const MODULE_HEADER_INFO: Record<
  string,
  { title: string; subtitle: string; badge?: string }
> = {
  lab_dashboard: {
    title: "Laboratory Dashboard",
    subtitle: "Real-time diagnostic workload, turnaround times, and pending specimen queues",
    badge: "Operational Overview",
  },
  lab_orders_collection: {
    title: "Lab Orders & Sample Collection",
    subtitle: "Doctor order intake, billing verification, tube selection, and phlebotomy collection queue",
    badge: "Orders & Phlebotomy",
  },
  lab_workbench: {
    title: "Laboratory Workbench",
    subtitle: "Department analytical queues, structured result entry with panic limits, and pathologist review",
    badge: "Testing & Review",
  },
  lab_reports: {
    title: "Laboratory Diagnostic Reports",
    subtitle: "Authorized printable reports, newly approved queue, release history, and patient EMR sync",
    badge: "Diagnostic Reports",
  },
  lab_inventory: {
    title: "Lab Inventory & Consumables",
    subtitle: "Reagents, test kits, vacuum collection tubes, and consumable stock management",
    badge: "Reagents & Stock",
  },
  lab_quality_analytics: {
    title: "Quality Control & Analytics",
    subtitle: "Levey-Jennings visual QC charts, Westgard multi-rules, operational analytics, and TAT SLA monitoring",
    badge: "QC & Analytics",
  },
  lab_admin_config: {
    title: "Laboratory Admin Configuration",
    subtitle: "Master test catalogue, tariffs, biological reference intervals, and laboratory governance",
    badge: "Test Master & Setup",
  },
}

export default function LaboratoryManagementSuite({
  technician = "Lab Technician",
  activeSubPage = "lab_dashboard",
  onNavigate,
}: LaboratoryManagementSuiteProps) {
  // Normalize module keys into consolidated LIS architecture
  const normalizeKey = (key: string): LisSubModule => {
    if (key === "laboratory" || key === "lab" || key === "lab_dashboard") return "lab_dashboard"
    if (key === "lab_orders" || key === "lab_sample_collection" || key === "lab_orders_collection") {
      return "lab_orders_collection"
    }
    if (key === "lab_sample_reception") return "lab_workbench"
    if (
      key === "lab_worklists" ||
      key === "lab_result_entry" ||
      key === "lab_pathologist_review" ||
      key === "lab_analyzers" ||
      key === "lab_processing" ||
      key === "lab_workbench" ||
      key === "lab_critical" ||
      key === "lab_critical_alerts"
    ) {
      return "lab_workbench"
    }
    if (key === "lab_reports" || key === "lab_review_reports") {
      return "lab_reports"
    }
    if (key === "lab_inventory") return "lab_inventory"
    if (key === "lab_quality_analytics" || key === "lab_analytics" || key === "lab_tat") {
      return "lab_quality_analytics"
    }
    if (key === "lab_admin_config" || key === "lab_test_master" || key === "lab_catalog" || key === "lab_settings") {
      return "lab_admin_config"
    }

    return "lab_dashboard"
  }

  const [currentTab, setCurrentTab] = useState<LisSubModule>(normalizeKey(activeSubPage))
  const [activeOrderForBench, setActiveOrderForBench] = useState<LabOrder | null>(null)
  const [activeTestForBench, setActiveTestForBench] = useState<LabOrderTest | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  // Live data subscriptions for badges
  const [orders, setOrders] = useState<LabOrder[]>(() => LabOrderDatabase.getOrders())
  const [specimens, setSpecimens] = useState<SpecimenRecord[]>(() => LabLisService.getSpecimens())
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlertRecord[]>(() => LabLisService.getCriticalAlerts())

  const loadData = () => {
    setOrders(LabOrderDatabase.getOrders())
    setSpecimens(LabLisService.getSpecimens())
    setCriticalAlerts(LabLisService.getCriticalAlerts())
  }

  useEffect(() => {
    loadData()
    const unsub1 = LabOrderDatabase.subscribe(loadData)
    const unsub2 = LabLisService.subscribe(loadData)
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  useEffect(() => {
    if (activeSubPage) {
      setCurrentTab(normalizeKey(activeSubPage))
    }
  }, [activeSubPage])

  const counts = useMemo(() => {
    const pendingDraws = specimens.filter(
      (s) => s.status === "Collection Pending" || s.status === "Recollection Requested"
    ).length
    const workbenchPending = orders.filter(
      (o) => o.status === "Sample Collected" || o.status === "In Progress" || o.status === "Billed"
    ).length
    const reportsReady = orders.filter((o) => o.status === "Completed").length
    const activeCritical = criticalAlerts.filter(
      (a) => a.status === "Active Alert" || a.status === "Escalated"
    ).length

    return {
      pendingDraws,
      workbenchPending,
      reportsReady,
      activeCritical,
    }
  }, [orders, specimens, criticalAlerts])

  const handleTabChange = (tabId: LisSubModule) => {
    const normalized = normalizeKey(tabId)
    setCurrentTab(normalized)
    if (onNavigate) {
      onNavigate(normalized)
    }
  }

  const handleOpenBenchWithOrder = (order: LabOrder, test?: LabOrderTest) => {
    setActiveOrderForBench(order)
    setActiveTestForBench(test || null)
    handleTabChange("lab_workbench")
  }

  const currentHeader = MODULE_HEADER_INFO[currentTab] || {
    title: "Laboratory Diagnostic System",
    subtitle: "Enterprise Diagnostic Workflow: Doctor Order → Specimen Collection → Bench Testing → Pathologist Review → Report Distribution",
    badge: "NABL & CAP Certified",
  }

  // Navigation tab definitions
  const tabs = [
    {
      id: "lab_dashboard" as LisSubModule,
      label: "Lab Dashboard",
      icon: LayoutDashboard,
      badge: null,
      desc: "Live clinic pulse & workload",
    },
    {
      id: "lab_orders_collection" as LisSubModule,
      label: "Lab Orders & Collection",
      icon: ClipboardList,
      badge: counts.pendingDraws > 0 ? `${counts.pendingDraws} pending` : null,
      badgeColor: "bg-amber-100 text-amber-800",
      desc: "Intake & specimen collection",
    },
    {
      id: "lab_workbench" as LisSubModule,
      label: "Lab Workbench",
      icon: Microscope,
      badge: counts.workbenchPending > 0 ? `${counts.workbenchPending} in bench` : null,
      badgeColor: "bg-teal-100 text-teal-800",
      desc: "Benches, entry & approval",
    },
    {
      id: "lab_reports" as LisSubModule,
      label: "Lab Reports",
      icon: FileCheck2,
      badge: counts.reportsReady > 0 ? `${counts.reportsReady} approved` : null,
      badgeColor: "bg-emerald-100 text-emerald-800",
      desc: "Official printable reports",
    },
    {
      id: "lab_inventory" as LisSubModule,
      label: "Lab Inventory & Consumables",
      icon: Boxes,
      badge: null,
      desc: "Kits & vacuum tubes",
    },
    {
      id: "lab_quality_analytics" as LisSubModule,
      label: "Quality & Analytics",
      icon: LineChart,
      badge: null,
      desc: "Westgard rules & TAT SLAs",
    },
    {
      id: "lab_admin_config" as LisSubModule,
      label: "Admin Configuration",
      icon: Settings,
      badge: "206 tests",
      badgeColor: "bg-purple-100 text-[#7552B8]",
      desc: "Tariffs & reference intervals",
    },
  ]



  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 p-6 space-y-4">
      {/* ── 1. UNIFIED LIS MASTER HEADER ─────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-[#7552B8] to-[#583994] text-white rounded-xl shadow-xs">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {currentHeader.title}
                </h1>
                {currentHeader.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#7552B8] uppercase tracking-wider">
                    {currentHeader.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentHeader.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {counts.activeCritical > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange("lab_workbench")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{counts.activeCritical} Critical Panic Limits</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#7552B8]" />
              <span>{showGuide ? "Hide Guide" : "How Lab Works"}</span>
            </button>

            <div className="px-3 py-1.5 bg-purple-50/70 border border-purple-100 text-[#7552B8] rounded-xl text-xs font-semibold">
              Duty: <span className="font-bold">{technician}</span>
            </div>
          </div>
        </div>



        {/* ── 3. COLLAPSIBLE "HOW LAB WORKS" QUICK GUIDE BANNER ──────────────── */}
        {showGuide && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white border border-purple-200 rounded-xl p-4 shadow-2xs text-xs space-y-3 relative">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[#7552B8] font-black text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Diagnostic Operations Quick Reference Guide</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-700">
              <div className="bg-white/80 p-3 rounded-lg border border-purple-100 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>1. Billing Clearance</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Doctor prescribes tests in OPD/IPD. Tests show as <strong className="text-amber-700">Awaiting Billing</strong> until settled at the Billing counter or quick-authorized.
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-purple-100 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Syringe className="w-3.5 h-3.5 text-purple-600" />
                  <span>2. Color-Coded Tubes</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong className="text-purple-700">Lavender:</strong> EDTA (CBC, ESR) · <strong className="text-rose-700">Red/Gold:</strong> Gel SST (LFT, RFT, Lipids) · <strong className="text-slate-700">Grey:</strong> Fluoride (Glucose).
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-purple-100 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Microscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>3. Bench & Panic Limits</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Values entered trigger automated flags (<span className="text-amber-600 font-bold">▲ High</span>, <span className="text-blue-600 font-bold">▼ Low</span>, or <span className="text-rose-600 font-bold animate-pulse">CRITICAL</span>). Critical values immediately notify ordering doctors.
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-purple-100 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Report Release</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Pathologist verifies and signs the order. It renders in authentic Imperial Hospital letterhead with print & PDF export for clinical discharge and doctor review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. PRIMARY IN-PAGE SUB-MODULE NAVIGATION TABS ──────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 border ${
                  isActive
                    ? "bg-[#7552B8] text-white border-[#7552B8] shadow-xs"
                    : "bg-slate-50/70 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                      isActive ? "bg-white/20 text-white" : tab.badgeColor || "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 5. ACTIVE SUB-MODULE WORKSPACES RENDERING ───────────────────────── */}
      <div className="transition-all">
        {currentTab === "lab_dashboard" && (
          <LabDashboardView
            onNavigate={(mod) => handleTabChange(normalizeKey(mod))}
            onOpenOrder={(ord) => handleOpenBenchWithOrder(ord)}
          />
        )}

        {currentTab === "lab_orders_collection" && (
          <LabOrdersAndCollectionView
            onOpenWorkbench={(ord, t) => handleOpenBenchWithOrder(ord, t)}
            onOpenReport={() => handleTabChange("lab_reports")}
          />
        )}

        {currentTab === "lab_workbench" && (
          <LabWorkbenchView
            initialOrder={activeOrderForBench || undefined}
            initialTest={activeTestForBench || undefined}
            onCompleteToReports={() => handleTabChange("lab_reports")}
          />
        )}

        {currentTab === "lab_reports" && <LabReportsView />}

        {currentTab === "lab_inventory" && <LaboratoryInventory />}

        {currentTab === "lab_quality_analytics" && <QualityControlView />}

        {currentTab === "lab_admin_config" && <AdminConfigurationView />}
      </div>
    </div>
  )
}
