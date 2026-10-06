import { useState } from 'react';
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
import Header from './Header';
import { usePlayback } from '../../hooks/usePlayback';
import { useSimStore } from '../../store/useSimStore';
import { BookOpen, GitCompare, Layers, X } from 'lucide-react';

type TabId = 'overview' | 'cpu' | 'memory' | 'details';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'ภาพรวม' },
  { id: 'cpu', label: 'CPU' },
  { id: 'memory', label: 'Memory' },
  { id: 'details', label: 'รายละเอียด' },
];

// Which tab holds the evidence for each bottleneck diagnosis
const DIAGNOSIS_TAB: Record<string, TabId> = {
  THRASHING: 'memory',
  MEMORY_PRESSURE: 'memory',
  CPU_BOUND: 'cpu',
  IO_BOUND: 'cpu',
  UNFAIR: 'cpu',
};

export default function Shell() {
  usePlayback();
  const { result } = useSimStore();
  const [tab, setTab] = useState<TabId>('overview');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<{ title: string; observation: string; lesson: string } | null>(null);

  const flaggedTab = result?.diagnosis?.label ? DIAGNOSIS_TAB[result.diagnosis.label] : undefined;

  return (
    <div className="min-h-screen max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5">
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <WhatIfCompare isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
      <ExportReportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <CustomWorkloadModal isOpen={isCustomOpen} onClose={() => setIsCustomOpen(false)} />
      <ScenarioPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={(p) => setActivePreset({ title: p.title, observation: p.observation, lesson: p.lesson })}
      />

      <Header
        canExport={!!result}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenCustom={() => setIsCustomOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {activePreset && (
        <div className="flex items-start justify-between gap-4 border-l-[3px] border-warning bg-warning-soft rounded-r-lg px-4 py-3 text-sm animate-fade-in">
          <div className="space-y-1">
            <p className="font-semibold">กำลังสาธิต: {activePreset.title}</p>
            <p className="text-muted">
              <span className="font-medium text-warning">สิ่งที่ควรสังเกต</span> {activePreset.observation}
            </p>
            <p className="text-muted">
              <span className="font-medium text-primary">บทเรียน</span> {activePreset.lesson}
            </p>
          </div>
          <button
            onClick={() => setActivePreset(null)}
            aria-label="ปิด"
            className="p-1 rounded-md text-muted hover:text-ink hover:bg-surface/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        <aside className="lg:col-span-1 lg:sticky lg:top-5">
          <ControlPanel />
        </aside>

        <main className="lg:col-span-3 min-w-0">
          {result ? (
            <div className="space-y-5">
              <div className="sticky top-3 z-30">
                <PlaybackBar>
                  <div role="tablist" aria-label="มุมมองผลลัพธ์" className="flex gap-1 overflow-x-auto -mx-1 px-1">
                    {TABS.map((t) => {
                      const selected = tab === t.id;
                      return (
                        <button
                          key={t.id}
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setTab(t.id)}
                          className={`relative shrink-0 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selected
                              ? 'bg-night-text text-night'
                              : 'text-night-muted hover:text-night-text hover:bg-night-raised'
                          }`}
                        >
                          {t.label}
                          {flaggedTab === t.id && (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full bg-night-signal ml-1.5 align-middle"
                              title="พบคอขวดในส่วนนี้"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </PlaybackBar>
              </div>

              <div key={tab} role="tabpanel" className="space-y-5 animate-fade-in">
                {tab === 'overview' && (
                  <>
                    <ExecutiveSummary />
                    <BottleneckCard onOpenCompare={() => setIsCompareOpen(true)} />
                    <GaugeRow />
                  </>
                )}
                {tab === 'cpu' && (
                  <>
                    <GanttChart />
                    <QueueLane />
                    <UtilizationChart />
                  </>
                )}
                {tab === 'memory' && (
                  <>
                    <MemoryGrid />
                    <PageFaultTrace />
                  </>
                )}
                {tab === 'details' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <ProcessTable />
                    <EventLog />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              onOpenPresets={() => setIsPresetsOpen(true)}
              onOpenCompare={() => setIsCompareOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  onOpenPresets: () => void;
  onOpenCompare: () => void;
  onOpenGuide: () => void;
}

function EmptyState({ onOpenPresets, onOpenCompare, onOpenGuide }: Readonly<EmptyStateProps>) {
  const shortcuts = [
    { Icon: Layers, title: 'Preset scenarios', body: 'เปิดกรณีศึกษาสำเร็จรูป เช่น Thrashing หรือ Convoy effect', onClick: onOpenPresets },
    { Icon: GitCompare, title: 'เปรียบเทียบ A/B', body: 'รัน 2 การตั้งค่าแล้วดูผลเทียบกัน', onClick: onOpenCompare },
    { Icon: BookOpen, title: 'คู่มือทฤษฎี OS', body: 'ทบทวนหลักการและเกณฑ์ที่ใช้วิเคราะห์คอขวด', onClick: onOpenGuide },
  ];

  return (
    <div className="bg-surface border border-line rounded-xl px-6 py-10 sm:px-10 sm:py-14">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold leading-snug">ยังไม่มีผลการจำลอง</h2>
        <p className="mt-2 text-muted leading-relaxed">
          ตั้งค่า scheduler, ขนาด RAM และ workload ทางซ้าย แล้วกด <span className="font-medium text-ink">Run simulation</span>{' '}
          โปรแกรมจะแสดงว่า CPU รัน process ไหนตอนไหน แรมพอไหม และคอขวดอยู่ที่ CPU, หน่วยความจำ หรือดิสก์
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shortcuts.map(({ Icon, title, body, onClick }) => (
          <button
            key={title}
            onClick={onClick}
            className="text-left p-4 rounded-lg border border-line hover:border-primary/50 hover:bg-primary-soft/40 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Icon size={16} className="text-primary" />
              {title}
            </span>
            <span className="block mt-1 text-sm text-muted leading-relaxed">{body}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
