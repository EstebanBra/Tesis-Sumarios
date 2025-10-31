type Props = {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
};

export default function CardOption({ title, subtitle, selected, onClick }: Props) {
  return (
    <div
      role="button"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      aria-pressed={selected}
      style={{
        border: `2px solid ${selected ? "#0b4a8f" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        outline: "none",
      }}
    >
      <div style={{ fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}
