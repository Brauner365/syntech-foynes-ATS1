"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import { getToken, getUser, supaFetch } from "@/lib/auth"

export default function MetricsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [vacs, setVacs] = useState<any[]>([])
  const [pip, setPip] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setTimeout(async () => {
      const token = getToken()
      if (!token) { router.push("/login"); return }
      const user = await getUser(token)
      if (!user.email) { router.push("/login"); return }
      setProfile({ full_name: user.email.split("@")[0], role: "recruiter" as const, email: user.email, id: user.id, is_active: true, created_at: "" })
      const [v, p] = await Promise.all([
        supaFetch("vacancies?select=*", token),
        supaFetch("pipeline?select=stage,vacancy_id", token)
      ])
      setVacs(Array.isArray(v)?v:[]); setPip(Array.isArray(p)?p:[]); setLoading(false)
    }, 300)
  }, [])

  if (loading) return <div style={{ padding:40, textAlign:"center" as const, color:"var(--steel)" }}>Loading...</div>
  if (!profile) return null

  const totalHeads = vacs.reduce((s,v)=>s+(v.quantity||0),0)
  const totalFilled = vacs.reduce((s,v)=>s+(v.filled||0),0)
  const fillRate = totalHeads>0?(totalFilled/totalHeads*100).toFixed(1):"0"
  const byStage: Record<string,number> = {submitted:0,reviewing:0,interview:0,offer:0,placed:0,rejected:0}
  pip.forEach(p=>{if(byStage[p.stage]!==undefined)byStage[p.stage]++})
  const byLocation: Record<string,{quantity:number,filled:number,roles:number}> = {}
  vacs.forEach(v=>{
    if(!byLocation[v.location])byLocation[v.location]={quantity:0,filled:0,roles:0}
    byLocation[v.location].quantity+=v.quantity
    byLocation[v.location].filled+=v.filled
    byLocation[v.location].roles++
  })

  return (
    <>
      <Navigation profile={profile} />
      <main style={{ padding:"40px 32px", maxWidth:1480, margin:"0 auto" }}>
        <div style={{ marginBottom:28 }}>
          <div className="section-mark">Live data</div>
          <h2 style={{ fontSize:26, fontWeight:700, color:"var(--navy)" }}>Metrics & Reports</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, border:"1px solid var(--line)", background:"var(--line)", marginBottom:28 }}>
          {[{label:"Total heads",val:totalHeads},{label:"Fill rate",val:`${fillRate}%`},{label:"In pipeline",val:pip.length},{label:"Placed",val:byStage.placed}].map((t,i)=>(
            <div key={i} className="stat-tile"><div className="stat-label">{t.label}</div><div className="stat-val">{t.val}</div></div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
          <div className="card" style={{ padding:22 }}>
            <div className="section-mark">Stage funnel</div>
            {Object.entries(byStage).map(([stage,count])=>(
              <div key={stage} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px dashed var(--line-soft)" }}>
                <span style={{ fontSize:13, color:"var(--navy)", textTransform:"capitalize" as const }}>{stage}</span>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:64, height:4, background:"var(--paper)", borderRadius:2 }}>
                    <div style={{ height:"100%", background:"var(--navy)", width:pip.length>0?`${count/pip.length*100}%`:"0%", borderRadius:2 }} />
                  </div>
                  <span className="mono" style={{ fontSize:12, fontWeight:600, color:"var(--navy)", width:20, textAlign:"right" as const }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:22 }}>
            <div className="section-mark">By location</div>
            {Object.entries(byLocation).map(([loc,d])=>(
              <div key={loc} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px dashed var(--line-soft)" }}>
                <span style={{ fontSize:13, color:"var(--navy)" }}>{loc}</span>
                <div style={{ textAlign:"right" as const }}>
                  <div className="mono" style={{ fontWeight:700, color:"var(--navy)", fontSize:15 }}>{d.filled}/{d.quantity}</div>
                  <div style={{ fontSize:11, color:"var(--steel)" }}>{d.roles} role{d.roles>1?"s":""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ overflow:"hidden" }}>
          <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--line)" }}>
            <span style={{ fontWeight:600, fontSize:13, color:"var(--navy)" }}>Role breakdown</span>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"var(--paper)", borderBottom:"1px solid var(--line)" }}>
                {["Role","Location","Target","Filled","Progress"].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left" as const, fontSize:10, fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase" as const, color:"var(--steel)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vacs.map(v=>{
                const pct=Math.min(100,Math.round(((v.filled||0)/(v.quantity||1))*100))
                return(
                  <tr key={v.id} style={{ borderBottom:"1px solid var(--line-soft)" }}>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:"var(--navy)" }}>x{v.quantity} {v.title}</td>
                    <td style={{ padding:"12px 16px", color:"var(--steel)" }}>{v.location}</td>
                    <td style={{ padding:"12px 16px", textAlign:"center" as const }}>{v.quantity}</td>
                    <td style={{ padding:"12px 16px", textAlign:"center" as const, color:"var(--green)", fontWeight:700 }}>{v.filled||0}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:6, background:"var(--paper)", borderRadius:3 }}>
                          <div style={{ height:"100%", background:"var(--green)", width:`${pct}%`, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:"var(--steel)", width:32 }}>{pct}%</span>
                      </div>
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
