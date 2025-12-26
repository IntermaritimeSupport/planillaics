// File: app/api/employees/[id]/route.ts

import { NextResponse } from 'next/server'
import { EmployeeDeduction } from '@/lib/types'
import prisma from '@/lib/prisma'

// PATCH /api/employees/[id] - Actualizar un empleado
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const data = await request.json() as Record<string, unknown>

    const updatedData: any = {
      ...data,
      fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso as string) : undefined,
      salarioBase: data.salarioBase ? Number(data.salarioBase) : undefined,
      // Manejar el campo JSON
      otrasDeduccionesPersonalizadas: data.otrasDeduccionesPersonalizadas 
        ? JSON.stringify(data.otrasDeduccionesPersonalizadas as EmployeeDeduction[]) 
        : undefined,
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updatedData,
    })

    const serializedEmployee = {
        ...updatedEmployee,
        fechaIngreso: updatedEmployee.fechaIngreso.toISOString().split('T')[0],
        otrasDeduccionesPersonalizadas: JSON.parse(updatedEmployee.otrasDeduccionesPersonalizadas as string),
    }

    return NextResponse.json(serializedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// DELETE /api/employees/[id] - Eliminar un empleado
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    
    await prisma.employee.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}