import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { lotteryService } from '../services/lotteryService';
import { Prediction, LotteryType, Lottery } from '../types';
import { Modal, Button } from 'react-bootstrap';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

const Predictions: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [selectedLottery, setSelectedLottery] = useState<LotteryType>('powerball');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [lotteriesLoading, setLotteriesLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [purchasedPrediction, setPurchasedPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLottery, setLoadingLottery] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showTrialPredictionModal, setShowTrialPredictionModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loadingPredictionDetails, setLoadingPredictionDetails] = useState(false);
  const [loadingPredictionId, setLoadingPredictionId] = useState<string | null>(null);
  const [trialMessage, setTrialMessage] = useState<string | null>(null);
  const [acknowledgeDisclaimer, setAcknowledgeDisclaimer] = useState(false);
  const prevLocationRef = useRef<string>('');

  // Fetch lotteries on component mount
  useEffect(() => {
    fetchLotteries();
  }, []);

  // Refetch predictions when navigating to this page (especially from navbar)
  useEffect(() => {
    // Check if we just navigated to this page
    const currentLocation = location.pathname + location.search;
    if (location.pathname === '/predictions' && prevLocationRef.current !== currentLocation) {
      prevLocationRef.current = currentLocation;

      // Get lottery type directly from URL to avoid state timing issues
      const lotteryTypeFromUrl = searchParams.get('lottery');
      const validLotteryTypes: LotteryType[] = ['gopher5', 'pick3', 'lottoamerica', 'megamillion', 'powerball'];

      if (lotteryTypeFromUrl && validLotteryTypes.includes(lotteryTypeFromUrl.toLowerCase() as LotteryType)) {
        const normalizedType = lotteryTypeFromUrl.toLowerCase() as LotteryType;
        console.log('🔄 Navigation detected - URL lottery:', normalizedType, 'Current state:', selectedLottery);

        // Update selectedLottery immediately to keep state in sync
        if (normalizedType !== selectedLottery) {
          setSelectedLottery(normalizedType);
        }

        // Fetch predictions directly using URL parameter to avoid timing issues
        const loadPredictions = async () => {
          setLoadingLottery(normalizedType);
          try {
            await fetchPredictionsForLottery(normalizedType);

            // Auto-scroll to predictions section after loading
            setTimeout(() => {
              const predictionsSection = document.getElementById('available-predictions-section');
              if (predictionsSection) {
                const headerOffset = 80; // Account for fixed navbar
                const elementPosition = predictionsSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }, 500); // Delay to ensure DOM is updated
          } finally {
            setLoadingLottery(null);
          }
        };
        loadPredictions();
      } else if (selectedLottery) {
        // Fallback to selectedLottery if no URL parameter
        console.log('🔄 Navigation detected - using selectedLottery:', selectedLottery);
        const loadPredictions = async () => {
          setLoadingLottery(selectedLottery);
          try {
            await fetchPredictionsForLottery(selectedLottery);
          } finally {
            setLoadingLottery(null);
          }
        };
        loadPredictions();
      }
    } else if (prevLocationRef.current !== currentLocation) {
      prevLocationRef.current = currentLocation;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Read URL parameter and set selected lottery
  useEffect(() => {
    const lotteryType = searchParams.get('lottery');
    const validLotteryTypes: LotteryType[] = ['gopher5', 'pick3', 'lottoamerica', 'megamillion', 'powerball'];

    console.log('🔍 URL parameter effect - lotteryType from URL:', lotteryType);
    console.log('🔍 URL parameter effect - current selectedLottery:', selectedLottery);
    console.log('🔍 URL parameter effect - lotteries loaded:', lotteries.length);

    if (lotteryType && validLotteryTypes.includes(lotteryType.toLowerCase() as LotteryType)) {
      // Directly use the URL parameter if it's a valid lottery type
      const normalizedType = lotteryType.toLowerCase() as LotteryType;
      console.log('✅ Setting selectedLottery from URL:', normalizedType);
      if (normalizedType !== selectedLottery) {
        setSelectedLottery(normalizedType);
      }
    } else if (lotteryType && lotteries.length > 0) {
      // Try to find lottery by id or code if URL param doesn't match valid types
      console.log('🔍 Trying to find lottery by id/code:', lotteryType);
      const lottery = lotteries.find(l =>
        l.id?.toLowerCase() === lotteryType.toLowerCase() ||
        l.code?.toLowerCase() === lotteryType.toLowerCase()
      );
      if (lottery) {
        const lotteryId = (lottery.id || lottery.code.toLowerCase()) as LotteryType;
        console.log('✅ Found lottery:', lotteryId);
        if (validLotteryTypes.includes(lotteryId) && lotteryId !== selectedLottery) {
          setSelectedLottery(lotteryId);
        }
      } else {
        console.warn('⚠️ Lottery not found for:', lotteryType);
      }
    } else if (lotteries.length > 0 && !searchParams.get('lottery')) {
      // Set first lottery as default if no URL parameter
      const firstLottery = lotteries.find(l => l.isActive) || lotteries[0];
      if (firstLottery) {
        const lotteryId = (firstLottery.id || firstLottery.code.toLowerCase()) as LotteryType;
        console.log('✅ Setting default lottery:', lotteryId);
        if (validLotteryTypes.includes(lotteryId) && lotteryId !== selectedLottery) {
          setSelectedLottery(lotteryId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, lotteries]);

  // Fetch predictions when lottery type changes
  useEffect(() => {
    if (selectedLottery) {
      console.log('🔄 selectedLottery changed, fetching predictions for:', selectedLottery);
      const loadPredictions = async () => {
        setLoadingLottery(selectedLottery);
        try {
          // Pass selectedLottery directly to ensure we use the latest value
          await fetchPredictionsForLottery(selectedLottery);

          // Auto-scroll to predictions section if coming from navbar
          // Check if there's a lottery parameter in URL (indicates navigation from navbar)
          const lotteryFromUrl = searchParams.get('lottery');
          if (lotteryFromUrl && location.pathname === '/predictions') {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
              const predictionsSection = document.getElementById('available-predictions-section');
              if (predictionsSection) {
                const headerOffset = 80; // Account for fixed navbar
                const elementPosition = predictionsSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }, 300);
          }
        } finally {
          setLoadingLottery(null);
        }
      };
      loadPredictions();
    }
  }, [selectedLottery, user, searchParams, location.pathname]);

  // Separate function that takes lottery type as parameter to avoid closure issues
  const fetchPredictionsForLottery = async (lotteryType: LotteryType) => {
    try {
      setLoading(true);
      setTrialMessage(null);

      console.log('🔍 Fetching predictions for lottery:', lotteryType);
      console.log('🔍 URL search params:', searchParams.get('lottery'));

      if (!lotteryType) {
        console.warn('⚠️ No lottery type provided, cannot fetch predictions');
        setPredictions([]);
        return;
      }

      // Check if user is in trial period (case-insensitive comparison)
      // Check trial status more robustly - check both isInTrial flag and trialEndDate
      const isInTrial = user?.isInTrial || (user?.trialEndDate && new Date(user.trialEndDate) >= new Date());
      const userSelectedLottery = user?.selectedLottery?.toLowerCase();
      const currentSelectedLottery = lotteryType?.toLowerCase();

      console.log('🔍 Frontend fetchPredictions trial check:', {
        isInTrial,
        userIsInTrial: user?.isInTrial,
        trialEndDate: user?.trialEndDate,
        userSelectedLottery,
        currentSelectedLottery,
        match: userSelectedLottery === currentSelectedLottery
      });

      if (isInTrial && userSelectedLottery === currentSelectedLottery) {
        // Fetch trial predictions (free) - 1 per day
        console.log('📥 Fetching trial predictions for:', lotteryType);
        try {
          const trialData = await predictionService.getTrialPredictions(lotteryType);
          console.log('✅ Trial predictions received:', trialData);
          // For trial users: Show only 1 prediction per day (backend should return only 1)
          // Limit to 1 prediction in case backend returns multiple
          const limitedPredictions = (trialData.predictions || []).slice(0, 1);
          setPredictions(limitedPredictions);
          if (trialData.message) {
            setTrialMessage(trialData.message);
          }
        } catch (trialError: any) {
          console.error('❌ Trial prediction fetch error:', trialError);
          // If trial fetch fails, show error but don't fall back to regular predictions
          if (trialError.response?.status === 403) {
            setTrialMessage(trialError.response?.data?.message || 'Access denied for trial predictions');
            setPredictions([]);
          } else {
            toast.error(trialError.message || 'Failed to fetch trial predictions');
            setPredictions([]);
          }
        }
      } else {
        // Fetch regular predictions (trial expired or different lottery)
        console.log('📥 Fetching regular predictions for:', lotteryType);
        const fetchedPredictions = await predictionService.getPredictions(lotteryType, 1, 10);
        console.log('✅ Predictions received:', fetchedPredictions);
        console.log('✅ Number of predictions:', fetchedPredictions?.length || 0);
        if (fetchedPredictions && fetchedPredictions.length > 0) {
          console.log('✅ First prediction lottery type:', fetchedPredictions[0]?.lotteryType);
        }
        setPredictions(fetchedPredictions || []);
      }
    } catch (error: any) {
      console.error('❌ Error fetching predictions:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Lottery type was:', lotteryType);
      toast.error(error.message || 'Failed to fetch predictions');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLotteries = async () => {
    try {
      setLotteriesLoading(true);
      const fetchedLotteries = await lotteryService.getLotteries();
      setLotteries(fetchedLotteries);

      // Don't set selectedLottery here - let the URL parameter effect handle it
      // This prevents conflicts and ensures URL parameter takes precedence
    } catch (error: any) {
      console.error('Error fetching lotteries:', error);
      toast.error(error.message || 'Failed to fetch lotteries');
    } finally {
      setLotteriesLoading(false);
    }
  };

  // Keep the old fetchPredictions for backward compatibility (used by navigation refetch)
  const fetchPredictions = async () => {
    await fetchPredictionsForLottery(selectedLottery);
  };

  // Map lottery icon based on lottery code/name
  const getLotteryIcon = (lottery: Lottery): string => {
    const iconMap: { [key: string]: string } = {
      'powerball': '⚡',
      'POWERBALL': '⚡',
      'megamillion': '💰',
      'MEGAMILLION': '💰',
      'lottoamerica': '🇺🇸',
      'LOTTOAMERICA': '🇺🇸',
      'gopher5': '🎯',
      'GOPHER5': '🎯',
      'pick3': '🎲',
      'PICK3': '🎲'
    };
    return iconMap[lottery.id] || iconMap[lottery.code] || '🎰';
  };

  // Categorize lottery based on state
  const getLotteryCategory = (lottery: Lottery): string => {
    if (lottery.state === 'Multi-State' || lottery.state === 'USA') {
      return 'national';
    } else if (lottery.drawSchedule && lottery.drawSchedule.length >= 7) {
      return 'daily';
    } else {
      return 'state';
    }
  };

  // Format next draw date from draw schedule
  const getNextDraw = (lottery: Lottery): string => {
    if (!lottery.drawSchedule || lottery.drawSchedule.length === 0) {
      return 'Check schedule';
    }

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];

    // Find next draw day
    const sortedSchedule = [...lottery.drawSchedule].sort((a, b) => {
      const dayA = dayNames.indexOf(a.day.toLowerCase());
      const dayB = dayNames.indexOf(b.day.toLowerCase());
      return dayA - dayB;
    });

    let nextDraw = sortedSchedule[0];
    for (const schedule of sortedSchedule) {
      if (dayNames.indexOf(schedule.day.toLowerCase()) > dayNames.indexOf(currentDay)) {
        nextDraw = schedule;
        break;
      }
    }

    if (lottery.drawSchedule.length >= 7) {
      return `Daily, ${nextDraw.time}`;
    } else {
      const dayName = nextDraw.day.charAt(0).toUpperCase() + nextDraw.day.slice(1);
      return `${dayName}, ${nextDraw.time}`;
    }
  };

  const lotteryCategories = [
    {
      id: 'national',
      name: 'National Lotteries',
      description: 'Multi-state lottery games with large jackpots',
      icon: '🇺🇸'
    },
    {
      id: 'state',
      name: 'State Lotteries',
      description: 'State-specific lottery games',
      icon: '🏛️'
    },
    {
      id: 'daily',
      name: 'Daily Games',
      description: 'Games with daily drawings',
      icon: '📅'
    }
  ];


  const handlePurchaseClick = async (prediction: Prediction, event?: React.MouseEvent) => {
    // Scroll to the clicked prediction card
    if (event) {
      const target = event.currentTarget.closest('.col-md-6');
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      }
    }

    // Check if user is in trial and selected lottery matches (case-insensitive)
    // Check trial status more robustly - check both isInTrial flag and trialEndDate
    const isInTrial = user?.isInTrial || (user?.trialEndDate && new Date(user.trialEndDate) >= new Date());
    const userSelectedLottery = user?.selectedLottery?.toLowerCase();
    const currentSelectedLottery = selectedLottery?.toLowerCase();

    console.log('🔍 Frontend trial check:', {
      isInTrial,
      userIsInTrial: user?.isInTrial,
      trialEndDate: user?.trialEndDate,
      userSelectedLottery,
      currentSelectedLottery,
      match: userSelectedLottery === currentSelectedLottery
    });

    if (isInTrial && userSelectedLottery === currentSelectedLottery) {
      // For trial users, directly show the prediction without payment
      try {
        setLoadingPredictionDetails(true);
        setLoadingPredictionId(prediction.id); // Track which prediction is loading
        const fullPrediction = await predictionService.getPredictionDetails(
          prediction.lotteryType,
          prediction.id
        );

        setPurchasedPrediction(fullPrediction);
        setShowTrialPredictionModal(true); // Use separate trial modal
        toast.success('Prediction loaded successfully!');

        // Refresh predictions list after viewing (to update the one-per-day status)
        await fetchPredictions();
      } catch (error: any) {
        console.error('❌ Error fetching trial prediction details:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error message:', error.message);

        // Get the actual error message from the response
        let errorMessage = 'Failed to load prediction details';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error('❌ Final error message:', errorMessage);

        // Check if it's the "already viewed today" error
        if (errorMessage.includes('already viewed') || errorMessage.includes('already viewed your free prediction')) {
          toast.error('You have already used your daily free prediction for today. Come back tomorrow for a new prediction!');
        } else if (error.response?.status === 403) {
          // Show the specific error message from backend
          toast.error(errorMessage || 'Access denied. Please check your trial status.');
        } else {
          toast.error(errorMessage);
        }

        // If it's a "already viewed today" error, refresh the list
        if (errorMessage.includes('already viewed') || error.response?.status === 403) {
          await fetchPredictions();
        }
      } finally {
        setLoadingPredictionDetails(false);
        setLoadingPredictionId(null); // Clear loading state
      }
    } else {
      // For non-trial users or different lottery, show payment modal
      setSelectedPrediction(prediction);
      setAcknowledgeDisclaimer(false); // Reset checkbox when opening modal
      setShowPaymentModal(true);
    }
  };

  const handleWalletPayment = async () => {
    if (!user || !selectedPrediction) {
      toast.error('User or prediction data not available');
      return;
    }

    // Check if user acknowledged the disclaimer
    if (!acknowledgeDisclaimer) {
      toast.error('Please acknowledge the disclaimer before purchasing.');
      return;
    }

    const amount = selectedPrediction.price || 0;

    // Check if user has sufficient wallet balance
    if (user.walletBalance < amount) {
      toast.error('Insufficient wallet balance. Please add funds to your wallet.');
      return;
    }

    setPaymentLoading(true);
    try {
      // Purchase prediction directly using prediction service
      await predictionService.purchasePrediction(
        selectedPrediction.lotteryType,
        selectedPrediction.id,
        'wallet'
      );

      // Refresh user data to get updated wallet balance
      await refreshUser();

      // Small delay to ensure purchase is committed to database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch full prediction details after purchase
      setLoadingPredictionDetails(true);
      try {
        const fullPrediction = await predictionService.getPredictionDetails(
          selectedPrediction.lotteryType,
          selectedPrediction.id
        );

        setPurchasedPrediction(fullPrediction);

        // Close payment modal and open prediction view modal
        setShowPaymentModal(false);
        setShowPredictionModal(true);
        setSelectedPrediction(null);

        toast.success(`Prediction purchased successfully!`);
        // Trigger wallet balance update event
        window.dispatchEvent(new Event('walletBalanceUpdated'));
      } catch (detailsError: any) {
        console.error('Error fetching prediction details:', detailsError);
        // If we can't fetch details, show a message but still close payment modal
        setShowPaymentModal(false);
        toast.error('Purchase successful, but failed to load prediction details. Please refresh and try viewing from "My Predictions".');
      }

      // Refresh predictions list
      await fetchPredictions();
    } catch (error: any) {
      console.error('Wallet payment failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setPaymentLoading(false);
      setLoadingPredictionDetails(false);
    }
  };


  const handlePayPalPayment = async () => {
    if (!selectedPrediction) return;

    // Check if user acknowledged the disclaimer
    if (!acknowledgeDisclaimer) {
      toast.error('Please acknowledge the disclaimer before purchasing.');
      setPaymentLoading(false);
      return;
    }

    setPaymentLoading(true);
    try {
      await predictionService.purchasePrediction(
        selectedPrediction.lotteryType,
        selectedPrediction.id,
        'paypal'
      );

      // Refresh user data
      await refreshUser();

      // Small delay to ensure purchase is committed to database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch full prediction details after purchase
      setLoadingPredictionDetails(true);
      try {
        const fullPrediction = await predictionService.getPredictionDetails(
          selectedPrediction.lotteryType,
          selectedPrediction.id
        );

        setPurchasedPrediction(fullPrediction);

        // Close payment modal and open prediction view modal
        setShowPaymentModal(false);
        setShowPredictionModal(true);
        setSelectedPrediction(null);

        toast.success('Prediction purchased successfully!');
        // Trigger wallet balance update event
        window.dispatchEvent(new Event('walletBalanceUpdated'));
      } catch (detailsError: any) {
        console.error('Error fetching prediction details:', detailsError);
        // If we can't fetch details, show a message but still close payment modal
        setShowPaymentModal(false);
        toast.error('Purchase successful, but failed to load prediction details. Please refresh and try viewing from "My Predictions".');
      }

      // Refresh predictions list
      await fetchPredictions();
    } catch (error: any) {
      console.error('PayPal payment failed:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
      setLoadingPredictionDetails(false);
    }
  };

  // Helper function to calculate viable numbers from non-viable numbers
  const calculateViableFromNonViable = (lotteryType: LotteryType, nonViableMain: number[], nonViableBonus: number[] = []): any => {
    let totalMain: number, totalBonus: number;

    switch (lotteryType) {
      case 'powerball':
        totalMain = 69;
        totalBonus = 26;
        break;
      case 'megamillion':
        totalMain = 70;
        totalBonus = 25;
        break;
      case 'lottoamerica':
        totalMain = 52;
        totalBonus = 10;
        break;
      case 'gopher5':
        totalMain = 47;
        totalBonus = 0;
        break;
      case 'pick3':
        totalMain = 10; // 0-9
        totalBonus = 0;
        break;
      default:
        return null;
    }

    // Calculate viable numbers = all numbers - non-viable numbers
    const viableMain: number[] = [];
    const startNum = lotteryType === 'pick3' ? 0 : 1;
    for (let i = startNum; i < startNum + totalMain; i++) {
      if (!nonViableMain.includes(i)) {
        viableMain.push(i);
      }
    }

    const viableBonus: number[] = [];
    if (totalBonus > 0) {
      for (let i = 1; i <= totalBonus; i++) {
        if (!nonViableBonus.includes(i)) {
          viableBonus.push(i);
        }
      }
    }

    if (lotteryType === 'powerball' || lotteryType === 'megamillion' || lotteryType === 'lottoamerica') {
      return { whiteBalls: viableMain, redBalls: viableBonus };
    } else {
      return viableMain;
    }
  };

  const formatViableNumbers = (prediction: Prediction) => {
    // First, try to use viableNumbers from backend (preferred)
    if (prediction.viableNumbers) {
      if (Array.isArray(prediction.viableNumbers)) {
        // Single selection (Gopher 5, Pick 3)
        const viable = prediction.viableNumbers.filter(n => n != null);
        if (viable.length > 0) {
          return viable;
        }
      } else if (typeof prediction.viableNumbers === 'object' && prediction.viableNumbers !== null) {
        // Double selection (Powerball, Mega Millions, Lotto America)
        const obj = prediction.viableNumbers as { whiteBalls?: number[]; redBalls?: number[] };
        const whiteBalls = Array.isArray(obj.whiteBalls) ? obj.whiteBalls.filter(n => n != null) : [];
        const redBalls = Array.isArray(obj.redBalls) ? obj.redBalls.filter(n => n != null) : [];
        if (whiteBalls.length > 0 || redBalls.length > 0) {
          return { whiteBalls, redBalls };
        }
      }
    }

    // Fallback: Calculate viable numbers from non-viable numbers if viableNumbers is empty or missing
    // Check based on lottery type
    if (prediction.lotteryType === 'powerball' || prediction.lotteryType === 'megamillion' || prediction.lotteryType === 'lottoamerica') {
      // Double selection lotteries
      if (prediction.nonViableNumbers && typeof prediction.nonViableNumbers === 'object' && !Array.isArray(prediction.nonViableNumbers)) {
        const obj = prediction.nonViableNumbers as { whiteBalls?: number[]; redBalls?: number[] };
        const nonViableWhite = Array.isArray(obj.whiteBalls) ? obj.whiteBalls.filter(n => n != null) : [];
        const nonViableRed = Array.isArray(obj.redBalls) ? obj.redBalls.filter(n => n != null) : [];
        if (nonViableWhite.length > 0 || nonViableRed.length > 0) {
          return calculateViableFromNonViable(prediction.lotteryType, nonViableWhite, nonViableRed);
        }
      }
    } else if (prediction.lotteryType === 'gopher5') {
      // Single selection - check nonViableNumbersSingle
      const nonViableSingle = (prediction as any).nonViableNumbersSingle || [];
      if (Array.isArray(nonViableSingle) && nonViableSingle.length > 0) {
        const filtered = nonViableSingle.filter((n: any) => n != null);
        if (filtered.length > 0) {
          return calculateViableFromNonViable(prediction.lotteryType, filtered);
        }
      }
    } else if (prediction.lotteryType === 'pick3') {
      // Pick 3 - check nonViableNumbersPick3
      const nonViablePick3 = (prediction as any).nonViableNumbersPick3 || [];
      if (Array.isArray(nonViablePick3) && nonViablePick3.length > 0) {
        const filtered = nonViablePick3.filter((n: any) => n != null);
        if (filtered.length > 0) {
          return calculateViableFromNonViable(prediction.lotteryType, filtered);
        }
      }
    }

    return null;
  };

  const renderFullPrediction = (prediction: Prediction) => {
    const viableData = formatViableNumbers(prediction);
    const isDouble = viableData && typeof viableData === 'object' && !Array.isArray(viableData);

    return (
      <div>
        <div className="text-center mb-4">
          <h4 className="fw-bold">{prediction.lotteryDisplayName}</h4>
          <p className="text-muted mb-2">
            <i className="bi bi-calendar me-2"></i>
            Draw Date: <strong>{new Date(prediction.drawDate).toLocaleDateString()} at {prediction.drawTime}</strong>
          </p>
        </div>

        <div className="alert alert-success mb-4">
          <h5 className="alert-heading">
            <i className="bi bi-check-circle me-2"></i>
            Non Viable Numbers
          </h5>
          <p className="mb-0">
            These numbers have been identified as least likely to appear in the upcoming draw.
          </p>
        </div>

        {isDouble ? (
          <div className="mb-4">
            <div className="mb-3">
              <h6 className="fw-bold text-success mb-3">
                <i className="bi bi-circle-fill me-2"></i>
                Recommended White Balls ({viableData.whiteBalls?.length || 0} numbers):
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {(viableData as any).whiteBalls?.map((num: number) => (
                  <span
                    key={num}
                    className="badge bg-success p-3"
                    style={{ fontSize: '1.1rem', minWidth: '50px' }}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h6 className="fw-bold text-success mb-3">
                <i className="bi bi-circle-fill me-2"></i>
                Recommended Red Ball ({viableData.redBalls?.length || 0} numbers):
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {(viableData as any).redBalls?.map((num: number) => (
                  <span
                    key={num}
                    className="badge bg-success p-3"
                    style={{ fontSize: '1.1rem', minWidth: '50px' }}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h6 className="fw-bold text-success mb-3">
              <i className="bi bi-list-ul me-2"></i>
              Non Viable Numbers ({(viableData as number[])?.length || 0} numbers):
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {(viableData as number[])?.map((num: number) => (
                <span
                  key={num}
                  className="badge bg-success p-3"
                  style={{ fontSize: '1.1rem', minWidth: '50px' }}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}

        {prediction.notes && (
          <div className="alert alert-info mt-4">
            <h6 className="fw-bold mb-2">
              <i className="bi bi-info-circle me-2"></i>
              Additional Notes:
            </h6>
            <p className="mb-0">{prediction.notes}</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-light rounded">
          <div className="row text-center">
            <div className="col-6">
              <small className="text-muted d-block">Downloads</small>
              <strong>{prediction.downloadCount}</strong>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Purchases</small>
              <strong>{prediction.purchaseCount || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const selectedLotteryData = lotteries.find(lottery => lottery.id === selectedLottery || lottery.code.toLowerCase() === selectedLottery);

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3 gradient-text">Lottery Predictions</h1>
            <p className="lead text-muted">
              Get predictions to identify non-viable numbers and improve your odds
            </p>
          </div>

          {/* Lottery Selection by Category */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-trophy me-2"></i>
                Select Lottery Game by Category
              </h5>

              {lotteriesLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading lotteries...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading available lotteries...</p>
                </div>
              ) : lotteries.length === 0 ? (
                <div className="alert alert-warning text-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  No lotteries available at the moment.
                </div>
              ) : (
                lotteryCategories.map((category) => {
                  const categoryLotteries = lotteries.filter(lottery => getLotteryCategory(lottery) === category.id && lottery.isActive);

                  if (categoryLotteries.length === 0) return null;

                  return (
                    <div key={category.id} className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="fs-3 me-3">{category.icon}</span>
                        <div>
                          <h6 className="fw-bold mb-1">{category.name}</h6>
                          <p className="small text-muted mb-0">{category.description}</p>
                        </div>
                      </div>

                      <div className="row g-3">
                        {categoryLotteries.map((lottery) => (
                          <div key={lottery.id} className="col-md-6 col-lg-4">
                            <div
                              className={`card h-100 cursor-pointer ${selectedLottery === (lottery.id || lottery.code.toLowerCase()) ? 'border-primary' : ''}`}
                              onClick={() => {
                                const lotteryType = (lottery.id || lottery.code.toLowerCase()) as LotteryType;
                                if (lotteryType !== selectedLottery) {
                                  setSelectedLottery(lotteryType);
                                }

                                // Scroll to Available Predictions section
                                setTimeout(() => {
                                  const predictionsSection = document.getElementById('available-predictions-section');
                                  if (predictionsSection) {
                                    predictionsSection.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start',
                                      inline: 'nearest'
                                    });
                                  }
                                }, 100);
                              }}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: selectedLottery === (lottery.id || lottery.code.toLowerCase()) ? '2px solid var(--primary-color)' : '1px solid #e9ecef',
                                opacity: loadingLottery === (lottery.id || lottery.code.toLowerCase()) ? 0.7 : 1
                              }}
                            >
                              <div className="card-body text-center">
                                {loadingLottery === (lottery.id || lottery.code.toLowerCase()) ? (
                                  <div className="py-3">
                                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="small text-muted mb-0">Loading predictions...</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-3">
                                      <span style={{ fontSize: '2rem' }}>{getLotteryIcon(lottery)}</span>
                                    </div>
                                    <h6 className="fw-bold">{lottery.name}</h6>
                                    <p className="small text-muted mb-2">{lottery.state}</p>
                                    <p className="small mb-2">{lottery.description}</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span className="badge bg-primary">${lottery.price}/prediction</span>
                                      <small className="text-muted">{getNextDraw(lottery)}</small>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {category.id !== lotteryCategories[lotteryCategories.length - 1].id && (
                        <hr className="my-4" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Available Predictions */}
          <div id="available-predictions-section" className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-calendar-event me-2"></i>
                  Available Predictions for {selectedLotteryData?.name}
                </h5>
                {(() => {
                  const isInTrial = user?.isInTrial || (user?.trialEndDate && new Date(user.trialEndDate) >= new Date());
                  const userSelectedLottery = user?.selectedLottery?.toLowerCase();
                  const currentSelectedLottery = selectedLottery?.toLowerCase();
                  return isInTrial && userSelectedLottery === currentSelectedLottery;
                })() && (
                    <span className="badge bg-success">
                      <i className="bi bi-star me-1"></i>
                      Free Trial
                    </span>
                  )}
              </div>

              {!user ? (
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  Please <a href="/register" className="alert-link">sign up</a> or <a href="/login" className="alert-link">login</a> to view predictions
                </div>
              ) : loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading predictions...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading predictions...</p>
                </div>
              ) : predictions.length === 0 ? (
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  {trialMessage || (
                    <>
                      <strong>No predictions available for {selectedLotteryData?.name || selectedLottery} at the moment.</strong>
                      <br />
                      <small>This could mean:</small>
                      <ul className="text-start mt-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <li>No active predictions have been created for this lottery</li>
                        <li>All available predictions have past draw dates</li>
                        <li>Predictions are inactive</li>
                      </ul>
                      <small className="d-block mt-2">Please check back later or contact admin to add predictions for this lottery.</small>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {trialMessage && (
                    <div className="alert alert-info mb-3">
                      <i className="bi bi-info-circle me-2"></i>
                      {trialMessage}
                    </div>
                  )}
                  <div className="row g-3">
                    {predictions.map((prediction) => {
                      const viableData = formatViableNumbers(prediction);
                      const isDouble = viableData && !Array.isArray(viableData);

                      return (
                        <div key={prediction.id} id={`prediction-${prediction.id}`} className="col-md-6">
                          <div className="card h-100 border">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                  <h6 className="fw-bold mb-1">{prediction.lotteryDisplayName}</h6>
                                  <small className="text-muted">
                                    <i className="bi bi-calendar me-1"></i>
                                    {new Date(prediction.drawDate).toLocaleDateString()} at {prediction.drawTime}
                                  </small>
                                </div>
                                {(() => {
                                  const isInTrial = user?.isInTrial || (user?.trialEndDate && new Date(user.trialEndDate) >= new Date());
                                  const userSelectedLottery = user?.selectedLottery?.toLowerCase();
                                  const currentSelectedLottery = selectedLottery?.toLowerCase();
                                  return isInTrial && userSelectedLottery === currentSelectedLottery ? (
                                    <span className="badge bg-success">Free Trial</span>
                                  ) : (
                                    <span className="badge bg-primary">${prediction.price ? prediction.price.toFixed(2) : '0.00'}</span>
                                  );
                                })()}
                              </div>

                              {/* Show limited preview - just count, not actual numbers */}
                              {(() => {
                                const isInTrial = user?.isInTrial || (user?.trialEndDate && new Date(user.trialEndDate) >= new Date());
                                const userSelectedLottery = user?.selectedLottery?.toLowerCase();
                                const currentSelectedLottery = selectedLottery?.toLowerCase();
                                return viableData && !(isInTrial && userSelectedLottery === currentSelectedLottery);
                              })() && (
                                  <div className="mb-3 p-2 bg-light rounded">
                                    {isDouble ? (
                                      <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Includes {(viableData as any).whiteBalls?.length || 0} recommended white ball numbers and {(viableData as any).redBalls?.length || 0} recommended red ball number(s).
                                        <strong className="text-primary"> Purchase to view full details.</strong>
                                      </small>
                                    ) : (
                                      <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Includes {(viableData as number[])?.length || 0} recommended numbers.
                                        <strong className="text-primary"> Purchase to view full details.</strong>
                                      </small>
                                    )}
                                  </div>
                                )}

                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                  <i className="bi bi-download me-1"></i>
                                  {prediction.downloadCount} downloads
                                </small>
                                {(() => {
                                  const isInTrial = user?.isInTrial || (user?.trialEndDate && new Date(user.trialEndDate) >= new Date());
                                  const userSelectedLottery = user?.selectedLottery?.toLowerCase();
                                  const currentSelectedLottery = selectedLottery?.toLowerCase();
                                  return isInTrial && userSelectedLottery === currentSelectedLottery;
                                })() ? (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={(e) => handlePurchaseClick(prediction, e)}
                                    disabled={loadingPredictionDetails && loadingPredictionId === prediction.id}
                                  >
                                    {loadingPredictionDetails && loadingPredictionId === prediction.id ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-eye me-1"></i>
                                        View More
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={(e) => handlePurchaseClick(prediction, e)}
                                    disabled={paymentLoading || (loadingPredictionDetails && loadingPredictionId === prediction.id)}
                                  >
                                    {loadingPredictionDetails && loadingPredictionId === prediction.id ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-cart me-1"></i>
                                        Purchase
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-credit-card me-2"></i>
            Purchase Prediction
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrediction && (
            <div className="mb-4">
              <div className="text-center mb-3">
                <h5>{selectedPrediction.lotteryDisplayName}</h5>
                <p className="text-muted mb-1">
                  Draw Date: <strong>{new Date(selectedPrediction.drawDate).toLocaleDateString()} at {selectedPrediction.drawTime}</strong>
                </p>
                <p className="text-muted">Amount: <strong className="fs-5">${selectedPrediction.price ? selectedPrediction.price.toFixed(2) : '0.00'}</strong></p>
              </div>

              {user && (
                <div className="alert alert-info mb-3">
                  <p className="mb-1">
                    <strong>Wallet Balance:</strong> ${user.walletBalance.toFixed(2)}
                  </p>
                  {selectedPrediction.price && user.walletBalance < selectedPrediction.price && (
                    <p className="mb-0 text-danger">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Insufficient balance - <a href="/wallet" className="alert-link">Add funds</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer Warning */}
          <div className="alert alert-warning border-warning mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-exclamation-triangle-fill text-warning me-2 fs-5"></i>
              <div className="flex-grow-1">
                <h6 className="alert-heading mb-2">
                  <strong>Important Disclaimer</strong>
                </h6>
                <ul className="mb-2 ps-3">
                  <li>Predictions are based on statistical analysis and are <strong>NOT 100% accurate</strong></li>
                  <li>Lottery outcomes are random and cannot be guaranteed</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>Use predictions at your own discretion and risk</li>
                  <li>We are not responsible for any losses incurred from using our predictions</li>
                </ul>
                <p className="mb-0 small">
                  <strong>By purchasing, you acknowledge that you understand these limitations and agree to use the predictions responsibly.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="acknowledgeDisclaimer"
                checked={acknowledgeDisclaimer}
                onChange={(e) => setAcknowledgeDisclaimer(e.target.checked)}
                disabled={paymentLoading}
              />
              <label className="form-check-label" htmlFor="acknowledgeDisclaimer">
                <strong>I acknowledge and understand that predictions are not 100% accurate and outcomes cannot be guaranteed. I accept full responsibility for my purchase decision.</strong>
              </label>
            </div>
          </div>

          <div className="d-grid gap-3">
            {/* Wallet Payment Option */}
            <Button
              variant="outline-primary"
              size="lg"
              onClick={handleWalletPayment}
              disabled={paymentLoading || loadingPredictionDetails || !acknowledgeDisclaimer || (user && selectedPrediction && selectedPrediction.price ? user.walletBalance < selectedPrediction.price : false)}
              className="d-flex align-items-center justify-content-center"
            >
              {paymentLoading || loadingPredictionDetails ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-wallet2 me-2"></i>
                  Pay with Wallet
                </>
              )}
            </Button>

            {/* PayPal Payment Option */}
            {(!user || user.walletBalance >= (selectedPrediction?.price || 0)) && acknowledgeDisclaimer ? (
              <div className="paypal-container">
                <PayPalScriptProvider
                  options={{
                    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "", // Load from environment variable
                    currency: "USD"
                  }}
                >
                  <PayPalButtons
                    createOrder={(_data, actions) => {
                      if (!acknowledgeDisclaimer) {
                        return Promise.reject('Please acknowledge the disclaimer first');
                      }
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              value: selectedPrediction?.price?.toString() || "0",
                              currency_code: "USD"
                            },
                            description: `Prediction for ${selectedPrediction?.lotteryDisplayName}`
                          }
                        ]
                      });
                    }}
                    onApprove={(_data, actions) => {
                      return actions.order!.capture().then((details) => {
                        console.log('PayPal payment completed:', details);
                        handlePayPalPayment();
                      });
                    }}
                    onError={(err) => {
                      console.error('PayPal error:', err);
                      setPaymentLoading(false);
                    }}
                    style={{
                      layout: 'vertical',
                      color: 'blue',
                      shape: 'rect',
                      label: 'paypal'
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            ) : !acknowledgeDisclaimer ? (
              <div className="alert alert-info text-center mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Please acknowledge the disclaimer above to enable PayPal payment
              </div>
            ) : null}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPaymentModal(false);
              setAcknowledgeDisclaimer(false); // Reset checkbox when closing
            }}
            disabled={paymentLoading}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Free Trial Prediction Modal - No validation/disclaimer needed */}
      <Modal
        show={showTrialPredictionModal}
        onHide={() => {
          setShowTrialPredictionModal(false);
          setPurchasedPrediction(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-gift me-2"></i>
            Free Trial Prediction
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingPredictionDetails ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading prediction details...</span>
              </div>
              <p className="mt-3 text-muted">Loading your free prediction...</p>
            </div>
          ) : purchasedPrediction ? (
            <>
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Free Trial:</strong> This is your daily free prediction. You can view one prediction per day during your trial period.
              </div>
              {renderFullPrediction(purchasedPrediction)}
            </>
          ) : (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No prediction data available.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={() => {
              setShowTrialPredictionModal(false);
              setPurchasedPrediction(null);
            }}
          >
            <i className="bi bi-check me-2"></i>
            Got it, thanks!
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Prediction Details Modal - Shows after purchase */}
      <Modal
        show={showPredictionModal}
        onHide={() => {
          setShowPredictionModal(false);
          setPurchasedPrediction(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-check-circle me-2"></i>
            Prediction Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingPredictionDetails ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading prediction details...</span>
              </div>
              <p className="mt-3 text-muted">Loading your prediction...</p>
            </div>
          ) : purchasedPrediction ? (
            renderFullPrediction(purchasedPrediction)
          ) : (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No prediction data available.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={() => {
              setShowPredictionModal(false);
              setPurchasedPrediction(null);
            }}
          >
            <i className="bi bi-check me-2"></i>
            Got it, thanks!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Predictions;

