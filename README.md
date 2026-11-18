# Needu · MVP violeta

React + Vite y Supabase. Plataforma para ofrecer habilidades, encontrar servicios, publicar necesidades y conversar.

**[Probar demo sin cuenta](https://needu.patyapps.com/?demo=1)** · **[Abrir sitio](https://needu.patyapps.com/)**

Consultá [REVISION.md](./REVISION.md) para arquitectura, funcionalidades, límites y puntos sugeridos para revisar. Podés entrar al sitio con Google sin estar en una lista de prueba: Needu solicita únicamente identidad básica (`openid email profile`). La demo permite explorar el producto sin una cuenta.

## Iniciar

Requiere Node 22 o posterior.

```sh
npm install
npm run dev -- --port 5187
```

- Comunidad publicada: https://needu.patyapps.com/
- Desarrollo local: http://127.0.0.1:5187/ (el ingreso retorna al dominio publicado).
- Demo independiente: http://127.0.0.1:5187/?demo=1
- Compilar: `npm run build`
- Pruebas de lógica: `npm test`
- Prueba de conexión: `node tests/connection.mjs` (requiere .env.local).

El esquema SQL ya se aplicó al proyecto de producción; no ejecutarlo otra vez. Para experimentar con datos reales, usar un proyecto Supabase propio y configurar `.env.local` a partir de `.env.example`. No incluir claves privadas en el frontend.

Publicado en Cloudflare Pages, proyecto `needu`, mediante carga directa de `dist/`. Este repositorio no despliega cambios automáticamente.

## Chat en tiempo real y avisos web

El cliente recibe inserciones de mensajes por Supabase Realtime con los permisos de cada participante. Reconcilia por ID los mensajes recibidos, enviados y recuperados al reconectar. Conserva una consulta de respaldo cada 30 segundos mientras la página está visible. Los indicadores de lectura son locales, no confirmaciones de lectura para el remitente.

La migración `004_realtime_push.sql` habilita la publicación Realtime, suscripciones privadas por dispositivo y una cola de avisos sin contenido del chat. El disparador intenta despachar inmediatamente; Cron reintenta cada minuto, con un máximo de cinco intentos y limpieza de trabajos a los siete días. La entrega es al menos una vez y puede repetirse tras un fallo; la etiqueta de notificación agrupa los avisos.

Para otro entorno: aplicar las migraciones en orden, generar una identidad VAPID con `scripts/prepare-push.mjs`, guardar sus cuatro valores únicamente como secretos de Edge Functions y guardar `NEEDU_PUSH_SECRET` en Vault con el nombre `needu_push_webhook`. Vault también requiere `needu_push_gateway`, la clave pública anon JWT existente del proyecto. Se mantienen tanto `verify_jwt=true` como la comprobación privada del webhook. Desplegar `supabase/functions/needu-push/index.ts`; ajustar el dominio del proyecto en la migración al reutilizarla. El frontend solo recibe la clave VAPID pública y `VITE_PUSH_ENABLED=true` después de verificar el servicio. Nunca subir `.env.push.local` ni `outputs/`.

La configuración actual conserva la verificación JWT heredada de Supabase. Su panel anuncia el retiro de claves heredadas a comienzos de 2027: antes de ese cambio hay que migrar esta puerta de entrada y la credencial interna de la función según la documentación vigente, manteniendo autenticación equivalente. No desactivar controles de acceso sin revisar el reemplazo.

Los usuarios activan los avisos desde Mensajes, por dispositivo. Chrome, Firefox y Safari usan servicios push permitidos explícitamente. En iPhone/iPad se requiere abrir la app agregada a la pantalla de inicio. No hay garantía de entrega cuando el dispositivo está sin conexión, impide actividad en segundo plano o bloquea notificaciones. Los avisos corresponden a mensajes nuevos, no al indicador de escritura.

Pruebas adicionales: `supabase/verify_push.sql` se ejecuta en transacción con rollback. `scripts/verify-push-service.mjs` comprueba rechazos de autenticación y firma VAPID sin mandar avisos reales; requiere los archivos locales de configuración. La prueba final de notificación con la página cerrada requiere un dispositivo que haya otorgado permiso.
