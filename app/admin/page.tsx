"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";

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
  surface_prompt: string | null;
  furniture_prompt: string | null;
  input_image_path: string | null;
  pass1_image_path: string | null;
  output_image_path: string | null;
  is_iteration: boolean | null;
  iteration_number: number | null;
  session_id: string | null;
  user_comment_raw: string | null;
  is_replay: boolean | null;
  replay_source_id: number | null;
  replay_label: string | null;
  pixel_diff_pct: number | null;
  color_shift_score: number | null;
  prompt_version: string | null;
}

function extractFilename(path: string): string {
  // Handle various path formats: "/logs/foo.jpg", "public/logs/foo.jpg", "foo.jpg", etc.
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function LogImage({ path, label }: { path: string; label: string }) {
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const src = `/api/logs/image?file=${encodeURIComponent(extractFilename(path))}`;

  const handleError = async () => {
    // Try to fetch and get the actual error detail
    try {
      const res = await fetch(src);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 404) {
          setErrorInfo("Image introuvable (404)");
        } else if (res.status === 500) {
          setErrorInfo(`Erreur stockage (500)${data?.detail ? `: ${data.detail}` : ""}`);
        } else {
          setErrorInfo(`Erreur ${res.status}`);
        }
      } else {
        setErrorInfo("Image indisponible");
      }
    } catch {
      setErrorInfo("Stockage inaccessible");
    }
  };

  if (errorInfo) {
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
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontSize: 13,
            color: "#aaa",
            fontStyle: "italic",
          }}
        >
          <span>{errorInfo}</span>
          <span style={{ fontSize: 10, color: "#ccc" }}>{extractFilename(path)}</span>
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
        onError={() => handleError()}
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

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <button
      onClick={handleCopy}
      title={label || "Copier"}
      style={{
        padding: "2px 8px",
        background: copied ? "#7D9B76" : "#eee",
        color: copied ? "#fff" : "#555",
        border: "none",
        borderRadius: 4,
        fontSize: 11,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {copied ? "Copié" : label || "Copier"}
    </button>
  );
}

interface UserEntry {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credits_remaining: number;
  created_at: string;
  purchase_count: number;
  total_spent_cents: number;
  generation_count: number;
}

