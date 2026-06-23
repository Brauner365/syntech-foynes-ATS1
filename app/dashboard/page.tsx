"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import Link from "next/link"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function supaFetch(path: string, token: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  })
  return r.json()
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    // Try localStorage keys that Supabase uses
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes("auth-token")) {
        const val = JSON.parse(localStorage.getItem(key) || "{}")
        return val.access_token || null
      }
    }
    // Also try the standard Supabase key format
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const val = JSON.parse(localStorage.getItem(key) || "{}")
        return val.access_token || null
      }
    }
  } catch {}
  return null
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [vacs, setVacs] = useState<any[]>([])
  const [pip, setPip] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Give Supabase client a moment to write to localStorage
    setTimeout(async () => {
      const token = getToken()
      if (!token) {
        // Try one more time after a bit longer
        setTimeout(async () => {
          const token2 = getToken()
          if (!token2) { router.push("/login"); return }
          await loadData(token2)
        }, 1500)
        return
      }
      await loadData(token)
    }, 500)
  }, [])

  async function loadData(token: string) {
    try {
      // Get user info
      const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
      })
      const user = await userResp.json()
      if (!user.email) { router.push("/login"); return }
      
      setProfile({ 
        full_name: user.email.split("@")[0], 
        role: "recruiter" as const, 
        email: user.email, 
        id: user.id, 
        is_active: true, 
        created_at: "" 
      })

      const [v, p] = await Promise.all([
        supaFetch(`vacancies?select=*&order=opened_date.desc`, token),
        supaFetch(`pipeline?select=stage,vacancy_id,created_at`, token)
      ])
      
      setVacs(Array.isArray(v) ? v : [])
      setPip(Array.isArray(p) ? p : [])
      setLoading(false)
    } catch(e) {
      setError("Failed to load data")
      setLoading(false)
    }
  }

  async function signOut() {
    try {
      const token = getToken()
      if (token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
        })
      }
      localStorage.clear()
    } catch {}
    router.push("/login")
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bone)" }}>
      <div style={{ textAlign:"center" as const }}>
        <div style={{ width:32, height:32, border:"3px solid var(--line)", borderTop:"3px solid var(--navy)", borderRadius:"50%", margin:"0 auto 16px", animation:"spin 0.8s linear infinite" }} />
        <div style={{ fontSize:13, color:"var(--steel)" }}>Loading dashboard...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!profile) return null

  const totalHeads = vacs.reduce((s, v) => s + (v.quantity || 0), 0)
  const totalFilled = vacs.reduce((s, v) => s + (v.filled || 0), 0)
  const fillRate = totalHeads > 0 ? Math.round((totalFilled / totalHeads) * 100) : 0
  const vacCounts: Record<number, number> = {}
  pip.forEach(p => { vacCounts[p.vacancy_id] = (vacCounts[p.vacancy_id] || 0) + 1 })
  const activeVacs = vacs.filter(v => v.status === "active")
  const atInterview = pip.filter(p => p.stage === "interview" || p.stage === "offer").length

  const navProfile = { ...profile, signOut }

  return (
    <>
      <Navigation profile={profile} />
      <main style={{ padding:"40px 32px", maxWidth:1480, margin:"0 auto" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"var(--steel)", fontWeight:600, marginBottom:4 }}>Welcome back</div>
          <h2 style={{ fontSize:26, fontWeight:700, color:"var(--navy)", letterSpacing:"-0.02em" }}>{profile.full_name}</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, border:"1px solid var(--line)", marginBottom:32, background:"var(--line)" }}>
          {[
            { label:"Active roles", val:activeVacs.length, sub:`${totalHeads} total heads` },
            { label:"CVs in pipeline", val:pip.length, sub:`${pip.filter(p=>p.stage==="submitted").length} newly submitted` },
            { label:"At interview", val:atInterview, sub:`${pip.filter(p=>p.stage==="offer").length} at offer stage` },
            { label:"Fill rate", val:`${fillRate}%`, sub:`${totalFilled} of ${totalHeads} placed` },
          ].map((t,i) => (
            <div key={i} className="stat-tile">
              <div className="stat-label">{t.label}</div>
              <div className="stat-val">{t.val}</div>
              <div className="stat-delta">{t.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:28 }}>
          <div className="card">
            <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:600, fontSize:13, color:"var(--navy)" }}>Active Roles</span>
              <Link href="/vacancies" style={{ fontSize:11, color:"var(--red)", fontWeight:600, textDecoration:"none", textTransform:"uppercase" as const }}>View all</Link>
            </div>
            {activeVacs.length === 0 && <div style={{ padding:32, textAlign:"center" as const, color:"var(--steel)", fontSize:13 }}>No active roles</div>}
            {activeVacs.map((v:any) => {
              const count = vacCounts[v.id] || 0
              const daysOpen = Math.floor((Date.now() - new Date(v.opened_date).getTime()) / 86400000)
              const pct = Math.min(100, Math.round(((v.filled||0)/(v.quantity||1))*100))
              return (
                <Link key={v.id} href={`/vacancies/${v.id}`} style={{ textDecoration:"none", display:"block", padding:"14px 22px", borderBottom:"1px solid var(--line-soft)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:"var(--navy)", marginBottom:3 }}>x{v.quantity} {v.title} <span style={{ marginLeft:6, fontSize:10, background:"var(--paper)", border:"1px solid var(--line)", color:"var(--steel)", padding:"1px 6px" }}>{v.location}</span></div>
                      <div style={{ fontSize:11, color:"var(--steel)" }}>{v.job_ref} · {daysOpen}d open · {count} in pipeline</div>
                    </div>
                    <div style={{ textAlign:"right" as const }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--navy)" }}>{v.filled||0}/{v.quantity}</div>
                      <div style={{ width:64, height:4, background:"var(--mist)", marginTop:4, borderRadius:2 }}>
                        <div style={{ height:"100%", background:"var(--green)", width:`${pct}%`, borderRadius:2 }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:20 }}>
            <div className="card" style={{ padding:22 }}>
              <div className="section-mark">Pipeline snapshot</div>
              {[
                { s:"submitted", label:"Submitted", col:"var(--blue)" },
                { s:"reviewing", label:"Reviewing", col:"var(--amber)" },
                { s:"interview", label:"Interview", col:"var(--navy-soft)" },
                { s:"offer",     label:"Offer out", col:"#E89B2E" },
                { s:"placed",    label:"Placed",    col:"var(--green)" },
                { s:"rejected",  label:"Rejected",  col:"var(--red)" },
              ].map(r => {
                const n = pip.filter(p => p.stage === r.s).length
                const pct = pip.length > 0 ? (n/pip.length*100) : 0
                return (
                  <div key={r.s} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px dashed var(--line-soft)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:r.col }} />
                      <span style={{ fontSize:13, color:"var(--navy)" }}>{r.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:56, height:4, background:"var(--paper)", borderRadius:2 }}>
                        <div style={{ height:"100%", background:r.col, width:`${pct}%`, borderRadius:2 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:"var(--navy)", width:20, textAlign:"right" as const }}>{n}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link href="/candidates/new" style={{ display:"block", padding:"14px 24px", background:"var(--navy)", color:"white", textDecoration:"none", textAlign:"center" as const, fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase" as const }}>+ Add Candidate</Link>
            <Link href="/vacancies" style={{ display:"block", padding:"14px 24px", border:"1px solid var(--line)", color:"var(--navy)", textDecoration:"none", textAlign:"center" as const, fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase" as const }}>View All Vacancies</Link>
          </div>
        </div>
      </main>
    </>
  )
}
