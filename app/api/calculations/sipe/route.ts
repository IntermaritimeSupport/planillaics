import { NextResponse } from 'next/server'
import { calculateSIPEPaymentCompany } from '@/lib/payroll-calculations'
import prisma from '@/lib/prisma'

// POST /api/calculations/sipe - Calcula el total a pagar del SIPE para un periodo
export async function POST(request: Request) {
    try {
        const { companiaId, periodo } = await request.json() // periodo: YYYY-MM

        if (!companiaId || !periodo) {
            return NextResponse.json({ error: 'Missing companiaId or periodo' }, { status: 400 })
        }

        // 1. Obtener todos los empleados activos de la compañía
        const allEmployees = await prisma.employee.findMany({ where: { companiaId, estado: "activo" } })
        if (allEmployees.length === 0) {
            return NextResponse.json({ message: 'No active employees found for SIPE calculation' }, { status: 200 })
        }

        // 2. Obtener todas las entradas de planilla pagadas del periodo
        const payrollEntries = await prisma.payrollEntry.findMany({
            where: { companiaId, estado: "pagado" }
        }) // Se filtra por "pagado" para asegurar que solo se sume lo que realmente se calculó/pagó

        // 3. Obtener parámetros legales y rangos de ISR
        const legalParameters = await prisma.legalParameters.findMany({ where: { companiaId, activo: true } })
        // CORRECCIÓN: Añadir la obtención de los rangos de ISR (isrBrackets)
        const isrBrackets = await prisma.iSRBracket.findMany({ where: { companiaId, activo: true } })

        // 4. Ejecutar el cálculo del servidor
        // CORRECCIÓN: Añadir isrBrackets como parámetro en el objeto
        const result = calculateSIPEPaymentCompany({
            employees: allEmployees as any,
            payrollEntries: payrollEntries as any,
            periodo,
            tipoPeriodo: "mensual", // Ajustar según necesidad
            legalParameters: legalParameters as any,
        })

        // Se retorna el resultado sin guardar, el frontend decidirá si guardar con un POST a /api/sipe-payments
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error calculating SIPE payment:', error)
        return NextResponse.json({ error: 'Failed to calculate SIPE payment' }, { status: 500 })
    }
}
