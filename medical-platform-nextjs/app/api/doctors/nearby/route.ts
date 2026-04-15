import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function parseCSV(content: string) {
    const lines = content.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''))
    return lines.slice(1).map(line => {
        // Handle commas within quoted fields
        const values: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of line) {
            if (char === '"') inQuotes = !inQuotes
            else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
            else current += char
        }
        values.push(current.trim().replace(/\r/g, ''))
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = values[i] || '' })
        return obj
    }).filter(d => d['Name'])
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')?.toLowerCase().trim() || ''
        const specialty = searchParams.get('specialty')?.toLowerCase().trim() || ''
        const sort = searchParams.get('sort') || 'experience'

        const csvPath = path.join(process.cwd(), 'public', 'data', 'mumbai_doctors.csv')
        const csvContent = fs.readFileSync(csvPath, 'utf-8')
        let doctors = parseCSV(csvContent)

        // Filter by city (partial match)
        if (city) {
            doctors = doctors.filter(d =>
                d['City']?.toLowerCase().includes(city) ||
                city.includes(d['City']?.toLowerCase())
            )
        }

        // Filter by specialty
        if (specialty) {
            doctors = doctors.filter(d =>
                d['Specialty']?.toLowerCase().includes(specialty)
            )
        }

        // Sort
        if (sort === 'experience') {
            doctors.sort((a, b) => parseInt(b['Experience_Years']) - parseInt(a['Experience_Years']))
        } else {
            doctors.sort((a, b) => a['Name'].localeCompare(b['Name']))
        }

        // Get unique specialties for filter dropdown
        const allDoctors = parseCSV(csvContent)
        const specialties = [...new Set(allDoctors.map(d => d['Specialty']).filter(Boolean))].sort()
        const cities = [...new Set(allDoctors.map(d => d['City']).filter(Boolean))].sort()

        return NextResponse.json({
            success: true,
            data: doctors,
            total: doctors.length,
            specialties,
            cities,
        })
    } catch (error: any) {
        console.error('Doctors API error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
