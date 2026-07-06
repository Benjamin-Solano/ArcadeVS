/**
 * paises — lista fija de paises para el selector de nacionalidad del perfil.
 * Cada entrada es "CODIGO Nombre": el codigo ISO alpha-2 se usa para armar la URL
 * de la bandera (flagcdn) y el nombre en espanol es lo que se guarda en la BD
 * (columna usuarios.nacionalidad, VARCHAR(100)). El nombre es la fuente de verdad;
 * la bandera se deriva buscando el codigo por nombre.
 */

// "CODIGO Nombre" separado por comas (ningun nombre contiene comas).
const LISTA =
  'AF Afganistan, AL Albania, DE Alemania, AD Andorra, AO Angola, AG Antigua y Barbuda, ' +
  'SA Arabia Saudita, DZ Argelia, AR Argentina, AM Armenia, AU Australia, AT Austria, ' +
  'AZ Azerbaiyan, BS Bahamas, BH Barein, BD Banglades, BB Barbados, BE Belgica, BZ Belice, ' +
  'BJ Benin, BY Bielorrusia, MM Birmania, BO Bolivia, BA Bosnia y Herzegovina, BW Botsuana, ' +
  'BR Brasil, BN Brunei, BG Bulgaria, BF Burkina Faso, BI Burundi, BT Butan, CV Cabo Verde, ' +
  'KH Camboya, CM Camerun, CA Canada, QA Catar, TD Chad, CL Chile, CN China, CY Chipre, ' +
  'CO Colombia, KM Comoras, KP Corea del Norte, KR Corea del Sur, CI Costa de Marfil, ' +
  'CR Costa Rica, HR Croacia, CU Cuba, DK Dinamarca, DM Dominica, EC Ecuador, EG Egipto, ' +
  'SV El Salvador, AE Emiratos Arabes Unidos, ER Eritrea, SK Eslovaquia, SI Eslovenia, ' +
  'ES Espana, US Estados Unidos, EE Estonia, SZ Esuatini, ET Etiopia, PH Filipinas, ' +
  'FI Finlandia, FJ Fiyi, FR Francia, GA Gabon, GM Gambia, GE Georgia, GH Ghana, GD Granada, ' +
  'GR Grecia, GT Guatemala, GN Guinea, GW Guinea-Bisau, GQ Guinea Ecuatorial, GY Guyana, ' +
  'HT Haiti, HN Honduras, HU Hungria, IN India, ID Indonesia, IQ Irak, IR Iran, IE Irlanda, ' +
  'IS Islandia, MH Islas Marshall, SB Islas Salomon, IL Israel, IT Italia, JM Jamaica, ' +
  'JP Japon, JO Jordania, KZ Kazajistan, KE Kenia, KG Kirguistan, KI Kiribati, KW Kuwait, ' +
  'LA Laos, LS Lesoto, LV Letonia, LB Libano, LR Liberia, LY Libia, LI Liechtenstein, ' +
  'LT Lituania, LU Luxemburgo, MG Madagascar, MY Malasia, MW Malaui, MV Maldivas, ML Mali, ' +
  'MT Malta, MA Marruecos, MU Mauricio, MR Mauritania, MX Mexico, FM Micronesia, MD Moldavia, ' +
  'MC Monaco, MN Mongolia, ME Montenegro, MZ Mozambique, NA Namibia, NR Nauru, NP Nepal, ' +
  'NI Nicaragua, NE Niger, NG Nigeria, NO Noruega, NZ Nueva Zelanda, OM Oman, NL Paises Bajos, ' +
  'PK Pakistan, PW Palaos, PA Panama, PG Papua Nueva Guinea, PY Paraguay, PE Peru, PL Polonia, ' +
  'PT Portugal, GB Reino Unido, CF Republica Centroafricana, CZ Republica Checa, ' +
  'CG Republica del Congo, CD Republica Democratica del Congo, DO Republica Dominicana, ' +
  'RW Ruanda, RO Rumania, RU Rusia, WS Samoa, KN San Cristobal y Nieves, SM San Marino, ' +
  'VC San Vicente y las Granadinas, LC Santa Lucia, ST Santo Tome y Principe, SN Senegal, ' +
  'RS Serbia, SC Seychelles, SL Sierra Leona, SG Singapur, SY Siria, SO Somalia, LK Sri Lanka, ' +
  'ZA Sudafrica, SD Sudan, SS Sudan del Sur, SE Suecia, CH Suiza, SR Surinam, TH Tailandia, ' +
  'TZ Tanzania, TJ Tayikistan, TL Timor Oriental, TG Togo, TO Tonga, TT Trinidad y Tobago, ' +
  'TN Tunez, TM Turkmenistan, TR Turquia, TV Tuvalu, UA Ucrania, UG Uganda, UY Uruguay, ' +
  'UZ Uzbekistan, VU Vanuatu, VA Vaticano, VE Venezuela, VN Vietnam, YE Yemen, DJ Yibuti, ' +
  'ZM Zambia, ZW Zimbabue';

/** Lista de paises: { codigo, nombre }, ordenada alfabeticamente por nombre. */
export const PAISES = LISTA.split(',').map((entrada) => {
  const texto = entrada.trim();
  const sep = texto.indexOf(' ');
  return { codigo: texto.slice(0, sep), nombre: texto.slice(sep + 1) };
});

/**
 * URL de la bandera (PNG) del pais en flagcdn segun su codigo ISO alpha-2.
 *
 * @param {string} codigo - Codigo ISO alpha-2 (p. ej. 'CL').
 * @param {number} [ancho] - Ancho en px del PNG disponible en flagcdn (20, 40, 80...).
 * @returns {string} URL de la bandera.
 */
export function bandera_url(codigo, ancho = 20) {
  return `https://flagcdn.com/w${ancho}/${String(codigo).toLowerCase()}.png`;
}

/** Normaliza un texto para comparar sin acentos ni mayusculas. */
function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Busca un pais por su nombre exacto (sin distinguir acentos ni mayusculas).
 *
 * @param {string} nombre - Nombre del pais tal como se guarda en la BD.
 * @returns {{codigo: string, nombre: string}|null} El pais o null si no esta en la lista.
 */
export function buscar_pais(nombre) {
  if (!nombre) return null;
  const clave = normalizar(nombre);
  return PAISES.find((p) => normalizar(p.nombre) === clave) || null;
}

/**
 * Filtra la lista de paises por coincidencia de texto en el nombre.
 *
 * @param {string} texto - Texto de busqueda (puede venir con acentos o mayusculas).
 * @returns {Array<{codigo: string, nombre: string}>} Paises que coinciden.
 */
export function filtrar_paises(texto) {
  const clave = normalizar(texto);
  if (!clave) return PAISES;
  return PAISES.filter((p) => normalizar(p.nombre).includes(clave));
}
