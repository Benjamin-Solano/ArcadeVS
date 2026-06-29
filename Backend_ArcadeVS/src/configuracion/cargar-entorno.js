/**
 * Carga las variables de entorno desde .env.local.
 *
 * IMPORTANTE: este modulo debe importarse ANTES que cualquier otro que lea
 * process.env (por ejemplo configuracion-db.js, que construye el pool con
 * DB_URL al evaluarse). En ESM los imports se ejecutan en orden, por lo que
 * importar este modulo primero garantiza que el entorno ya este disponible.
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
