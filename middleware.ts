import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ---
// (NUEVO) CORRECCIÓN DE TIPOS DE CLERK
// ---
type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user' | 'member' | string | null | undefined;

interface CustomOrganizationClaims {
    rol: AppRole;
}

declare global {
    interface Auth {
        sessionClaims: Record<string, unknown> & {
            o?: CustomOrganizationClaims;
        };
    }
}
// ---
// (FIN DE LA CORRECCIÓN)
// ---


// ---
// 1. Definir Rutas Públicas
// ---
const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',             // La página de inicio de sesión
    '/not-access(.*)',         // Página de "Acceso no válido"
    '/api/webhooks/clerk(.*)', // Webhook de Clerk
    '/api/admin/init(.*)',     // ← AGREGAR ESTA LÍNEA para la inicialización
])

// ---
// 2. Definir Configuración de Roles
// ---

const VALID_APP_ROLES: string[] = [
    'super_admin',
    'admin',
    'moderator',
];

const roleConfig = {
    '/dashboard': ['super_admin', 'admin', 'moderator'],
    '/empleados': ['super_admin', 'admin', 'moderator'],
    '/calcular-planilla': ['super_admin', 'admin', 'moderator'],
    '/decimo-tercer-mes': ['super_admin', 'admin', 'moderator'],
    '/impuesto-sobre-renta': ['super_admin', 'admin', 'moderator'],
    '/pagos-sipe': ['super_admin', 'admin', 'moderator'],
    '/reportes': ['super_admin', 'admin', 'moderator'],
    '/parametros': ['super_admin', 'admin', 'moderator'],
    '/empresas': ['super_admin', 'admin'],
    '/configuracion': ['super_admin', 'admin'],
}

export default clerkMiddleware(async (auth, req) => {
    // 3. Permitir rutas públicas
    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    const { userId, sessionClaims } = await auth();

    if (!userId) {
        // 4. Si no está logueado, redirigir a sign-in
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
    }

    // ---
    // 5. Lógica de Autorización (Roles)
    // ---

    const userRole = (sessionClaims?.o as CustomOrganizationClaims | undefined)?.rol
    const { pathname } = req.nextUrl

    console.log(`Middleware: Usuario ${userId} con rol '${userRole}' accediendo a ${pathname}`)

    // ---
    // Validación de Rol Válido
    // ---
    const hasValidRole = userRole && VALID_APP_ROLES.includes(userRole);

    if (!hasValidRole) {
        console.warn(`Usuario ${userId} (rol: '${userRole}') no tiene un rol válido. Redirigiendo a /not-access.`);

        if (pathname.startsWith('/not-access')) {
            return NextResponse.next();
        }

        const notAccessUrl = new URL('/not-access', req.url);
        return NextResponse.redirect(notAccessUrl);
    }

    // 6. Analizar la ruta solicitada
    const parts = pathname.split('/').filter(Boolean)

    if (parts.length < 2) {
        return NextResponse.next()
    }

    const routeBase = '/' + parts[1]

    // 7. Validar permiso
    const requiredRoles = roleConfig[routeBase as keyof typeof roleConfig]

    if (requiredRoles) {
        if (!requiredRoles.includes(userRole!)) {
            const companyId = parts[0]
            const dashboardUrl = new URL(`/${companyId}/dashboard`, req.url)
            dashboardUrl.searchParams.set('error', 'unauthorized')

            console.warn(`Acceso denegado: Usuario ${userId} (rol: ${userRole}) intentó acceder a ${pathname}`)

            return NextResponse.redirect(dashboardUrl)
        }
    }

    // 8. Dejar pasar
    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}