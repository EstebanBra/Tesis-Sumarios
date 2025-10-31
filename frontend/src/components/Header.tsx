type Props = { logoSrc?: string };

export default function Header({ logoSrc = "/logo-ubb.png" }: Props) {
  return (
    <header
      style={{
        borderBottom: "1px solid #e5e7eb",
        background: "white",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <img
        src={logoSrc}
        alt="Universidad del Bío-Bío"
        style={{
          width: 50,
          height: 50,
          objectFit: "contain",
        }}
      />
      <div style={{ lineHeight: 1.3 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 22,
            color: "#0b4a8f",
          }}
        >
          Portal Único de Denuncias
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#374151",
          }}
        >
          Universidad del Bío-Bío
        </div>
      </div>
    </header>
  );
}
