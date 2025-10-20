type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };

export default function Button({ variant = "primary", style, ...rest }: Props) {
  const base: React.CSSProperties = {
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 600,
    border: "1px solid transparent",
    cursor: "pointer",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "#0b4a8f", color: "white" },
    ghost: { background: "transparent", borderColor: "#cbd5e1", color: "#0b4a8f" },
  };
  return <button {...rest} style={{ ...base, ...variants[variant], ...style }} />;
}
