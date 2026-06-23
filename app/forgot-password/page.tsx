"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
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
            {sent ? "Check your email" : "Reset password"}
          </div>
        </div>

        <div style={{ padding:"32px 32px 28px" }}>
          {sent ? (
            <div>
              <p style={{ fontSize:14, color:"#4A5E78", lineHeight:1.6, marginBottom:24 }}>
                We've sent a password reset link to <strong style={{ color:"#0E2A47" }}>{email}</strong>. Click the link in the email to set a new password.
              </p>
              <div style={{ padding:"14px 16px", background:"rgba(46,138,79,0.08)", borderLeft:"3px solid #2E8A4F", fontSize:13, color:"#2E8A4F", marginBottom:24 }}>
                ✓ Reset email sent — check your inbox and spam folder
              </div>
              <Link href="/login" style={{ display:"block", textAlign:"center" as const, padding:"14px 24px", background:"#0E2A47", color:"white", textDecoration:"none", fontSize:11, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase" as const }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize:13, color:"#4A5E78", marginBottom:24, lineHeight:1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#4A5E78", fontWeight:600, marginBottom:8 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@email.com"
                  style={{ width:"100%", padding:"12px 16px", border:"1px solid #D5DCE5", background:"#F4F6F9", fontSize:14, color:"#0E2A47", outline:"none", fontFamily:"inherit", boxSizing:"border-box" as const }} />
              </div>
              {error && (
                <div style={{ marginBottom:20, padding:"12px 16px", background:"rgba(230,57,70,0.06)", borderLeft:"3px solid #E63946", fontSize:13, color:"#B7202E" }}>{error}</div>
              )}
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"14px 24px", background:"#0E2A47", color:"white", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase" as const, fontFamily:"inherit", marginBottom:16 }}>
                {loading ? "Sending…" : "Send reset link →"}
              </button>
              <Link href="/login" style={{ display:"block", textAlign:"center" as const, fontSize:12, color:"#8A99AE", textDecoration:"none" }}>
                ← Back to sign in
              </Link>
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
