import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || "notifications@syntechrecruitment.co.uk"
const POC = process.env.POC_EMAIL || "brendan.oconnor@foynesengineering.ie"

function header() {
  return `
    <div style="background:#152850;padding:24px 32px;border-radius:12px 12px 0 0;">
      <div style="display:flex;align-items:center;gap:16px;">
        <span style="color:#e63946;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Syntech</span>
        <span style="color:#ffffff50;font-size:16px;">×</span>
        <span style="color:#ffffff;font-size:16px;font-weight:600;">Foynes Engineering</span>
      </div>
      <p style="color:#ffffff60;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase;">Applicant Tracking System</p>
    </div>
  `
}
function footer() {
  return `
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">
        Sent by Syntech ATS on behalf of Syntech Recruitment Ltd<br>
        Questions? Reply to this email or contact <a href="mailto:charlene@syntechrecruitment.co.uk" style="color:#152850;">Charlene Roux</a>
      </p>
    </div>
  `
}

function wrap(content: string) {
  return `
    <!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f1f5f9;padding:24px;margin:0;">
    <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
      ${header()}
      <div style="padding:28px 32px;">${content}</div>
      ${footer()}
    </div></body></html>
  `
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, candidate, vacancy, stage, actor, notes } = body

    let subject = ""
    let html = ""
    let to = [POC]

    const candName = `${candidate?.first_name} ${candidate?.last_name}`
    const roleTitle = vacancy ? `×${vacancy.quantity} ${vacancy.title} — ${vacancy.location}` : ""

    if (type === "candidate_submitted") {
      subject = `New CV Submitted — ${candName} for ${vacancy?.title} (${vacancy?.location})`
      html = wrap(`
        <h2 style="color:#152850;margin:0 0 4px;font-size:20px;">New CV Submitted</h2>
        <p style="color:#64748b;margin:0 0 24px;font-size:14px;">Syntech has submitted a new candidate for your review.</p>
        
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Candidate</p>
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0f172a;">${candName}</p>
          ${candidate?.trade ? `<p style="margin:0 0 4px;font-size:14px;color:#475569;">${candidate.trade}</p>` : ""}
          ${candidate?.location ? `<p style="margin:0;font-size:13px;color:#94a3b8;">Based in ${candidate.location}</p>` : ""}
        </div>
        
        <div style="background:#f0f4fb;border:1px solid #dce6f4;border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Role</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#152850;">${roleTitle}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Ref: ${vacancy?.job_ref}</p>
        </div>
        
        ${candidate?.certifications?.length ? `
          <p style="font-size:13px;color:#475569;margin-bottom:8px;"><strong>Certifications:</strong> ${candidate.certifications.join(", ")}</p>
        ` : ""}
        
        <p style="font-size:14px;color:#475569;margin-bottom:20px;">
          Please log in to the Foynes ATS portal to review the CV and move this candidate to the next stage.
        </p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://foynes-ats.vercel.app"}/vacancies/${vacancy?.id}"
          style="display:inline-block;background:#152850;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          Review Candidate →
        </a>
        
        <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Submitted by ${actor || "Syntech Recruitment"}</p>
      `)
    }

    else if (type === "stage_change") {
      const stageLabels: Record<string,string> = {
        interview:"moved to Interview","offer":"Offer Made","placed":"Placed ✓","rejected":"Rejected","reviewing":"Under Review"
      }
      const stageLabel = stageLabels[stage] || stage
      const isPlaced = stage === "placed"
      const isInterview = stage === "interview"

      subject = `${candName} — ${stageLabel} · ${vacancy?.title} (${vacancy?.location})`
      html = wrap(`
        <h2 style="color:#152850;margin:0 0 4px;font-size:20px;">Candidate Update</h2>
        <p style="color:#64748b;margin:0 0 24px;font-size:14px;">${actor} has updated the status of a candidate.</p>
        
        <div style="background:${isPlaced?"#f0fdf4":isInterview?"#faf5ff":"#f8fafc"};border:1px solid ${isPlaced?"#bbf7d0":isInterview?"#e9d5ff":"#e2e8f0"};border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0f172a;">${candName}</p>
          <p style="margin:0;font-size:14px;color:#475569;">${vacancy?.title} — ${vacancy?.location}</p>
          <div style="margin-top:12px;display:inline-block;background:${isPlaced?"#22c55e":isInterview?"#8b5cf6":"#3b82f6"};color:white;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">
            ${stageLabel}
          </div>
        </div>
        
        ${notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#78350f;"><strong>Notes:</strong> ${notes}</p></div>` : ""}
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://foynes-ats.vercel.app"}/vacancies/${vacancy?.id}"
          style="display:inline-block;background:#152850;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          View in Portal →
        </a>
      `)

      // Also email recruiter if client moved stage
      if (stage === "interview" || stage === "rejected") {
        to = [POC, "charlene@syntechrecruitment.co.uk"]
      }
    }

    else if (type === "new_comment") {
      const { comment, commenter_role } = body
      subject = `New Comment — ${candName} · ${vacancy?.title}`
      to = commenter_role === "client"
        ? ["charlene@syntechrecruitment.co.uk"]
        : [POC]
      html = wrap(`
        <h2 style="color:#152850;margin:0 0 4px;font-size:20px;">New Comment</h2>
        <p style="color:#64748b;margin:0 0 24px;font-size:14px;">${actor} has left a comment on a candidate.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0f172a;">${candName} — ${vacancy?.title}</p>
          <p style="margin:0;font-size:14px;color:#475569;font-style:italic;">"${comment}"</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://foynes-ats.vercel.app"}/vacancies/${vacancy?.id}"
          style="display:inline-block;background:#152850;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          Reply in Portal →
        </a>
      `)
    }

    if (!subject) return NextResponse.json({ ok: true, skipped: true })

    const { data, error } = await resend.emails.send({
      from: `Syntech ATS <${FROM}>`, to, subject, html
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ ok: false, error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err) {
    console.error("Email route error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
