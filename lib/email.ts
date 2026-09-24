import { Resend } from 'resend';
import nodemailer from 'nodemailer';

function getNodemailerTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Yathra Care <onboarding@resend.dev>';
const OWNER_EMAIL = process.env.RESEND_OWNER_EMAIL || 'febinnoble2028@cs.sjcetpalai.ac.in';

export async function sendGrievanceConfirmationEmail(data: {
  passengerEmail: string;
  referenceNumber: string;
  category: string;
  description: string;
  location?: string;
  slaDeadline: string;
  routeName?: string;
}) {
  if (!data.passengerEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yathracare.vercel.app';
  const trackingLink = `${appUrl}/track/${data.referenceNumber}`;
  const deadlineFormatted = new Date(data.slaDeadline).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .badge { display: inline-block; background: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 8px; }
        .body { padding: 32px 24px; }
        .ref-box { background: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px; border-radius: 8px; margin: 20px 0; }
        .ref-number { font-family: monospace; font-size: 18px; font-weight: bold; color: #0284c7; }
        .detail-row { margin-bottom: 12px; font-size: 14px; }
        .detail-label { font-weight: 600; color: #64748b; }
        .button { display: inline-block; background: #0284c7; color: #ffffff !important; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; text-align: center; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Yathra Care Passenger Support</h1>
          <div class="badge">Grievance Confirmation</div>
        </div>
        <div class="body">
          <p>Dear Passenger,</p>
          <p>Thank you for reaching out to KSRTC Yathra Care. Your grievance has been logged successfully into our central transport monitoring system.</p>
          
          <div class="ref-box">
            <div class="detail-label">TICKET REFERENCE NUMBER</div>
            <div class="ref-number">${data.referenceNumber}</div>
          </div>

          <div class="detail-row"><span class="detail-label">Category:</span> <strong>${data.category}</strong></div>
          ${data.routeName ? `<div class="detail-row"><span class="detail-label">Bus Route / Service:</span> <strong>${data.routeName}</strong></div>` : ''}
          ${data.location ? `<div class="detail-row"><span class="detail-label">Incident Location:</span> <strong>${data.location}</strong></div>` : ''}
          <div class="detail-row"><span class="detail-label">Description:</span> ${data.description}</div>
          <div class="detail-row"><span class="detail-label">Target SLA Resolution Deadline:</span> <strong style="color: #d97706;">${deadlineFormatted}</strong></div>

          <div style="text-align: center;">
            <a href="${trackingLink}" class="button">Track Grievance Live</a>
          </div>
        </div>
        <div class="footer">
          This is an automated system notification from KSRTC Yathra Care Grievance Redressal Mechanism.<br>
          © ${new Date().getFullYear()} KSRTC Transport Systems.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Gmail / Custom SMTP Transporter First if configured (Zero domain verification required!)
  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      const senderUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const mailRes = await transporter.sendMail({
        from: `Yathra Care <${senderUser}>`,
        to: data.passengerEmail,
        subject: `[Yathra Care] Grievance Registered - Ticket #${data.referenceNumber}`,
        html: htmlContent,
      });
      console.log(`[Gmail SMTP Success] Email sent directly to passenger ${data.passengerEmail} (MessageId: ${mailRes.messageId})`);
      return mailRes;
    } catch (err) {
      console.error(`[Gmail SMTP Error] Failed to send via Gmail SMTP:`, err);
    }
  }

  // 2. Fallback to Resend API
  const resend = getResendClient();
  if (!resend) {
    console.log(`[Email Notice] Skipping email sending: Neither Gmail SMTP nor Resend API Key is set.`);
    return;
  }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.passengerEmail],
      subject: `[Yathra Care] Grievance Registered - Ticket #${data.referenceNumber}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error(`[Resend API Notice] Could not send directly to ${data.passengerEmail}:`, response.error.message);

      if (response.error.message?.includes('can only send testing emails') || response.error.statusCode === 403) {
        console.log(`[Resend Fallback] Forwarding receipt to project owner (${OWNER_EMAIL})...`);
        return await resend.emails.send({
          from: FROM_EMAIL,
          to: [OWNER_EMAIL],
          subject: `[Yathra Care Receipt] Ticket #${data.referenceNumber} (For: ${data.passengerEmail})`,
          html: htmlContent,
        });
      }
    } else {
      console.log(`[Resend Success] Grievance confirmation email sent to ${data.passengerEmail}`);
    }

    return response;
  } catch (error) {
    console.error(`[Resend Exception] Failed to send email to ${data.passengerEmail}:`, error);
  }
}

