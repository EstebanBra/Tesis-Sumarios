type Props = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
};

export default function FormGroup({ label, htmlFor, children, hint }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={htmlFor} style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
