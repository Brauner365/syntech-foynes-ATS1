import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Navigation from "@/components/Navigation"
import AddCandidateForm from "@/components/AddCandidateForm"

export default async function AddCandidatePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || { id: "", email: "" }
  const { data: profile } = await supabase.schema("foynes").from("profiles").select("*").eq("id", user.id).single()
  if (!profile) { return <div style={{padding:40,textAlign:"center"}}>Access denied</div> }
  const { data: vacancies } = await supabase.schema("foynes").from("vacancies").select("id,title,location,quantity,job_ref").eq("status","active").order("location")
  return (
    <>
      <Navigation profile={profile} />
      <main style={{ padding:"40px 32px", maxWidth:860, margin:"0 auto" }}>
        <AddCandidateForm profile={profile} vacancies={vacancies || []} />
      </main>
    </>
  )
}
