import { ClientModel } from '../models/Client';
import { CreateClientRequest, UpdateClientRequest, ClientFilters, Client } from '../types/client';
import logger from '../utils/logger';

export class ClientService {
  static async createClient(clientData: CreateClientRequest): Promise<Client> {
    // Verificar que el teléfono no exista
    const existingClient = await ClientModel.findByPhone(clientData.phone);
    if (existingClient) {
      throw new Error('Ya existe un cliente con este número de teléfono');
    }

    // Verificar que el email no exista (si se proporciona)
    if (clientData.email) {
      const existingEmail = await ClientModel.findByEmail(clientData.email);
      if (existingEmail) {
        throw new Error('Ya existe un cliente con este email');
      }
    }

    const client = await ClientModel.create(clientData);
    logger.info(`New client created: ${client.name} (${client.phone})`);
    
    return client;
  }

  static async getClientById(id: string): Promise<Client | null> {
    return ClientModel.findById(id);
  }

  static async getClientByPhone(phone: string): Promise<Client | null> {
    return ClientModel.findByPhone(phone);
  }

  static async getClientByEmail(email: string): Promise<Client | null> {
    return ClientModel.findByEmail(email);
  }

  static async updateClient(id: string, updates: UpdateClientRequest): Promise<Client | null> {
    const existingClient = await ClientModel.findById(id);
    if (!existingClient) {
      throw new Error('Cliente no encontrado');
    }

    // Verificar que el email no exista en otro cliente (si se está actualizando)
    if (updates.email && updates.email !== existingClient.email) {
      const existingEmail = await ClientModel.findByEmail(updates.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new Error('Ya existe otro cliente con este email');
      }
    }

    const updatedClient = await ClientModel.update(id, updates);
    if (updatedClient) {
      logger.info(`Client updated: ${updatedClient.name} (${updatedClient.phone})`);
    }
    
    return updatedClient;
  }

  static async deleteClient(id: string): Promise<boolean> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const deleted = await ClientModel.delete(id);
    if (deleted) {
      logger.info(`Client deleted: ${client.name} (${client.phone})`);
    }
    
    return deleted;
  }

  static async getClients(filters: ClientFilters = {}) {
    const { clients, total } = await ClientModel.findAll(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  static async addLoyaltyPoints(id: string, points: number): Promise<Client | null> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const updatedClient = await ClientModel.addLoyaltyPoints(id, points);
    if (updatedClient) {
      logger.info(`Loyalty points added: ${points} points to ${client.name} (${client.phone})`);
    }
    
    return updatedClient;
  }

  static async subtractLoyaltyPoints(id: string, points: number): Promise<Client | null> {
    const client = await ClientModel.findById(id);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    if (client.loyaltyPoints < points) {
      throw new Error('El cliente no tiene suficientes puntos de lealtad');
    }

    const updatedClient = await ClientModel.subtractLoyaltyPoints(id, points);
    if (updatedClient) {
      logger.info(`Loyalty points subtracted: ${points} points from ${client.name} (${client.phone})`);
    }
    
    return updatedClient;
  }

  static async getClientStats() {
    return ClientModel.getClientStats();
  }

  static async searchClients(searchTerm: string, limit: number = 10): Promise<Client[]> {
    const { clients } = await ClientModel.findAll({
      search: searchTerm,
      limit
    });
    
    return clients;
  }
}