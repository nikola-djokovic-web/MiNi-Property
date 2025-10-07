import { Resend } from "resend";
import nodemailer from "nodemailer";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "MiNi Property <no-reply@yourdomain.com>";

// Try Resend first (if configured)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Prepare SMTP transporter only if env is present (fallback)
const hasSmtp =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (or configure RESEND_API_KEY)."
    );
  }
  try {
    const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    return info;
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    throw error;
  }
}

export async function sendWorkerInviteEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const link = `${APP_URL}/register?token=${encodeURIComponent(token)}`;
  const subject = "You're invited to MiNi Property";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">You've been invited to MiNi Property</h2>
      <p>You've been invited to join our property management platform.</p>
      <div style="margin: 30px 0;">
        <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Registration
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
      <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 11px;">Direct link: ${link}</p>
    </div>
  `;

  console.log(`Attempting to send email to: ${email}`);
  console.log(`Generated registration link: ${link}`);
  console.log(`Token in link: ${token}`);
  console.log(`Using Resend API Key: ${RESEND_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`Email FROM: ${EMAIL_FROM}`);
  console.log(`App URL: ${APP_URL}`);

  // Prefer Resend when available
  if (resend) {
    try {
      console.log("Sending via Resend...");
      const result = await resend.emails.send({ 
        from: EMAIL_FROM, 
        to: email, 
        subject, 
        html 
      });
      console.log("Resend success:", result);
      return result;
    } catch (err) {
      console.error("Resend failed:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      // fall through to SMTP
    }
  } else {
    console.log("Resend not configured, trying SMTP...");
  }

  // Fallback to SMTP
  if (transporter) {
    console.log("Sending via SMTP...");
    return sendEmail(email, subject, html);
  } else {
    console.error("No email service configured!");
    throw new Error("No email service configured. Please set RESEND_API_KEY or SMTP credentials.");
  }
}

export async function sendAdminInviteEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const link = `${APP_URL}/register?token=${encodeURIComponent(token)}`;
  const subject = "Administrator Invitation - MiNi Property";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">You've been invited as an Administrator</h2>
      <p>You've been invited to join MiNi Property as an administrator with full management permissions.</p>
      <p><strong>As an administrator, you will be able to:</strong></p>
      <ul style="color: #666;">
        <li>Manage properties and units</li>
        <li>Invite and manage tenants</li>
        <li>Invite and manage workers</li>
        <li>Handle maintenance requests</li>
        <li>Access all administrative features</li>
      </ul>
      <div style="margin: 30px 0;">
        <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Administrator Registration
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
      <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 11px;">Direct link: ${link}</p>
    </div>
  `;

  console.log(`Attempting to send admin invitation to: ${email}`);
  console.log(`Generated registration link: ${link}`);
  console.log(`Token in link: ${token}`);
  console.log(`Using Resend API Key: ${RESEND_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`Email FROM: ${EMAIL_FROM}`);
  console.log(`App URL: ${APP_URL}`);

  // Prefer Resend when available
  if (resend) {
    try {
      console.log("Sending admin invitation via Resend...");
      const result = await resend.emails.send({ 
        from: EMAIL_FROM, 
        to: email, 
        subject, 
        html 
      });
      console.log("Resend success:", result);
      return result;
    } catch (err) {
      console.error("Resend failed:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      // fall through to SMTP
    }
  } else {
    console.log("Resend not configured, trying SMTP...");
  }

  // Fallback to SMTP
  if (transporter) {
    console.log("Sending admin invitation via SMTP...");
    return sendEmail(email, subject, html);
  } else {
    console.error("No email service configured!");
    throw new Error("No email service configured. Please set RESEND_API_KEY or SMTP credentials.");
  }
}
