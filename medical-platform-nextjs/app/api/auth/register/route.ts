// Register route - aligned with Python auth_system.py register_user()
// Writes to "users" collection with Python field names
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'bcryptjs'
import { usersCol } from '@/lib/db/collections'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { full_name, email, password, role, medical_license, specialization } = body

        if (!full_name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const col = await usersCol()
        const existing = await col.findOne({ email })
        if (existing) {
            return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
        }

        // Use bcrypt (more secure than Python's SHA-256; verifyPassword handles both)
        const hashedPassword = await hash(password, 12)
        const now = new Date().toISOString()
        const userId = uuidv4()

        await col.insertOne({
            user_id: userId,
            email,
            password: hashedPassword,
            full_name,
            medical_license: medical_license || undefined,
            specialization: specialization || undefined,
            created_at: now,
            last_login: undefined,
            is_verified: false,
            // Python sets role based on whether medical_license is provided
            role: medical_license ? 'doctor' : (role || 'patient'),
        })

        return NextResponse.json({
            success: true,
            user: { user_id: userId, full_name, email, role: medical_license ? 'doctor' : (role || 'patient') },
        })
    } catch (error: any) {
        console.error('Registration error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to create account' }, { status: 500 })
    }
}
