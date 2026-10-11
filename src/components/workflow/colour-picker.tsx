import { useId } from "react";

import type { Messages } from "@/i18n/messages/en";
import type { ColourId, ColourRole, SignTemplate } from "@/templates/types";

import styles from "./colour-picker.module.css";

type ColourPickerProps = {
  messages: Messages;
  template: SignTemplate;
  value: Record<ColourRole, ColourId>;
  onChange: (role: ColourRole, colourId: ColourId) => void;
};

/**
 * Named colour swatches for each customisable slot of the current template. Swatch
 * dots are decorative; the colour name carries the meaning. Changes apply to the
 * preview instantly through the parent's state.
 */
export function ColourPicker({ messages, template, value, onChange }: ColourPickerProps) {
  const baseName = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{messages.create.colourLegend}</legend>
      <div className={styles.slots}>
        {template.slots.map((slot) => (
          <div key={slot.role} className={styles.slotGroup}>
            <p className={styles.slotName}>{messages.colours.slots[slot.role]}</p>
            <div className={styles.swatches}>
              {slot.options.map((option) => (
                <label
                  key={option.id}
                  className={styles.swatchOption}
                  data-selected={value[slot.role] === option.id}
                >
                  <input
                    type="radio"
                    name={`${baseName}-${slot.role}`}
                    value={option.id}
                    checked={value[slot.role] === option.id}
                    onChange={() => onChange(slot.role, option.id)}
                    className={styles.radio}
                  />
                  <span
                    className={styles.swatch}
                    style={{ background: option.value }}
                    aria-hidden="true"
                  />
                  <span className={styles.swatchName}>{messages.colours.names[option.id]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
