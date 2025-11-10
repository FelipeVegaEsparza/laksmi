import db from '../config/database';
import { Client, CreateClientRequest, UpdateClientRequest, ClientFilters } from '../types/client';

export class ClientModel {
  static async findById(id: string): Promise<Client | null> {
    const client = await db('clients').where({ id }).first();
    if (!client) return null;
    
    return this.formatClient(client);
  }

  static async findByPhone(phone: string): Promise<Client | null> {
    const client = await db('clients').where({ phone }).first();
    if (!client) return null;
    
    return this.formatClient(client);
  }

  static async findByEmail(email: string): Promise<Client | null> {
    const client = await db('clients').where({ email }).first();
    if (!client) return null;
    
    return this.formatClient(client);
  }

  static async create(clientData: CreateClientRequest): Promise<Client> {
    const insertData = {
      phone: clientData.phone,
      name: clientData.name,
      email: clientData.email || null,
      allergies: JSON.stringify(clientData.allergies || []),
      preferences: JSON.stringify(clientData.preferences || []),
      loyalty_points: 0
    };

    await db('clients').insert(insertData);

    // Buscar el cliente recién creado
    const client = await db('clients')
      .where({ phone: clientData.phone })
      .first();
    
    if (!client) {
      throw new Error('Error creating client');
    }

    return this.formatClient(client);
  }

  static async update(id: string, updates: UpdateClientRequest): Promise<Client | null> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.allergies !== undefined) updateData.allergies = JSON.stringify(updates.allergies);
    if (updates.preferences !== undefined) updateData.preferences = JSON.stringify(updates.preferences);
    
    updateData.updated_at = new Date();

    const result = await db('clients').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async findAll(filters: ClientFilters = {}): Promise<{ clients: Client[]; total: number }> {
    const { search, hasEmail, minLoyaltyPoints, page = 1, limit = 10 } = filters;
    
    let query = db('clients').select('*');

    // Aplicar filtros
    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      });
    }

    if (hasEmail !== undefined) {
      if (hasEmail) {
        query = query.whereNotNull('email').where('email', '!=', '');
      } else {
        query = query.where(function() {
          this.whereNull('email').orWhere('email', '=', '');
        });
      }
    }

    if (minLoyaltyPoints !== undefined) {
      query = query.where('loyalty_points', '>=', minLoyaltyPoints);
    }

    // Contar total de registros
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset).orderBy('created_at', 'desc');

    const clients = await query;
    
    return {
      clients: clients.map(client => this.formatClient(client)),
      total
    };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('clients').where({ id }).del();
    return result > 0;
  }

  static async addLoyaltyPoints(id: string, points: number): Promise<Client | null> {
    await db('clients')
      .where({ id })
      .increment('loyalty_points', points);
    
    return this.findById(id);
  }

  static async subtractLoyaltyPoints(id: string, points: number): Promise<Client | null> {
    // Asegurar que no se vuelvan negativos los puntos
    await db('clients')
      .where({ id })
      .andWhere('loyalty_points', '>=', points)
      .decrement('loyalty_points', points);
    
    return this.findById(id);
  }

  static async getClientStats(): Promise<{
    totalClients: number;
    clientsWithEmail: number;
    averageLoyaltyPoints: number;
    topLoyaltyClients: Client[];
  }> {
    const [totalResult] = await db('clients').count('* as count');
    const totalClients = parseInt(totalResult.count as string);

    const [emailResult] = await db('clients')
      .whereNotNull('email')
      .where('email', '!=', '')
      .count('* as count');
    const clientsWithEmail = parseInt(emailResult.count as string);

    const [avgResult] = await db('clients').avg('loyalty_points as avg');
    const averageLoyaltyPoints = parseFloat(avgResult.avg as string) || 0;

    const topClients = await db('clients')
      .orderBy('loyalty_points', 'desc')
      .limit(5);

    return {
      totalClients,
      clientsWithEmail,
      averageLoyaltyPoints,
      topLoyaltyClients: topClients.map(client => this.formatClient(client))
    };
  }

  private static formatClient(dbClient: any): Client {
    return {
      id: dbClient.id,
      phone: dbClient.phone,
      name: dbClient.name,
      email: dbClient.email,
      allergies: Array.isArray(dbClient.allergies) ? dbClient.allergies : (dbClient.allergies ? JSON.parse(dbClient.allergies) : []),
      preferences: Array.isArray(dbClient.preferences) ? dbClient.preferences : (dbClient.preferences ? JSON.parse(dbClient.preferences) : []),
      loyaltyPoints: dbClient.loyalty_points,
      createdAt: dbClient.created_at,
      updatedAt: dbClient.updated_at
    };
  }
}