export default function AdminPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [showAuditPrompt, setShowAuditPrompt] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ checked: boolean; ok: boolean; detail?: string }>({ checked: false, ok: false });
  const [storageChecking, setStorageChecking] = useState(false);
  const [versionFilter, setVersionFilter] = useState<string>("");
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"generations" | "users">("generations");
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

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
    setLoading(true);
    const params = new URLSearchParams({ token: password });
    if (versionFilter) params.set("version", versionFilter);
    fetch(`/api/logs?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          let detail = `HTTP ${r.status}`;
          try {
            const json = JSON.parse(text);
            if (json.error) detail += ` — ${json.error}`;
          } catch {
            if (text.length > 0 && text.length < 200) detail += ` — ${text}`;
          }
          throw new Error(detail);
        }
        return r.json();
      })
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setLogs(data.logs || []);
          if (data.versions) setAvailableVersions(data.versions);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authenticated, versionFilter, password]);

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen font-[Inter,sans-serif] bg-background">
        <form onSubmit={handleLogin} className="bg-white px-12 py-10 rounded-2xl border border-foreground/10 text-center max-w-[360px] w-full">
          <h1 className="text-xl font-semibold text-foreground mb-2">Versiroom Admin</h1>
          <p className="text-[13px] text-foreground/50 mb-6">Acces restreint</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
            placeholder="Mot de passe"
            autoFocus
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none mb-4 ${authError ? "border-red-600" : "border-foreground/15"}`}
          />
          {authError && <p className="text-xs text-red-600 mb-3">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-foreground text-white rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            Connexion
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="p-10 font-[Inter,sans-serif] text-foreground/60">Chargement...</div>;
  if (error) return <div className="p-10 font-[Inter,sans-serif] text-red-600">Erreur : {error}</div>;
  if (logs.length === 0 && activeTab === "generations") return <div className="p-10 font-[Inter,sans-serif] text-foreground/60">Aucune generation loguee.</div>;

  const auditPromptText = `Fais appel aux agents Architecte d'Interieur (Yann Duval), Expert IA Image (Lucas Moreau) et Paysagiste (Camille Verdier, pour les generations outdoor) pour auditer les generations recentes de production.

Methode d'acces aux donnees de production :
- Utilise WebFetch sur https://architecture-toum92.replit.app/api/logs?token=allezpsg pour recuperer TOUS les logs (style, duree, succes, prompts construits, chemins images)
- Pour les images : telecharge-les avec curl dans /tmp/audit-images/ :
  curl -s -o /tmp/audit-images/{id}_{type}.jpg "https://architecture-toum92.replit.app/api/logs/image?path={image_path}&token=allezpsg"
  (image_path = input_image_path, pass1_image_path, output_image_path de chaque log)
- Puis lis les images avec Read tool pour les analyser visuellement (Read supporte les images JPG/PNG)
- IMPORTANT : decoupe l'audit en batches de 6 generations max par agent pour eviter les timeouts

Workflow d'audit :
1. Recupere les logs via l'API production (WebFetch sur /api/logs?token=allezpsg)
2. Identifie les generations NOUVELLES depuis le dernier audit (voir docs/reviews/audit-visuel-* pour le dernier batch audite)
3. Telecharge TOUTES les images (input, pass1, output) dans /tmp/audit-images/
4. Pour chaque generation, examine visuellement avec Read :
   - Les images INPUT, PASSE 1 et OUTPUT
   - Le prompt construit passe 1 (built_prompt_pass1) et passe 2 (built_prompt_pass2)
   - Le style utilise, la duree par passe, le modele utilise
5. Yann evalue (grille 10 criteres, fidelite et credibilite comptent double) : fidelite stylistique, vocabulaire visuel, hero pieces, coherence matieres, eclairage, credibilite pro, completude, differenciation, adaptabilite spatiale, potentiel photorealiste
6. Lucas evalue (grille 10 criteres, preservation et rendu comptent double) : preservation architecturale, contraintes lumiere, vocabulaire photo, structure prompt, negative prompting, compatibilite multi-modeles, coherence I/O, richesse descriptive, adaptabilite conditions variables, rendu final credible
7. Camille evalue les generations outdoor (grille 10 criteres) : fidelite style paysager, vocabulaire vegetal, mobilier outdoor, materiaux exterieurs, eclairage naturel, credibilite pro, completude, differenciation, integration environnement, potentiel photorealiste
8. Note /10 par generation + classement comparatif
9. Patterns recurrents (problemes communs a plusieurs generations)
10. Plan d'amelioration prioritaire (P0-P4) avec corrections concretes de prompts/parametres

Demande type : "Fais appel aux agents Architecte d'Interieur, Expert IA Image et Paysagiste pour auditer toutes les generations depuis le dernier audit. Telecharge les images dans /tmp/audit-images/ et analyse-les visuellement. Donne la note de chaque generation, identifie les patterns recurrents, et propose un plan d'amelioration prioritaire."`;

  // Fetch users when tab switches to "users"
  useEffect(() => {
    if (activeTab !== "users" || !authenticated) return;
    if (users.length > 0) return; // already loaded
    setUsersLoading(true);
    setUsersError(null);
    fetch(`/api/admin/users?token=${encodeURIComponent(password)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) setUsersError(data.error);
        else setUsers(data.users || []);
      })
      .catch((e) => setUsersError(e.message))
      .finally(() => setUsersLoading(false));
  }, [activeTab, authenticated, password, users.length]);

  return (
    <div className="px-6 py-6 md:px-8 font-[Inter,sans-serif] max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-semibold text-foreground mb-4">
        Versiroom Admin
      </h1>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-foreground/10">
        <button
          onClick={() => setActiveTab("generations")}
          className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "generations"
              ? "bg-foreground text-white"
              : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
          }`}
        >
          Generations ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "users"
              ? "bg-foreground text-white"
              : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
          }`}
        >
          Utilisateurs
        </button>
      </div>

      {/* === Tab: Users === */}
      {activeTab === "users" && (
        <div>
          {usersLoading && <p className="text-foreground/50 text-sm">Chargement des utilisateurs...</p>}
          {usersError && <p className="text-red-600 text-sm">Erreur : {usersError}</p>}
          {!usersLoading && !usersError && users.length === 0 && (
            <p className="text-foreground/50 text-sm">Aucun utilisateur enregistre.</p>
          )}
          {!usersLoading && users.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-foreground/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-foreground/[0.03] text-left text-foreground/60 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Credits</th>
                    <th className="px-4 py-3 font-medium text-right">Generations</th>
                    <th className="px-4 py-3 font-medium text-right">Achats</th>
                    <th className="px-4 py-3 font-medium text-right">Depense</th>
                    <th className="px-4 py-3 font-medium">Inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-4 py-3 text-foreground font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-foreground/70">{u.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === "admin" ? "bg-sage/20 text-sage" : u.role === "pro" ? "bg-blue-100 text-blue-700" : "bg-foreground/5 text-foreground/60"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground/70 tabular-nums">{u.credits_remaining}</td>
                      <td className="px-4 py-3 text-right text-foreground/70 tabular-nums">{u.generation_count}</td>
                      <td className="px-4 py-3 text-right text-foreground/70 tabular-nums">{u.purchase_count}</td>
                      <td className="px-4 py-3 text-right text-foreground/70 tabular-nums">
                        {u.total_spent_cents > 0 ? `${(u.total_spent_cents / 100).toFixed(2)} \u20AC` : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground/50 text-xs">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === Tab: Generations === */}
      {activeTab === "generations" && (<>

      {/* Audit prompt banner */}
      <div className="mb-5 bg-sage/10 border border-sage/30 rounded-xl overflow-hidden">
        <div
          onClick={() => setShowAuditPrompt(!showAuditPrompt)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}
        >
          <span style={{ fontSize: 16 }}>&#x1f9d1;&#x200d;&#x1f3a8;</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#3d5a38" }}>
            Prompt d&apos;audit agents (Yann Duval + Lucas Moreau + Camille Verdier)
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#7D9B76" }}>
            {showAuditPrompt ? "Masquer" : "Copier le prompt pour lancer un audit"}
          </span>
        </div>
        {showAuditPrompt && (
          <div style={{ padding: "0 16px 16px" }}>
            <pre
              style={{
                background: "#fff", padding: 16, borderRadius: 8, fontSize: 12,
                whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6,
                border: "1px solid #dde8db", color: "#1C1C1E", maxHeight: 400, overflow: "auto",
                overflowX: "auto",
              }}
            >
              {auditPromptText}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(auditPromptText); }}
              style={{
                marginTop: 8, padding: "6px 16px", background: "#7D9B76", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              Copier dans le presse-papier
            </button>
          </div>
        )}
      </div>

      {/* Storage diagnostic */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={async () => {
            setStorageChecking(true);
            try {
              const res = await fetch(`/api/logs/storage-check?token=${encodeURIComponent(password)}`);
              const data = await res.json();
              setStorageStatus({ checked: true, ok: data.status === "ok", detail: data.detail || data.message });
            } catch (err) {
              setStorageStatus({ checked: true, ok: false, detail: err instanceof Error ? err.message : "Fetch failed" });
            } finally {
              setStorageChecking(false);
            }
          }}
          disabled={storageChecking}
          style={{
            padding: "6px 16px", background: "#1C1C1E", color: "#fff", border: "none",
            borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: storageChecking ? "wait" : "pointer",
            opacity: storageChecking ? 0.6 : 1,
          }}
        >
          {storageChecking ? "Test en cours..." : "Tester Object Storage"}
        </button>
        {storageStatus.checked && (
          <span style={{ fontSize: 12, color: storageStatus.ok ? "#3d5a38" : "#c00" }}>
            {storageStatus.ok ? "OK" : `Erreur : ${storageStatus.detail}`}
          </span>
        )}
      </div>

      {/* Version filter */}
      {availableVersions.length > 0 && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Filtrer par version de prompt :</label>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            style={{
              padding: "6px 12px", border: "1px solid #ddd", borderRadius: 6,
              fontSize: 13, color: "#1C1C1E", background: "#fff", cursor: "pointer",
            }}
          >
            <option value="">Toutes les versions</option>
            {availableVersions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {versionFilter && (
            <span style={{ fontSize: 12, color: "#888" }}>
              {logs.length} generation{logs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

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
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E", minWidth: 40 }}>#{log.id}</span>
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
                {log.is_iteration && (
                  <span
                    style={{
                      background: "#e8a838",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ITÉRATION{log.iteration_number ? ` #${log.iteration_number}` : ""}
                  </span>
                )}
                <span
                  style={{
                    background: log.prompt_version ? "#4a6fa5" : "#ccc",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {log.prompt_version || "—"}
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
                {log.is_replay && (
                  <span style={{ background: "#4a90d9", color: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                    REPLAY{log.replay_source_id ? ` de #${log.replay_source_id}` : ""}
                  </span>
                )}
                {log.replay_label && (
                  <span style={{ background: "#eee", color: "#555", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                    {log.replay_label}
                  </span>
                )}
                {log.pixel_diff_pct != null && (
                  <span style={{ fontSize: 11, color: "#888" }}>
                    diff: {log.pixel_diff_pct}% | color: {log.color_shift_score?.toFixed(1)}
                  </span>
                )}
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
                  {/* User comment (iterations) */}
                  {log.user_comment_raw && (
                    <div style={{ marginTop: 16, padding: 12, background: "#fff8e6", borderRadius: 8, border: "1px solid #f0d98c" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E", marginBottom: 4 }}>Commentaire utilisateur</div>
                      <div style={{ fontSize: 13, color: "#555" }}>{log.user_comment_raw}</div>
                    </div>
                  )}

                  {/* Session ID */}
                  {log.session_id && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#aaa" }}>
                      Session : {log.session_id}
                    </div>
                  )}

                  {log.built_prompt_pass1 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E" }}>Prompt Passe 1 (surfaces)</span>
                        <CopyButton text={log.built_prompt_pass1} />
                      </div>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E" }}>Prompt Passe 2 (mobilier)</span>
                        <CopyButton text={log.built_prompt_pass2} />
                      </div>
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

                  {/* Replay button */}
                  {log.success && log.input_image_path && !log.is_replay && (
                    <ReplayButton logId={log.id} styleId={log.style_id} adminPassword={password} onReplayDone={() => {
                      // Refresh logs
                      fetch(`/api/logs?token=${encodeURIComponent(password)}`).then(r => r.json()).then(data => { if (data.logs) setLogs(data.logs); });
                    }} />
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

function ReplayButton({ logId, styleId, adminPassword, onReplayDone }: { logId: number; styleId: string; adminPassword: string; onReplayDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleReplay = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          sourceGenerationId: logId,
          replayPass: "both",
          replayLabel: label || `replay-${styleId}-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Replay #${data.replayId} cree (${(data.durationMs / 1000).toFixed(1)}s)${data.metrics ? ` — diff: ${data.metrics.pixelDiffPct}%` : ""}`);
        onReplayDone();
      } else {
        setResult(`Erreur: ${data.error}`);
      }
    } catch (e) {
      setResult(`Erreur: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 16, padding: "6px 16px", background: "#4a90d9", color: "#fff",
          border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}
      >
        Rejouer avec les prompts actuels
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: 16, background: "#f0f6ff", borderRadius: 8, border: "1px solid #c4d8f0" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E", marginBottom: 8 }}>
        Replay de #{logId} ({styleId})
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (ex: sprint20-fix-lumiere)"
        style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, fontSize: 12, marginBottom: 8, boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleReplay}
          disabled={loading}
          style={{
            padding: "6px 16px", background: loading ? "#999" : "#4a90d9", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Generation en cours..." : "Lancer le replay"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ padding: "6px 12px", background: "#eee", color: "#555", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
        >
          Annuler
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 8, fontSize: 12, color: result.startsWith("Erreur") ? "#c00" : "#3d5a38" }}>
          {result}
        </div>
      )}
    </div>
  );
}
