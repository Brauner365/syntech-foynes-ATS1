"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

const RECRUITER_LINKS = [
  { href: "/dashboard",  label: "Overview" },
  { href: "/vacancies",  label: "Vacancies" },
  { href: "/candidates", label: "Candidates" },
  { href: "/metrics",    label: "Reports" },
]
const CLIENT_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/vacancies", label: "Roles" },
  { href: "/metrics",   label: "Reports" },
]

export default function Navigation({ profile }: { profile: Profile | null | any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  if (!profile) return null
  const links = profile.role === "recruiter" ? RECRUITER_LINKS : CLIENT_LINKS
  const initials = (profile.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="lockup">
          {/* Syntech wordmark */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M4 8L12 16L4 24" stroke="#E63946" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8L20 16L12 24" stroke="#E63946" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 8L28 16L20 24" stroke="#E63946" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
              <span style={{ color:"white", fontWeight:700, fontSize:15, letterSpacing:"-0.02em" }}>Syntech</span>
            </div>
            <div className="partnership-tag">Industrial Recruitment</div>
          </div>
          <span className="lockup-sep">×</span>
          <div>
            <div style={{ color:"white", fontWeight:600, fontSize:14 }}>Foynes Engineering</div>
            <div className="partnership-tag">ATS · Live</div>
          </div>
        </div>

        <div className="topbar-meta">
          <span><span className="live-dot"/>56 roles · Active</span>
          <span>{new Date().toLocaleDateString("en-IE",{day:"numeric",month:"short",year:"numeric"})}</span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div className="topbar-user" onClick={signOut}>
            <div className="avatar">{initials}</div>
            <span>{profile.full_name}</span>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>
              {profile.role === "recruiter" ? "Recruiter" : "Client"}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal page nav */}
      <nav className="pagenav">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`nav-link${pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)) ? " active" : ""}`}>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
