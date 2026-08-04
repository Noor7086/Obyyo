import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Prediction, Purchase, LotteryType, PredictionContextType } from '../types';
import { predictionService } from '../services/predictionService';
import toast from 'react-hot-toast';

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

interface PredictionProviderProps {
  children: ReactNode;
}

export const PredictionProvider: React.FC<PredictionProviderProps> = ({ children }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = async (lotteryType: LotteryType) => {
    try {
      setLoading(true);
      const data = await predictionService.getPredictions(lotteryType);
      setPredictions(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch predictions');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictionDetails = async (lotteryType: LotteryType, id: string): Promise<Prediction> => {
    try {
      setLoading(true);
      const prediction = await predictionService.getPredictionDetails(lotteryType, id);
      return prediction;
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch prediction details');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const purchasePrediction = async (lotteryType: LotteryType, id: string, paymentMethod: string) => {
    try {
      setLoading(true);
      await predictionService.purchasePrediction(lotteryType, id, paymentMethod);
      toast.success('Prediction purchased successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPurchases = async (): Promise<Purchase[]> => {
    try {
      setLoading(true);
      const purchases = await predictionService.getMyPurchases();
      return purchases;
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch purchases');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchTrialPredictions = async (lotteryType: LotteryType): Promise<Prediction[]> => {
    try {
      setLoading(true);
      const data = await predictionService.getTrialPredictions(lotteryType);
      return data.predictions;
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch trial predictions');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: PredictionContextType = {
    predictions,
    loading,
    fetchPredictions,
    fetchPredictionDetails,
    purchasePrediction,
    fetchMyPurchases,
    fetchTrialPredictions
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
};

export const usePrediction = (): PredictionContextType => {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
};

