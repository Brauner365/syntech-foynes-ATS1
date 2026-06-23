"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    setLoading(true); setError("")
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push("/dashboard"), 2000)
  }

  const bgStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #081A2E 0%, #0E2A47 60%, #0a1f38 100%)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: 24, position: "relative", overflow: "hidden",
    fontFamily: "Inter, -apple-system, sans-serif"
  }

  return (
    <div style={bgStyle}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:`repeating-linear-gradient(90deg, transparent 0, transparent 59px, rgba(255,255,255,0.025) 59px, rgba(255,255,255,0.025) 60px), repeating-linear-gradient(0deg, transparent 0, transparent 59px, rgba(255,255,255,0.025) 59px, rgba(255,255,255,0.025) 60px)` }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"#E63946" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1, background:"white", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ background:"#0E2A47", padding:"24px 32px", borderBottom:"3px solid #E63946" }}>
          <div style={{ fontSize:11, letterSpacing:"0.28em", textTransform:"uppercase" as const, color:"rgba(255,255,255,0.5)", fontWeight:600, marginBottom:6 }}>
            Foynes Engineering ATS
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"white", letterSpacing:"-0.02em" }}>
            {done ? "Password updated" : "Set new password"}
          </div>
        </div>

        <div style={{ padding:"32px 32px 28px" }}>
          {done ? (
            <div>
              <div style={{ padding:"14px 16px", background:"rgba(46,138,79,0.08)", borderLeft:"3px solid #2E8A4F", fontSize:13, color:"#2E8A4F", marginBottom:16 }}>
                ✓ Password updated successfully — redirecting to dashboard…
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#4A5E78", fontWeight:600, marginBottom:8 }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Minimum 8 characters"
                  style={{ width:"100%", padding:"12px 16px", border:"1px solid #D5DCE5", background:"#F4F6F9", fontSize:14, color:"#0E2A47", outline:"none", fontFamily:"inherit", boxSizing:"border-box" as const }} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#4A5E78", fontWeight:600, marginBottom:8 }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Repeat new password"
                  style={{ width:"100%", padding:"12px 16px", border:"1px solid #D5DCE5", background:"#F4F6F9", fontSize:14, color:"#0E2A47", outline:"none", fontFamily:"inherit", boxSizing:"border-box" as const }} />
              </div>
              {error && (
                <div style={{ marginBottom:20, padding:"12px 16px", background:"rgba(230,57,70,0.06)", borderLeft:"3px solid #E63946", fontSize:13, color:"#B7202E" }}>{error}</div>
              )}
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"14px 24px", background:"#0E2A47", color:"white", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase" as const, fontFamily:"inherit" }}>
                {loading ? "Updating…" : "Set new password →"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop:36, fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.18em", textTransform:"uppercase" as const, textAlign:"center" as const, position:"relative", zIndex:1 }}>
        Built by Legatum Group for Syntech Recruitment
      </div>
    </div>
  )
}
