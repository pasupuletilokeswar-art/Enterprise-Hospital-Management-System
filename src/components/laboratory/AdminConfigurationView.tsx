import React, { useState } from "react"
import { BookOpen, Settings, Sliders, ShieldCheck } from "lucide-react"
import TestMasterView from "./TestMasterView"
import LabSettingsView from "./LabSettingsView"

interface AdminConfigurationViewProps {
  initialTab?: "test_master" | "settings"
}

export default function AdminConfigurationView({
  initialTab = "test_master",
}: AdminConfigurationViewProps) {
  const [activeTab, setActiveTab] = useState<"test_master" | "settings">(initialTab)

  return (
    <div className="space-y-4">
      {/* ── ADMIN CONFIGURATION WORKSPACE SWITCHER ────────────────────────── */}
      <div className="bg-white border border-[#DCE4EC] rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F7FA] rounded-xl border border-[#DCE4EC]">
            <button
              onClick={() => setActiveTab("test_master")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "test_master"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Test Master Catalogue</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#167D8D] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#172B3A] hover:bg-slate-200/60"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Laboratory Settings & Governance</span>
            </button>
          </div>

          <div className="text-[11px] text-[#64748B] hidden sm:flex items-center gap-2 pr-2">
            <span className="font-bold text-[#14243A]">Admin Configuration:</span>
            <span>Master diagnostic catalogue, tariffs, NABL/CAP settings & tube standards</span>
          </div>
        </div>
      </div>

      {/* ── ACTIVE PANEL RENDERING ─────────────────────────────────────────── */}
      <div className="transition-all">
        {activeTab === "test_master" ? (
          <TestMasterView />
        ) : (
          <LabSettingsView />
        )}
      </div>
    </div>
  )
}
