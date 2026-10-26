import React, { useState } from "react"
import { Microscope, FileEdit, FileCheck, CheckCircle2 } from "lucide-react"
import LabWorklistsView from "./LabWorklistsView"
import ResultEntryView from "./ResultEntryView"
import PathologistReviewView from "./PathologistReviewView"
import { LabOrder, LabOrderTest } from "../../services/labOrdersDb"

interface LabWorkbenchViewProps {
  initialOrder?: LabOrder
  initialTest?: LabOrderTest
  onCompleteToReports?: () => void
  initialTab?: "worklists" | "result_entry" | "review"
}

export default function LabWorkbenchView({
  initialOrder,
  initialTest,
  onCompleteToReports,
  initialTab = "worklists",
}: LabWorkbenchViewProps) {
  const [activeTab, setActiveTab] = useState<"worklists" | "result_entry" | "review">(
    initialOrder ? "result_entry" : initialTab
  )
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(initialOrder || null)
  const [selectedTest, setSelectedTest] = useState<LabOrderTest | null>(initialTest || null)

  const handleOpenResultEntryFromWorklist = (order: LabOrder, test?: LabOrderTest) => {
    setSelectedOrder(order)
    setSelectedTest(test || null)
    setActiveTab("result_entry")
  }

  const handleResultEntryComplete = () => {
    setActiveTab("review")
    if (onCompleteToReports) {
      // Notification if needed
    }
  }

  return (
    <div className="space-y-4">
      {/* ── UNIFIED WORKBENCH HEADER & WORKSPACE SWITCHER ─────────────────── */}
      <div className="bg-white border border-[#DCE4EC] rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F7FA] rounded-xl border border-[#DCE4EC]">
            <button
              onClick={() => setActiveTab("worklists")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "worklists"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <Microscope className="w-4 h-4" />
              <span>Department Analytical Worklists</span>
            </button>

            <button
              onClick={() => setActiveTab("result_entry")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "result_entry"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>Structured Result Entry</span>
              {selectedOrder && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white font-mono">
                  {selectedOrder.id}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("review")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "review"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Pathologist Review & Approval</span>
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] hidden sm:flex items-center gap-2 pr-2">
            <span className="font-bold text-[#14243A]">Analytical Workbench:</span>
            <span>Batch processing, result entry & flags, and clinical pathologist sign-off</span>
          </div>
        </div>
      </div>

      {/* ── ACTIVE PANEL RENDERING ─────────────────────────────────────────── */}
      <div className="transition-all">
        {activeTab === "worklists" && (
          <LabWorklistsView onOpenResultEntry={handleOpenResultEntryFromWorklist} />
        )}

        {activeTab === "result_entry" && (
          <ResultEntryView
            initialOrder={selectedOrder || undefined}
            initialTest={selectedTest || undefined}
            onComplete={handleResultEntryComplete}
          />
        )}

        {activeTab === "review" && (
          <PathologistReviewView initialOrderId={selectedOrder?.id} />
        )}
      </div>
    </div>
  )
}
