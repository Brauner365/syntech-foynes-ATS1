"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import Link from "next/link"
import { getToken, getUser, supaFetch, signOut } from "@/lib/auth"

export default function VacanciesPage() {
  const [profile, setProfile] = useState<any>(null)
  const [vacancies, setVacancies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setTimeout(async () => {
      const token = getToken()
      if (!token) { router.push("/login"); return }
      const user = await getUser(token)
      if (!user.email) { router.push("/login"); return }
      setProfile({ full_name: user.email.split("@")[0], role: "recruiter" as const, email: user.email, id: user.id, is_active: true, created_at: "" })
      const v = await supaFetch("vacancies?select=*&order=status,opened_date.desc", token)
      setVacancies(Array.isArray(v) ? v : [])
      setLoading(false)
    }, 300)
  }, [])

  if (loading) return <div style={{ padding:40, textAlign:"center" as const, color:"var(--steel)" }}>Loading...</div>
  if (!profile) return null

  const active = vacancies.filter(v => v.status === "active")
  const other = vacancies.filter(v => v.status !== "active")

  return (
    <>
      <Navigation profile={profile} />
      <main style={{ padding:"40px 32px", maxWidth:1480, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
          <div>
            <div className="section-mark">Live data</div>
            <h2 style={{ fontSize:26, fontWeight:700, color:"var(--navy)" }}>Vacancies</h2>
          </div>
          <span style={{ fontSize:13, color:"var(--steel)" }}>{active.length} active · {vacancies.reduce((s,v)=>s+v.quantity,0)} total heads</span>
        </div>
        <div className="card" style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"var(--paper)", borderBottom:"1px solid var(--line)" }}>
                {["Ref","Role","Location","Heads","Filled","Status","Days Open",""].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left" as const, fontSize:10, fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase" as const, color:"var(--steel)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...active,...other].map(v=>{
                const daysOpen = Math.floor((Date.now()-new Date(v.opened_date).getTime())/86400000)
                const pct = Math.min(100,Math.round(((v.filled||0)/(v.quantity||1))*100))
                const statusCol: Record<string,string> = {active:"var(--green)",paused:"var(--amber)",filled:"var(--navy)",cancelled:"var(--red)"}
                return (
                  <tr key={v.id} style={{ borderBottom:"1px solid var(--line-soft)" }}>
                    <td style={{ padding:"12px 16px", color:"var(--steel)" }}><span className="mono" style={{ fontSize:11 }}>{v.job_ref}</span></td>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:"var(--navy)" }}>x{v.quantity} {v.title}</td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)" }}>{v.location}</td>
                    <td style={{ padding:"12px 16px", textAlign:"center" as const }}>{v.quantity}</td>
                    <td style={{ padding:"12px 16px", textAlign:"center" as const }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                        <span style={{ fontWeight:700, color:"var(--navy)" }}>{v.filled||0}</span>
                        <div style={{ width:40, height:4, background:"var(--mist)", borderRadius:2 }}>
                          <div style={{ height:"100%", background:"var(--green)", width:`${pct}%`, borderRadius:2 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:10, fontWeight:600, textTransform:"uppercase" as const, color:statusCol[v.status]||"var(--steel)" }}>{v.status}</span>
                    </td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)", textAlign:"center" as const }}>{daysOpen}d</td>
                    <td style={{ padding:"12px 16px" }}>
                      <Link href={`/vacancies/${v.id}`} style={{ fontSize:11, color:"var(--red)", fontWeight:600, textDecoration:"none" }}>View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
