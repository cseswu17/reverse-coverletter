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
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
          {step}
        </span>
        <span className="text-sm font-semibold text-zinc-800">{label}</span>
        <span className="text-xs font-medium text-zinc-400">{hint}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={disabled}
        className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 text-[15px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 outline-none transition-all focus-visible:border-zinc-900 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-60"
      />
    </div>
  );
}
