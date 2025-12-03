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

      const updatedPage = await LegalPageModel.upsert({
        pageType: type as 'terms' | 'consent' | 'privacy',
        title,
        content
      });

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
