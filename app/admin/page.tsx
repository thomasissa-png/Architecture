"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";

interface LogEntry {
  id: number;
  created_at: string;
  ip: string | null;
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
      <div className="text-center flex-auto min-w-[150px] max-w-[300px]">
        <div className="text-[11px] text-foreground/50 mb-1">{label}</div>
        <div className="max-w-[300px] h-[180px] rounded-lg border border-foreground/10 bg-foreground/[0.03] flex flex-col items-center justify-center gap-1 text-[13px] text-foreground/40 italic">
          <span>{errorInfo}</span>
          <span className="text-[10px] text-foreground/20">{extractFilename(path)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center flex-auto min-w-[150px] max-w-[300px]">
      <div className="text-[11px] text-foreground/50 mb-1">{label}</div>
      <img
        src={src}
        alt={label}
        onError={() => handleError()}
        onClick={() => window.open(src, "_blank")}
        className="max-w-[300px] w-full h-auto max-h-[250px] object-contain rounded-lg border border-foreground/10 cursor-pointer hover:opacity-90 transition-opacity"
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
      className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1 ${
        copied ? "bg-sage text-white" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
      }`}
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
    const params = new URLSearchParams();
    if (versionFilter) params.set("version", versionFilter);
    const logsUrl = params.toString() ? `/api/logs?${params.toString()}` : "/api/logs";
    fetch(logsUrl, {
      headers: { Authorization: `Bearer ${password}` },
    })
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

  // Fetch users when tab switches to "users"
  useEffect(() => {
    if (activeTab !== "users" || !authenticated) return;
    if (users.length > 0) return; // already loaded
    setUsersLoading(true);
    setUsersError(null);
    fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${password}` },
    })
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

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen font-[Inter,sans-serif] bg-background">
        <form onSubmit={handleLogin} className="bg-white px-12 py-10 rounded-2xl border border-foreground/10 text-center max-w-[360px] w-full">
          <h1 className="text-xl font-semibold text-foreground mb-2">Versimo Admin</h1>
          <p className="text-[13px] text-foreground/50 mb-6">Accès restreint</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
            placeholder="Mot de passe"
            autoFocus
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none mb-4 focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1 ${authError ? "border-red-600" : "border-foreground/15"}`}
          />
          {authError && <p className="text-xs text-red-600 mb-3">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-foreground text-white rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
          >
            Connexion
          </button>
        </form>
      </div>
    );
  }

  const showEmptyGenerations = !loading && !error && logs.length === 0 && activeTab === "generations";

  const auditPromptText = `Fais appel aux agents Architecte d'Intérieur (Yann Duval), Expert IA Image (Lucas Moreau) et Paysagiste (Camille Verdier, pour les générations outdoor) pour auditer les générations récentes de production.

Méthode d'accès aux données de production :
- Utilise WebFetch sur https://versimo.fr/api/logs?token=allezpsg pour récupérer TOUS les logs (style, durée, succès, prompts construits, chemins images)
- Pour les images : télécharge-les avec curl dans /tmp/audit-images/ :
  curl -s -o /tmp/audit-images/{id}_{type}.jpg "https://versimo.fr/api/logs/image?path={image_path}&token=allezpsg"
  (image_path = input_image_path, pass1_image_path, output_image_path de chaque log)
- Puis lis les images avec Read tool pour les analyser visuellement (Read supporte les images JPG/PNG)
- IMPORTANT : découpe l'audit en batches de 6 générations max par agent pour éviter les timeouts

Workflow d'audit :
1. Récupère les logs via l'API production (WebFetch sur /api/logs?token=allezpsg)
2. Identifie les générations NOUVELLES depuis le dernier audit (voir docs/reviews/audit-visuel-* pour le dernier batch audité)
3. Télécharge TOUTES les images (input, pass1, output) dans /tmp/audit-images/
4. Pour chaque génération, examine visuellement avec Read :
   - Les images INPUT, PASSE 1 et OUTPUT
   - Le prompt construit passe 1 (built_prompt_pass1) et passe 2 (built_prompt_pass2)
   - Le style utilisé, la durée par passe, le modèle utilisé
