# Flota Tracker

Seguimiento de flota de vehículos: documentos legales, kilometraje, mantenciones y notificaciones por Telegram.

## Setup inicial

1. Crear proyecto en [Supabase](https://supabase.com) (free tier)
2. Ejecutar `supabase/schema.sql` completo en el SQL Editor de Supabase
3. Crear bucket de Storage llamado `documentos` (privado, se accede vía URL firmada)
4. Crear bot en Telegram con [@BotFather](https://t.me/BotFather), guardar el token
5. Copiar `.env.example` a `.env.local` y completar todas las variables
6. `npm install`
7. `npm run dev`

## Deploy

- Repo conectado a Vercel (Hobby plan)
- Configurar las mismas variables de entorno en Vercel > Settings > Environment Variables
- El cron job (`vercel.json`) llama a `/api/cron/revisar-vencimientos` una vez al día — límite del plan Hobby, no se puede más seguido
- Registrar el webhook de Telegram apuntando a `https://<tu-dominio>.vercel.app/api/telegram/webhook`

## Limitaciones del stack gratuito (léelas antes de que te sorprendan en prod)

- **Supabase free**: el proyecto se pausa automáticamente tras 7 días sin actividad. El cron diario le pega un ping y evita esto.
- **Vercel Hobby cron**: máximo 1 ejecución al día, no sirve para notificaciones en tiempo real.
- **Supabase Storage free**: 1GB total — de sobra para 2-3 vehículos, ojo si escala a muchos clientes.
- **Supabase DB free**: 500MB — no debería ser problema para este volumen de datos.

## Cronograma de referencia (2 semanas)

**Semana 1**
- Día 1-2: repo, Supabase, schema, auth básica, primer deploy
- Día 3-4: CRUD de flotas y vehículos + verificar RLS por rol
- Día 5-7: subida de documentos (Storage) + fecha de vencimiento manual + actualización de km con historial

**Semana 2**
- Día 8-9: reglas de mantención (intervalo por km) + cálculo de próximos avisos
- Día 10-11: bot de Telegram (vincular chat_id a usuario) + cron diario de notificaciones
- Día 12-13: pulir UI mobile, probar con el cliente real, ajustes
- Día 14: buffer / demo final

## Roles

| Rol | Puede |
|---|---|
| superadmin | todo, todas las empresas |
| admin | gestiona su empresa completa (flotas, vehículos, docs, usuarios) |
| conductor | ve y actualiza el km de su vehículo asignado |
