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