5. Yann évalue (grille 10 critères, fidélité et crédibilité comptent double) : fidélité stylistique, vocabulaire visuel, hero pièces, cohérence matières, éclairage, crédibilité pro, complétude, différenciation, adaptabilité spatiale, potentiel photoréaliste
6. Lucas évalue (grille 10 critères, préservation et rendu comptent double) : préservation architecturale, contraintes lumière, vocabulaire photo, structure prompt, negative prompting, compatibilité multi-modèles, cohérence I/O, richesse descriptive, adaptabilité conditions variables, rendu final crédible
7. Camille évalue les générations outdoor (grille 10 critères) : fidélité style paysager, vocabulaire végétal, mobilier outdoor, matériaux extérieurs, éclairage naturel, crédibilité pro, complétude, différenciation, intégration environnement, potentiel photoréaliste
8. Note /10 par génération + classement comparatif
9. Patterns récurrents (problèmes communs à plusieurs générations)
10. Plan d'amélioration prioritaire (P0-P4) avec corrections concrètes de prompts/paramètres

Demande type : "Fais appel aux agents Architecte d'Intérieur, Expert IA Image et Paysagiste pour auditer toutes les générations depuis le dernier audit. Télécharge les images dans /tmp/audit-images/ et analyse-les visuellement. Donne la note de chaque génération, identifie les patterns récurrents, et propose un plan d'amélioration prioritaire."`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header identique au reste du site */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm">
            Versimo
          </a>
          <span className="text-xs text-muted font-light">Administration</span>
        </div>
      </header>

      <div className="pt-20 px-5 sm:px-8 max-w-6xl mx-auto pb-10">

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-foreground/10">
        <button
          onClick={() => setActiveTab("generations")}
          className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1 ${
            activeTab === "generations"
              ? "border-b-2 border-foreground -mb-px text-foreground"
              : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
          }`}
        >
          Générations ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1 ${
            activeTab === "users"
              ? "border-b-2 border-foreground -mb-px text-foreground"
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
            <p className="text-foreground/50 text-sm">Aucun utilisateur enregistré.</p>
          )}
          {!usersLoading && users.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-foreground/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-foreground/[0.03] text-left text-foreground/60 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Visuels</th>
                    <th className="px-4 py-3 font-medium text-right">Générations</th>
                    <th className="px-4 py-3 font-medium text-right">Achats</th>
                    <th className="px-4 py-3 font-medium text-right">Dépensé</th>
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
                        {u.total_spent_cents > 0 ? `${(u.total_spent_cents / 100).toFixed(2)} €` : "—"}
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

      {loading && (
        <div className="py-16 text-center text-foreground/60 text-sm">Chargement...</div>
      )}
      {!loading && error && (
        <div className="py-16 text-center text-red-600 text-sm">Erreur : {error}</div>
      )}
      {showEmptyGenerations && (
        <div className="py-16 text-center text-foreground/60 text-sm">Aucune génération loguée.</div>
      )}

      {!loading && !error && logs.length > 0 && (<>
      {/* Audit prompt banner */}
      <div className="mb-5 bg-sage/10 border border-sage/30 rounded-xl overflow-hidden">
        <div
          onClick={() => setShowAuditPrompt(!showAuditPrompt)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowAuditPrompt(!showAuditPrompt); } }}
          className="flex items-center gap-2.5 px-4 py-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
        >
          <span className="text-base">&#x1f9d1;&#x200d;&#x1f3a8;</span>
          <span className="text-[13px] font-semibold text-sage">
            Prompt d&apos;audit agents (Yann Duval + Lucas Moreau + Camille Verdier)
          </span>
          <span className="ml-auto text-xs text-sage">
            {showAuditPrompt ? "Masquer" : "Copier le prompt pour lancer un audit"}
          </span>
        </div>
        {showAuditPrompt && (
          <div className="px-4 pb-4">
            <pre className="bg-white p-4 rounded-lg text-xs whitespace-pre-wrap break-words leading-relaxed border border-sage/20 text-foreground max-h-[400px] overflow-auto">
              {auditPromptText}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(auditPromptText); }}
              className="mt-2 px-4 py-1.5 bg-sage text-white rounded-md text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
            >
              Copier dans le presse-papier
            </button>
          </div>
        )}
      </div>

      {/* Storage diagnostic */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={async () => {
            setStorageChecking(true);
            try {
              const res = await fetch("/api/logs/storage-check", {
                headers: { Authorization: `Bearer ${password}` },
              });
              const data = await res.json();
              setStorageStatus({ checked: true, ok: data.status === "ok", detail: data.detail || data.message });
            } catch (err) {
              setStorageStatus({ checked: true, ok: false, detail: err instanceof Error ? err.message : "Fetch failed" });
            } finally {
              setStorageChecking(false);
            }
          }}
          disabled={storageChecking}
          className={`px-4 py-1.5 bg-foreground text-white rounded-md text-xs font-medium cursor-pointer transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1 ${storageChecking ? "opacity-60 cursor-wait" : "hover:opacity-90"}`}
        >
          {storageChecking ? "Test en cours..." : "Tester Object Storage"}
        </button>
        {storageStatus.checked && (
          <span className={`text-xs ${storageStatus.ok ? "text-sage" : "text-red-600"}`}>
            {storageStatus.ok ? "OK" : `Erreur : ${storageStatus.detail}`}
          </span>
        )}
      </div>

      {/* Version filter */}
      {availableVersions.length > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <label className="text-[13px] font-medium text-foreground/60">Filtrer par version de prompt :</label>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="px-3 py-1.5 border border-foreground/15 rounded-md text-[13px] text-foreground bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
          >
            <option value="">Toutes les versions</option>
            {availableVersions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {versionFilter && (
            <span className="text-xs text-foreground/50">
              {logs.length} génération{logs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {logs.map((log) => {
          const expanded = expandedId === log.id;
          const date = new Date(log.created_at);
          const timeStr = date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR");

          return (
            <div
              key={log.id}
              className={`border rounded-xl overflow-hidden ${log.success ? "border-foreground/10 bg-white" : "border-red-200 bg-red-50/50"}`}
            >
              {/* Header row */}
              <div
                onClick={() => setExpandedId(expanded ? null : log.id)}
                className="flex items-center gap-4 px-5 py-3 cursor-pointer flex-wrap"
              >
                <span className="text-[13px] font-bold text-foreground min-w-[40px]">#{log.id}</span>
                {log.ip && <span className="text-[11px] text-muted/50 font-light">{log.ip}</span>}
                <span className="text-[13px] text-foreground/50 min-w-[150px]">{timeStr}</span>
                <span className="bg-sage text-white px-2.5 py-0.5 rounded-md text-[13px] font-medium">
                  {log.style_id || "custom"}
                </span>
                {log.is_iteration && (
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[11px] font-semibold">
                    ITÉRATION{log.iteration_number ? ` #${log.iteration_number}` : ""}
                  </span>
                )}
                <span className={`text-white px-2 py-0.5 rounded-md text-[11px] font-semibold ${log.prompt_version ? "bg-blue-600/70" : "bg-foreground/20"}`}>
                  {log.prompt_version || "—"}
                </span>
                <span className="text-[13px] text-foreground/60">
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "—"}
                  {log.pass1_duration_ms && log.pass2_duration_ms
                    ? ` (P1: ${(log.pass1_duration_ms / 1000).toFixed(1)}s + P2: ${(log.pass2_duration_ms / 1000).toFixed(1)}s)`
                    : ""}
                </span>
                <span className="text-[13px] text-foreground/60">
                  {log.input_width}x{log.input_height}
                </span>
                <span className={`text-[13px] font-semibold ${log.success ? "text-sage" : "text-red-600"}`}>
                  {log.success ? "OK" : "ERREUR"}
                </span>
                {log.is_replay && (
                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded-md text-[11px] font-semibold">
                    REPLAY{log.replay_source_id ? ` de #${log.replay_source_id}` : ""}
                  </span>
                )}
                {log.replay_label && (
                  <span className="bg-foreground/5 text-foreground/60 px-2 py-0.5 rounded-md text-[11px]">
                    {log.replay_label}
                  </span>
                )}
                {log.pixel_diff_pct != null && (
                  <span className="text-[11px] text-foreground/50">
                    diff: {log.pixel_diff_pct}% | color: {log.color_shift_score?.toFixed(1)}
                  </span>
                )}
                <span className="ml-auto text-xs text-foreground/30">{expanded ? "▲" : "▼"}</span>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="px-5 pb-5 border-t border-foreground/5">
                  {/* Images */}
                  <div className="flex gap-3 mt-4 flex-wrap">
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
                      <div className="text-[13px] text-foreground/40 italic">Aucune image sauvegardée</div>
                    )}
                  </div>

                  {/* Models */}
                  <div className="mt-4 text-[13px] text-foreground/60">
                    <strong>Modèles :</strong> P1: {log.pass1_model || "—"} / P2: {log.pass2_model || "—"}
                  </div>

                  {/* Error */}
                  {log.error_message && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg text-[13px] text-red-600">
                      {log.error_message}
                    </div>
                  )}

                  {/* User comment (iterations) */}
                  {log.user_comment_raw && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-xs font-semibold text-foreground mb-1">Commentaire utilisateur</div>
                      <div className="text-[13px] text-foreground/60">{log.user_comment_raw}</div>
                    </div>
                  )}

                  {/* Session ID */}
                  {log.session_id && (
                    <div className="mt-2 text-[11px] text-foreground/30">
                      Session : {log.session_id}
                    </div>
                  )}

                  {log.built_prompt_pass1 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">Prompt Passe 1 (surfaces)</span>
                        <CopyButton text={log.built_prompt_pass1} />
                      </div>
                      <pre className="bg-foreground/[0.03] p-3 rounded-lg text-xs whitespace-pre-wrap break-words max-h-[200px] overflow-auto">
                        {log.built_prompt_pass1}
                      </pre>
                    </div>
                  )}
                  {log.built_prompt_pass2 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">Prompt Passe 2 (mobilier)</span>
                        <CopyButton text={log.built_prompt_pass2} />
                      </div>
                      <pre className="bg-foreground/[0.03] p-3 rounded-lg text-xs whitespace-pre-wrap break-words max-h-[200px] overflow-auto">
                        {log.built_prompt_pass2}
                      </pre>
                    </div>
                  )}

                  {/* Replay button */}
                  {log.success && log.input_image_path && !log.is_replay && (
                    <ReplayButton logId={log.id} styleId={log.style_id} adminPassword={password} onReplayDone={() => {
                      // Refresh logs
                      fetch("/api/logs", { headers: { Authorization: `Bearer ${password}` } }).then(r => r.json()).then(data => { if (data.logs) setLogs(data.logs); });
                    }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      </>)}

      </>)}

      </div>{/* ferme le container pt-20 */}
      <Footer currentPage="/admin" />
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
        setResult(`Replay #${data.replayId} créé (${(data.durationMs / 1000).toFixed(1)}s)${data.metrics ? ` — diff: ${data.metrics.pixelDiffPct}%` : ""}`);
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
        className="mt-4 px-4 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
      >
        Rejouer avec les prompts actuels
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-[13px] font-semibold text-foreground mb-2">
        Replay de #{logId} ({styleId})
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (ex: sprint20-fix-lumiere)"
        className="w-full px-2.5 py-1.5 border border-foreground/15 rounded-md text-xs mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
      />
      <div className="flex gap-2">
        <button
          onClick={handleReplay}
          disabled={loading}
          className={`px-4 py-1.5 text-white rounded-md text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1 ${loading ? "bg-foreground/40 cursor-wait" : "bg-blue-500 cursor-pointer hover:opacity-90"}`}
        >
          {loading ? "Génération en cours..." : "Lancer le replay"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 bg-foreground/5 text-foreground/60 rounded-md text-xs cursor-pointer hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1"
        >
          Annuler
        </button>
      </div>
      {result && (
        <div className={`mt-2 text-xs ${result.startsWith("Erreur") ? "text-red-600" : "text-sage"}`}>
          {result}
        </div>
      )}
    </div>
  );
}
