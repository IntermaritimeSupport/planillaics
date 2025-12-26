#!/bin/bash
vercel env pull
npx tsx prisma/seed.ts