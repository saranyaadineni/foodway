import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'

dotenv.config()

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log('Connected to MongoDB')

    const user = await User.findOne({ email: 'superadmin@foodway.com' })
    if (!user) {
      console.log('No superadmin user found')
      process.exit(0)
    }

    console.log('Found user:', {
      email: user.email,
      role: user.role,
      id: user._id.toString(),
    })

    const ok = await bcrypt.compare('superadmin123', user.password || '')
    console.log('Password "superadmin123" match:', ok)

    await mongoose.disconnect()
  } catch (err) {
    console.error('Check error:', err)
  } finally {
    process.exit(0)
  }
}

run()

