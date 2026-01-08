import { apiService } from './api';
import { Prediction, Purchase, LotteryType, ApiResponse } from '../types';

class PredictionService {
  async getPredictions(lotteryType: LotteryType, page = 1, limit = 10): Promise<Prediction[]> {
    try {
      const response = await apiService.get<ApiResponse<{ predictions: Prediction[]; pagination?: any }>>(
        `/predictions/${lotteryType}?page=${page}&limit=${limit}`
      );
      
      console.log('GetPredictions response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch predictions');
      }
      
      // Handle both response formats
      if (response.data?.predictions) {
        return response.data.predictions;
      } else if (Array.isArray(response.data)) {
        return response.data as Prediction[];
      } else {
        console.warn('Unexpected response format:', response);
        return [];
      }
    } catch (error: any) {
      console.error('Error in getPredictions:', error);
      throw error;
    }
  }

  async getPredictionDetails(lotteryType: LotteryType, id: string): Promise<Prediction> {
    try {
      const response = await apiService.get<ApiResponse<{ prediction: Prediction }>>(
        `/predictions/${lotteryType}/${id}`
      );
      
      // Check if response is successful
      if (!response.success) {
        const errorMessage = response.message || 'Failed to fetch prediction details';
        console.error('❌ getPredictionDetails error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Handle different response structures
      if (response.data?.prediction) {
        return response.data.prediction;
      } else if (response.data && typeof response.data === 'object' && 'id' in response.data) {
        // If data itself is the prediction
        return response.data as unknown as Prediction;
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('Unexpected response format from server');
      }
    } catch (error: any) {
      console.error('❌ getPredictionDetails catch error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      
      // Re-throw with better error message
      if (error.response?.data) {
        // Handle different response structures
        const errorData = error.response.data;
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      }
      
      // If no specific error message, use the generic one
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your trial status.');
      }
      
      throw error;
    }
  }

  async purchasePrediction(lotteryType: LotteryType, id: string, paymentMethod: string): Promise<void> {
    const response = await apiService.post<ApiResponse>(
      `/predictions/${lotteryType}/${id}/purchase`,
      { paymentMethod }
    );
    if (!response.success) {
      throw new Error(response.message || 'Purchase failed');
    }
  }

  async getMyPurchases(page = 1, limit = 10): Promise<Purchase[]> {
    const response = await apiService.get<ApiResponse<{ purchases: Purchase[] }>>(
      `/predictions/my-purchases?page=${page}&limit=${limit}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch purchases');
    }
    return response.data.purchases;
  }

  async getTrialPredictions(lotteryType: LotteryType): Promise<{ predictions: Prediction[]; message?: string }> {
    const response = await apiService.get<ApiResponse<{ predictions: Prediction[]; message?: string }>>(
      `/predictions/trial/${lotteryType}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch trial predictions');
    }
    return {
      predictions: response.data.predictions || [],
      message: response.data.message
    };
  }

  // Download prediction (increment download count)
  async downloadPrediction(lotteryType: LotteryType, id: string): Promise<Prediction> {
    // This would typically be a separate endpoint for tracking downloads
    // For now, we'll just fetch the details which increments the count
    return this.getPredictionDetails(lotteryType, id);
  }
}

export const predictionService = new PredictionService();

