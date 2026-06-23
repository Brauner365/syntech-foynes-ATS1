import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Navigation from "@/components/Navigation"
import VacancyPipeline from "@/components/VacancyPipeline"
import { differenceInDays } from "date-fns"

export const revalidate = 0

export default async function VacancyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || { id: "", email: "" }
  const { data: profile } = await supabase.schema("foynes").from("profiles").select("*").eq("id", user.id).single()
  if (!profile) redirect("/login")
  const { data: vacancy } = await supabase.schema("foynes").from("vacancies").select("*").eq("id", params.id).single()
  if (!vacancy) notFound()
  const { data: pipelineRaw } = await supabase.schema("foynes").from("pipeline")
    .select("*, candidate:candidates(*)").eq("vacancy_id", params.id).order("created_at", { ascending: false })
  const { data: comments } = await supabase.schema("foynes").from("pipeline_comments").select("*").order("created_at", { ascending: true })
  const daysOpen = differenceInDays(new Date(), new Date(vacancy.opened_date))
  const pct = Math.min(100, Math.round((vacancy.filled / vacancy.quantity) * 100))

  return (
    <>
      <Navigation profile={profile} />
      <main style={{ padding:"40px 32px", maxWidth:1480, margin:"0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize:12, color:"var(--steel)", marginBottom:24, display:"flex", alignItems:"center", gap:8 }}>
          <a href="/vacancies" style={{ color:"var(--steel)", textDecoration:"none" }}>Vacancies</a>
          <span>›</span>
          <span style={{ color:"var(--navy)", fontWeight:500 }}>{vacancy.job_ref} · {vacancy.title}</span>
        </div>

        {/* Vacancy header */}
        <div className="card" style={{ padding:"24px 28px", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy)", margin:0 }}>×{vacancy.quantity} {vacancy.title}</h1>
                <span style={{ fontSize:10, padding:"3px 10px", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
                  background:"rgba(46,138,79,0.1)", color:"var(--green)", border:"1px solid rgba(46,138,79,0.2)" }}>
                  {vacancy.status}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:20, fontSize:13, color:"var(--steel)", flexWrap:"wrap" }}>
                <span>📍 {vacancy.location}</span>
                <span className="mono" style={{ fontSize:12 }}>🔖 {vacancy.job_ref}</span>
                <span>👤 {vacancy.recruiter}</span>
                <span>🏢 {vacancy.client_contact}</span>
                <span>📅 Opened {new Date(vacancy.opened_date).toLocaleDateString("en-IE",{day:"numeric",month:"short",year:"numeric"})}</span>
                <span>⏱ {daysOpen} days open</span>
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:32, fontWeight:700, color:"var(--navy)", fontFamily:"JetBrains Mono,monospace" }}>{vacancy.filled}/{vacancy.quantity}</div>
              <div style={{ fontSize:11, color:"var(--steel)", marginBottom:6 }}>placed</div>
              <div style={{ width:120, height:6, background:"var(--mist)", borderRadius:3 }}>
                <div style={{ height:"100%", background:"var(--green)", width:`${pct}%`, borderRadius:3 }} />
              </div>
              <div style={{ fontSize:11, color:"var(--steel)", marginTop:4 }}>{pct}% filled</div>
            </div>
          </div>
          {vacancy.notes && (
            <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(232,155,46,0.08)", borderLeft:"3px solid var(--amber)", fontSize:13, color:"var(--navy)" }}>
              📝 {vacancy.notes}
            </div>
          )}
        </div>

        <VacancyPipeline
          vacancy={vacancy}
          pipeline={pipelineRaw || []}
          comments={comments || []}
          profile={profile}
        />
      </main>
    </>
  )
}
