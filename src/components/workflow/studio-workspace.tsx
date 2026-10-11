"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";

import {
  constructionIds,
  finishIds,
  lightingIds,
  materialIds,
  MAX_DEPTH_MM,
  MAX_HEIGHT_MM,
  MAX_WIDTH_MM,
  MIN_DEPTH_MM,
  MIN_HEIGHT_MM,
  MIN_WIDTH_MM,
  clampPhysical,
  defaultProject,
  projectFromDraft,
  type ConstructionId,
  type FinishId,
  type LightingId,
  type MaterialId,
  type SignProject,
} from "@/projects/sign-project";
import { loadProject, saveProject } from "@/projects/project-store";
import { loadDraft } from "@/projects/draft-store";
import { getTemplate } from "@/templates/catalogue";
import { defaultDraft, resolveColourValues } from "@/templates/draft";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { Button, buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { SignPreview } from "./sign-preview";
import { SideView } from "./side-view";
import styles from "./studio-workspace.module.css";

type StudioWorkspaceProps = {
  locale: Locale;
  messages: Messages;
};

function initialProject(): SignProject {
  const stored = loadProject();
  if (stored) {
    return stored;
  }
  // First visit: carry the customer draft across, so the Normal Mode design is
  // the starting point of the professional project (same device).
  return projectFromDraft(loadDraft() ?? defaultDraft());
}

/**
 * The Professional Studio workspace (Stage E): one shared structured project —
 * the customer design plus separate fabrication attributes (construction,
 * material, lighting, finish, real millimetre dimensions) — with a live front
 * view and a dimensioned side view. The design itself is edited in the customer
 * creator; the fabrication parameters live here. The project is stored on this
 * device; nothing pretends to be a 2D/3D editor or to export fabrication files.
 */
export function StudioWorkspace({ locale, messages }: StudioWorkspaceProps) {
  const workspace = messages.pro.workspace;
  const [project, setProject] = useState<SignProject>(initialProject);
  const [savedFlash, setSavedFlash] = useState(false);

  const template = getTemplate(project.draft.templateId);
  const colours = resolveColourValues(project.draft);
  // Views and storage always see clamped fabrication values; while typing the
  // raw field value is kept so the input behaves like a normal number field.
  const physical = clampPhysical(project.physical);

  function patch(patch: Partial<SignProject>) {
    setProject((current) => ({ ...current, ...patch }));
  }

  function setDimension(
    field: "widthMm" | "heightMm" | "depthMm",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = Number(event.target.value);
    setProject((current) => ({
      ...current,
      physical: { ...current.physical, [field]: Number.isFinite(value) ? Math.max(0, value) : 0 },
    }));
  }

  function clampDimensions() {
    setProject((current) => ({ ...current, physical: clampPhysical(current.physical) }));
  }

  function handleSave() {
    const clamped = { ...project, physical: clampPhysical(project.physical) };
    setProject(clamped);
    if (saveProject(clamped)) {
      setSavedFlash(true);
    }
  }

  function handleNew() {
    setSavedFlash(false);
    setProject(defaultProject());
  }

  return (
    <div className={styles.workspace} data-testid="studio-workspace">
      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="workspace-controls-title">
          <h2 className={styles.panelTitle} id="workspace-controls-title">
            {workspace.controls}
          </h2>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{workspace.dimensions}</legend>
            <div className={styles.dimensionRow}>
              <label className={styles.field}>
                <span>{workspace.width}</span>
                <input
                  className={styles.input}
                  type="number"
                  min={MIN_WIDTH_MM}
                  max={MAX_WIDTH_MM}
                  value={project.physical.widthMm}
                  onChange={(event) => void setDimension("widthMm", event)}
                  onBlur={clampDimensions}
                />
              </label>
              <label className={styles.field}>
                <span>{workspace.height}</span>
                <input
                  className={styles.input}
                  type="number"
                  min={MIN_HEIGHT_MM}
                  max={MAX_HEIGHT_MM}
                  value={project.physical.heightMm}
                  onChange={(event) => void setDimension("heightMm", event)}
                  onBlur={clampDimensions}
                />
              </label>
              <label className={styles.field}>
                <span>{workspace.depth}</span>
                <input
                  className={styles.input}
                  type="number"
                  min={MIN_DEPTH_MM}
                  max={MAX_DEPTH_MM}
                  value={project.physical.depthMm}
                  onChange={(event) => void setDimension("depthMm", event)}
                  onBlur={clampDimensions}
                />
              </label>
            </div>
            <p className={styles.hint}>{workspace.depthHint}</p>
          </fieldset>

          <label className={styles.field}>
            <span>{workspace.construction}</span>
            <select
              className={styles.input}
              value={project.construction}
              onChange={(event) => patch({ construction: event.target.value as ConstructionId })}
            >
              {constructionIds.map((id) => (
                <option key={id} value={id}>
                  {workspace.constructions[id]}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{workspace.material}</span>
            <select
              className={styles.input}
              value={project.material}
              onChange={(event) => patch({ material: event.target.value as MaterialId })}
            >
              {materialIds.map((id) => (
                <option key={id} value={id}>
                  {workspace.materials[id]}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{workspace.lighting}</span>
            <select
              className={styles.input}
              value={project.lighting}
              onChange={(event) => patch({ lighting: event.target.value as LightingId })}
            >
              {lightingIds.map((id) => (
                <option key={id} value={id}>
                  {workspace.lightings[id]}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{workspace.finish}</span>
            <select
              className={styles.input}
              value={project.finish}
              onChange={(event) => patch({ finish: event.target.value as FinishId })}
            >
              {finishIds.map((id) => (
                <option key={id} value={id}>
                  {workspace.finishes[id]}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.actions}>
            <Button onClick={handleSave}>{workspace.save}</Button>
            <Button variant="ghost" onClick={handleNew}>
              {workspace.new}
            </Button>
          </div>
          {savedFlash && (
            <p className={styles.saved} role="status">
              {workspace.saved}
            </p>
          )}
          <p className={styles.hint}>{workspace.deviceNote}</p>
          <Link href={`/${locale}/create`} className={buttonClassName({ variant: "secondary" })}>
            {workspace.openCreate}
          </Link>
        </section>

        <div className={styles.views}>
          <section className={styles.panel} aria-labelledby="workspace-front-title">
            <div className={styles.viewHeader}>
              <h2 className={styles.panelTitle} id="workspace-front-title">
                {workspace.frontView}
              </h2>
              <Badge tone="neutral">{workspace.constructions[project.construction]}</Badge>
            </div>
            <SignPreview
              messages={messages}
              templateId={project.draft.templateId}
              templateName={messages.templates.items[project.draft.templateId].name}
              layout={template.layout}
              colours={colours}
              text={project.draft.text}
              tagline={project.draft.tagline}
              composition={template.composition}
              lettering={project.draft.lettering}
              arrangement={template.composition.arrangement}
            />
          </section>

          <section className={styles.panel} aria-labelledby="workspace-side-title">
            <h2 className={styles.panelTitle} id="workspace-side-title">
              {workspace.sideView}
            </h2>
            <SideView
              messages={messages}
              physical={physical}
              construction={project.construction}
              material={project.material}
              finish={project.finish}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
