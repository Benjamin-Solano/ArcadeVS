/**
 * Error de la capa de servicios.
 *
 * Permite que los servicios comuniquen fallos de negocio (validaciones,
 * conflictos, credenciales invalidas) con un codigo estable y un estado HTTP
 * sugerido. La capa de rutas/eventos traduce este error a la respuesta final.
 */
export class ErrorServicio extends Error {
  /**
   * @param {string} codigo - Codigo estable del error (ej: 'CORREO_EN_USO').
   * @param {string} mensaje - Mensaje legible en espanol.
   * @param {number} [estado_http] - Estado HTTP sugerido (por defecto 400).
   */
  constructor(codigo, mensaje, estado_http = 400) {
    super(mensaje);
    this.name = 'ErrorServicio';
    this.codigo = codigo;
    this.estado_http = estado_http;
  }
}
