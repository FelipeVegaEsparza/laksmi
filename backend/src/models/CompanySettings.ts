import db from '../config/database';

export interface DaySchedule {
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyDescription?: string;
  logoUrl?: string;
  
  // Datos de pago
  paymentLink?: string;
  paymentInstructions?: string;
  
  // Datos de contacto
  contactAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  
  // Configuración de Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioWebhookUrl?: string;
  twilioValidateSignatures?: boolean;
  
  // Redes sociales
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  
  // Horarios del local
  businessHours?: BusinessHours;
  
  // Colores del Dashboard
  dashboardPrimaryColor: string;
  dashboardSecondaryColor: string;
  dashboardBackgroundColor: string;
  dashboardTextColor: string;
  
  // Colores del Frontend
  frontendPrimaryColor: string;
  frontendSecondaryColor: string;
  frontendBackgroundColor: string;
  frontendTextColor: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCompanySettingsRequest {
  companyName?: string;
  companyDescription?: string;
  logoUrl?: string;
  paymentLink?: string;
  paymentInstructions?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioWebhookUrl?: string;
  twilioValidateSignatures?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  businessHours?: BusinessHours;
  dashboardPrimaryColor?: string;
  dashboardSecondaryColor?: string;
  dashboardBackgroundColor?: string;
  dashboardTextColor?: string;
  frontendPrimaryColor?: string;
  frontendSecondaryColor?: string;
  frontendBackgroundColor?: string;
  frontendTextColor?: string;
}

export class CompanySettingsModel {
  static async getSettings(): Promise<CompanySettings | null> {
    const settings = await db('company_settings').first();
    if (!settings) return null;
    
    return this.formatSettings(settings);
  }

  static async updateSettings(updates: UpdateCompanySettingsRequest): Promise<CompanySettings | null> {
    const updateData: any = {};
    
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
    if (updates.companyDescription !== undefined) updateData.company_description = updates.companyDescription;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    if (updates.paymentLink !== undefined) updateData.payment_link = updates.paymentLink;
    if (updates.paymentInstructions !== undefined) updateData.payment_instructions = updates.paymentInstructions;
    if (updates.contactAddress !== undefined) updateData.contact_address = updates.contactAddress;
    if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
    if (updates.contactWhatsapp !== undefined) updateData.contact_whatsapp = updates.contactWhatsapp;
    
    // Twilio settings - asegurarse de que se guarden correctamente
    if (updates.twilioAccountSid !== undefined) {
      updateData.twilio_account_sid = updates.twilioAccountSid || null;
    }
    if (updates.twilioAuthToken !== undefined) {
      updateData.twilio_auth_token = updates.twilioAuthToken || null;
    }
    if (updates.twilioPhoneNumber !== undefined) {
      updateData.twilio_phone_number = updates.twilioPhoneNumber || null;
    }
    if (updates.twilioWebhookUrl !== undefined) {
      updateData.twilio_webhook_url = updates.twilioWebhookUrl || null;
    }
    if (updates.twilioValidateSignatures !== undefined) {
      updateData.twilio_validate_signatures = updates.twilioValidateSignatures;
    }
    if (updates.facebookUrl !== undefined) updateData.facebook_url = updates.facebookUrl;
    if (updates.instagramUrl !== undefined) updateData.instagram_url = updates.instagramUrl;
    if (updates.tiktokUrl !== undefined) updateData.tiktok_url = updates.tiktokUrl;
    if (updates.xUrl !== undefined) updateData.x_url = updates.xUrl;
    if (updates.businessHours !== undefined) updateData.business_hours = JSON.stringify(updates.businessHours);
    if (updates.dashboardPrimaryColor !== undefined) updateData.dashboard_primary_color = updates.dashboardPrimaryColor;
    if (updates.dashboardSecondaryColor !== undefined) updateData.dashboard_secondary_color = updates.dashboardSecondaryColor;
    if (updates.dashboardBackgroundColor !== undefined) updateData.dashboard_background_color = updates.dashboardBackgroundColor;
    if (updates.dashboardTextColor !== undefined) updateData.dashboard_text_color = updates.dashboardTextColor;
    if (updates.frontendPrimaryColor !== undefined) updateData.frontend_primary_color = updates.frontendPrimaryColor;
    if (updates.frontendSecondaryColor !== undefined) updateData.frontend_secondary_color = updates.frontendSecondaryColor;
    if (updates.frontendBackgroundColor !== undefined) updateData.frontend_background_color = updates.frontendBackgroundColor;
    if (updates.frontendTextColor !== undefined) updateData.frontend_text_color = updates.frontendTextColor;
    
    updateData.updated_at = new Date();

    // Obtener el primer registro (solo debería haber uno)
    const existingSettings = await db('company_settings').first();
    
    if (existingSettings) {
      await db('company_settings').where({ id: existingSettings.id }).update(updateData);
    } else {
      // Si no existe, crear uno nuevo
      await db('company_settings').insert(updateData);
    }

    return this.getSettings();
  }

  private static formatSettings(dbSettings: any): CompanySettings {
    return {
      id: dbSettings.id,
      companyName: dbSettings.company_name,
      companyDescription: dbSettings.company_description,
      logoUrl: dbSettings.logo_url,
      paymentLink: dbSettings.payment_link,
      paymentInstructions: dbSettings.payment_instructions,
      contactAddress: dbSettings.contact_address,
      contactEmail: dbSettings.contact_email,
      contactPhone: dbSettings.contact_phone,
      contactWhatsapp: dbSettings.contact_whatsapp,
      twilioAccountSid: dbSettings.twilio_account_sid,
      twilioAuthToken: dbSettings.twilio_auth_token,
      twilioPhoneNumber: dbSettings.twilio_phone_number,
      twilioWebhookUrl: dbSettings.twilio_webhook_url,
      twilioValidateSignatures: dbSettings.twilio_validate_signatures,
      facebookUrl: dbSettings.facebook_url,
      instagramUrl: dbSettings.instagram_url,
      tiktokUrl: dbSettings.tiktok_url,
      xUrl: dbSettings.x_url,
      businessHours: dbSettings.business_hours ? 
        (typeof dbSettings.business_hours === 'string' ? JSON.parse(dbSettings.business_hours) : dbSettings.business_hours) 
        : undefined,
      dashboardPrimaryColor: dbSettings.dashboard_primary_color,
      dashboardSecondaryColor: dbSettings.dashboard_secondary_color,
      dashboardBackgroundColor: dbSettings.dashboard_background_color,
      dashboardTextColor: dbSettings.dashboard_text_color,
      frontendPrimaryColor: dbSettings.frontend_primary_color,
      frontendSecondaryColor: dbSettings.frontend_secondary_color,
      frontendBackgroundColor: dbSettings.frontend_background_color,
      frontendTextColor: dbSettings.frontend_text_color,
      createdAt: dbSettings.created_at,
      updatedAt: dbSettings.updated_at
    };
  }
}
