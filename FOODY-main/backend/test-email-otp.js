import dotenv from 'dotenv'
import { sendOtpMail } from './utils/mail.js'

// Load environment variables from backend/.env explicitly when running from repo root
dotenv.config({ path: './backend/.env' })

async function testEmailOTP() {
  console.log('🧪 Testing OTP Email Functionality...')
  console.log('📧 Email Configuration:')
  console.log(`   EMAIL: ${process.env.EMAIL || process.env.SMTP_USER}`)
  const passSet = (process.env.PASS || process.env.EMAIL_PASS || process.env.SMTP_PASS) ? '***configured***' : 'NOT SET'
  console.log(`   PASS: ${passSet}`)
  console.log('')

  // Use configured email for testing, fallback to TEST_EMAIL if provided
  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL || process.env.SMTP_USER || 'test@example.com'
  const testOTP = '1234'

  try {
    console.log(`📤 Attempting to send test OTP to: ${testEmail}`)
    await sendOtpMail(testEmail, testOTP)
    console.log('✅ Test completed! Check your inbox (and spam folder).')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }

  console.log('')
  console.log('📋 Notes:')
  console.log('• If using Gmail, ensure 2-Step Verification is ON and use an App Password.')
  console.log('• SMTP settings are read from EMAIL/EMAIL_PASS or SMTP_USER/SMTP_PASS with SMTP_HOST/SMTP_PORT.')
}

testEmailOTP()