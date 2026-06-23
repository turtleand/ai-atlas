import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { industryRegions, type IndustryRegion, type Role } from '../../data/impact-map-data';
import { NotesPanel } from './NotesPanel';
import {
  getAdjacentRoles,
  getIndustryById,
  getRoleInsight,
  getRolesByStatus,
  getStatusCount,
  industryInsights,
  statusLabels,
  statusNouns,
  statusOrder,
  statusShortLabels,
  type ImpactStatus,
} from './impactMapModel';
import '../../styles/impact-map.css';

const defaultIndustryId = 'software-engineering';
const defaultStatus: ImpactStatus = 'frontier';

function getInitialIndustryId(): string {
  if (typeof window === 'undefined') return defaultIndustryId;

  const hashIndustryId = window.location.hash.replace('#', '');
  return industryRegions.some((industry) => industry.id === hashIndustryId)
    ? hashIndustryId
    : defaultIndustryId;
}

function updateIndustryHash(industryId: string) {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', `#${industryId}`);
}

function formatStatus(status: ImpactStatus): string {
  return status === 'submerged' ? 'flooded' : status;
}

interface CategoryTabsProps {
  selectedIndustryId: string;
  onSelect: (industryId: string) => void;
}

function CategoryTabs({ selectedIndustryId, onSelect }: CategoryTabsProps) {
  return (
    <div className="impact-category-tabs" role="tablist" aria-label="AI impact categories">
      {industryRegions.map((industry) => {
        const selected = industry.id === selectedIndustryId;
        return (
          <button
            key={industry.id}
            type="button"
            className={`impact-category-tab ${selected ? 'selected' : ''}`}
            onClick={() => onSelect(industry.id)}
            role="tab"
            aria-selected={selected}
          >
            <span>{industry.name}</span>
            <small>
              {industry.roles.length} roles · {getStatusCount(industry, 'frontier')} frontier
            </small>
          </button>
        );
      })}
    </div>
  );
}

interface FloodScaleProps {
  industry: IndustryRegion;
  selectedStatus: ImpactStatus;
  guideOpen: boolean;
  onSelectStatus: (status: ImpactStatus) => void;
  onToggleGuide: () => void;
}

