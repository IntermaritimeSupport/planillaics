

export async function POST(req: Request) {
  // Validar que sea una petición interna/segura
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Aquí va el contenido de tu seed.ts
    // (Copia todo el código del main())
    
    return Response.json({ 
      success: true, 
      message: 'Seed ejecutado exitosamente' 
    })
  } catch (error) {
    console.error('Error en seed:', error)
    return Response.json({ error: 'Seed failed' }, { status: 500 })
  }
}