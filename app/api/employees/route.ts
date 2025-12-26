import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { EmployeeDeduction } from "@/lib/types"

// ===============================
// Helper: manejo seguro de Json
// ===============================
const safeParseJsonField = (
  field: unknown
): EmployeeDeduction[] => {
  if (!field) return []

  if (Array.isArray(field)) {
    return field as unknown as EmployeeDeduction[]
  }

  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed)
        ? (parsed as unknown as EmployeeDeduction[])
        : []
    } catch {
      return []
    }
  }

  return []
}

// ===============================
// POST /api/employees
// ===============================
export async function POST(request: Request) {
  try {
    const data = await request.json() as Record<string, unknown>

    if (!data.companiaId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        cedula: data.cedula as string,
        nombre: data.nombre as string,
        apellido: data.apellido as string,
        fechaIngreso: new Date(data.fechaIngreso as string),
        salarioBase: Number(data.salarioBase),
        departamento: data.departamento as string,
        cargo: data.cargo as string,
        estado: (data.estado as string) ?? "activo",
        email: data.email as string,
        telefono: data.telefono as string,
        direccion: data.direccion as string,
        deduccionesBancarias: data.deduccionesBancarias as number | null | undefined,
        mesesDeduccionesBancarias: (data.mesesDeduccionesBancarias as number[] | undefined) ?? [],
        prestamos: data.prestamos as number | null | undefined,
        mesesPrestamos: (data.mesesPrestamos as number[] | undefined) ?? [],
        otrasDeduccionesPersonalizadas:
          data.otrasDeduccionesPersonalizadas ?? [],
        company: {
          connect: { id: data.companiaId as string },
        },
      },
    })

    return NextResponse.json(
      {
        ...employee,
        fechaIngreso: employee.fechaIngreso
          .toISOString()
          .split("T")[0],
        otrasDeduccionesPersonalizadas: safeParseJsonField(
          employee.otrasDeduccionesPersonalizadas
        ),
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating employee:", error)

    // ✔ Manejo de unicidad sin Prisma namespace
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "La cédula ya existe para esta compañía." },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    )
  }
}

// ===============================
// GET /api/employees
// ===============================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companiaId = searchParams.get("companiaId")

    if (!companiaId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      )
    }

    const employees = await prisma.employee.findMany({
      where: { companiaId },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(
      employees.map((emp) => ({
        ...emp,
        fechaIngreso: emp.fechaIngreso
          .toISOString()
          .split("T")[0],
        otrasDeduccionesPersonalizadas: safeParseJsonField(
          emp.otrasDeduccionesPersonalizadas
        ),
      }))
    )
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}
