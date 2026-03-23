"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: number;
  created_at: string;
  style_id: string;
  model_used: string;
  pass1_model: string;
  pass2_model: string;
  duration_ms: number;
  pass1_duration_ms: number;
  pass2_duration_ms: number;
  success: boolean;
  error_message: string | null;
  input_width: number;
  input_height: number;
  built_prompt_pass1: string | null;
  built_prompt_pass2: string | null;
  input_image_path: string | null;
  pass1_image_path: string | null;
  output_image_path: string | null;
}

function extractFilename(path: string): string {
  // Handle various path formats: "/logs/foo.jpg", "public/logs/foo.jpg", "foo.jpg", etc.
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function LogImage({ path, label }: { path: string; label: string }) {
  const [errored, setErrored] = useState(false);
  const src = `/api/logs/image?file=${encodeURIComponent(extractFilename(path))}`;

  if (errored) {
    return (
      <div style={{ textAlign: "center", flex: "1 1 auto", minWidth: 150, maxWidth: 300 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
        <div
          style={{
            maxWidth: 300,
            height: 180,
            borderRadius: 8,
            border: "1px solid #eee",
            background: "#f5f5f3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "#aaa",
            fontStyle: "italic",
          }}
        >
          Image indisponible
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", flex: "1 1 auto", minWidth: 150, maxWidth: 300 }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <img
        src={src}
        alt={label}
        onError={() => setErrored(true)}
        onClick={() => window.open(src, "_blank")}
        style={{
          maxWidth: 300,
          width: "100%",
          height: "auto",
          maxHeight: 250,
          objectFit: "contain",
          borderRadius: 8,
          border: "1px solid #eee",
          cursor: "pointer",
        }}
      />
    </div>
  );
}

export default function AdminPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        setAuthError(false);
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/logs")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLogs(data.logs || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "Inter, sans-serif", background: "#FAFAF8" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: "40px 48px", borderRadius: 16, border: "1px solid #e0e0e0", textAlign: "center", maxWidth: 360, width: "100%" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1C1C1E", marginBottom: 8 }}>VisiRenov Admin</h1>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>Acces restreint</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
            placeholder="Mot de passe"
            autoFocus
            style={{
              width: "100%", padding: "10px 14px", border: `1px solid ${authError ? "#c00" : "#ddd"}`, borderRadius: 8,
              fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box",
            }}
          />
          {authError && <p style={{ fontSize: 12, color: "#c00", marginBottom: 12 }}>Mot de passe incorrect</p>}
          <button
            type="submit"
            style={{
              width: "100%", padding: "10px 0", background: "#1C1C1E", color: "#fff", border: "none",
              borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}
          >
            Connexion
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>Chargement...</div>;
  if (error) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif", color: "#c00" }}>Erreur : {error}</div>;
  if (logs.length === 0) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>Aucune generation loguee.</div>;

  return (
    <div style={{ padding: "24px 32px", fontFamily: "Inter, sans-serif", maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: "#1C1C1E" }}>
        VisiRenov — Logs de generation ({logs.length})
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {logs.map((log) => {
          const expanded = expandedId === log.id;
          const date = new Date(log.created_at);
          const timeStr = date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR");

          return (
            <div
              key={log.id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 12,
                background: log.success ? "#fff" : "#fff5f5",
                overflow: "hidden",
              }}
            >
              {/* Header row */}
              <div
                onClick={() => setExpandedId(expanded ? null : log.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 20px",
                  cursor: "pointer",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 13, color: "#888", minWidth: 150 }}>{timeStr}</span>
                <span
                  style={{
                    background: "#7D9B76",
                    color: "#fff",
                    padding: "2px 10px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {log.style_id || "custom"}
                </span>
                <span style={{ fontSize: 13, color: "#555" }}>
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "—"}
                  {log.pass1_duration_ms && log.pass2_duration_ms
                    ? ` (P1: ${(log.pass1_duration_ms / 1000).toFixed(1)}s + P2: ${(log.pass2_duration_ms / 1000).toFixed(1)}s)`
                    : ""}
                </span>
                <span style={{ fontSize: 13, color: "#555" }}>
                  {log.input_width}x{log.input_height}
                </span>
                <span style={{ fontSize: 13, color: log.success ? "#7D9B76" : "#c00", fontWeight: 600 }}>
                  {log.success ? "OK" : "ERREUR"}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#aaa" }}>{expanded ? "▲" : "▼"}</span>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid #eee" }}>
                  {/* Images */}
                  <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                    {log.input_image_path && (
                      <LogImage path={log.input_image_path} label="Input" />
                    )}
                    {log.pass1_image_path && (
                      <LogImage path={log.pass1_image_path} label="Passe 1 (surfaces)" />
                    )}
                    {log.output_image_path && (
                      <LogImage path={log.output_image_path} label="Output (final)" />
                    )}
                    {!log.input_image_path && !log.pass1_image_path && !log.output_image_path && (
                      <div style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Aucune image sauvegardee</div>
                    )}
                  </div>

                  {/* Models */}
                  <div style={{ marginTop: 16, fontSize: 13, color: "#555" }}>
                    <strong>Modeles :</strong> P1: {log.pass1_model || "—"} / P2: {log.pass2_model || "—"}
                  </div>

                  {/* Error */}
                  {log.error_message && (
                    <div style={{ marginTop: 12, padding: 12, background: "#fff0f0", borderRadius: 8, fontSize: 13, color: "#c00" }}>
                      {log.error_message}
                    </div>
                  )}

                  {/* Prompts */}
                  {log.built_prompt_pass1 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E", marginBottom: 4 }}>Prompt Passe 1 (surfaces)</div>
                      <pre
                        style={{
                          background: "#f5f5f3",
                          padding: 12,
                          borderRadius: 8,
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: 200,
                          overflow: "auto",
                        }}
                      >
                        {log.built_prompt_pass1}
                      </pre>
                    </div>
                  )}
                  {log.built_prompt_pass2 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E", marginBottom: 4 }}>Prompt Passe 2 (mobilier)</div>
                      <pre
                        style={{
                          background: "#f5f5f3",
                          padding: 12,
                          borderRadius: 8,
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: 200,
                          overflow: "auto",
                        }}
                      >
                        {log.built_prompt_pass2}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
