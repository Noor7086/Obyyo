import { apiService } from './api';
import { Lottery, ApiResponse } from '../types';

class LotteryService {
  async getLotteries(): Promise<Lottery[]> {
    const response = await apiService.get<ApiResponse<{ lotteries: Lottery[] }>>('/lotteries');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch lotteries');
    }
    return response.data.lotteries;
  }
}

export const lotteryService = new LotteryService();








