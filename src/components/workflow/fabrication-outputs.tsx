"use client";

import type { RefObject } from "react";

import {
  buildCutListCsv,
  buildPanelDxf,
  downloadText,
  svgDocumentFromElement,
} from "@/projects/fabrication-outputs";
import type { SignProject } from "@/projects/sign-project";
import type { Messages } from "@/i18n/messages/en";
import { Button } from "@/components/ui/button";

import styles from "./studio-workspace.module.css";

type FabricationOutputsProps = {
  messages: Messages;
  project: SignProject;
  /** The workspace root: the live side-view svg is serialised from it. */
  rootRef: RefObject<HTMLDivElement | null>;
};

/**
 * Fabrication exports (Stage F). Each output is generated only from the
 * validated structured project, and the note under it states exactly what the
 * file contains and how accurate it is. The front design is an HTML/CSS
 * visual, so no fake "front SVG/DXF" is offered; the LED plan needs
 * manufacturer data and is honestly withheld.
 */
export function FabricationOutputs({ messages, project, rootRef }: FabricationOutputsProps) {
  const copy = messages.pro.outputs;

  function downloadSideSvg() {
    const svg = rootRef.current?.querySelector("[data-testid='side-view-svg']");
    if (svg) {
      downloadText("signcraft-profil.svg", svgDocumentFromElement(svg), "image/svg+xml");
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="workspace-outputs-title">
      <h2 className={styles.panelTitle} id="workspace-outputs-title">
        {copy.title}
      </h2>
      <p className={styles.hint}>{copy.lead}</p>

      <div className={styles.outputRow} data-testid="output-svg-side">
        <div>
          <p className={styles.outputName}>{copy.svgSide}</p>
          <p className={styles.hint}>{copy.svgSideNote}</p>
        </div>
        <Button variant="secondary" onClick={downloadSideSvg}>
          {copy.download}
        </Button>
      </div>

      <div className={styles.outputRow} data-testid="output-cutlist">
        <div>
          <p className={styles.outputName}>{copy.cutList}</p>
          <p className={styles.hint}>{copy.cutListNote}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadText("signcraft-liste-debit.csv", buildCutListCsv(project), "text/csv")
          }
        >
          {copy.download}
        </Button>
      </div>

      <div className={styles.outputRow} data-testid="output-dxf">
        <div>
          <p className={styles.outputName}>{copy.dxf}</p>
          <p className={styles.hint}>{copy.dxfNote}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadText("signcraft-panneau.dxf", buildPanelDxf(project), "application/dxf")
          }
        >
          {copy.download}
        </Button>
      </div>

      <div className={styles.outputRow} data-testid="output-led">
        <div>
          <p className={styles.outputName}>{copy.led}</p>
          <p className={styles.hint}>{copy.ledNote}</p>
        </div>
        <Button variant="ghost" disabled>
          {copy.download}
        </Button>
      </div>
    </section>
  );
}
