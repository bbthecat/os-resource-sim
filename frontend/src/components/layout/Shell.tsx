import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ControlPanel from '../ControlPanel';
import PlaybackBar from '../PlaybackBar';
import GaugeRow from '../GaugeRow';
import QueueLane from '../QueueLane';
import MemoryGrid from '../MemoryGrid';
import PageFaultTrace from '../PageFaultTrace';
import GanttChart from '../GanttChart';
import UtilizationChart from '../UtilizationChart';
import BottleneckCard from '../BottleneckCard';
import ExecutiveSummary from '../ExecutiveSummary';
import ProcessTable from '../ProcessTable';
import EventLog from '../EventLog';
import GuideModal from '../GuideModal';
import WhatIfCompare from '../WhatIfCompare';
import ExportReportModal from '../ExportReportModal';
import CustomWorkloadModal from '../CustomWorkloadModal';
import ScenarioPresetsModal from '../ScenarioPresetsModal';
import { usePlayback } from '../../hooks/usePlayback';
import { useSimStore } from '../../store/useSimStore';
import { 
  Cpu, 
  BookOpen, 
  GitCompare, 
  Download, 
  Sliders, 
  Layers, 
  X, 
  Info,
  Terminal
} from 'lucide-react';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function Shell() {
  usePlayback();
  const { result } = useSimStore();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<{ title: string; observation: string; lesson: string } | null>(null);

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 space-y-6 max-w-[1440px] mx-auto text-slate-800 relative">
      {/* Background Blobs for Pastel Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="blob-shape bg-pastel-pink w-96 h-96 top-[-10%] left-[-10%]" style={{ animationDelay: '0s' }}></div>
        <div className="blob-shape bg-pastel-yellow w-80 h-80 top-[20%] right-[-5%]" style={{ animationDelay: '2s' }}></div>
        <div className="blob-shape bg-pastel-blue w-[30rem] h-[30rem] bottom-[-10%] left-[20%]" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Modals */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <WhatIfCompare isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
      <ExportReportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <CustomWorkloadModal isOpen={isCustomOpen} onClose={() => setIsCustomOpen(false)} />
      <ScenarioPresetsModal 
        isOpen={isPresetsOpen} 
        onClose={() => setIsPresetsOpen(false)} 
        onSelectPreset={(p) => setActivePreset({ title: p.title, observation: p.observation, lesson: p.lesson })}
      />

      {/* Professional Top Navigation Bar */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel rounded-xl px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue/30 via-white/50 to-pastel-purple/30 opacity-70"></div>
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-pastel-blue/40 border border-pastel-blue/60 flex items-center justify-center text-blue-600 shadow-glow">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                OS Kernel & Resource Telemetry
              </h1>
              <span className="font-mono text-[10px] uppercase tracking-wider bg-pastel-blue/30 text-blue-700 border border-pastel-blue/50 px-2 py-0.5 rounded-full">
                SIMULATOR
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              การวิเคราะห์เชิงลึก: CPU Scheduling, Virtual Memory Paging และ Disk I/O Bottlenecks
            </p>
          </div>
        </div>

        {/* Clean Action Buttons without Emojis */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {/* Preset Demos Button */}
          <button
            onClick={() => setIsPresetsOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-border-subtle hover:border-border-light text-xs font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Layers size={14} className="text-blue-500" />
            <span>Preset Scenarios</span>
          </button>

          {/* Compare A/B Button */}
          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-border-subtle hover:border-border-light text-xs font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <GitCompare size={14} className="text-purple-500" />
            <span>A/B Comparison</span>
          </button>

          {/* Export Report Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!result}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-border-subtle hover:border-border-light text-xs font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            <Download size={14} className="text-emerald-500" />
            <span>Export CSV</span>
          </button>

          {/* Custom Workload */}
          <button
            onClick={() => setIsCustomOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-border-subtle hover:border-border-light text-xs font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Sliders size={14} className="text-slate-500" />
            <span>Custom Workload</span>
          </button>

          {/* Learning Guide */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-pastel-yellow/30 hover:bg-pastel-yellow/50 text-amber-800 border border-pastel-yellow/50 hover:border-pastel-yellow text-xs font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <BookOpen size={14} className="text-amber-600" />
            <span>Documentation</span>
          </button>
        </div>
      </motion.header>
      
      {/* Active Scenario Banner */}
      <AnimatePresence>
        {activePreset && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="glass-panel border-l-4 border-l-amber-400 rounded-r-xl p-4 flex items-start justify-between gap-4 text-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pastel-yellow/30 to-transparent"></div>
            <div className="flex items-start space-x-3 relative z-10">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 mt-0.5 shadow-glow">
                <Info size={16} />
              </div>
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>กำลังสาธิตสถานการณ์: {activePreset.title}</span>
                </div>
                <p className="text-slate-600">
                  <span className="text-amber-600 font-semibold">ข้อสังเกต:</span> {activePreset.observation}
                </p>
                <p className="text-slate-600">
                  <span className="text-blue-600 font-semibold">บทเรียน OS:</span> {activePreset.lesson}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePreset(null)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors relative z-10"
              title="ปิดการแจ้งเตือน"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1 space-y-6 sticky top-6"
        >
          <ControlPanel />
        </motion.div>
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20 }}
                className="space-y-6"
              >
                {/* TL;DR Executive Summary */}
                <motion.div variants={itemVariants}>
                  <ExecutiveSummary />
                </motion.div>

                {/* Playback Controls */}
                <motion.div variants={itemVariants}>
                  <PlaybackBar />
                </motion.div>

                {/* CPU Gantt Chart */}
                <motion.div variants={itemVariants}>
                  <GanttChart />
                </motion.div>

              {/* Bottleneck Analyzer Card */}
              <motion.div variants={itemVariants}>
                <BottleneckCard onOpenCompare={() => setIsCompareOpen(true)} />
              </motion.div>

              {/* Real-time Meters (CPU, RAM, Disk) */}
              <motion.div variants={itemVariants}>
                <GaugeRow />
              </motion.div>

              {/* Process State & Queues */}
              <motion.div variants={itemVariants}>
                <QueueLane />
              </motion.div>

              {/* Memory Frames Grid */}
              <motion.div variants={itemVariants}>
                <MemoryGrid />
              </motion.div>

              {/* Page Fault Trace */}
              <motion.div variants={itemVariants}>
                <PageFaultTrace />
              </motion.div>

              {/* Multi-mode Charts (Utilization, Queue Depths, Process BarChart) */}
              <motion.div variants={itemVariants}>
                <UtilizationChart />
              </motion.div>

              {/* Process Table & Event Log in 2 columns */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ProcessTable />
                <EventLog />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              className="flex-grow glass-panel rounded-xl min-h-[460px] flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-pastel-blue/20 to-transparent"></div>
              
              <div className="w-16 h-16 rounded-2xl bg-white border border-border-light flex items-center justify-center text-blue-500 shadow-glow relative z-10">
                <Terminal size={32} />
              </div>
              <div className="space-y-3 max-w-md relative z-10">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">OS Resource Simulator</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  โปรแกรมจำลองการทำงานของระบบปฏิบัติการ (OS)
                </p>
                <div className="bg-white/80 p-4 rounded-lg shadow-sm border border-white text-left text-sm text-slate-600 space-y-2 mt-4">
                  <p>🔹 <strong>มันช่วยอะไร?</strong> ช่วยจำลองว่าถ้าคอมพิวเตอร์ต้องรันหลายโปรแกรมพร้อมกัน OS จะจัดคิว CPU และแบ่ง RAM อย่างไร</p>
                  <p>🔹 <strong>มีประโยชน์ยังไง?</strong> ช่วยให้มองเห็นปัญหาคอขวด (Bottlenecks) เช่น อาการเครื่องค้าง (Thrashing) หรือ CPU รอดิสก์นานเกินไป</p>
                  <p>🔹 <strong>วิธีใช้งาน:</strong> ปรับตั้งค่าด้านซ้ายมือ แล้วกด <strong className="text-blue-500">Run Simulation</strong> โปรแกรมจะสรุปผลลัพธ์มาให้ดูแบบเข้าใจง่าย!</p>
                </div>
              </div>

              {/* Quick Launch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left pt-4 relative z-10 px-6">
                <button
                  onClick={() => setIsPresetsOpen(true)}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-border-subtle hover:border-pastel-blue transition-all duration-300 text-left space-y-2 shadow-subtle group hover:shadow-glow hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-2 text-blue-500 text-sm font-bold">
                    <Layers size={16} className="group-hover:scale-110 transition-transform" />
                    <span>Scenario Presets</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ทดสอบกรณีศึกษาจำลอง เช่น Thrashing, Convoy Effect
                  </p>
                </button>

                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-border-subtle hover:border-pastel-purple transition-all duration-300 text-left space-y-2 shadow-subtle group hover:shadow-glow hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-2 text-purple-500 text-sm font-bold">
                    <GitCompare size={16} className="group-hover:scale-110 transition-transform" />
                    <span>A/B Comparison</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    เปรียบเทียบผลลัพธ์ของ 2 อัลกอริทึมแบบเคียงข้างกัน
                  </p>
                </button>

                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-border-subtle hover:border-pastel-yellow transition-all duration-300 text-left space-y-2 shadow-subtle group hover:shadow-glow hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-2 text-amber-500 text-sm font-bold">
                    <BookOpen size={16} className="group-hover:scale-110 transition-transform" />
                    <span>OS Theory Guide</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ทบทวนทฤษฎีระบบปฏิบัติการและเกณฑ์การวิเคราะห์
                  </p>
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
