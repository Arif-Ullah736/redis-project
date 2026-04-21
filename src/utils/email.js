const nodemailer = require("nodemailer");

const getBrandName = () => process.env.EMAIL_FROM_NAME || "MaheDeluxe";

const getAdminEmail = () =>
  process.env.ADMIN_EMAIL || process.env.EMAIL_ADMIN || process.env.EMAIL_USER;

const normalizeEmailList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [String(value)].filter(Boolean);
};

const listHasEmail = (listValue, email) => {
  if (!email) return false;
  const normalizedEmail = String(email).trim().toLowerCase();
  return normalizeEmailList(listValue).some(
    (v) => String(v).trim().toLowerCase() === normalizedEmail
  );
};

/**
 * Create Gmail / SMTP transporter
 */
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT);
  const secure =
    typeof process.env.EMAIL_SECURE === "string"
      ? process.env.EMAIL_SECURE.toLowerCase() === "true"
      : port === 465;

  if (port === 465 && !secure) {
    throw new Error(
      "Invalid SMTP config: EMAIL_PORT=465 requires EMAIL_SECURE=true (or use EMAIL_PORT=587 with EMAIL_SECURE=false)."
    );
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email (Gmail in prod, Ethereal in dev fallback)
 */
const sendEmail = async (options) => {
  try {
    const hasEmailCreds =
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS;

    let transporter;
    let fromAddress;

    // ✅ Use Ethereal if env creds are missing (development fallback)
    if (!hasEmailCreds) {
      const testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      fromAddress = `"${getBrandName()}" <${testAccount.user}>`;
    } else {
      transporter = createTransporter();
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      fromAddress = `"${getBrandName()}" <${fromEmail}>`;
    }

    const adminEmail = getAdminEmail();
    const alwaysBccAdmin =
      typeof process.env.ALWAYS_BCC_ADMIN === "string" &&
      process.env.ALWAYS_BCC_ADMIN.toLowerCase() === "true";

    const shouldBccAdmin =
      alwaysBccAdmin &&
      adminEmail &&
      !options.skipAdminBcc &&
      !listHasEmail(options.to, adminEmail) &&
      !listHasEmail(options.cc, adminEmail) &&
      !listHasEmail(options.bcc, adminEmail);

    const mergedBcc = [
      ...normalizeEmailList(options.bcc),
      ...(shouldBccAdmin ? [adminEmail] : []),
    ];

    const mailOptions = {
      from: fromAddress,
      to: options.to,
      cc: options.cc,
      bcc: mergedBcc.length ? mergedBcc.join(",") : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log preview URL only for Ethereal
    if (!hasEmailCreds) {
      console.log("📧 Ethereal Email Preview:");
      console.log(nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

/**
 * Notify user their account is under verification (registration received)
 */
const sendRegistrationPendingEmail = async (user) => {
  const roleLabel = user.role === "user" ? "customer" : user.role;

  return sendEmail({
    to: user.email,
    subject: "Registration received — under verification",
    html: `
            <h2>Thanks for registering, ${user.name}.</h2>
            <p>We received your ${roleLabel} registration and it is currently <strong>under verification</strong>.</p>
            <p>We’ll email you again as soon as an admin approves your account.</p>
            <br />
            <p>Regards,<br /><strong>${getBrandName()} Team</strong></p>
        `,
  });
};

/**
 * Notify admin of new registration
 */
const sendAdminNewRegistrationEmail = async (user) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return null;

  const roleLabel = user.role === "user" ? "customer" : user.role;

  return sendEmail({
    to: adminEmail,
    subject: `New ${roleLabel} registration: ${user.name}`,
    html: `
            <h2>New registration received</h2>
            <p>A new user has registered and is waiting for verification.</p>
            <ul>
                <li><strong>Name:</strong> ${user.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${roleLabel}</li>
                <li><strong>User ID:</strong> ${user.id}</li>
            </ul>
            <p>Please review in the Admin Panel approvals section.</p>
            <br />
            <p>${getBrandName()}</p>
        `,
  });
};

/**
 * Notify user their account is approved
 */
const sendAccountApprovedEmail = async (user) => {
  const roleLabel = user.role === "user" ? "customer" : user.role;

  return sendEmail({
    to: user.email,
    subject: "Your account has been approved",
    html: `
            <h2>Good news, ${user.name}!</h2>
            <p>Your ${roleLabel} account has been <strong>approved</strong>.</p>
            <p>You can now sign in and start using the platform.</p>
            <br />
            <p>Regards,<br /><strong>${getBrandName()} Team</strong></p>
        `,
  });
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: "Welcome to Our Platform!",
    html: `
      <h1>Welcome ${user.name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Email: <strong>${user.email}</strong></p>
      <br />
      <p>Best regards,<br>The Team</p>
    `,
  });
};

/**
 * Send password reset OTP email
 */
const sendPasswordResetEmail = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: "Your Password Reset OTP",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>Your One-Time Password (OTP) is:</p>

      <div style="
        font-size: 24px;
        font-weight: bold;
        background: #f3f4f6;
        padding: 12px 20px;
        border-radius: 6px;
        letter-spacing: 3px;
        display: inline-block;
        margin: 10px 0;
      ">
        ${otp}
      </div>

      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>If you didn’t request this, please ignore this email.</p>
      <br />
      <p>Regards,<br><strong>SwissCRM Team</strong></p>
    `,
  });
};

/**
 * Send email verification email
 */
const sendEmailVerification = async (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: "Verify Your Email Address",
    html: `
      <h1>Email Verification</h1>
      <p>Hi ${user.name},</p>
      <p>Please verify your email by clicking the button below:</p>

      <a href="${verifyUrl}" style="
        background: #28a745;
        color: #fff;
        padding: 10px 20px;
        border-radius: 5px;
        text-decoration: none;
        display: inline-block;
        margin-top: 10px;
      ">
        Verify Email
      </a>

      <p>This link expires in 24 hours.</p>
      <br />
      <p>Best regards,<br>The Team</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendRegistrationPendingEmail,
  sendAdminNewRegistrationEmail,
  sendAccountApprovedEmail,
};
