"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { TRADES, CERTIFICATIONS, type Profile } from "@/lib/types"

interface Props { profile: Profile; vacancies: any[] }

export default function AddCandidateForm({ profile, vacancies }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    location: "", nationality: "", trade: "", notes: "",
    right_to_work: true, linkedin_url: ""
  })
  const [certs, setCerts] = useState<string[]>([])
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [vacancyId, setVacancyId] = useState<number | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggle(cert: string) {
    setCerts(prev => prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name || !form.last_name) { setError("First and last name required"); return }
    setLoading(true); setError("")

    let cv_url: string | null = null
    let cv_filename: string | null = null
    if (cvFile) {
      const ext = cvFile.name.split(".").pop()
      const path = `cvs/${Date.now()}-${form.last_name.toLowerCase().replace(/\s+/g,"-")}.${ext}`
      const { error: uploadError } = await supabase.storage.from("foynes-cvs").upload(path, cvFile)
      if (uploadError) { setError("CV upload failed: " + uploadError.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from("foynes-cvs").getPublicUrl(path)
      cv_url = urlData.publicUrl; cv_filename = cvFile.name
    }

    const { data: candidate, error: candError } = await supabase.schema("foynes").from("candidates").insert({
      ...form, certifications: certs, cv_url, cv_filename, added_by: profile.id
    }).select().single()
    if (candError) { setError(candError.message); setLoading(false); return }

    if (vacancyId && candidate) {
      await supabase.schema("foynes").from("pipeline").insert({
        vacancy_id: vacancyId, candidate_id: candidate.id, stage: "submitted", added_by: profile.id
      })
      await supabase.schema("foynes").from("activity_log").insert({
        user_id: profile.id, user_name: profile.full_name,
        action: `submitted ${candidate.first_name} ${candidate.last_name} to pipeline`,
        entity_type: "candidate", entity_id: candidate.id, metadata: { vacancy_id: vacancyId }
      })
      const vac = vacancies.find(v => v.id === vacancyId)
      await fetch("/api/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "candidate_submitted", candidate, vacancy: vac, actor: profile.full_name })
      })
      router.push(`/vacancies/${vacancyId}`)
    } else {
      router.push("/candidates")
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <a href="/candidates" className="text-slate-400 hover:text-slate-600 text-sm">← Candidates</a>
        <span className="text-slate-300">›</span>
        <h1 className="text-xl font-bold text-[#152850]">Add Candidate</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Personal Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name *</label>
              <input className="input" value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))} required /></div>
            <div><label className="label">Last Name *</label>
              <input className="input" value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))} required /></div>
            <div><label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
            <div><label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+353 …" /></div>
            <div><label className="label">Based In</label>
              <input className="input" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} /></div>
            <div><label className="label">Nationality</label>
              <input className="input" value={form.nationality} onChange={e=>setForm(f=>({...f,nationality:e.target.value}))} /></div>
          </div>
          <div className="mt-4"><label className="label">LinkedIn</label>
            <input className="input" value={form.linkedin_url} onChange={e=>setForm(f=>({...f,linkedin_url:e.target.value}))} placeholder="https://linkedin.com/in/…" /></div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Trade & Certifications</h2>
          <select className="input mb-4" value={form.trade} onChange={e=>setForm(f=>({...f,trade:e.target.value}))}>
            <option value="">Select trade…</option>
            {TRADES.map(t=><option key={t}>{t}</option>)}
          </select>
          <label className="label">Certifications held</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {CERTIFICATIONS.map(c=>(
              <button key={c} type="button" onClick={()=>toggle(c)}
                className={`badge border cursor-pointer text-xs py-1.5 px-3 transition-colors ${
                  certs.includes(c)?"bg-[#152850] text-white border-[#152850]":"bg-white text-slate-600 border-slate-200 hover:border-[#152850]"}`}>
                {c}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.right_to_work} onChange={e=>setForm(f=>({...f,right_to_work:e.target.checked}))} className="w-4 h-4 accent-[#152850]" />
            <span className="text-sm text-slate-700">Right to work in Ireland confirmed</span>
          </label>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-3">CV Upload</h2>
          <input type="file" accept=".pdf,.doc,.docx" onChange={e=>setCvFile(e.target.files?.[0]||null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#152850] file:text-white hover:file:bg-[#1e3f7a] cursor-pointer file:text-sm file:font-medium" />
          {cvFile&&<p className="text-xs text-green-600 mt-2">✓ {cvFile.name}</p>}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Submit to Vacancy</h2>
          <select className="input" value={vacancyId} onChange={e=>setVacancyId(e.target.value?Number(e.target.value):"")}>
            <option value="">— Add to database only —</option>
            {vacancies.map(v=><option key={v.id} value={v.id}>{v.job_ref} · ×{v.quantity} {v.title} — {v.location}</option>)}
          </select>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Notes</h2>
          <textarea className="input h-24 resize-none" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
            placeholder="Trade notes, availability, rate, accommodation needed…" />
        </div>

        {error&&<div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
            {loading?"Saving…":vacancyId?"Add & Submit to Vacancy":"Add to Database"}
          </button>
          <a href="/candidates" className="btn-secondary px-6">Cancel</a>
        </div>
      </form>
    </div>
  )
}
