# Guía de revisión para desarrolladores

Needu es un MVP de una comunidad de servicios: las personas ofrecen habilidades, publican necesidades y se contactan. La versión actual es web; Expo, iOS y Android son pasos posteriores.

## Probar

- Sitio: https://needu.patyapps.com/
- Demo sin cuenta: https://needu.patyapps.com/?demo=1
- La demo usa perfiles ficticios y estado local; no escribe en Supabase. No demuestra conversaciones reales entre cuentas.
- Google está configurado, pero el proyecto OAuth sigue en modo de prueba. Para probar datos reales con una cuenta nueva, el propietario debe autorizarla.

## Ejecutar localmente

Requiere Node 22 o posterior. Ejecutar `npm install` y `npm run dev -- --port 5187`; abrir http://127.0.0.1:5187/?demo=1. La demo funciona sin variables de entorno.

Para una base propia, copiar `.env.example` a `.env.local` y configurar la URL y clave pública de Supabase. Aplicar `supabase/schema.sql` solamente a un proyecto NUEVO, luego `supabase/migrations/001_localities.sql`, y configurar Auth y sus URLs de retorno. Nunca aplicar el esquema de nuevo sobre la base existente de Needu. No usar claves secretas ni service-role en el frontend. El despliegue existente permite retornar al dominio público, no a un entorno local arbitrario.

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

Todavía no hay mapa real, gestos swipe, subida de fotos, pagos, reseñas, moderación ni app nativa. La comunidad real puede aparecer vacía al iniciar sesión; los ejemplos no se cargan en producción.

## Puntos útiles para revisar

- Aislamiento de mensajes y presencia, permisos RLS y validaciones de escritura.
- Experiencia de alta de perfil y estados vacíos, errores y carga.
- Separación del componente principal y evolución a móvil.
- Accesibilidad, navegación y comportamiento en pantallas pequeñas.
- Requisitos de moderación, privacidad y operación antes de una beta más amplia.

El repositorio no incluye contraseñas, secretos OAuth ni la configuración local de producción. Las propuestas pueden enviarse mediante issues o pull requests; este repositorio no despliega automáticamente a producción.
