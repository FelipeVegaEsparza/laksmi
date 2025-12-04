import { Request, Response } from 'express';
import LegalPageModel from '../models/LegalPageModel';

class LegalPageController {
  // Obtener todas las páginas legales (para dashboard)
  async getAll(req: Request, res: Response) {
    try {
      const pages = await LegalPageModel.findAll();
      res.json({
        success: true,
        data: pages
      });
    } catch (error) {
      console.error('Error fetching legal pages:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener páginas legales'
      });
    }
  }

  // Obtener una página por tipo (para frontend público)
  async getByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      // Validar tipo
      if (!['terms', 'consent', 'privacy'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de página inválido'
        });
      }

      const page = await LegalPageModel.findByType(type);

      if (!page) {
        return res.status(404).json({
          success: false,
          error: 'Página no encontrada'
        });
      }

      res.json({
        success: true,
        data: page
      });
    } catch (error) {
      console.error('Error fetching legal page:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener página legal'
      });
    }
  }

  // Actualizar una página legal (solo dashboard con autenticación)
  async update(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { title, content } = req.body;

      console.log('📥 Backend recibió solicitud de actualización:');
      console.log('   Tipo:', type);
      console.log('   Título:', title);
      console.log('   Contenido (preview):', content?.substring(0, 200));
      console.log('   Contenido (longitud):', content?.length);
      console.log('   Tiene HTML?:', content?.includes('<'));
      console.log('   Tiene <p>?:', content?.includes('<p>'));
      console.log('   Tiene <strong>?:', content?.includes('<strong>'));

      // Validar tipo
      if (!['terms', 'consent', 'privacy'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de página inválido'
        });
      }

      // Validar datos
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Título y contenido son requeridos'
        });
      }

      console.log('✅ Validación pasada, guardando en BD...');

      const updatedPage = await LegalPageModel.upsert({
        pageType: type as 'terms' | 'consent' | 'privacy',
        title,
        content
      });

      console.log('💾 Página guardada en BD');
      console.log('   Contenido guardado (preview):', updatedPage.content.substring(0, 200));
      console.log('   Tiene HTML después de guardar?:', updatedPage.content.includes('<'));

      res.json({
        success: true,
        data: updatedPage,
        message: 'Página actualizada correctamente'
      });
    } catch (error) {
      console.error('Error updating legal page:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar página legal'
      });
    }
  }
}

export default new LegalPageController();
