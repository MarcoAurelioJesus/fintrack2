export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  description: string;
  value: number;
  type: 'entrada' | 'sa\u00EDda';
  categoryId: string;
  category?: Category;
  date: Date;
  scheduledDate?: Date | null;
  isScheduled: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeCount: number;
  expenseCount: number;
  byCategory: CategoryBalance[];
  monthlyEvolution: MonthlyEvolutionItem[];
}

export interface MonthlyEvolutionItem {
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBalance {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
