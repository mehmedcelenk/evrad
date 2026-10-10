import { useId } from "react";
import { Check } from "lucide-react";

export function SettingsSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void;
}) {
  const id = useId();
  return <div className="settings-flat-row">
    <label htmlFor={id} className="settings-flat-label">{label}</label>
    <div className="settings-slider-wrap">
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))} className="settings-slider" />
    </div>
  </div>;
}

export function SettingsSwitch({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const id = useId();
  return <div className="settings-flat-row" onClick={onToggle} style={{ cursor: "pointer" }}>
    <span id={id} className="settings-flat-label">{label}</span>
    <button type="button" role="checkbox" aria-checked={checked} aria-labelledby={id}
      className={`classic-checkbox-box${checked ? " is-checked" : ""}`} onClick={(event) => { event.stopPropagation(); onToggle(); }}>
      {checked ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  </div>;
}
