"use client";

/** Error boundary de nível raiz (substitui todo o layout, precisa de html/body). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f0d",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Erro inesperado</h1>
        <p style={{ color: "#a3a3a3", fontSize: "0.875rem", maxWidth: 420 }}>
          A aplicação encontrou um erro. Recarregue a página.
          {error.digest ? ` (ref: ${error.digest})` : ""}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.25rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(74,222,128,0.4)",
            background: "rgba(22,163,74,0.15)",
            color: "#4ade80",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