function FloodScale({
  industry,
  selectedStatus,
  guideOpen,
  onSelectStatus,
  onToggleGuide,
}: FloodScaleProps) {
  return (
    <aside className="impact-flood-scale" aria-label="Flood scale">
      <div className="impact-flood-scale-header">
        <p>Flood scale</p>
        <button
          type="button"
          className={`impact-guide-button ${guideOpen ? 'selected' : ''}`}
          onClick={onToggleGuide}
          aria-expanded={guideOpen}
          aria-controls="impact-reading-guide"
        >
          ?
        </button>
      </div>

      {guideOpen && (
        <div id="impact-reading-guide" className="impact-reading-guide">
          <strong>How to read it</strong>
          <span>Higher means more human judgment and accountability. Lower means more routine, repeatable, or automatable.</span>
        </div>
      )}

      <div className="impact-scale-rail" aria-hidden="true">
        <span className="impact-scale-waterline" />
      </div>

      <div className="impact-flood-layer-list">
        {statusOrder.map((status) => {
          const selected = selectedStatus === status;
          const count = getStatusCount(industry, status);

          return (
            <button
              key={status}
              type="button"
              className={`impact-flood-layer ${status} ${selected ? 'selected' : ''}`}
              onClick={() => onSelectStatus(status)}
              aria-pressed={selected}
            >
              <span className="impact-layer-eyebrow">{statusShortLabels[status]}</span>
              <strong>{statusLabels[status]}</strong>
              <span>{count} {count === 1 ? 'role' : 'roles'} in {industry.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

interface RoleChipProps {
  role: Role;
  selected: boolean;
  onClick: (role: Role) => void;
}

function RoleChip({ role, selected, onClick }: RoleChipProps) {
  return (
    <button
      type="button"
      className={`impact-role-chip ${role.status} ${selected ? 'selected' : ''}`}
      onClick={() => onClick(role)}
      aria-pressed={selected}
    >
      <span>{role.name}</span>
      {role.notesFile && <small>note</small>}
    </button>
  );
}

interface CategorySummaryProps {
  industry: IndustryRegion;
}

function CategorySummary({ industry }: CategorySummaryProps) {
  const insight = industryInsights[industry.id];

  return (
    <section className="impact-category-summary" aria-labelledby="impact-category-title">
      <div>
        <p className="impact-breadcrumb">AI Impact Map / {industry.name}</p>
        <h2 id="impact-category-title">{industry.name}</h2>
        <p>{insight.summary}</p>
      </div>
    </section>
  );
}

interface LayerDetailProps {
  industry: IndustryRegion;
  selectedStatus: ImpactStatus;
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
}

function LayerDetail({ industry, selectedStatus, selectedRole, onSelectRole }: LayerDetailProps) {
  const insight = industryInsights[industry.id];
  const roles = getRolesByStatus(industry, selectedStatus);
  const layerCopy = insight.statusCopy[selectedStatus];

  return (
    <section className={`impact-layer-detail ${selectedStatus}`} aria-live="polite">
      <div className="impact-layer-heading">
        <div>
          <p className="impact-layer-kicker">{industry.name} + {statusNouns[selectedStatus]}</p>
          <h3>{statusLabels[selectedStatus]}</h3>
        </div>
        <span className="impact-layer-count">{roles.length} {roles.length === 1 ? 'role' : 'roles'}</span>
      </div>

      <p className="impact-layer-copy">{layerCopy}</p>

      <div className="impact-role-grid" aria-label={`${statusLabels[selectedStatus]} roles`}>
        {roles.length > 0 ? (
          roles.map((role) => (
            <RoleChip
              key={role.id}
              role={role}
              selected={selectedRole?.id === role.id}
              onClick={onSelectRole}
            />
          ))
        ) : (
          <div className="impact-empty-layer">
            No roles in this layer yet. This is useful too: the current map does not classify this category as {formatStatus(selectedStatus)}.
          </div>
        )}
      </div>
    </section>
  );
}

interface RoleDetailPanelProps {
  industry: IndustryRegion;
  role: Role | null;
  onClose: () => void;
  onOpenEvidence: (role: Role) => void;
  onSelectAdjacent: (role: Role) => void;
}

function RoleDetailPanel({
  industry,
  role,
  onClose,
  onOpenEvidence,
  onSelectAdjacent,
}: RoleDetailPanelProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (role) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [role, onClose]);

  if (!role) return null;

  const insight = getRoleInsight(role);
  const adjacentRoles = getAdjacentRoles(industry, role);

  return (
    <aside className={`impact-role-detail ${role.status}`} aria-labelledby="impact-role-detail-title">
      <div className="impact-role-detail-header">
        <div>
          <p className="impact-breadcrumb">
            {industry.name} / {statusLabels[role.status]}
          </p>
          <h3 id="impact-role-detail-title">{role.name}</h3>
        </div>
        <button type="button" className="impact-detail-close" onClick={onClose} aria-label="Close role detail">
          ×
        </button>
      </div>

      <div className="impact-detail-status-row">
        <span className={`impact-status-pill ${role.status}`}>{statusLabels[role.status]}</span>
        {role.notesFile && <span>Evidence available</span>}
      </div>

      <div className="impact-detail-grid">
        <article>
          <span>What it means</span>
          <p>{insight.meaning}</p>
        </article>
        <article>
          <span>Why this status</span>
          <p>{insight.why}</p>
        </article>
        <article>
          <span>What AI can assist with</span>
          <p>{insight.aiCanHelp}</p>
        </article>
        <article>
          <span>What humans still own</span>
          <p>{insight.humanOwns}</p>
        </article>
      </div>

      <div className="impact-movement-signals">
        <strong>Evidence or movement signals</strong>
        <p>{insight.movementSignals}</p>
      </div>

      <div className="impact-adjacent-block">
        <strong>Adjacent topics</strong>
        <div className="impact-adjacent-list">
          {adjacentRoles.map((candidate) => (
            <button key={candidate.id} type="button" onClick={() => onSelectAdjacent(candidate)}>
              {candidate.name}
            </button>
          ))}
        </div>
      </div>

      {role.notesFile && (
        <button type="button" className="impact-evidence-button" onClick={() => onOpenEvidence(role)}>
          Open evidence
        </button>
      )}
    </aside>
  );
}

function ImpactHeader() {
  return (
    <header className="impact-control-header">
      <div className="impact-title-block">
        <p className="impact-surface-label">AI Atlas / living orientation map</p>
        <h1>AI Impact Map</h1>
        <p>
          The water is rising unevenly. Routine work floods first. Human value concentrates where context,
          accountability, taste, and system ownership still matter.
        </p>
      </div>

      <div className="impact-header-actions">
        <Link to="/" className="impact-map-back">
          Back to Atlas
        </Link>
      </div>
    </header>
  );
}

export function ImpactMapPage() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(getInitialIndustryId);
  const [selectedStatus, setSelectedStatus] = useState<ImpactStatus>(defaultStatus);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [noteRole, setNoteRole] = useState<Role | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const selectedIndustry = useMemo(
    () => getIndustryById(selectedIndustryId),
    [selectedIndustryId],
  );

  useEffect(() => {
    updateIndustryHash(selectedIndustryId);
  }, [selectedIndustryId]);

  const handleSelectIndustry = (industryId: string) => {
    const nextIndustry = getIndustryById(industryId);
    setSelectedIndustryId(industryId);
    setSelectedRole(null);

    if (getStatusCount(nextIndustry, selectedStatus) === 0) {
      const nextStatus = statusOrder.find((status) => getStatusCount(nextIndustry, status) > 0) ?? defaultStatus;
      setSelectedStatus(nextStatus);
    }
  };

  const handleSelectStatus = (status: ImpactStatus) => {
    setSelectedStatus(status);
    setSelectedRole(null);
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  const handleSelectAdjacent = (role: Role) => {
    setSelectedStatus(role.status);
    setSelectedRole(role);
  };

  return (
    <div className="impact-map-page impact-control-room">
      <ImpactHeader />

      <main className="impact-control-shell">
        <CategoryTabs selectedIndustryId={selectedIndustryId} onSelect={handleSelectIndustry} />

        <div className={`impact-subspace-grid ${selectedRole ? 'has-role-detail' : 'no-role-detail'}`}>
          <FloodScale
            industry={selectedIndustry}
            selectedStatus={selectedStatus}
            guideOpen={guideOpen}
            onSelectStatus={handleSelectStatus}
            onToggleGuide={() => setGuideOpen((open) => !open)}
          />

          <div className="impact-main-canvas">
            <CategorySummary industry={selectedIndustry} />
            <LayerDetail
              industry={selectedIndustry}
              selectedStatus={selectedStatus}
              selectedRole={selectedRole}
              onSelectRole={handleSelectRole}
            />
          </div>

          <RoleDetailPanel
            industry={selectedIndustry}
            role={selectedRole}
            onClose={() => setSelectedRole(null)}
            onOpenEvidence={setNoteRole}
            onSelectAdjacent={handleSelectAdjacent}
          />
        </div>
      </main>

      <footer className="impact-map-footer">
        This is a living orientation map, not a fixed prediction. <a href="https://github.com/turtleand/ai-atlas" target="_blank" rel="noopener noreferrer">Fork it and map your world.</a>
      </footer>

      <NotesPanel role={noteRole} onClose={() => setNoteRole(null)} />
    </div>
  );
}
