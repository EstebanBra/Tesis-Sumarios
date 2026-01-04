/**
 * Middleware para parsear FormData cuando viene con un campo 'data' que contiene JSON
 * Esto permite enviar archivos junto con datos JSON en una sola petición
 */
export function parseFormDataJson(req, res, next) {
  // Si hay un campo 'data' que es un string, intentar parsearlo como JSON
  if (req.body && req.body.data && typeof req.body.data === 'string') {
    try {
      const parsedData = JSON.parse(req.body.data);
      // Reemplazar req.body con los datos parseados
      // Mantener otros campos que puedan venir directamente (por si acaso)
      req.body = {
        ...parsedData,
        // Si hay otros campos además de 'data', mantenerlos (aunque normalmente no debería haber)
        ...Object.fromEntries(
          Object.entries(req.body).filter(([key]) => key !== 'data')
        ),
      };
    } catch (error) {
      console.error('Error parseando JSON del campo data:', error);
      return res.status(400).json({ 
        message: "Error parseando datos JSON",
        error: error.message 
      });
    }
  }
  next();
}

