# Guía de revisión para desarrolladores

Needu es un MVP de una comunidad de servicios: las personas ofrecen habilidades, publican necesidades y se contactan. La versión actual es web; Expo, iOS y Android son pasos posteriores.

## Probar

- Sitio: https://needu.patyapps.com/
- Demo sin cuenta: https://needu.patyapps.com/?demo=1
- La demo usa perfiles ficticios y estado local; no escribe en Supabase. No demuestra conversaciones reales entre cuentas.
- Google OAuth está en producción desde el 11/11/2026 y Supabase permite registrar cuentas nuevas. Needu solicita únicamente `openid email profile`; no requiere una lista de correos de prueba. La política de privacidad está publicada en https://needu.patyapps.com/privacidad y vinculada desde la app y Google. No se agregó un logo ni se solicitó verificación de marca en este paso. Las cuentas de organizaciones pueden tener restricciones de sus administradores. Falta comprobar el alta con una cuenta externa nueva.

## Ejecutar localmente

Requiere Node 22 o posterior. Ejecutar `npm install` y `npm run dev -- --port 5187`; abrir http://127.0.0.1:5187/?demo=1. La demo funciona sin variables de entorno.

Para una base propia, copiar `.env.example` a `.env.local` y configurar la URL y clave pública de Supabase. Aplicar `supabase/schema.sql` solamente a un proyecto NUEVO, luego las migraciones de `supabase/migrations/` en orden, y configurar Auth y sus URLs de retorno. Nunca aplicar el esquema de nuevo sobre la base existente de Needu. No usar claves secretas ni service-role en el frontend. El despliegue existente permite retornar al dominio público, no a un entorno local arbitrario.

## Estructura

- `src/main.jsx`: pantallas, navegación y estado de la aplicación.
- `src/Login.jsx`: Google OAuth y enlace de correo.
- `src/identity.js`: datos de Google como valor inicial, sin reemplazar un nombre ya elegido por el usuario. No se infiere edad.
- `src/LocalityField.jsx` y `src/localities.js`: autocompletado con selección obligatoria de un ID oficial; ver [LOCALIDADES.md](./LOCALIDADES.md).
- `src/backend.js`: cliente Supabase y consultas.
- `src/domain.js`: búsqueda, filtros, validación y redondeo de ubicación.
- `src/data.js`: datos ficticios.
- `src/purple.css` y `src/style.css`: diseño adaptable.
- `supabase/schema.sql`: tablas, permisos RLS y función de cruces.
- `supabase/verify.sql`: comprobaciones de aislamiento dentro de una transacción revertida; revisar antes de ejecutar y preferir un proyecto de pruebas.
- `tests/`: pruebas de lógica y comprobación opcional de conexión.

## Validaciones y límites

`npm test` ejecuta ocho pruebas de lógica, identidad y localidades; `npm run build` genera `dist/`. `node tests/connection.mjs` requiere `.env.local` y comprueba proveedores de acceso y bloqueo de lecturas anónimas. No sustituye pruebas completas entre varios usuarios.

Los mensajes se consultan cada diez segundos. Los horarios son informativos. Los cruces usan una celda aproximada con consentimiento mutuo y vencimiento de 24 horas: no prueban un encuentro ni muestran recorridos. Los favoritos, perfiles, necesidades y mensajes tienen persistencia para cuentas conectadas.

Todavía no hay mapa real, gestos swipe, pagos, reseñas, moderación ni app nativa. La comunidad real puede aparecer vacía al iniciar sesión; los ejemplos no se cargan en producción.

## Puntos útiles para revisar

- Aislamiento de mensajes y presencia, permisos RLS y validaciones de escritura.
- Experiencia de alta de perfil y estados vacíos, errores y carga.
- Separación del componente principal y evolución a móvil.
- Accesibilidad, navegación y comportamiento en pantallas pequeñas.
- Requisitos de moderación, privacidad y operación antes de una beta más amplia.

El repositorio no incluye contraseñas, secretos OAuth ni la configuración local de producción. Las propuestas pueden enviarse mediante issues o pull requests; este repositorio no despliega automáticamente a producción.

## Edición de necesidades
Cada propietario puede editar título, descripción, categoría, localidad y presupuesto de la misma publicación, o eliminarla con confirmación. La migración 002_edit_needs.sql habilita UPDATE por columnas con RLS del propietario; propietario, nombre y fecha no son editables. verify_edit_needs.sql comprueba edición/borrado propio, bloqueo de terceros y localidad canónica con fixtures revertidos. Validado en Supabase y recorrido demo (editar, recargar, cancelar y confirmar borrado).

## Fotos de perfiles y trabajos
Mi perfil / Ofrezco permite una foto propia y hasta seis fotos de trabajos. src/Media.jsx implementa los controles y src/media.js convierte JPG/PNG/WebP de hasta 10 MB a JPEG de hasta 1600 px y 3 MB. Supabase Storage usa el bucket privado profile-media y enlaces temporales de una hora, renovados mientras la pantalla está abierta. No se comparte automáticamente el avatar de Google con otras cuentas; solo la foto subida por el usuario. La migración 003_profile_media.sql valida rutas por propietario y el máximo de seis fotos. verify_profile_media.sql prueba aislamiento, carpetas propias, lectura autenticada y rechazo de referencias ajenas dentro de una transacción revertida. Para eliminar una cuenta manualmente, borrar primero sus objetos de Storage mediante la API y luego la cuenta; el cascade de perfiles no borra archivos. Si falla la limpieza tras reemplazar/quitar, la app avisa y el archivo pendiente queda sin referencia. Carga y persistencia verificadas en demo local; falta prueba integral de carga contra Storage con una cuenta real de prueba.

Alta inicial: DraftMedia.jsx permite elegir foto de perfil y trabajos antes de guardar por primera vez. Conserva blobs solo en memoria y muestra previsualizaciones. Guardar perfil valida datos, crea el perfil, sube imágenes y guarda referencias; si falla la subida conserva la selección para reintentar y limpia archivos de ese intento. Recorrido de selección y guardado conjunto probado en demo. No requiere migraciones adicionales.
