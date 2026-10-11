import { useId } from "react";

import type { Messages } from "@/i18n/messages/en";
import { signTemplates } from "@/templates/catalogue";
import type { TemplateId } from "@/templates/types";

import styles from "./template-picker.module.css";

type TemplatePickerProps = {
  messages: Messages;
  value: TemplateId;
  onChange: (id: TemplateId) => void;
};

/**
 * Template selection for the customer flow. Every template is a radio with its
 * localised name and hint; choosing one updates the preview instantly through the
 * parent's state. All templates work locally — nothing here is planned.
 */
export function TemplatePicker({ messages, value, onChange }: TemplatePickerProps) {
  const groupName = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{messages.templates.pickerLegend}</legend>
      <p className={styles.hint}>{messages.templates.pickerHint}</p>
      <div className={styles.options}>
        {signTemplates.map((template) => {
          const copy = messages.templates.items[template.id];
          return (
            <label
              key={template.id}
              className={styles.option}
              data-selected={value === template.id}
            >
              <input
                type="radio"
                name={groupName}
                value={template.id}
                checked={value === template.id}
                onChange={() => onChange(template.id)}
                className={styles.radio}
              />
              <span className={styles.optionText}>
                <span className={styles.optionName}>{copy.name}</span>
                <span className={styles.optionHint}>{copy.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
