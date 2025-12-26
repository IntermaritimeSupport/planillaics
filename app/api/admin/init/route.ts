import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Validar token de seguridad
    const authHeader = req.headers.get('authorization')
    const secretKey = process.env.INIT_SECRET_KEY
    
    if (!secretKey) {
      return NextResponse.json(
        { error: 'INIT_SECRET_KEY no configurado' },
        { status: 500 }
      )
    }
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Token inválido' },
        { status: 401 }
      )
    }

    // Verificar que DATABASE_URL existe
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL no está configurado en Vercel' },
        { status: 500 }
      )
    }

    console.log('Endpoint inicialización listo')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...')

    return NextResponse.json(
      { 
        success: true,
        message: 'Endpoint de inicialización está funcionando',
        instructions: [
          '1. Verifica que DATABASE_URL está configurado en Vercel',
          '2. Ejecuta localmente: npx prisma db seed',
          '3. O ejecuta en terminal de Vercel: npm run seed'
        ]
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { 
        error: 'Error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}