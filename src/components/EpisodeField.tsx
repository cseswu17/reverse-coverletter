interface EpisodeFieldProps {
  step: number;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function EpisodeField({
  step,
  label,
  hint,
  placeholder,
  value,
  onChange,
  disabled,
}: EpisodeFieldProps) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-white">
          {step}
        </span>
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-mute">{hint}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={disabled}
        className="w-full resize-none rounded-md border border-hairline bg-canvas p-4 text-[15px] leading-relaxed text-ink placeholder:text-mute outline-none transition-all focus-visible:border-link focus-visible:ring-2 focus-visible:ring-link/20 disabled:opacity-60"
      />
    </div>
  );
}