export async function sendStatusUpdateEmail(data: {
  passengerEmail: string;
  referenceNumber: string;
  category: string;
  newStatus: string;
  notes?: string;
}) {
  if (!data.passengerEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yathracare.vercel.app';
  const trackingLink = `${appUrl}/track/${data.referenceNumber}`;

  let statusBg = '#0284c7';
  if (data.newStatus === 'RESOLVED') statusBg = '#10b981';
  if (data.newStatus === 'REJECTED') statusBg = '#64748b';
  if (data.newStatus === 'ESCALATED') statusBg = '#e11d48';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; }
        .status-badge { display: inline-block; background: ${statusBg}; color: #ffffff; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; margin-top: 10px; text-transform: uppercase; }
        .body { padding: 32px 24px; }
        .notes-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
        .button { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; text-align: center; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Yathra Care Status Update</h1>
          <div class="status-badge">${data.newStatus}</div>
        </div>
        <div class="body">
          <p>Dear Passenger,</p>
          <p>The status of your grievance <strong>#${data.referenceNumber}</strong> (${data.category}) has been updated by KSRTC Depot Operations.</p>
          
          ${data.notes ? `
            <div class="notes-box">
              <strong>Officer Update Notes:</strong><br>
              ${data.notes}
            </div>
          ` : ''}

          ${data.newStatus === 'RESOLVED' ? `
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; color: #065f46; font-size: 14px; margin-bottom: 20px;">
              ✨ <strong>Grievance Resolved:</strong> Thank you for helping us improve KSRTC bus services. Please click below to rate your resolution experience.
            </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${trackingLink}" class="button">View Complaint Details & Timeline</a>
          </div>
        </div>
        <div class="footer">
          KSRTC Passenger Grievance Redressal Unit<br>
          © ${new Date().getFullYear()} KSRTC Transport Systems.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Gmail / Custom SMTP Transporter First
  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      const senderUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const mailRes = await transporter.sendMail({
        from: `Yathra Care <${senderUser}>`,
        to: data.passengerEmail,
        subject: `[Yathra Care] Grievance #${data.referenceNumber} Updated: ${data.newStatus}`,
        html: htmlContent,
      });
      console.log(`[Gmail SMTP Success] Status update sent to ${data.passengerEmail} (MessageId: ${mailRes.messageId})`);
      return mailRes;
    } catch (err) {
      console.error(`[Gmail SMTP Error] Failed to send update via Gmail SMTP:`, err);
    }
  }

  // 2. Fallback to Resend API
  const resend = getResendClient();
  if (!resend) return;

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.passengerEmail],
      subject: `[Yathra Care] Grievance #${data.referenceNumber} Updated: ${data.newStatus}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error(`[Resend API Notice] Could not send status update to ${data.passengerEmail}:`, response.error.message);

      if (response.error.message?.includes('can only send testing emails') || response.error.statusCode === 403) {
        console.log(`[Resend Fallback] Forwarding status update to ${OWNER_EMAIL}...`);
        return await resend.emails.send({
          from: FROM_EMAIL,
          to: [OWNER_EMAIL],
          subject: `[Yathra Care Update] Ticket #${data.referenceNumber} is ${data.newStatus} (For: ${data.passengerEmail})`,
          html: htmlContent,
        });
      }
    } else {
      console.log(`[Resend Success] Status update email sent to ${data.passengerEmail}`);
    }

    return response;
  } catch (error) {
    console.error(`[Resend Exception] Failed to send status update email to ${data.passengerEmail}:`, error);
  }
}

export interface ForwardedGrievanceItem {
  referenceNumber: string;
  category: string;
  routeName?: string;
  depotName?: string;
  description: string;
  location?: string;
  status: string;
  slaDeadline: string;
  createdAt: string;
  escalated?: boolean | number;
  passengerEmail?: string;
}

