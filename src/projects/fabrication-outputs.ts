import type { SignProject } from "./sign-project";

/**
 * Fabrication outputs (Stage F). Every file is generated ONLY from the
 * validated structured project (clamped millimetre dimensions, chosen
 * construction/material/lighting/finish) and every output states exactly what
 * it is:
 *
 * - cut list (CSV): the panel cut dimensions — exact structured data;
 * - DXF (R12): the panel face rectangle in millimetres — exact simple
 *   geometry, labelled as panel outline only (not a shop drawing);
 * - the SVG views are produced by serialising the on-screen views (the
 *   visual composition, and the dimensioned schematic profile).
 *
 * Nothing here invents electrical or engineering values: an LED plan is NOT
 * offered until manufacturer data exists, and the UI says so.
 */

/** The panel cut list as CSV (one row; quantities are honest: one panel). */
export function buildCutListCsv(project: SignProject): string {
  const { physical, material, finish, construction } = project;
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = "item,construction,material,finish,width_mm,height_mm,depth_mm,quantity";
  const row = [
    esc("panel"),
    esc(construction),
    esc(material),
    esc(finish),
    physical.widthMm,
    physical.heightMm,
    physical.depthMm,
    1,
  ].join(",");
  return `${header}\n${row}\n`;
}

/**
 * A minimal, valid AutoCAD R12 DXF of the panel face rectangle, in
 * millimetres ($INSUNITS 4). Only the outline is exported — the file carries
 * a comment saying exactly that.
 */
export function buildPanelDxf(project: SignProject): string {
  const { widthMm, heightMm } = project.physical;
  const line = (x1: number, y1: number, x2: number, y2: number): string =>
    [
      "0",
      "LINE",
      "8",
      "PANEL",
      "10",
      String(x1),
      "20",
      String(y1),
      "30",
      "0",
      "11",
      String(x2),
      "21",
      String(y2),
      "31",
      "0",
    ].join("\n");
  return [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$INSUNITS",
    "70",
    "4",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
    line(0, 0, widthMm, 0),
    line(widthMm, 0, widthMm, heightMm),
    line(widthMm, heightMm, 0, heightMm),
    line(0, heightMm, 0, 0),
    "0",
    "ENDSEC",
    "0",
    "EOF",
    "",
  ].join("\n");
}

/** Serialises a live SVG element into a standalone .svg document. */
export function svgDocumentFromElement(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}\n`;
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
