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
} from "lucide-react"
import { LabOrder, LabOrderDatabase } from "../../services/labOrdersDb"
import { LabLisService, SpecimenRecord, CriticalAlertRecord } from "../../services/labLisService"

interface LabDashboardViewProps {
  onNavigate: (module: string) => void
  onOpenOrder?: (order: LabOrder) => void
}

// Sparkline Mini Bar Visual Component (Identical to Insurance Command Dashboard)
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
    const awaitingCollection = specimens.filter((s) => s.status === "Collection Pending").length
    const processingCount = orders.filter((o) => o.status === "In Progress" || o.status === "Sample Collected").length
    const awaitingReview = orders.filter((o) =>
      o.tests.some((t) => t.status === "Result Entered" || t.status === "In Progress") && o.status !== "Completed"
    ).length
    const releasedToday = orders.filter((o) => o.status === "Completed").length
    const activeCritical = criticalAlerts.filter((a) => a.status === "Active Alert" || a.status === "Escalated").length
    const overdueCount = orders.filter(
      (o) => o.status !== "Completed" && o.status !== "Cancelled" && o.tests.some((t) => t.urgency === "STAT")
    ).length

    return {
      ordersToday,
      awaitingCollection,
      processingCount,
      awaitingReview,
      releasedToday,
      activeCritical,
      overdueCount,
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
        (selectedPriority === "Routine" && o.tests.every((t) => t.urgency !== "STAT"))

      const matchStatus = selectedStatus === "All" || o.status === selectedStatus

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
          className="bg-white hover:bg-purple-50/30 border border-slate-200/90 hover:border-purple-300 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7552B8] group-hover:bg-[#7552B8] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                Orders Today
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.ordersToday}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                ↑ 14%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">Total diagnostic requests</p>
          </div>
          <SparklineBars heights={[35, 55, 45, 80, 100]} color="bg-purple-400" />
        </div>

        {/* KPI 2: Awaiting Draw */}
        <div
          onClick={() => onNavigate("lab_orders_collection")}
          className="bg-white hover:bg-amber-50/30 border border-slate-200/90 hover:border-amber-300 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                Awaiting Draw
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.awaitingCollection}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                ↑ 25%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">Phlebotomy draw queue</p>
          </div>
          <SparklineBars heights={[20, 50, 40, 75, 90]} color="bg-amber-400" />
        </div>

        {/* KPI 3: Analytical Bench */}
        <div
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-teal-50/30 border border-slate-200/90 hover:border-teal-300 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <Microscope size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                In Testing
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.processingCount}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">Active workbench runs</p>
          </div>
          <SparklineBars heights={[30, 45, 60, 75, 95]} color="bg-teal-400" />
        </div>

        {/* KPI 4: Awaiting Review */}
        <div
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-indigo-50/30 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <FileCheck2 size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                Awaiting Review
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.awaitingReview}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">Pathologist sign-off</p>
          </div>
          <SparklineBars heights={[80, 65, 50, 40, 30]} color="bg-indigo-400" />
        </div>

        {/* KPI 5: Critical Panic Limits */}
        <div
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-rose-50/30 border border-slate-200/90 hover:border-rose-300 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors truncate">
                Panic Limits
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.activeCritical}</span>
              <span className="inline-flex items-center text-[10.5px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded animate-pulse">
                Action Req.
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">Critical doctor call-out</p>
          </div>
          <SparklineBars heights={[20, 40, 60, 80, 100]} color="bg-rose-400" />
        </div>
      </div>

      {/* ── 2. QUICK DIAGNOSTIC ACTION STRIP (INSURANCE COMMAND STYLE) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => onNavigate("lab_orders_collection")}
          className="bg-white hover:bg-purple-50/50 border border-slate-200/90 hover:border-purple-200 rounded-2xl p-3.5 text-left shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7552B8] flex items-center justify-center group-hover:bg-[#7552B8] group-hover:text-white transition-colors">
              <Plus size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">New Lab Order</div>
              <div className="text-[11px] text-slate-400">Intake &amp; diagnostic requests</div>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-[#7552B8] transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_orders_collection")}
          className="bg-white hover:bg-amber-50/50 border border-slate-200/90 hover:border-amber-200 rounded-2xl p-3.5 text-left shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Droplet size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Phlebotomy Queue</div>
              <div className="text-[11px] text-slate-400">Collect samples &amp; print tubes</div>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-teal-50/50 border border-slate-200/90 hover:border-teal-200 rounded-2xl p-3.5 text-left shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Microscope size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Lab Workbench</div>
              <div className="text-[11px] text-slate-400">Run analyzers &amp; enter values</div>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_workbench")}
          className="bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-200 rounded-2xl p-3.5 text-left shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileCheck2 size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Pathologist Review</div>
              <div className="text-[11px] text-slate-400">Delta checks &amp; sign-off</div>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("lab_reports")}
          className="bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-200 rounded-2xl p-3.5 text-left shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Diagnostic Reports</div>
              <div className="text-[11px] text-slate-400">Official PDF &amp; EMR release</div>
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
        </button>
      </div>

      {/* ── 3. CRITICAL ALERTS BANNER (IF ACTIVE) ────────────────────────────── */}
      {criticalAlerts.filter((a) => a.status === "Active Alert").length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span>Critical Panic Limit Alerts Requiring Immediate Clinician Notification</span>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
              Immediate Panic Limits
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {criticalAlerts
              .filter((a) => a.status === "Active Alert")
              .slice(0, 3)
              .map((alert) => (
                <div key={alert.id} className="bg-white p-3 rounded-xl border border-rose-200 text-xs shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900">{alert.patientName}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-1.5">({alert.umr})</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                      CRITICAL
                    </span>
                  </div>
                  <div className="mt-1 text-slate-700">
                    <span className="font-medium text-slate-900">{alert.testName}:</span>{" "}
                    <span className="font-mono font-bold text-rose-700">{alert.observedValue}</span>{" "}
                    <span className="text-slate-400 text-[10px]">({alert.panicLimits})</span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Dr: {alert.orderingDoctor}</span>
                    <span className="text-[10px] font-semibold text-rose-600">
                      Immediate Call Required
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── 4. FILTER CONTROL BAR (INSURANCE STYLE) ─────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, UMR, order #, doctor, or test name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7552B8]/20 focus:border-[#7552B8] font-medium transition-all"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-700 font-semibold focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="Hematology">Hematology</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Pathology">Pathology</option>
            <option value="Cardiology">Cardiology</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-700 font-semibold focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="STAT">STAT / Urgent</option>
            <option value="Routine">Routine</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-700 font-semibold focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Awaiting Billing">Awaiting Billing</option>
            <option value="Billed">Billed (Ready to Draw)</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-9 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── 5. ACTIVE DIAGNOSTIC WORKLIST TABLE (INSURANCE COMMAND TABLE STYLE) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[200px]">Patient &amp; UMR</th>
                <th className="py-3 px-4 min-w-[220px]">Tests &amp; Department</th>
                <th className="py-3 px-4 min-w-[160px]">Ordering Clinician</th>
                <th className="py-3 px-4 min-w-[100px]">Priority</th>
                <th className="py-3 px-4 min-w-[150px]">Diagnostic Stage</th>
                <th className="py-3 px-4 min-w-[120px]">Billing</th>
                <th className="py-3 px-4 min-w-[130px]">Status</th>
                <th className="py-3 px-4 min-w-[140px] text-right">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No laboratory orders match your selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 20).map((order) => {
                  const hasStat = order.tests.some((t) => t.urgency === "STAT")
                  const isPaid = order.billing?.status === "Paid"

                  // Progress percentage based on status
                  const progressPct =
                    order.status === "Completed"
                      ? 100
                      : order.status === "In Progress"
                        ? 75
                        : order.status === "Sample Collected"
                          ? 50
                          : order.status === "Billed"
                            ? 25
                            : 10

                  // Initials avatar background
                  const initials = order.patientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer"
                      onClick={() => {
                        if (order.status === "Completed") onNavigate("lab_reports")
                        else if (order.status === "Billed") onNavigate("lab_orders_collection")
                        else if (onOpenOrder) onOpenOrder(order)
                        else onNavigate("lab_workbench")
                      }}
                    >
                      {/* Patient & UMR */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7552B8] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-[#7552B8] transition-colors whitespace-nowrap">
                              {order.patientName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400">{order.umr}</span>
                              <span className="text-[10px] text-slate-400 font-medium">· {order.age}y/{order.sex?.[0] || "M"}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold border bg-purple-50 text-[#7552B8] border-purple-200">
                                {order.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tests & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 line-clamp-1 max-w-[220px]">
                          {order.tests.map((t) => t.name).join(", ")}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-500">
                            {order.tests.length} test{order.tests.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">{order.department}</span>
                        </div>
                      </td>

                      {/* Clinician */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-semibold">{order.doctorName}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{order.department}</div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            hasStat
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {hasStat ? "STAT" : "Routine"}
                        </span>
                      </td>

                      {/* Diagnostic Stage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                          <span>
                            {order.status === "Completed"
                              ? "Completed"
                              : order.status === "In Progress"
                                ? "In Testing"
                                : order.status === "Sample Collected"
                                  ? "Drawn"
                                  : "Ordered"}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {order.status === "Completed" ? "4/4" : order.status === "In Progress" ? "3/4" : "2/4"}
                          </span>
                        </div>
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              order.status === "Completed"
                                ? "bg-emerald-500"
                                : order.status === "In Progress"
                                  ? "bg-teal-500"
                                  : "bg-purple-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Billing */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">₹{order.billing?.total || 0}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            order.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : order.status === "In Progress"
                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                : order.status === "Sample Collected"
                                  ? "bg-purple-50 text-[#7552B8] border-purple-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.status === "Completed"
                                ? "bg-emerald-500"
                                : order.status === "In Progress"
                                  ? "bg-teal-500"
                                  : order.status === "Sample Collected"
                                    ? "bg-[#7552B8]"
                                    : "bg-amber-500"
                            }`}
                          />
                          <span>{order.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => onNavigate("lab_orders_collection")}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            💳 Settle Bill
                          </button>
                        ) : order.status === "Billed" ? (
                          <button
                            type="button"
                            onClick={() => onNavigate("lab_orders_collection")}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-[#7552B8] border border-purple-200 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            💉 Draw Sample
                          </button>
                        ) : order.status === "Completed" ? (
                          <button
                            type="button"
                            onClick={() => onNavigate("lab_reports")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                          >
                            📄 View Report
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenOrder) onOpenOrder(order)
                              else onNavigate("lab_workbench")
                            }}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                          >
                            🔬 Enter Results
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{Math.min(filteredOrders.length, 20)}</strong> of{" "}
            <strong className="text-slate-800">{filteredOrders.length}</strong> active orders
          </span>
          <button
            onClick={() => onNavigate("lab_orders_collection")}
            className="text-[#7552B8] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Complete Orders Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
