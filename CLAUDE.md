# Proyecto: Seguimiento de Flota

## Contexto de negocio
App para que el cliente (dueño de camiones, actualmente 2, pensado para escalar a más clientes) lleve control de su flota: vehículos, documentos legales (permiso de circulación, revisión técnica, seguro), kilometraje y mantenciones preventivas. Notificaciones vía Telegram cuando algo está por vencer o toca mantención.

Usuario final principal (rol admin) tiene poco manejo de tecnología → UI simple, mobile-first, sin fricción.

## Restricción dura: presupuesto $0
Todo debe mantenerse en free tier: Vercel Hobby, Supabase free, Telegram Bot API. Si Claude Code propone algo que requiera pago (otro servicio, plan superior, API de pago), debe decirlo explícito ANTES de implementarlo, no asumir que está bien.

## Stack
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage)
- Tailwind CSS
- Vercel Hobby (hosting + 1 cron job diario — límite del plan: máx. 1 ejecución/día)
- Telegram Bot API vía webhook en `/api/telegram/webhook`

## Roles (RLS en Supabase, no solo en frontend)
- `superadmin`: acceso total, es el desarrollador/soporte
- `admin`: dueño de la flota, gestiona todo dentro de su empresa
- `conductor`: solo ve y actualiza el kilometraje de su vehículo asignado

## Reglas de negocio clave (Fase 1 — MVP)
- Fecha de vencimiento de documentos: se ingresa **manual** al subir el archivo. NO hay OCR/IA en esta fase (queda para fase 2, tiene costo).
- Mantención: cada vehículo tiene `intervalo_mantencion_km`. Se debe avisar cuando `km_actual - km_ultima_mantencion` se acerca al intervalo (definir umbral, ej. faltando 500-1000 km).
- El cron diario revisa documentos por vencer (ej. <15 días) y mantenciones próximas, y manda notificación por Telegram. Debe evitar mandar el mismo aviso más de una vez (usar `notificaciones_log`).
- Es una PWA responsive (no apps nativas de tienda).

## Modelo de datos
Fuente de verdad: `supabase/schema.sql`. Ejecutarlo completo en el SQL Editor de Supabase antes de programar features que dependan de las tablas.

Tablas: `empresas`, `profiles`, `flotas`, `vehiculos`, `documentos`, `km_historial`, `notificaciones_log`.

## Convenciones
- Nombres de tablas/columnas en español, snake_case
- Toda regla de permisos vive en RLS de Supabase, el frontend no es la barrera de seguridad
- Componentes simples, evitar sobre-ingeniería — el objetivo es tener algo mostrable pronto, no arquitectura perfecta
- Antes de instalar una dependencia nueva, preguntar si es realmente necesaria (mantener el bundle liviano para Vercel Hobby)
