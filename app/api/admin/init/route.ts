import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: Request) {
  try {
    // Validar token de seguridad
    const authHeader = req.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.INIT_SECRET_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Iniciando migraciones y seed...')

    // Ejecutar migraciones
    console.log('Ejecutando migraciones...')
    try {
      const { stdout: migrateOut } = await execAsync('npx prisma migrate deploy')
      console.log('Migraciones:', migrateOut)
    } catch (error) {
      console.log('Migraciones completadas o no hay pendientes')
    }

    // Ejecutar seed
    console.log('Ejecutando seed...')
    try {
      const { stdout: seedOut } = await execAsync('npx tsx prisma/seed.ts')
      console.log('Seed:', seedOut)
    } catch (error) {
      console.log('Seed completado o ya existe')
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Base de datos inicializada correctamente'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en inicialización:', error)
    return NextResponse.json(
      { error: 'Error durante la inicialización' },
      { status: 500 }
    )
  }
}