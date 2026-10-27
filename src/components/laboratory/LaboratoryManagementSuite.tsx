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
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  CreditCard,
  Calendar,
  RefreshCw,
  Plus,
  BookOpen,
  Info,
  X,
  ShieldAlert,
  Clock,
  Syringe,
  Filter,
  Check,
} from "lucide-react"
import LabDashboardView from "./LabDashboardView"
import LabOrdersAndCollectionView from "./LabOrdersAndCollectionView"
import LabWorkbenchView from "./LabWorkbenchView"
import LabReportsView from "./LabReportsView"
import LaboratoryInventory from "./LaboratoryInventory"
import QualityControlView from "./QualityControlView"
import AdminConfigurationView from "./AdminConfigurationView"
import CriticalAlertsView from "./CriticalAlertsView"
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
  { title: string; subtitle: string; badge?: string; breadcrumb: string }
> = {
  lab_dashboard: {
    title: "Laboratory Command Center",
    subtitle: "Real-time diagnostic workload, turnaround times, and pending specimen queues",
    badge: "Operational Overview",
    breadcrumb: "Command Dashboard",
  },
  lab_orders_collection: {
    title: "Lab Orders & Sample Collection",
    subtitle: "Doctor order intake, billing verification, tube selection, and barcode phlebotomy queue",
    badge: "Orders & Phlebotomy",
    breadcrumb: "Orders & Phlebotomy",
  },
  lab_workbench: {
    title: "Laboratory Analytical Workbench",
    subtitle: "Department analytical queues, structured result entry with panic limits, and clinical sign-off",
    badge: "Testing & Review",
    breadcrumb: "Lab Workbench",
  },
  lab_reports: {
    title: "Laboratory Diagnostic Reports",
    subtitle: "Authorized printable reports, newly approved queue, release history, and patient EMR sync",
    badge: "Diagnostic Reports",
    breadcrumb: "Diagnostic Reports",
  },
  lab_inventory: {
    title: "Lab Inventory & Consumables",
    subtitle: "Reagents, test kits, vacuum collection tubes, and consumable stock management",
    badge: "Reagents & Stock",
    breadcrumb: "Inventory & Stock",
  },
  lab_quality_analytics: {
    title: "Quality Control & Analytics",
    subtitle: "Levey-Jennings visual QC charts, Westgard multi-rules, operational analytics, and TAT SLA monitoring",
    badge: "QC & Analytics",
    breadcrumb: "Quality & Analytics",
  },
  lab_admin_config: {
    title: "Laboratory Admin Configuration",
    subtitle: "Master test catalogue, tariffs, biological reference intervals, and laboratory governance",
    badge: "Test Master & Setup",
    breadcrumb: "Admin Configuration",
  },
}

