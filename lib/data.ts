import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "./prisma";

export async function getLayoutData(companyIdFromUrl: string) {
  const { userId: clerkId, sessionClaims } = await auth();

  // 1. Validar autenticación
  if (!clerkId) {
    redirect("/sign-in");
  }

  // 2. Buscar usuario con sus compañías
  const userInDb = await prisma.user.findUnique({
    where: { clerkId },
    include: { companias: true },
  });

  if (!userInDb) {
    console.error(`Usuario no encontrado en DB para clerkId: ${clerkId}`);
    return { error: "no-access" };
  }

  // 3. Definir roles y permisos
  // @ts-ignore
  const userRole = sessionClaims?.metadata?.role || userInDb.rol;
  const isSuperAdmin = userRole === "super_admin";
  const userCompanyIds = userInDb.companias.map((c) => c.id);

  // 4. Validar acceso a la compañía de la URL
  const hasAccess = isSuperAdmin || userCompanyIds.includes(companyIdFromUrl);

  if (!hasAccess) {
    if (userCompanyIds.length > 0) {
      redirect(`/${userCompanyIds[0]}/dashboard`);
    } else {
      return { error: "no-access" };
    }
  }

  // 5. Cargar lista de compañías según rol
  let companiesForContext;
  if (isSuperAdmin) {
    companiesForContext = await prisma.company.findMany();
  } else {
    // Para Admin/User, mostrar solo las que tiene asignadas
    companiesForContext = userInDb.companias;
  }

  // 6. Formatear datos para el cliente (Serialización)
  const initialCompanies = companiesForContext.map((c) => ({
    ...c,
    fechaCreacion: c.fechaCreacion.toISOString(),
    email: c.email ?? undefined,
    direccion: c.direccion ?? undefined,
    telefono: c.telefono ?? undefined,
    representanteLegal: c.representanteLegal ?? undefined,
  }));

  const initialUser = {
    id: userInDb.id,
    nombre: userInDb.nombre,
    email: userInDb.email,
    rol: userRole,
    image: userInDb.image ?? undefined,
    companias: userInDb.companias.map((c) => ({ id: c.id, nombre: c.nombre })),
  };

  return {
    initialUser,
    initialCompanies,
    currentCompanyId: companyIdFromUrl,
    error: null,
  };
}