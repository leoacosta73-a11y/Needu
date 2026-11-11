# Localidades argentinas

Fuente: [Georef, servicio oficial de Argentina](https://www.argentina.gob.ar/georef). Descarga completa por API, sin coordenadas personales ni claves de Google Maps. La fecha y URL de la consulta están en `public/localidades-ar.json`.

El catálogo contiene 3.931 opciones normalizadas a partir de 4.037 entradas oficiales. Las entradas con el mismo nombre, provincia y departamento se unifican conservando el ID más específico; nombres iguales en provincias o departamentos diferentes se mantienen separados. Incluye los barrios de CABA que ofrece Georef; no pretende cubrir todos los barrios informales del país.

La búsqueda se realiza en el navegador sobre el catálogo descargado desde Needu. Lo que escribe el usuario no se envía a Google ni a Georef. Hay que seleccionar una opción: escribir texto sin elegir no permite guardar. Perfil y necesidad usan `locality_id` y una etiqueta canónica. Un trigger en Supabase impide guardar etiquetas diferentes para el mismo ID.

La migración `supabase/migrations/001_localities.sql` agrega el catálogo y las columnas sin borrar perfiles ni publicaciones. Las zonas históricas se conservan: el usuario debe confirmar una localidad al volver a editar. Para instalaciones nuevas, aplicar primero `schema.sql`, luego la migración. No volver a ejecutar `schema.sql` en producción.

Para actualizar el catálogo, ejecutar `node scripts/import-localities.mjs`. Revisar los cambios antes de aplicar una nueva migración; no eliminar IDs utilizados por perfiles existentes. Las localidades no activan los cruces ni solicitan GPS.
