import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export const runtime = 'nodejs'
export const maxDuration = 300

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

    console.log('Iniciando seeding...')

    // --- 1. CREAR COMPAÑÍAS ---
    const companyIntermaritime = await prisma.company.upsert({
      update: {},
      create: {
        nombre: 'Intermaritime',
        ruc: '800100200-1-2025',
        direccion: 'C0iudad de Panamá, Edificio TechHub, Piso 5',
        telefono: '+507 800-1234',
        email: 'info@intermaritime.com',
        representanteLegal: 'Representante Intermaritime',
        activo: true,
      },
      where: { ruc: '800100200-1-2025' },
    })
    console.log(`✓ Compañía: ${companyIntermaritime.nombre} (ID: ${companyIntermaritime.id})`)

    const companyPMTS = await prisma.company.upsert({
      where: { ruc: 'PMTS-RUC-EJEMPLO' },
      update: {},
      create: {
        nombre: 'PMTS',
        ruc: 'PMTS-RUC-EJEMPLO',
        direccion: 'Ciudad de Panamá, Oficina PMTS',
        telefono: '+507 300-5678',
        email: 'contact@pmts.com',
        representanteLegal: 'Representante PMTS',
        activo: true,
      },
    })
    console.log(`✓ Compañía: ${companyPMTS.nombre} (ID: ${companyPMTS.id})`)

    // --- 2. CREAR USUARIOS ---
    const passwordModerator = await hash('moderator123', 12)
    const passwordAdmin = await hash('admin123', 12)
    const passwordSuperAdmin = await hash('superadmin123', 12)

    const userModerator = await prisma.user.upsert({
      where: { email: 'contador@intermaritime.org' },
      update: { hashedPassword: passwordModerator },
      create: {
        nombre: 'Contador',
        email: 'contador@intermaritime.org',
        rol: 'moderator',
        activo: true,
        hashedPassword: passwordModerator,
        companias: {
          connect: [{ id: companyPMTS.id }],
        },
      },
    })
    console.log(`✓ Usuario: ${userModerator.email} (rol: ${userModerator.rol})`)

    const userAdmin = await prisma.user.upsert({
      where: { email: 'alex@intermaritime.org' },
      update: { hashedPassword: passwordAdmin },
      create: {
        nombre: 'Alexander Prosper',
        email: 'alex@intermaritime.org',
        rol: 'admin',
        activo: true,
        hashedPassword: passwordAdmin,
        companias: {
          connect: [{ id: companyIntermaritime.id }],
        },
      },
    })
    console.log(`✓ Usuario: ${userAdmin.email} (rol: ${userAdmin.rol})`)

    const userSuperAdmin = await prisma.user.upsert({
      where: { email: 'david@intermaritime.org' },
      update: {
        hashedPassword: passwordSuperAdmin,
        companias: {
          set: [
            { id: companyIntermaritime.id },
            { id: companyPMTS.id }
          ]
        }
      },
      create: {
        nombre: 'Carlos Sanchez',
        email: 'david@intermaritime.org',
        rol: 'super_admin',
        activo: true,
        clerkId: "user_34TpZ0SdkE9Yk22WNWmrKRI1HWT",
        hashedPassword: passwordSuperAdmin,
        companias: {
          connect: [
            { id: companyIntermaritime.id },
            { id: companyPMTS.id }
          ],
        },
      },
    })
    console.log(`✓ Usuario: ${userSuperAdmin.email} (rol: ${userSuperAdmin.rol})`)

    // --- 3. PARÁMETROS LEGALES E ISR ---
    const legalParams = [
      { nombre: 'CSS_EMPLEADO', tipo: 'DEDUCCION_FIJA', porcentaje: 9.75, fechaVigencia: new Date('2025-01-01') },
      { nombre: 'SEGURO_EDUCATIVO_EMPLEADO', tipo: 'DEDUCCION_FIJA', porcentaje: 1.25, fechaVigencia: new Date('2025-01-01') },
      { nombre: 'CSS_EMPLEADOR', tipo: 'APORTE_PATRONAL', porcentaje: 12.25, fechaVigencia: new Date('2025-01-01') },
      { nombre: 'SEGURO_EDUCATIVO_EMPLEADOR', tipo: 'APORTE_PATRONAL', porcentaje: 1.50, fechaVigencia: new Date('2025-01-01') },
      { nombre: 'RIESGO_PROFESIONAL', tipo: 'APORTE_PATRONAL', porcentaje: 0.98, fechaVigencia: new Date('2025-01-01') },
    ]

    await Promise.all(
      legalParams.map((param) =>
        prisma.legalParameters.upsert({
          where: {
            companiaId_nombre_fechaVigencia: {
              companiaId: companyIntermaritime.id,
              nombre: param.nombre,
              fechaVigencia: param.fechaVigencia,
            },
          },
          update: { porcentaje: param.porcentaje },
          create: {
            ...param,
            companiaId: companyIntermaritime.id,
          },
        })
      )
    )
    console.log(`✓ Parámetros legales para ${companyIntermaritime.nombre}`)

    const isrBrackets = [
      { desde: 0.00, hasta: 11000.00, porcentaje: 0, deduccionFija: 0 },
      { desde: 11000.01, hasta: 50000.00, porcentaje: 15, deduccionFija: 1650.00 },
      { desde: 50000.01, hasta: null, porcentaje: 25, deduccionFija: 6650.00 },
    ]

    await prisma.iSRBracket.deleteMany({ where: { companiaId: companyIntermaritime.id } })
    await prisma.iSRBracket.createMany({
      data: isrBrackets.map((bracket) => ({
        ...bracket,
        companiaId: companyIntermaritime.id,
      })),
    })
    console.log(`✓ Tramos ISR para ${companyIntermaritime.nombre}`)

    // --- 4. EMPLEADOS ---
    const employeesIntermaritime = [
      { cedula: '8-800-801', nombre: 'Ana', apellido: 'Gomez', salarioBase: 2200.00, cargo: 'Analista BI' },
      { cedula: '8-800-802', nombre: 'Luis', apellido: 'Pinto', salarioBase: 1800.00, cargo: 'Soporte IT' },
      { cedula: '8-800-803', nombre: 'Carla', apellido: 'Suarez', salarioBase: 3000.00, cargo: 'Gerente de Proyectos' },
      { cedula: '8-800-804', nombre: 'David', apellido: 'Ruiz', salarioBase: 1500.00, cargo: 'Asistente Contable' },
      { cedula: '8-800-805', nombre: 'Elena', apellido: 'Morales', salarioBase: 2500.00, cargo: 'Desarrolladora Sr.' },
    ]

    await Promise.all(
      employeesIntermaritime.map(emp => 
        prisma.employee.upsert({
          where: { companiaId_cedula: { companiaId: companyIntermaritime.id, cedula: emp.cedula } },
          update: { ...emp },
          create: {
            ...emp,
            companiaId: companyIntermaritime.id,
            fechaIngreso: new Date('2024-01-15'),
            departamento: 'Operaciones',
            estado: 'activo',
            email: `${emp.nombre.toLowerCase()}.${emp.apellido.toLowerCase()}@intermaritime.com`,
            mesesDeduccionesBancarias: [],
            mesesPrestamos: [],
          }
        })
      )
    )
    console.log(`✓ ${employeesIntermaritime.length} empleados para ${companyIntermaritime.nombre}`)

    const employeesPMTS = [
      { cedula: '9-900-901', nombre: 'Pedro', apellido: 'Martinez', salarioBase: 2100.00, cargo: 'Supervisor' },
      { cedula: '9-900-902', nombre: 'Sofia', apellido: 'Loren', salarioBase: 1900.00, cargo: 'Asistente Admin' },
      { cedula: '9-900-903', nombre: 'Jorge', apellido: 'Campos', salarioBase: 2800.00, cargo: 'Logística' },
      { cedula: '9-900-904', nombre: 'Maria', apellido: 'Delgado', salarioBase: 1600.00, cargo: 'Recepcionista' },
      { cedula: '9-900-905', nombre: 'Ricardo', apellido: 'Forte', salarioBase: 3200.00, cargo: 'Gerente de Flota' },
    ]

    await Promise.all(
      employeesPMTS.map(emp => 
        prisma.employee.upsert({
          where: { companiaId_cedula: { companiaId: companyPMTS.id, cedula: emp.cedula } },
          update: { ...emp },
          create: {
            ...emp,
            companiaId: companyPMTS.id,
            fechaIngreso: new Date('2023-11-01'),
            departamento: 'Administración',
            estado: 'activo',
            email: `${emp.nombre.toLowerCase()}.${emp.apellido.toLowerCase()}@pmts.com`,
            mesesDeduccionesBancarias: [],
            mesesPrestamos: [],
          }
        })
      )
    )
    console.log(`✓ ${employeesPMTS.length} empleados para ${companyPMTS.nombre}`)

    return NextResponse.json(
      { 
        success: true,
        message: 'Base de datos inicializada correctamente ✓',
        data: {
          companies: 2,
          users: 3,
          employees: 10,
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en seeding:', error)
    return NextResponse.json(
      { 
        error: 'Error durante la inicialización',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}