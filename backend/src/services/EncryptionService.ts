import CryptoJS from 'crypto-js';
import logger from '../utils/logger';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  
  /**
   * Encrypt sensitive data using AES-256
   */
  static encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt data - invalid key or corrupted data');
      }
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(data: string): string {
    try {
      return CryptoJS.SHA256(data).toString();
    } catch (error) {
      logger.error('Hashing failed:', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    try {
      return CryptoJS.lib.WordArray.random(length).toString();
    } catch (error) {
      logger.error('Token generation failed:', error);
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Encrypt phone numbers for storage
   */
  static encryptPhone(phone: string): string {
    return this.encrypt(phone);
  }

  /**
   * Decrypt phone numbers for use
   */
  static decryptPhone(encryptedPhone: string): string {
    return this.decrypt(encryptedPhone);
  }

  /**
   * Encrypt email addresses for storage
   */
  static encryptEmail(email: string): string {
    return this.encrypt(email);
  }

  /**
   * Decrypt email addresses for use
   */
  static decryptEmail(encryptedEmail: string): string {
    return this.decrypt(encryptedEmail);
  }

  /**
   * Encrypt personal notes or sensitive information
   */
  static encryptPersonalData(data: string): string {
    return this.encrypt(data);
  }

  /**
   * Decrypt personal notes or sensitive information
   */
  static decryptPersonalData(encryptedData: string): string {
    return this.decrypt(encryptedData);
  }
}