export default function LaboratoryManagementSuite({
  technician = "Lab Technician",
  activeSubPage = "lab_dashboard",
  onNavigate,
}: LaboratoryManagementSuiteProps) {
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
  const [showCriticalModal, setShowCriticalModal] = useState(false)

  // Live data subscriptions
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
    setCurrentTab(normalizeKey(activeSubPage))
  }, [activeSubPage])

  const pendingDraws = useMemo(
    () => specimens.filter((s) => s.status === "Collection Pending" || s.status === "Recollection Requested").length,
    [specimens]
  )
  const benchCount = useMemo(
    () => orders.filter((o) => o.status === "Sample Collected" || o.status === "In Progress").length,
    [orders]
  )
  const reportsCount = useMemo(
    () => orders.filter((o) => o.status === "Completed").length,
    [orders]
  )
  const activePanicCount = useMemo(
    () => criticalAlerts.filter((a) => a.status === "Active Alert" || a.status === "Escalated").length,
    [criticalAlerts]
  )

  const handleTabChange = (tabId: LisSubModule) => {
    setCurrentTab(tabId)
    if (onNavigate) {
      onNavigate(tabId)
    }
  }

  const handleOpenBenchWithOrder = (order: LabOrder, test?: LabOrderTest) => {
    setActiveOrderForBench(order)
    setActiveTestForBench(test || null)
    handleTabChange("lab_workbench")
  }

  const navItems = [
    {
      id: "lab_dashboard" as LisSubModule,
      label: "Lab Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "lab_orders_collection" as LisSubModule,
      label: "Orders & Phlebotomy",
      icon: ClipboardList,
      badge: pendingDraws > 0 ? `${pendingDraws} draws` : null,
      badgeColor: "bg-[#D99A25]/15 text-[#D99A25]",
    },
    {
      id: "lab_workbench" as LisSubModule,
      label: "Lab Workbench",
      icon: Microscope,
      badge: benchCount > 0 ? `${benchCount} pending` : null,
      badgeColor: "bg-[#167D8D]/15 text-[#167D8D]",
    },
    {
      id: "lab_reports" as LisSubModule,
      label: "Diagnostic Reports",
      icon: FileCheck2,
      badge: reportsCount > 0 ? `${reportsCount} ready` : null,
      badgeColor: "bg-[#168568]/15 text-[#168568]",
    },
    {
      id: "lab_inventory" as LisSubModule,
      label: "Reagents & Stock",
      icon: Boxes,
      badge: null,
    },
    {
      id: "lab_quality_analytics" as LisSubModule,
      label: "Quality & QC",
      icon: LineChart,
      badge: null,
    },
    {
      id: "lab_admin_config" as LisSubModule,
      label: "Test Master",
      icon: Settings,
      badge: "206 tests",
      badgeColor: "bg-slate-200 text-slate-700",
    },
  ]

  const activeHeader = MODULE_HEADER_INFO[currentTab] || MODULE_HEADER_INFO["lab_dashboard"]

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col text-[#172B3A] font-sans antialiased">
      {/* ── 1. GLOBAL EXECUTIVE HEADER WITH HORIZONTAL NAV TABS ───────────────── */}
      <header className="bg-white border-b border-[#DCE4EC] sticky top-0 z-10 px-6 pt-4 pb-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Breadcrumb & Module Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B] mb-1">
              <span>Imperial Hospital</span>
              <span>/</span>
              <span>Central Laboratory</span>
              <span>/</span>
              <span className="text-[#167D8D] font-bold">{activeHeader.breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#167D8D] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <FlaskConical className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-xl font-black text-[#14243A] tracking-tight">{activeHeader.title}</h1>
              {activeHeader.badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-[#167D8D]/10 text-[#167D8D] border border-[#167D8D]/20">
                  {activeHeader.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{activeHeader.subtitle}</p>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Date / Shift Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FA] border border-[#DCE4EC] rounded-xl text-xs font-bold text-[#64748B]">
              <Calendar className="w-3.5 h-3.5 text-[#167D8D]" />
              <span>01 Oct 2026 – Today</span>
            </div>

            {/* SOP Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FA] hover:bg-slate-100 border border-[#DCE4EC] rounded-xl text-xs font-bold text-[#14243A] transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#167D8D]" />
              <span>Dept SOP</span>
            </button>

            {/* Panic Limits Alert Badge */}
            <button
              type="button"
              onClick={() => setShowCriticalModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer ${
                activePanicCount > 0
                  ? "bg-[#C93645]/10 border-[#C93645]/30 text-[#C93645] hover:bg-[#C93645]/20 animate-pulse"
                  : "bg-[#F4F7FA] border-[#DCE4EC] text-[#64748B] hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activePanicCount} Critical Panic</span>
            </button>

            {/* Quick Refresh */}
            <button
              type="button"
              onClick={loadData}
              title="Refresh Live Data"
              className="p-2 bg-[#F4F7FA] hover:bg-slate-100 border border-[#DCE4EC] rounded-xl text-[#64748B] hover:text-[#14243A] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleTabChange("lab_orders_collection")}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#167D8D] hover:bg-[#136674] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Lab Order</span>
            </button>
          </div>
        </div>

        {/* ── SUB-MODULE NAVIGATION TABS (CLEAN HORIZONTAL PILLS) ───────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-3 border-t border-[#DCE4EC]">
          {navItems.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-[#167D8D] text-white border-[#167D8D] shadow-xs"
                    : "bg-[#F4F7FA] text-[#64748B] border-[#DCE4EC] hover:bg-slate-100 hover:text-[#172B3A]"
                }`}
              >
                <Icon size={15} className={isActive ? "text-white" : "text-[#64748B]"} />
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
      </header>

      {/* Collapsible SOP Quick Guide Banner */}
      {showGuide && (
        <div className="bg-gradient-to-r from-[#F4F7FA] via-white to-[#F4F7FA] border-b border-[#DCE4EC] p-4 text-xs relative animate-in fade-in duration-200">
          <button
            onClick={() => setShowGuide(false)}
            className="absolute top-3 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-[#167D8D] font-bold text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Imperial Clinical Diagnostic Pathway & Quality Standard</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-[#DCE4EC] shadow-2xs space-y-1">
              <div className="font-bold text-[#14243A] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#D99A25]" />
                <span>1. Billing Clearance</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Doctor orders in OPD/IPD. Tests remain in Awaiting Billing until settled or emergency authorized.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE4EC] shadow-2xs space-y-1">
              <div className="font-bold text-[#14243A] flex items-center gap-1.5">
                <Syringe className="w-3.5 h-3.5 text-[#167D8D]" />
                <span>2. Color-Coded Phlebotomy</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Lavender (EDTA: CBC), Gold/Red (SST: LFT/RFT), Light Blue (Citrate: PT/INR), Grey (Fluoride: Sugar).
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE4EC] shadow-2xs space-y-1">
              <div className="font-bold text-[#14243A] flex items-center gap-1.5">
                <Microscope className="w-3.5 h-3.5 text-[#14243A]" />
                <span>3. Bench & Panic Limits</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Automated flags for abnormal results. Panic values alert clinicians immediately with mandatory readback.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE4EC] shadow-2xs space-y-1">
              <div className="font-bold text-[#14243A] flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#168568]" />
                <span>4. Pathologist Release</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Verified and digitally signed reports generate in official Imperial Hospital letterhead with QR code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. SUB-MODULE VIEW WORKSPACE RENDERING ─────────────────────────── */}
      <main className="flex-1 p-6">
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

        {currentTab === "lab_inventory" && <LaboratoryInventory technician={technician} />}

        {currentTab === "lab_quality_analytics" && <QualityControlView />}

        {currentTab === "lab_admin_config" && <AdminConfigurationView />}
      </main>

      {/* ── 3. CRITICAL PANIC LIMITS MODAL DIALOG ──────────────────────────── */}
      {showCriticalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14243A]/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DCE4EC] w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#C93645] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="text-base font-black tracking-tight">Critical Panic Limits Command Queue</h3>
                  <p className="text-xs text-rose-100">
                    Mandatory verbal readback & clinician notification registry (CAP / NABL safety standard)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCriticalModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto bg-[#F4F7FA]">
              <CriticalAlertsView />
            </div>
            <div className="bg-white px-6 py-3 border-t border-[#DCE4EC] flex justify-end">
              <button
                onClick={() => setShowCriticalModal(false)}
                className="px-4 py-2 bg-[#14243A] hover:bg-[#1E3550] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
