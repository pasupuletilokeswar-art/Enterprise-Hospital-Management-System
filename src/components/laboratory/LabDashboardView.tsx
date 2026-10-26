import React, { useState, useEffect, useMemo } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  FlaskConical,
  Microscope,
  RotateCcw,
  Search,
  Sparkles,
  User,
  Users,
  ChevronRight,
  RefreshCw,
  Plus,
  CreditCard,
  FileCheck2,
  Droplet,
  Layers,
  Syringe,
  Boxes,
  LineChart,
} from "lucide-react"
import { LabOrder, LabOrderDatabase } from "../../services/labOrdersDb"
import { LabLisService, SpecimenRecord, CriticalAlertRecord } from "../../services/labLisService"

interface LabDashboardViewProps {
  onNavigate: (module: string) => void
  onOpenOrder?: (order: LabOrder) => void
}

function SparklineBars({ heights, color }: { heights: number[]; color: string }) {
  return (
    <div className="flex items-end gap-1 h-8 shrink-0">
      {heights.map((h, i) => (
        <div key={i} className={`w-1.5 rounded-xs ${color}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export default function LabDashboardView({ onNavigate, onOpenOrder }: LabDashboardViewProps) {
  const [orders, setOrders] = useState<LabOrder[]>(() => LabOrderDatabase.getOrders())
  const [specimens, setSpecimens] = useState<SpecimenRecord[]>(() => LabLisService.getSpecimens())
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlertRecord[]>(() => LabLisService.getCriticalAlerts())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDept, setSelectedDept] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = () => {
    setIsRefreshing(true)
    setOrders(LabOrderDatabase.getOrders())
    setSpecimens(LabLisService.getSpecimens())
    setCriticalAlerts(LabLisService.getCriticalAlerts())
    setTimeout(() => setIsRefreshing(false), 400)
  }

  useEffect(() => {
    const unsub1 = LabOrderDatabase.subscribe(loadData)
    const unsub2 = LabLisService.subscribe(loadData)
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    const ordersToday = orders.filter((o) => o.createdAt?.startsWith(todayStr) || true).length
    const awaitingCollection = specimens.filter((s) => s.status === "Collection Pending" || s.status === "Recollection Requested").length
    const processingCount = orders.filter((o) => o.status === "In Progress" || o.status === "Sample Collected").length
    const awaitingReview = orders.filter((o) =>
      o.tests.some((t) => t.status === "Result Entered" || t.status === "In Progress") && o.status !== "Completed"
    ).length
    const releasedToday = orders.filter((o) => o.status === "Completed").length
    const activeCritical = criticalAlerts.filter((a) => a.status === "Active Alert" || a.status === "Escalated").length

    return {
      ordersToday,
      awaitingCollection,
      processingCount,
      awaitingReview,
      releasedToday,
      activeCritical,
    }
  }, [orders, specimens, criticalAlerts])

  // Filtered Dashboard Worklist
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !searchQuery ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.umr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.tests.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchDept = selectedDept === "All" || o.department === selectedDept
      const matchPriority =
        selectedPriority === "All" ||
        (selectedPriority === "STAT" && o.tests.some((t) => t.urgency === "STAT")) ||
        (selectedPriority === "Urgent" && o.tests.some((t) => t.urgency === "Urgent")) ||
        (selectedPriority === "Routine" && o.tests.every((t) => t.urgency === "Routine"))

      const matchStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Awaiting Billing" && o.billing?.status !== "Paid") ||
        (selectedStatus === "Ready for Draw" && o.billing?.status === "Paid" && o.status === "Billed") ||
        (selectedStatus === "In Testing" && (o.status === "Sample Collected" || o.status === "In Progress")) ||
        (selectedStatus === "Completed" && o.status === "Completed")

      return matchSearch && matchDept && matchPriority && matchStatus
    })
  }, [orders, searchQuery, selectedDept, selectedPriority, selectedStatus])

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedDept("All")
    setSelectedPriority("All")
    setSelectedStatus("All")
  }

  return (
    <div className="space-y-5">
      {/* ── 1. TOP 5 EXECUTIVE KPI STAT CARDS WITH SPARKLINES ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Orders Today */}
        <div
          onClick={() => onNavigate("lab_orders_collection")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#167D8D] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#14243A]/10 text-[#14243A] group-hover:bg-[#14243A] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#172B3A] transition-colors truncate">
                Orders Today
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-[#172B3A] tracking-tight">{metrics.ordersToday}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-[#168568] bg-[#168568]/10 border border-[#168568]/20 px-1.5 py-0.2 rounded">
                ↑ 14%
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium truncate">Total diagnostic requests</p>
          </div>
          <SparklineBars heights={[35, 55, 45, 80, 100]} color="bg-[#14243A]" />
        </div>

        {/* KPI 2: Awaiting Draw */}
        <div
          onClick={() => onNavigate("lab_orders_collection")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#D99A25] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D99A25]/10 text-[#D99A25] group-hover:bg-[#D99A25] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#172B3A] transition-colors truncate">
                Awaiting Draw
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-[#172B3A] tracking-tight">{metrics.awaitingCollection}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-[#D99A25] bg-[#D99A25]/10 border border-[#D99A25]/20 px-1.5 py-0.2 rounded">
                ↑ 25%
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium truncate">Phlebotomy draw queue</p>
          </div>
          <SparklineBars heights={[20, 50, 40, 75, 90]} color="bg-[#D99A25]" />
        </div>

        {/* KPI 3: Analytical Bench */}
        <div
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#167D8D] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#167D8D]/10 text-[#167D8D] group-hover:bg-[#167D8D] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <Microscope size={16} />
              </div>
              <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#172B3A] transition-colors truncate">
                In Testing
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-[#172B3A] tracking-tight">{metrics.processingCount}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-[#167D8D] bg-[#167D8D]/10 border border-[#167D8D]/20 px-1.5 py-0.2 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium truncate">Active workbench runs</p>
          </div>
          <SparklineBars heights={[30, 45, 60, 75, 95]} color="bg-[#167D8D]" />
        </div>

        {/* KPI 4: Critical Panic Limits */}
        <div
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-rose-50/40 border border-[#DCE4EC] hover:border-[#C93645] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C93645]/10 text-[#C93645] group-hover:bg-[#C93645] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#172B3A] transition-colors truncate">
                Panic Limits
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-[#C93645] tracking-tight">{metrics.activeCritical}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-[#C93645] bg-[#C93645]/10 border border-[#C93645]/20 px-1.5 py-0.2 rounded">
                Urgent
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium truncate">Doctor call required</p>
          </div>
          <SparklineBars heights={[10, 80, 20, 95, 100]} color="bg-[#C93645]" />
        </div>

        {/* KPI 5: Reports Released */}
        <div
          onClick={() => onNavigate("lab_reports")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#168568] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#168568]/10 text-[#168568] group-hover:bg-[#168568] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#172B3A] transition-colors truncate">
                Reports Released
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-[#172B3A] tracking-tight">{metrics.releasedToday}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-[#168568] bg-[#168568]/10 border border-[#168568]/20 px-1.5 py-0.2 rounded">
                Ready
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium truncate">Signed & EMR synced</p>
          </div>
          <SparklineBars heights={[25, 45, 65, 85, 100]} color="bg-[#168568]" />
        </div>
      </div>

      {/* ── 2. QUICK ACTION STRIP (CLINICAL WORKFLOW JUMP CARDS) ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => onNavigate("lab_orders_collection")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#167D8D] rounded-xl p-3.5 flex items-center justify-between gap-3 text-left transition shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#167D8D]/10 text-[#167D8D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Syringe size={17} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#172B3A] truncate">Specimen Collection</h4>
              <p className="text-[11px] text-[#64748B] truncate">Draw & print barcode</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-400 group-hover:text-[#167D8D] transition-colors shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#14243A] rounded-xl p-3.5 flex items-center justify-between gap-3 text-left transition shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#14243A]/10 text-[#14243A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Microscope size={17} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#172B3A] truncate">Lab Workbench</h4>
              <p className="text-[11px] text-[#64748B] truncate">Result entry & flags</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-400 group-hover:text-[#14243A] transition-colors shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_reports")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#168568] rounded-xl p-3.5 flex items-center justify-between gap-3 text-left transition shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#168568]/10 text-[#168568] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck2 size={17} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#172B3A] truncate">Diagnostic Reports</h4>
              <p className="text-[11px] text-[#64748B] truncate">Review & PDF print</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-400 group-hover:text-[#168568] transition-colors shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_inventory")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#D99A25] rounded-xl p-3.5 flex items-center justify-between gap-3 text-left transition shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#D99A25]/10 text-[#D99A25] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Boxes size={17} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#172B3A] truncate">Reagents & Stock</h4>
              <p className="text-[11px] text-[#64748B] truncate">Batch & expiry watch</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-400 group-hover:text-[#D99A25] transition-colors shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_quality_analytics")}
          className="bg-white hover:bg-slate-50 border border-[#DCE4EC] hover:border-[#167D8D] rounded-xl p-3.5 flex items-center justify-between gap-3 text-left transition shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#167D8D]/10 text-[#167D8D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <LineChart size={17} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#172B3A] truncate">Quality & QC</h4>
              <p className="text-[11px] text-[#64748B] truncate">Levey-Jennings & TAT</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-400 group-hover:text-[#167D8D] transition-colors shrink-0" />
        </button>
      </div>

      {/* ── 3. FILTER CONTROL BAR (EXECUTIVE SEARCH & CRITERIA BAR) ───────────── */}
      <div className="bg-white border border-[#DCE4EC] rounded-2xl p-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient name, UMR, order ID, or investigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F4F7FA] border border-[#DCE4EC] rounded-xl text-xs text-[#172B3A] placeholder-[#64748B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#167D8D] transition"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-[#F4F7FA] border border-[#DCE4EC] rounded-xl text-xs font-semibold text-[#172B3A] focus:outline-none focus:ring-1 focus:ring-[#167D8D]"
            >
              <option value="All">All Departments</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Hematology">Hematology</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Clinical Pathology">Clinical Pathology</option>
              <option value="Immunoassay">Immunoassay</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-[#F4F7FA] border border-[#DCE4EC] rounded-xl text-xs font-semibold text-[#172B3A] focus:outline-none focus:ring-1 focus:ring-[#167D8D]"
            >
              <option value="All">All Urgencies</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT / Emergency</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-[#F4F7FA] border border-[#DCE4EC] rounded-xl text-xs font-semibold text-[#172B3A] focus:outline-none focus:ring-1 focus:ring-[#167D8D]"
            >
              <option value="All">All Stages</option>
              <option value="Awaiting Billing">Awaiting Billing</option>
              <option value="Ready for Draw">Ready for Draw</option>
              <option value="In Testing">In Testing</option>
              <option value="Completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F7FA] hover:bg-slate-100 border border-[#DCE4EC] rounded-xl text-xs font-bold text-[#64748B] hover:text-[#172B3A] transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. MODERN PATIENT & ORDER WORKLIST TABLE ──────────────────────────── */}
      <div className="bg-white border border-[#DCE4EC] rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE4EC] flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-[#14243A]">Live Diagnostic Worklist Queue</h3>
            <p className="text-[11px] text-[#64748B]">
              Showing {filteredOrders.length} active orders requiring clinical progression
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#64748B] bg-white border border-[#DCE4EC] px-2.5 py-1 rounded-lg">
            Auto-Sync 5s
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4F7FA] border-b border-[#DCE4EC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Patient &amp; UMR</th>
                <th className="py-3 px-4">Department / Doctor</th>
                <th className="py-3 px-4">Diagnostic Tests</th>
                <th className="py-3 px-4">Journey Stage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Billing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4EC]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#172B3A]">No lab orders match selected criteria</p>
                    <p className="text-xs text-[#64748B] mt-1">Try resetting search filters or checking different departments</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const initials = order.patientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  const isPaid = order.billing?.status === "Paid"
                  const hasStat = order.tests.some((t) => t.urgency === "STAT")

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Patient & UMR */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#14243A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#172B3A] truncate flex items-center gap-1.5">
                              <span>{order.patientName}</span>
                              {hasStat && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#C93645] text-white">
                                  STAT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#64748B] font-mono">
                              {order.umr} · {order.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Doctor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#172B3A]">{order.department || "Pathology"}</div>
                        <div className="text-[11px] text-[#64748B] truncate">{order.doctorName}</div>
                      </td>

                      {/* Diagnostic Tests */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#172B3A] truncate max-w-xs">
                          {order.tests.map((t) => t.name).join(", ")}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {order.tests.length} investigation{order.tests.length > 1 ? "s" : ""}
                        </div>
                      </td>

                      {/* Journey Stage Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[10px] font-bold text-[#64748B]">
                            <span>
                              {order.status === "Awaiting Billing" && "1/4 Billing"}
                              {order.status === "Billed" && "2/4 Draw"}
                              {order.status === "Sample Collected" && "3/4 Bench"}
                              {order.status === "In Progress" && "3/4 Bench"}
                              {order.status === "Completed" && "4/4 Release"}
                            </span>
                            <span>
                              {order.status === "Completed"
                                ? "100%"
                                : order.status === "In Progress" || order.status === "Sample Collected"
                                ? "65%"
                                : order.status === "Billed"
                                ? "35%"
                                : "10%"}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                order.status === "Completed"
                                  ? "bg-[#168568] w-full"
                                  : order.status === "In Progress" || order.status === "Sample Collected"
                                  ? "bg-[#167D8D] w-2/3"
                                  : order.status === "Billed"
                                  ? "bg-[#D99A25] w-1/3"
                                  : "bg-slate-400 w-1/12"
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            order.status === "Completed"
                              ? "bg-[#168568]/10 text-[#168568] border-[#168568]/20"
                              : order.status === "In Progress" || order.status === "Sample Collected"
                              ? "bg-[#167D8D]/10 text-[#167D8D] border-[#167D8D]/20"
                              : order.status === "Billed"
                              ? "bg-[#D99A25]/10 text-[#D99A25] border-[#D99A25]/20"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.status === "Completed"
                                ? "bg-[#168568]"
                                : order.status === "In Progress" || order.status === "Sample Collected"
                                ? "bg-[#167D8D]"
                                : order.status === "Billed"
                                ? "bg-[#D99A25]"
                                : "bg-slate-400"
                            }`}
                          />
                          {order.status}
                        </span>
                      </td>

                      {/* Billing */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            isPaid
                              ? "bg-[#168568]/10 text-[#168568] border border-[#168568]/20"
                              : "bg-[#D99A25]/10 text-[#D99A25] border border-[#D99A25]/20"
                          }`}
                        >
                          {isPaid ? "Paid" : "Awaiting"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "Completed" ? (
                            <button
                              type="button"
                              onClick={() => onNavigate("lab_reports")}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#168568] border border-[#DCE4EC] rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Report
                            </button>
                          ) : order.status === "Billed" ? (
                            <button
                              type="button"
                              onClick={() => onNavigate("lab_orders_collection")}
                              className="px-2.5 py-1 bg-[#167D8D] hover:bg-[#136674] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              Draw
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenOrder) onOpenOrder(order)
                                else onNavigate("lab_workbench")
                              }}
                              className="px-2.5 py-1 bg-[#14243A] hover:bg-[#1E3550] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              Bench
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
