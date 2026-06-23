"use client"
import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { STAGE_CONFIG, type PipelineStage, type PipelineEntry, type PipelineComment, type Profile, type Vacancy } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

const KANBAN_STAGES: PipelineStage[] = ["submitted","reviewing","interview","offer","placed","rejected"]
const COL_COLORS: Record<string, string> = {
  submitted:"var(--blue)", reviewing:"var(--amber)", interview:"var(--navy-soft)",
  offer:"#E89B2E", placed:"var(--green)", rejected:"var(--red)"
}

interface Props {
  vacancy: Vacancy
  pipeline: (PipelineEntry & { candidate: any })[]
  comments: PipelineComment[]
  profile: Profile
}

export default function VacancyPipeline({ vacancy, pipeline, comments, profile }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<(PipelineEntry & { candidate: any }) | null>(null)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [pendingStage, setPendingStage] = useState<PipelineStage | null>(null)
  const [stageNotes, setStageNotes] = useState("")
  const [moving, setMoving] = useState(false)
  const supabase = createClient()

  const clientAllowed: PipelineStage[] = ["interview","rejected","placed"]
  const canMove = (s: PipelineStage) => profile.role === "recruiter" || clientAllowed.includes(s)

  function entryComments(id: string) { return comments.filter(c => c.pipeline_id === id) }

  function showToast(title: string, msg: string, type = "success") {
    const stack = document.getElementById("toast-stack")
    if (!stack) return
    const t = document.createElement("div")
    t.className = `toast ${type}`
    t.innerHTML = `<div class="toast-icon">${type==="success"?"✓":type==="error"?"⚠":"ℹ"}</div><div class="toast-msg"><strong>${title}</strong><span>${msg}</span></div>`
    stack.appendChild(t)
    setTimeout(() => { t.style.opacity="0"; t.style.transform="translateX(20px)"; setTimeout(()=>t.remove(),300) }, 3500)
  }

  async function moveStage() {
    if (!selected || !pendingStage) return
    setMoving(true)
    const { error } = await supabase.schema("foynes").from("pipeline")
      .update({ stage: pendingStage, stage_notes: stageNotes || null, stage_updated_at: new Date().toISOString(), moved_by: profile.id })
      .eq("id", selected.id)
    if (!error) {
      await supabase.schema("foynes").from("activity_log").insert({
        user_id: profile.id, user_name: profile.full_name,
        action: `moved ${selected.candidate.first_name} ${selected.candidate.last_name} to ${STAGE_CONFIG[pendingStage].label}`,
        entity_type: "pipeline", entity_id: selected.id,
        metadata: { vacancy_id: vacancy.id, from: selected.stage, to: pendingStage }
      })
      await fetch("/api/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type:"stage_change", candidate:selected.candidate, vacancy, stage:pendingStage, actor:profile.full_name, notes:stageNotes })
      })
      showToast("Stage updated", `${selected.candidate.first_name} → ${STAGE_CONFIG[pendingStage].label}`)
    } else {
      showToast("Error", error.message, "error")
    }
    setMoving(false); setPendingStage(null); setStageNotes(""); setSelected(null)
    startTransition(() => router.refresh())
  }

  async function addComment() {
    if (!selected || !comment.trim()) return
    setSubmitting(true)
    await supabase.schema("foynes").from("pipeline_comments").insert({
      pipeline_id: selected.id, author_id: profile.id,
      author_name: profile.full_name, author_role: profile.role, comment: comment.trim()
    })
    showToast("Comment sent", profile.role === "client" ? "Syntech notified" : "Brendan O'Connor notified")
    setComment(""); setSubmitting(false)
    startTransition(() => router.refresh())
  }

  const byStage = KANBAN_STAGES.reduce((acc, s) => {
    acc[s] = pipeline.filter(p => p.stage === s); return acc
  }, {} as Record<PipelineStage, typeof pipeline>)

  const initials = (c: any) => `${c.first_name?.[0]||""}${c.last_name?.[0]||""}`.toUpperCase()
  const avColors = ["var(--navy)","var(--red)","var(--blue)","var(--green)","var(--amber)","var(--navy-soft)"]
  const avColor = (id: string) => avColors[id.charCodeAt(0) % avColors.length]

  return (
    <div>
      {/* Kanban */}
      <div className="kanban-wrap card" style={{ marginBottom:28 }}>
        <div className="board-head">
          <div className="board-title">
            Pipeline Board
            <span className="board-badge">{vacancy.job_ref} · ×{vacancy.quantity} {vacancy.title} · {vacancy.location}</span>
          </div>
          {profile.role === "recruiter" && (
            <div className="board-controls">
              <button className="ctl active">All roles</button>
              <button className="ctl">{vacancy.location}</button>
            </div>
          )}
        </div>
        <div className="kanban">
          {KANBAN_STAGES.map(stage => (
            <div key={stage} className="kcol">
              <div className="kcol-head">
                <span>{STAGE_CONFIG[stage].label}</span>
                <span className="knum">{byStage[stage]?.length || 0}</span>
              </div>
              {(byStage[stage] || []).map(entry => (
                <div key={entry.id}
                  className={`kcard ${stage === "placed" ? "placed" : stage === "interview" ? "interview" : stage === "submitted" ? "submitted" : ""}`}
                  onClick={() => setSelected(entry)}>
                  <div className="kcard-name">{entry.candidate.first_name} {entry.candidate.last_name}</div>
                  <div className="kcard-meta">
                    {entry.candidate.trade || "—"}
                    {entry.candidate.location ? ` · ${entry.candidate.location}` : ""}
                  </div>
                  {entry.candidate.certifications?.length > 0 && (
                    <div className="kcard-chips">
                      {entry.candidate.certifications.slice(0,3).map((c:string) => (
                        <span key={c} className="kchip">{c}</span>
                      ))}
                    </div>
                  )}
                  {entryComments(entry.id).length > 0 && (
                    <div style={{ marginTop:5, fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                      💬 {entryComments(entry.id).length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Candidate detail panel (slide-in from right) */}
      {selected && (
        <div className="modal-backdrop show" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth:540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">{selected.candidate.first_name} {selected.candidate.last_name}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding:0 }}>

              {/* Candidate info */}
              <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--line-soft)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                  <div className="ccard-av" style={{ background: avColor(selected.candidate.id), width:48, height:48, fontSize:17 }}>
                    {initials(selected.candidate)}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16, color:"var(--navy)" }}>
                      {selected.candidate.first_name} {selected.candidate.last_name}
                    </div>
                    <div style={{ fontSize:12, color:"var(--steel)", marginTop:2 }}>
                      <span style={{ background:"var(--paper)", border:"1px solid var(--line)", padding:"1px 7px", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                        {STAGE_CONFIG[selected.stage].label}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 20px", fontSize:13 }}>
                  {selected.candidate.phone && <div><span style={{color:"var(--steel)",fontSize:11}}>Phone</span><div style={{fontWeight:500}}>{selected.candidate.phone}</div></div>}
                  {selected.candidate.email && <div><span style={{color:"var(--steel)",fontSize:11}}>Email</span><div style={{fontWeight:500,fontSize:12}}>{selected.candidate.email}</div></div>}
                  {selected.candidate.location && <div><span style={{color:"var(--steel)",fontSize:11}}>Based</span><div style={{fontWeight:500}}>{selected.candidate.location}</div></div>}
                  {selected.candidate.nationality && <div><span style={{color:"var(--steel)",fontSize:11}}>Nationality</span><div style={{fontWeight:500}}>{selected.candidate.nationality}</div></div>}
                  {selected.candidate.trade && <div><span style={{color:"var(--steel)",fontSize:11}}>Trade</span><div style={{fontWeight:500}}>{selected.candidate.trade}</div></div>}
                  <div><span style={{color:"var(--steel)",fontSize:11}}>RTW Ireland</span><div style={{fontWeight:600,color:selected.candidate.right_to_work?"var(--green)":"var(--amber)"}}>{selected.candidate.right_to_work?"✓ Confirmed":"⚠ TBC"}</div></div>
                </div>
                {selected.candidate.certifications?.length > 0 && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--steel)", fontWeight:600, marginBottom:6 }}>Certifications</div>
                    <div>{selected.candidate.certifications.map((c:string) => (
                      <span key={c} className="badge-chip">{c}</span>
                    ))}</div>
                  </div>
                )}
                {selected.candidate.cv_url && (
                  <a href={selected.candidate.cv_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:12, padding:"8px 16px", background:"var(--navy)", color:"white", fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none" }}>
                    📄 View CV — {selected.candidate.cv_filename || "CV"}
                  </a>
                )}
                {selected.candidate.notes && (
                  <div style={{ marginTop:12, padding:12, background:"var(--paper)", border:"1px solid var(--line-soft)", fontSize:13, color:"var(--steel)", lineHeight:1.6 }}>
                    {selected.candidate.notes}
                  </div>
                )}
              </div>

              {/* Move stage */}
              <div style={{ padding:"16px 24px", borderBottom:"1px solid var(--line-soft)" }}>
                <div style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--steel)", fontWeight:600, marginBottom:10 }}>Move stage</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {KANBAN_STAGES.filter(s => s !== selected.stage && canMove(s)).map(s => (
                    <button key={s} onClick={() => setPendingStage(s)}
                      style={{ padding:"6px 13px", border:`1px solid ${COL_COLORS[s]}`, background:"transparent",
                        color:COL_COLORS[s], fontSize:11, fontWeight:600, letterSpacing:"0.08em",
                        textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>
                      → {STAGE_CONFIG[s].label}
                    </button>
                  ))}
                </div>
                {profile.role === "client" && (
                  <p style={{ fontSize:11, color:"var(--steel)", marginTop:8 }}>
                    You can move to Interview, Placed, or Rejected.
                  </p>
                )}
              </div>

              {/* Comments */}
              <div style={{ padding:"16px 24px" }}>
                <div style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--steel)", fontWeight:600, marginBottom:12 }}>
                  Comments {entryComments(selected.id).length > 0 && `(${entryComments(selected.id).length})`}
                </div>
                {entryComments(selected.id).length === 0 && (
                  <div style={{ fontSize:13, color:"var(--steel)", fontStyle:"italic", marginBottom:14 }}>
                    No comments yet. Ask a question or add a note below.
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {entryComments(selected.id).map(c => (
                    <div key={c.id} style={{
                      padding:"11px 14px", borderLeft:`3px solid ${c.author_role==="client"?"var(--blue)":"var(--navy)"}`,
                      background:c.author_role==="client"?"rgba(30,111,183,0.06)":"rgba(14,42,71,0.04)",
                      fontSize:13
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontWeight:600, color:"var(--navy)" }}>{c.author_name}</span>
                        <span style={{ fontSize:11, color:"var(--steel)" }}>
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p style={{ color:"var(--navy)", lineHeight:1.5, margin:0 }}>{c.comment}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && !e.shiftKey && addComment()}
                    className="input" style={{ flex:1, fontSize:13 }}
                    placeholder={profile.role === "client" ? "Ask Syntech a question…" : "Add a note or update…"} />
                  <button onClick={addComment} disabled={!comment.trim() || submitting}
                    className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }}>
                    {submitting ? "…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage move confirmation */}
      {pendingStage && selected && (
        <div className="modal-backdrop show" onClick={() => { setPendingStage(null); setStageNotes("") }}>
          <div className="modal" style={{ maxWidth:460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-title">Move to {STAGE_CONFIG[pendingStage].label}</span>
              <button className="modal-close" onClick={() => { setPendingStage(null); setStageNotes("") }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color:"var(--steel)", marginBottom:16, fontSize:13 }}>
                <strong style={{ color:"var(--navy)" }}>{selected.candidate.first_name} {selected.candidate.last_name}</strong>
                {" "}→ <strong style={{ color:COL_COLORS[pendingStage] }}>{STAGE_CONFIG[pendingStage].label}</strong>
              </p>
              <div className="modal-field">
                <label>{pendingStage==="interview"?"Interview details":pendingStage==="rejected"?"Reason (optional)":pendingStage==="placed"?"Start date / rate":"Notes (optional)"}</label>
                <textarea value={stageNotes} onChange={e => setStageNotes(e.target.value)}
                  placeholder={
                    pendingStage==="interview"?"Date, time, format, site…":
                    pendingStage==="rejected"?"Reason for rejection…":
                    pendingStage==="placed"?"Start date, rate agreed, site confirmed…":"Add any notes…"
                  } />
              </div>
              <div className="modal-actions">
                <button onClick={() => { setPendingStage(null); setStageNotes("") }} className="btn btn-secondary">Cancel</button>
                <button onClick={moveStage} disabled={moving} className="btn btn-primary"
                  style={{ background: pendingStage==="rejected"?"var(--red)": pendingStage==="placed"?"var(--green)":undefined }}>
                  {moving ? "Moving…" : `Confirm — ${STAGE_CONFIG[pendingStage].label}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
