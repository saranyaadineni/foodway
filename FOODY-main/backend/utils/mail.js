import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()

// Helper to resolve current env-based mail configuration
const resolveMailEnv = () => {
  const MAIL_USER = process.env.EMAIL || process.env.SMTP_USER
  const MAIL_PASS = process.env.PASS || process.env.EMAIL_PASS || process.env.SMTP_PASS
  const MAIL_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
  const MAIL_PORT = Number(process.env.SMTP_PORT || 465)
  return { MAIL_USER, MAIL_PASS, MAIL_HOST, MAIL_PORT }
}

let transporter = null
let mailerInitialized = false
let mailerDisabledWarned = false

const getTransporter = async () => {
  // Lazily create transporter using the latest env values
  if (!transporter) {
    const { MAIL_USER, MAIL_PASS, MAIL_HOST, MAIL_PORT } = resolveMailEnv()
    const hasMailerCreds = !!(MAIL_USER && MAIL_PASS)
    if (hasMailerCreds) {
      transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: MAIL_PORT,
        secure: MAIL_PORT === 465,
        auth: { user: MAIL_USER, pass: MAIL_PASS },
      })
    }
  }

  // Verify existing transporter once to avoid repeated login attempts
  if (transporter && !mailerInitialized) {
    try {
      await transporter.verify()
      mailerInitialized = true
    } catch (err) {
      console.warn(
        `[MAILER] Transport verify failed: ${err?.message || err}. Disabling mail send.`
      )
      transporter = null
    }
  }

  // Dev/test fallback using Ethereal if explicitly requested
  if (!transporter && process.env.USE_TEST_MAIL === "1") {
    try {
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
      mailerInitialized = true
      console.log("[DEV] Using Ethereal test SMTP for emails.")
    } catch (e) {
      console.warn(
        `[MAILER] Failed to create Ethereal test account: ${e?.message || e}`
      )
    }
  }

  if (!transporter && !mailerDisabledWarned) {
    mailerDisabledWarned = true
    console.warn(
      "Email sending disabled. Provide valid EMAIL/EMAIL_PASS or SMTP_USER/SMTP_PASS or set USE_TEST_MAIL=1 in .env for dev."
    )
  }

  return transporter
}

const safeSendMail = async (mailOptions) => {
  const activeTransporter = await getTransporter()
  if (!activeTransporter) {
    const to = Array.isArray(mailOptions.to)
      ? mailOptions.to.join(", ")
      : mailOptions.to
    console.log(
      `[DEV] Skipping email send. Intended to: ${to}. Subject: ${mailOptions.subject}`
    )
    return Promise.resolve()
  }
  try {
    const info = await activeTransporter.sendMail(mailOptions)
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`[DEV] Email preview: ${previewUrl}`)
    }
    return info
  } catch (err) {
    // Do not propagate mail errors; log once and continue to avoid noisy logs/500s
    console.warn(`[MAILER] sendMail failed: ${err?.message || err}`)
    return Promise.resolve()
  }
}

export const sendOtpMail = async (email, otp) => {
  const { MAIL_USER } = resolveMailEnv()
  await safeSendMail({
    from: MAIL_USER || "no-reply@foodway.dev",
    to: email,
    subject: "OTP",
    html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  })
  if (process.env.USE_TEST_MAIL !== "1") {
    console.log(`[DEV] OTP for ${email}: ${otp}`)
  }
}

export const sendDeliveryOtpMail = async (user, otp) => {
  const { MAIL_USER } = resolveMailEnv()
  await safeSendMail({
    from: MAIL_USER || "no-reply@foodway.dev",
    to: user.email,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 2 hours.</p>`,
  })
  if (process.env.USE_TEST_MAIL !== "1") {
    console.log(`[DEV] Delivery OTP for ${user.email}: ${otp}`)
  }
}
