import { Resend } from 'resend';

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
  const resend = getResendClient();
  if (!resend || !data.passengerEmail) {
    console.log(`[Email Notice] Skipping email sending for ${data.referenceNumber}: Resend API key or email missing.`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yathracare.vercel.app';
  const trackingLink = `${appUrl}/track/${data.referenceNumber}`;
  const deadlineFormatted = new Date(data.slaDeadline).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const generateHtml = (intendedFor?: string) => `
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
        .demo-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px 14px; border-radius: 8px; font-size: 12px; color: #78350f; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Yathra Care Passenger Support</h1>
          <div class="badge">Grievance Confirmation</div>
        </div>
        <div class="body">
          ${intendedFor ? `<div class="demo-notice">ℹ️ <strong>Resend Testing Mode:</strong> This confirmation email was intended for <strong>${intendedFor}</strong>. (Domain verification required in Resend for direct delivery to external emails).</div>` : ''}
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

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.passengerEmail],
      subject: `[Yathra Care] Grievance Registered - Ticket #${data.referenceNumber}`,
      html: generateHtml(),
    });

    if (response.error) {
      console.error(`[Resend API Notice] Could not send directly to ${data.passengerEmail}:`, response.error.message);

      // If Resend sandbox blocks external email, auto-forward to project owner email so message is never lost!
      if (response.error.message?.includes('can only send testing emails') || response.error.statusCode === 403) {
        console.log(`[Resend Sandbox Fallback] Auto-forwarding ticket #${data.referenceNumber} confirmation to ${OWNER_EMAIL}...`);
        const fallbackRes = await resend.emails.send({
          from: FROM_EMAIL,
          to: [OWNER_EMAIL],
          subject: `[Yathra Care Receipt] Ticket #${data.referenceNumber} (For: ${data.passengerEmail})`,
          html: generateHtml(data.passengerEmail),
        });
        return fallbackRes;
      }
    } else {
      console.log(`[Resend Success] Grievance confirmation email sent to ${data.passengerEmail} (ID: ${response.data?.id})`);
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
  const resend = getResendClient();
  if (!resend || !data.passengerEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yathracare.vercel.app';
  const trackingLink = `${appUrl}/track/${data.referenceNumber}`;

  let statusBg = '#0284c7';
  if (data.newStatus === 'RESOLVED') statusBg = '#10b981';
  if (data.newStatus === 'REJECTED') statusBg = '#64748b';
  if (data.newStatus === 'ESCALATED') statusBg = '#e11d48';

  const generateHtml = (intendedFor?: string) => `
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
        .demo-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px 14px; border-radius: 8px; font-size: 12px; color: #78350f; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Yathra Care Status Update</h1>
          <div class="status-badge">${data.newStatus}</div>
        </div>
        <div class="body">
          ${intendedFor ? `<div class="demo-notice">ℹ️ <strong>Resend Testing Mode:</strong> This update email was intended for <strong>${intendedFor}</strong>.</div>` : ''}
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

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.passengerEmail],
      subject: `[Yathra Care] Grievance #${data.referenceNumber} Updated: ${data.newStatus}`,
      html: generateHtml(),
    });

    if (response.error) {
      console.error(`[Resend API Notice] Could not send status update to ${data.passengerEmail}:`, response.error.message);

      if (response.error.message?.includes('can only send testing emails') || response.error.statusCode === 403) {
        console.log(`[Resend Sandbox Fallback] Auto-forwarding status update for ticket #${data.referenceNumber} to ${OWNER_EMAIL}...`);
        const fallbackRes = await resend.emails.send({
          from: FROM_EMAIL,
          to: [OWNER_EMAIL],
          subject: `[Yathra Care Update] Ticket #${data.referenceNumber} is ${data.newStatus} (For: ${data.passengerEmail})`,
          html: generateHtml(data.passengerEmail),
        });
        return fallbackRes;
      }
    } else {
      console.log(`[Resend Success] Status update email sent to ${data.passengerEmail} (ID: ${response.data?.id})`);
    }

    return response;
  } catch (error) {
    console.error(`[Resend Exception] Failed to send status update email to ${data.passengerEmail}:`, error);
  }
}
