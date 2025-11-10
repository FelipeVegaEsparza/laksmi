import { WhatsAppTemplateService } from '../services/WhatsAppTemplateService';

describe('WhatsApp Template System', () => {
  describe('Template Management', () => {
    test('should get all available templates', () => {
      const templates = WhatsAppTemplateService.getAvailableTemplates();
      
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('category');
      expect(templates[0]).toHaveProperty('parameters');
    });

    test('should get template by name', () => {
      const template = WhatsAppTemplateService.getTemplate('appointment_reminder_24h');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('appointment_reminder_24h');
      expect(template?.category).toBe('appointment_reminder');
      expect(template?.parameters).toContain('clientName');
    });

    test('should get templates by category', () => {
      const reminderTemplates = WhatsAppTemplateService.getTemplatesByCategory('appointment_reminder');
      
      expect(reminderTemplates).toBeDefined();
      expect(reminderTemplates.length).toBeGreaterThan(0);
      expect(reminderTemplates.every(t => t.category === 'appointment_reminder')).toBe(true);
    });

    test('should get template content', () => {
      const content = WhatsAppTemplateService.getTemplateContent('appointment_reminder_24h');
      
      expect(content).toBeDefined();
      expect(content).toContain('{{clientName}}');
      expect(content).toContain('{{serviceName}}');
    });
  });

  describe('Template Rendering', () => {
    test('should render template with data', () => {
      const templateData = {
        clientName: 'María',
        serviceName: 'Facial Hidratante',
        appointmentDate: 'viernes, 15 de marzo de 2024',
        appointmentTime: '14:30',
        professionalName: 'Ana García',
        clinicName: 'Clínica Bella',
        clinicPhone: '+34 123 456 789'
      };

      const rendered = WhatsAppTemplateService.renderTemplateContent(
        'appointment_reminder_24h',
        templateData
      );

      expect(rendered).toBeDefined();
      expect(rendered).toContain('María');
      expect(rendered).toContain('Facial Hidratante');
      expect(rendered).toContain('viernes, 15 de marzo de 2024');
      expect(rendered).toContain('14:30');
      expect(rendered).not.toContain('{{clientName}}');
    });

    test('should preview template successfully', () => {
      const templateData = {
        clientName: 'María',
        serviceName: 'Facial Hidratante',
        appointmentDate: 'viernes, 15 de marzo de 2024',
        appointmentTime: '14:30',
        professionalName: 'Ana García',
        clinicName: 'Clínica Bella',
        clinicPhone: '+34 123 456 789'
      };

      const preview = WhatsAppTemplateService.previewTemplate(
        'appointment_reminder_24h',
        templateData
      );

      expect(preview.success).toBe(true);
      expect(preview.content).toBeDefined();
      expect(preview.content).toContain('María');
    });

    test('should fail preview with missing parameters', () => {
      const incompleteData = {
        clientName: 'María'
        // Missing required parameters
      };

      const preview = WhatsAppTemplateService.previewTemplate(
        'appointment_reminder_24h',
        incompleteData
      );

      expect(preview.success).toBe(false);
      expect(preview.missingParameters).toBeDefined();
      expect(preview.missingParameters?.length).toBeGreaterThan(0);
    });
  });

  describe('Template Validation', () => {
    test('should validate template data correctly', () => {
      const completeData = {
        clientName: 'María',
        serviceName: 'Facial Hidratante',
        appointmentDate: 'viernes, 15 de marzo de 2024',
        appointmentTime: '14:30',
        professionalName: 'Ana García',
        clinicName: 'Clínica Bella',
        clinicPhone: '+34 123 456 789'
      };

      const validation = WhatsAppTemplateService.validateTemplateData(
        'appointment_reminder_24h',
        completeData
      );

      expect(validation.isValid).toBe(true);
      expect(validation.missingParameters).toHaveLength(0);
    });

    test('should detect missing parameters', () => {
      const incompleteData = {
        clientName: 'María'
      };

      const validation = WhatsAppTemplateService.validateTemplateData(
        'appointment_reminder_24h',
        incompleteData
      );

      expect(validation.isValid).toBe(false);
      expect(validation.missingParameters.length).toBeGreaterThan(0);
      expect(validation.missingParameters).toContain('serviceName');
    });
  });

  describe('Template Statistics', () => {
    test('should get template statistics', () => {
      const stats = WhatsAppTemplateService.getTemplateStats();

      expect(stats).toBeDefined();
      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.templatesByCategory).toBeDefined();
      expect(stats.templatesWithMostParameters).toBeDefined();
      expect(stats.templatesWithMostParameters.length).toBeLessThanOrEqual(3);
    });

    test('should have correct template categories', () => {
      const stats = WhatsAppTemplateService.getTemplateStats();

      expect(stats.templatesByCategory).toHaveProperty('appointment_reminder');
      expect(stats.templatesByCategory).toHaveProperty('booking_confirmation');
      expect(stats.templatesByCategory).toHaveProperty('follow_up');
      expect(stats.templatesByCategory).toHaveProperty('promotion');
    });
  });

  describe('Template Management Operations', () => {
    test('should add new template', () => {
      const newTemplate = {
        name: 'test_template',
        language: 'es',
        category: 'general' as const,
        parameters: ['clientName', 'testMessage'],
        description: 'Template de prueba'
      };

      expect(() => {
        WhatsAppTemplateService.addTemplate(newTemplate);
      }).not.toThrow();

      const retrieved = WhatsAppTemplateService.getTemplate('test_template');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test_template');
    });

    test('should not add duplicate template', () => {
      const duplicateTemplate = {
        name: 'appointment_reminder_24h', // Already exists
        language: 'es',
        category: 'general' as const,
        parameters: ['clientName'],
        description: 'Duplicate template'
      };

      expect(() => {
        WhatsAppTemplateService.addTemplate(duplicateTemplate);
      }).toThrow('Template \'appointment_reminder_24h\' already exists');
    });

    test('should update template content', () => {
      const newContent = 'Test content with {{clientName}}';
      const result = WhatsAppTemplateService.updateTemplateContent(
        'appointment_reminder_24h',
        newContent
      );

      expect(result).toBe(true);
      
      const updatedContent = WhatsAppTemplateService.getTemplateContent('appointment_reminder_24h');
      expect(updatedContent).toBe(newContent);
    });

    test('should not update non-existent template content', () => {
      const result = WhatsAppTemplateService.updateTemplateContent(
        'non_existent_template',
        'Some content'
      );

      expect(result).toBe(false);
    });
  });

  describe('Template Content Verification', () => {
    test('all templates should have content defined', () => {
      const templates = WhatsAppTemplateService.getAvailableTemplates();
      
      templates.forEach(template => {
        const content = WhatsAppTemplateService.getTemplateContent(template.name);
        expect(content).toBeDefined();
        expect(content).not.toBe('');
        
        // Verify all parameters are used in content
        template.parameters.forEach(param => {
          expect(content).toContain(`{{${param}}}`);
        });
      });
    });

    test('should get all templates with content', () => {
      const templatesWithContent = WhatsAppTemplateService.getAllTemplatesWithContent();
      
      expect(templatesWithContent).toBeDefined();
      expect(templatesWithContent.length).toBeGreaterThan(0);
      
      templatesWithContent.forEach(template => {
        expect(template).toHaveProperty('content');
        expect(template.content).toBeDefined();
        expect(template.content).not.toBe('');
      });
    });
  });
});