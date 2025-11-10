export interface LoyaltyTransaction {
  id: string;
  clientId: string;
  type: 'earned' | 'redeemed';
  points: number;
  reason: string;
  referenceId?: string; // ID de la cita, compra, etc.
  referenceType?: 'booking' | 'purchase' | 'manual' | 'bonus';
  createdAt: Date;
}

export interface LoyaltyRule {
  id: string;
  name: string;
  description: string;
  pointsPerUnit: number; // Puntos por peso/dólar gastado
  isActive: boolean;
  createdAt: Date;
}

export interface ClientHistory {
  clientId: string;
  totalBookings: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit?: Date;
  favoriteServices: string[];
  loyaltyTransactions: LoyaltyTransaction[];
}

export interface LoyaltyStats {
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  transactionCount: number;
  lastTransaction?: Date;
}