export async function sendForwardedGrievancesEmail(data: {
  officialEmail: string;
  officialName: string;
  forwardedBy: string;
  priority: string;
  remarks?: string;
  complaints: ForwardedGrievanceItem[];
}) {
  if (!data.officialEmail || data.complaints.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yathracare.vercel.app';
  const priorityColor =
    data.priority === 'URGENT' ? '#e11d48' : data.priority === 'HIGH' ? '#ea580c' : '#0284c7';

  const rowsHtml = data.complaints
    .map((c, idx) => {
      const deadline = new Date(c.slaDeadline).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const trackingLink = `${appUrl}/track/${c.referenceNumber}`;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 12px; font-family: monospace; font-weight: bold; color: #0369a1;">
            <a href="${trackingLink}" style="color: #0284c7; text-decoration: none;">#${c.referenceNumber}</a>
            ${c.escalated ? '<span style="display:block; color:#e11d48; font-size:10px; font-weight:800;">OVERDUE</span>' : ''}
          </td>
          <td style="padding: 12px; font-size: 13px; font-weight: 600; color: #334155;">
            ${c.category}
            <span style="display: block; font-size: 11px; color: #64748b; font-weight: 400;">${c.routeName || 'General Route'}</span>
          </td>
          <td style="padding: 12px; font-size: 12px; color: #475569; max-width: 220px;">
            <div style="margin-bottom: 4px;">${c.description}</div>
            ${c.location ? `<span style="font-size: 10px; color: #94a3b8;">📍 ${c.location}</span>` : ''}
          </td>
          <td style="padding: 12px; font-size: 11px; color: #64748b; white-space: nowrap;">
            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #334155;">${c.status}</span>
            <div style="font-size: 10px; color: #d97706; margin-top: 4px;">Target: ${deadline}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #091e42 0%, #0f398a 100%); padding: 28px 24px; color: #ffffff; text-align: left; }
        .header-title { font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #93c5fd; }
        .header-sub { font-size: 22px; font-weight: 900; margin: 6px 0 0 0; color: #ffffff; }
        .priority-tag { display: inline-block; background: ${priorityColor}; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 8px; }
        .body { padding: 28px 24px; }
        .memo-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0f398a; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
        .table-wrap { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 16px; }
        .th { background: #0f2757; color: #ffffff; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        .cta-btn { display: inline-block; background: #0f398a; color: #ffffff !important; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; text-decoration: none; text-align: center; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-title">KSRTC Yathra Care Command & Oversight</div>
          <div class="header-sub">Grievance Escalation Dossier (${data.complaints.length} Cases)</div>
          <div class="priority-tag">Priority: ${data.priority}</div>
        </div>
        <div class="body">
          <p><strong>To:</strong> ${data.officialName} (${data.officialEmail})<br>
             <strong>From:</strong> ${data.forwardedBy}<br>
             <strong>Date:</strong> ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
          </p>

          <div class="memo-box">
            <strong style="color: #0f398a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Officer Submission Remarks:</strong><br>
            ${data.remarks ? data.remarks.replace(/\n/g, '<br>') : 'The following passenger grievance cases have been selected and forwarded for administrative review, vigilance intervention, or executive action.'}
          </div>

          <h3 style="font-size: 14px; font-weight: 800; color: #0f2757; margin-bottom: 8px; text-transform: uppercase;">
            Summary of Forwarded Grievances (${data.complaints.length})
          </h3>

          <table class="table-wrap">
            <thead>
              <tr>
                <th class="th">Ref ID</th>
                <th class="th">Category / Route</th>
                <th class="th">Allegation Details</th>
                <th class="th">Status & SLA</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="text-align: center;">
            <a href="${appUrl}/dashboard?tab=operations" class="cta-btn">Access Central Operations Dashboard</a>
          </div>
        </div>
        <div class="footer">
          Confidential Administrative Communication • Government of Kerala Transport Department • KSRTC Central Operations
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Gmail / Custom SMTP
  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      const senderUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const mailRes = await transporter.sendMail({
        from: `Yathra Care Command <${senderUser}>`,
        to: data.officialEmail,
        subject: `[KSRTC Escalation Dossier] ${data.complaints.length} Grievance(s) Forwarded for Review (${data.priority})`,
        html: htmlContent,
      });
      console.log(`[Gmail SMTP Success] Dossier forwarded to ${data.officialEmail} (MessageId: ${mailRes.messageId})`);
      return mailRes;
    } catch (err) {
      console.error(`[Gmail SMTP Error] Failed to forward dossier via Gmail:`, err);
    }
  }

  // 2. Fallback to Resend API
  const resend = getResendClient();
  if (!resend) return;

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.officialEmail],
      subject: `[KSRTC Escalation Dossier] ${data.complaints.length} Grievance(s) Forwarded for Review (${data.priority})`,
      html: htmlContent,
    });

    if (response.error) {
      if (response.error.message?.includes('can only send testing emails') || response.error.statusCode === 403) {
        return await resend.emails.send({
          from: FROM_EMAIL,
          to: [OWNER_EMAIL],
          subject: `[Forwarded Dossier to ${data.officialEmail}] ${data.complaints.length} Grievance(s) (${data.priority})`,
          html: htmlContent,
        });
      }
    }
    return response;
  } catch (error) {
    console.error(`[Resend Exception] Failed to forward dossier:`, error);
  }
}

