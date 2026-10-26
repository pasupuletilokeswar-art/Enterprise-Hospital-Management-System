import React, { useState } from "react"
import { ClipboardList, Syringe, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react"
import LabOrdersView from "./LabOrdersView"
import SampleCollectionView from "./SampleCollectionView"
import { LabOrder, LabOrderDatabase, LabOrderTest } from "../../services/labOrdersDb"

interface LabOrdersAndCollectionViewProps {
  onOpenWorkbench?: (order: LabOrder, test?: LabOrderTest) => void
  onOpenReport?: (order: LabOrder) => void
  initialTab?: "orders" | "collection"
}

export default function LabOrdersAndCollectionView({
  onOpenWorkbench,
  onOpenReport,
  initialTab = "orders",
}: LabOrdersAndCollectionViewProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "collection">(initialTab)

  return (
    <div className="space-y-4">
      {/* ── SUB-MODULE WORKSPACE BAR ─────────────────────────────────────── */}
      <div className="bg-white border border-[#DCE4EC] rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F7FA] rounded-xl border border-[#DCE4EC]">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Lab Orders Directory</span>
            </button>

            <button
              onClick={() => setActiveTab("collection")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "collection"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <Syringe className="w-4 h-4" />
              <span>Phlebotomy & Sample Collection</span>
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] hidden sm:flex items-center gap-2 pr-2">
            <span className="font-bold text-[#14243A]">Phlebotomy Station:</span>
            <span>Order intake, billing check, tube selection & barcode printing</span>
          </div>
        </div>
      </div>

      {/* ── ACTIVE PANEL RENDERING ─────────────────────────────────────────── */}
      <div className="transition-all">
        {activeTab === "orders" ? (
          <LabOrdersView
            onOpenBench={(ord) => {
              if (onOpenWorkbench) onOpenWorkbench(ord)
            }}
            onOpenReport={(ord) => {
              if (onOpenReport) onOpenReport(ord)
            }}
            onCollectSample={() => {
              setActiveTab("collection")
            }}
          />
        ) : (
          <SampleCollectionView
            onOpenWorkbench={(orderId) => {
              const order = LabOrderDatabase.getOrders().find((o) => o.id === orderId)
              if (order && onOpenWorkbench) onOpenWorkbench(order)
            }}
          />
        )}
      </div>
    </div>
  )
}
