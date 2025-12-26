// lib/prisma.ts
import 'dotenv/config'
import { PrismaClient, } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

// Test de conexión (opcional - solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Conectado a PostgreSQL (via Prisma Accelerate)')
    })
    .catch((error) => {
      console.error('❌ Error conectando a PostgreSQL:', error.message)
    })
}

export default prisma