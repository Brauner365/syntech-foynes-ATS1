"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import Link from "next/link"
import { getToken, getUser, supaFetch } from "@/lib/auth"

export default function CandidatesPage() {
  const [profile, setProfile] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    setTimeout(async () => {
      const token = getToken()
      if (!token) { router.push("/login"); return }
      const user = await getUser(token)
      if (!user.email) { router.push("/login"); return }
      setProfile({ full_name: user.email.split("@")[0], role: "recruiter" as const, email: user.email, id: user.id, is_active: true, created_at: "" })
      const c = await supaFetch("candidates?select=*&order=created_at.desc", token)
      setCandidates(Array.isArray(c) ? c : [])
      setLoading(false)
    }, 300)
  }, [])

  if (loading) return <div style={{ padding:40, textAlign:"center" as const, color:"var(--steel)" }}>Loading...</div>
  if (!profile) return null

  const filtered = candidates.filter(c =>
    `${c.first_name} ${c.last_name} ${c.trade} ${c.location}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navigation profile={profile} />
      <main style={{ padding:"40px 32px", maxWidth:1480, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
          <div>
            <div className="section-mark">Recruiter view</div>
            <h2 style={{ fontSize:26, fontWeight:700, color:"var(--navy)" }}>Candidates</h2>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
              style={{ padding:"8px 14px", border:"1px solid var(--line)", background:"white", fontSize:13, outline:"none", width:220, fontFamily:"inherit" }} />
            <Link href="/candidates/new" style={{ padding:"10px 20px", background:"var(--navy)", color:"white", textDecoration:"none", fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase" as const }}>+ Add</Link>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding:48, textAlign:"center" as const, color:"var(--steel)" }}>
            {candidates.length === 0 ? "No candidates yet." : "No matches."}
          </div>
        ) : (
          <div className="card" style={{ overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--paper)", borderBottom:"1px solid var(--line)" }}>
                  {["Name","Trade","Location","Nationality","Right to Work","Added",""].map(h=>(
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left" as const, fontSize:10, fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase" as const, color:"var(--steel)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c=>(
                  <tr key={c.id} style={{ borderBottom:"1px solid var(--line-soft)" }}>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:"var(--navy)" }}>{c.first_name} {c.last_name}</td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)" }}>{c.trade||"-"}</td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)" }}>{c.location||"-"}</td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)" }}>{c.nationality||"-"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:10, fontWeight:600, color:c.right_to_work?"var(--green)":"var(--red)", textTransform:"uppercase" as const }}>{c.right_to_work?"Yes":"No"}</span>
                    </td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)", fontSize:11 }}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding:"12px 16px" }}>
                      {c.cv_url&&<a href={c.cv_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--red)", fontWeight:600, textDecoration:"none" }}>CV</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
