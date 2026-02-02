import React, { useState, useEffect } from 'react';
import { Prediction, LotteryType } from '../../types';
import { apiService } from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const AdminPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLottery, setFilterLottery] = useState<LotteryType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);
  const [togglingPredictionId, setTogglingPredictionId] = useState<string | null>(null);
  const [showAddResultModal, setShowAddResultModal] = useState(false);
  const [selectedPredictionForResult, setSelectedPredictionForResult] = useState<Prediction | null>(null);
  const [predictionResults, setPredictionResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showEditResultModal, setShowEditResultModal] = useState(false);
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [selectedPredictionIds, setSelectedPredictionIds] = useState<string[]>([]);
  const [exportPdfLoading, setExportPdfLoading] = useState(false);
  const [resultData, setResultData] = useState({
    drawDate: new Date().toISOString().split('T')[0],
    winningNumbers: {
      whiteBalls: [] as number[],
      redBalls: [] as number[],
      singleNumbers: [] as number[],
      pick3Numbers: [] as number[]
    },
    jackpot: '',
    winners: {
      jackpot: '',
      match5: '',
      match4: '',
      match3: '',
      exact: '',
      any: ''
    }
  });
  // Lottery configurations with pick limits
  const lotteryConfigs = {
    powerball: {
      whiteBalls: { min: 1, max: 69, pickCount: 5, label: 'White Balls (1-69)' },
      redBalls: { min: 1, max: 26, pickCount: 1, label: 'Red Ball / Powerball (1-26)' },
      type: 'double' as const
    },
    megamillion: {
      whiteBalls: { min: 1, max: 70, pickCount: 5, label: 'White Balls (1-70)' },
      redBalls: { min: 1, max: 25, pickCount: 1, label: 'Mega Ball (1-25)' },
      type: 'double' as const
    },
    lottoamerica: {
      whiteBalls: { min: 1, max: 52, pickCount: 5, label: 'White Balls (1-52)' },
      redBalls: { min: 1, max: 10, pickCount: 1, label: 'Star Ball (1-10)' },
      type: 'double' as const
    },
    gopher5: {
      numbers: { min: 1, max: 47, pickCount: 5, label: 'Numbers (1-47)' },
      type: 'single' as const
    },
    pick3: {
      numbers: { min: 0, max: 9, pickCount: 3, label: 'Numbers (0-9)' },
      type: 'pick3' as const
    }
  };

  const [newPrediction, setNewPrediction] = useState({
    lotteryType: 'powerball' as LotteryType,
    lotteryDisplayName: '',
    drawDate: '',
    drawTime: '',
    drawDay: '' as string, // Selected draw day (e.g., 'monday', 'tuesday')
    whiteBalls: [] as number[],
    redBalls: [] as number[],
    singleNumbers: [] as number[],
    pick3Numbers: [] as number[],
    price: '' as any,
    notes: ''
  });

  // Draw schedule configuration (All times in Minnesota Time - CST/CDT)
  const drawSchedule: Record<string, { days: string[], time: string }> = {
    powerball: {
      days: ['monday', 'wednesday', 'saturday'],
      time: '21:59' // 9:59 PM Minnesota Time
    },
    megamillion: {
      days: ['tuesday', 'friday'],
      time: '22:00' // 10:00 PM Minnesota Time
    },
    lottoamerica: {
      days: ['monday', 'wednesday', 'saturday'],
      time: '21:15' // 9:15 PM Minnesota Time
    },
    gopher5: {
      days: ['monday', 'wednesday', 'friday'],
      time: '18:17' // 6:17 PM Minnesota Time
    },
    pick3: {
      days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      time: '18:17' // 6:17 PM Minnesota Time
    }
  };

  // Get available draw days for selected lottery
  const getAvailableDrawDays = (lotteryType: LotteryType): string[] => {
    return drawSchedule[lotteryType]?.days || [];
  };

  // Calculate next occurrence of a day
  const getNextDateForDay = (dayName: string): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.indexOf(dayName.toLowerCase());
    
    if (dayIndex === -1) return '';
    
    // Get current date (using local time to avoid UTC conversion issues)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let daysUntil = dayIndex - currentDay;
    if (daysUntil < 0) {
      daysUntil += 7; // Next week
    } else if (daysUntil === 0) {
      // If it's today, check if the draw time has passed
      const drawTime = drawSchedule[newPrediction.lotteryType]?.time || '18:17';
      const [hours, minutes] = drawTime.split(':').map(Number);
      const drawDateTime = new Date(now);
      drawDateTime.setHours(hours, minutes, 0, 0);
      
      if (now > drawDateTime) {
        daysUntil = 7; // Draw time has passed, use next week
      }
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    
    // Format as YYYY-MM-DD using local date (not UTC)
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Handle draw day selection
  const handleDrawDayChange = (day: string) => {
    const drawDate = getNextDateForDay(day);
    const drawTime = drawSchedule[newPrediction.lotteryType]?.time || '18:17';
    
    setNewPrediction(prev => ({
      ...prev,
      drawDay: day,
      drawDate: drawDate,
      drawTime: drawTime
    }));
  };

  // Helper function to get price based on lottery type
  const getPriceByLotteryType = (lotteryType: LotteryType): number => {
    const priceMap: Record<LotteryType, number> = {
      'lottoamerica': 1,
      'megamillion': 5,
      'powerball': 2,
      'gopher5': 1,
      'pick3': 1
    };
    return priceMap[lotteryType] || 0;
  };

  // Reset draw day when lottery type changes
  const handleLotteryTypeChange = (lotteryType: LotteryType) => {
    const autoPrice = getPriceByLotteryType(lotteryType);
    setNewPrediction(prev => ({
      ...prev,
      lotteryType: lotteryType,
      drawDay: '',
      drawDate: '',
      drawTime: '',
      price: autoPrice > 0 ? autoPrice : prev.price
    }));
  };
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const lotteryTypes: { value: LotteryType; label: string }[] = [
    { value: 'powerball', label: 'Powerball' },
    { value: 'megamillion', label: 'Mega Millions' },
    { value: 'lottoamerica', label: 'Lotto America' },
    { value: 'pick3', label: 'Pick 3' },
    { value: 'gopher5', label: 'Gopher 5' }
  ];

  useEffect(() => {
    fetchPredictions();
  }, [currentPage, searchTerm, filterLottery, filterStatus]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterLottery !== 'all' && { lotteryType: filterLottery }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      console.log('🔍 Fetching predictions with params:', {
        searchTerm,
        filterLottery,
        filterStatus,
        currentPage,
        params: params.toString()
      });

      const response = await apiService.get(`/admin/predictions?${params}`);
      if ((response as any).success) {
        setPredictions((response as any).data.predictions);
        setTotalPages((response as any).data.pagination.pages);
      } else {
        setError('Failed to fetch predictions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictionsForExport = async (lotteryType?: LotteryType | 'all'): Promise<Prediction[]> => {
    const params = new URLSearchParams();
    if (lotteryType && lotteryType !== 'all') params.set('lotteryType', lotteryType);
    const response = await apiService.get(`/admin/predictions/export${params.toString() ? `?${params}` : ''}`);
    if (!(response as any).success) return [];
    return (response as any).data.predictions || [];
  };

  const formatPredictionNumbers = (pred: any): string => {
    const lt = (pred.lotteryType || '').toLowerCase();
    if (lt === 'powerball' || lt === 'megamillion' || lt === 'lottoamerica') {
      const w = pred.nonViableNumbers?.whiteBalls || pred.viableNumbers?.whiteBalls || [];
      const r = pred.nonViableNumbers?.redBalls || pred.viableNumbers?.redBalls || [];
      const wStr = Array.isArray(w) ? w.join(', ') : '';
      const rStr = Array.isArray(r) ? r.join(', ') : '';
      return `White: ${wStr || '—'} | Red: ${rStr || '—'}`;
    }
    if (lt === 'gopher5') {
      const arr = pred.nonViableNumbersSingle || pred.viableNumbersSingle || [];
      return Array.isArray(arr) ? arr.join(', ') || '—' : '—';
    }
    if (lt === 'pick3') {
      const arr = pred.nonViableNumbersPick3 || pred.viableNumbersPick3 || [];
      return Array.isArray(arr) ? arr.join(', ') || '—' : '—';
    }
    return '—';
  };

  const generatePredictionPDF = (list: Prediction[], filename: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;
    const lineH = 7;
    const margin = 14;

    doc.setFontSize(16);
    doc.text('Prediction Export', margin, y);
    y += lineH + 2;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total: ${list.length} prediction(s)`, margin, y);
    y += lineH + 4;

    list.forEach((pred, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
      const predAny = pred as any;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${pred.lotteryDisplayName || pred.lotteryType}`, margin, y);
      y += lineH;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Draw: ${new Date(pred.drawDate).toLocaleDateString()} ${pred.drawTime || ''}`, margin, y);
      y += lineH;
      doc.text(`Price: $${typeof pred.price === 'number' ? pred.price.toFixed(2) : pred.price}`, margin, y);
      y += lineH;
      const numbersText = formatPredictionNumbers(predAny);
      const split = doc.splitTextToSize(`Numbers: ${numbersText}`, pageW - 2 * margin);
      doc.text(split, margin, y);
      y += lineH * split.length;
      if (pred.notes) {
        const notesSplit = doc.splitTextToSize(`Notes: ${pred.notes}`, pageW - 2 * margin);
        doc.text(notesSplit, margin, y);
        y += lineH * notesSplit.length;
      }
      y += 4;
    });

    doc.save(filename);
  };

  const handleExportPdf = async (mode: 'selected' | 'lottery' | 'all') => {
    setExportPdfLoading(true);
    try {
      let list: Prediction[] = [];
      let filename = `predictions-export-${new Date().toISOString().split('T')[0]}.pdf`;

      if (mode === 'selected') {
        if (selectedPredictionIds.length === 0) {
          toast.error('Select at least one prediction to export.');
          setExportPdfLoading(false);
          return;
        }
        list = predictions.filter((p) => {
          const id = p.id || (p as any)._id;
          return id && selectedPredictionIds.includes(id);
        });
        filename = `predictions-selected-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (mode === 'lottery') {
        const lottery = filterLottery !== 'all' ? filterLottery : undefined;
        if (!lottery) {
          toast.error('Choose a lottery filter (e.g. Pick 3) or use "Export all".');
          setExportPdfLoading(false);
          return;
        }
        list = await fetchPredictionsForExport(lottery);
        const label = lotteryTypes.find((lt) => lt.value === lottery)?.label || lottery;
        filename = `predictions-${lottery}-all-${new Date().toISOString().split('T')[0]}.pdf`;
        toast.success(`Exported ${list.length} ${label} prediction(s).`);
      } else {
        list = await fetchPredictionsForExport('all');
        toast.success(`Exported ${list.length} prediction(s).`);
      }

      if (list.length === 0) {
        toast.error('No predictions to export.');
        setExportPdfLoading(false);
        return;
      }
      generatePredictionPDF(list, filename);
    } catch (e: any) {
      toast.error(e?.message || 'Export failed.');
    } finally {
      setExportPdfLoading(false);
    }
  };

  const handleExportPdfByLottery = async (lotteryType: LotteryType) => {
    setExportPdfLoading(true);
    try {
      const list = await fetchPredictionsForExport(lotteryType);
      const label = lotteryTypes.find((lt) => lt.value === lotteryType)?.label || lotteryType;
      const filename = `predictions-${lotteryType}-all-${new Date().toISOString().split('T')[0]}.pdf`;
      if (list.length === 0) {
        toast.error(`No ${label} predictions to export.`);
        setExportPdfLoading(false);
        return;
      }
      generatePredictionPDF(list, filename);
      toast.success(`Exported ${list.length} ${label} prediction(s).`);
    } catch (e: any) {
      toast.error(e?.message || 'Export failed.');
    } finally {
      setExportPdfLoading(false);
    }
  };

  const toggleSelectPrediction = (id: string) => {
    setSelectedPredictionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    const ids = predictions.map((p) => p.id || (p as any)._id).filter(Boolean) as string[];
    const allSelected = ids.length > 0 && ids.every((id) => selectedPredictionIds.includes(id));
    if (allSelected) {
      setSelectedPredictionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPredictionIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handlePredictionAction = async (predictionId: string, action: string) => {
    // Validate predictionId before making request
    if (!predictionId || predictionId === 'undefined' || predictionId === 'null') {
      toast.error('Invalid prediction ID');
      console.error('Invalid predictionId:', predictionId);
      return;
    }

    try {
      setTogglingPredictionId(predictionId);
      setError(null);
      
      console.log('🔄 Toggling prediction status:', { predictionId, action });
      console.log('🔄 Current predictions:', predictions.map(p => ({ id: p.id, _id: (p as any)._id, isActive: p.isActive })));
      
      const response = await apiService.patch(`/admin/predictions/${predictionId}/${action}`);
      
      console.log('✅ Toggle response:', response);
      
      if ((response as any).success) {
        const message = (response as any).message || `Prediction ${action === 'toggle-status' ? 'status updated' : action === 'delete' ? 'deleted' : 'updated'} successfully`;
        toast.success(message);
        
        // Update the prediction in the local state immediately for better UX
        if (action === 'toggle-status') {
          const newIsActive = (response as any).data?.isActive;
          setPredictions(prevPredictions => 
            prevPredictions.map(prediction => {
              const predId = prediction.id || (prediction as any)._id || (prediction as any).predictionId;
              return predId === predictionId 
                ? { ...prediction, isActive: newIsActive !== undefined ? newIsActive : (prediction.isActive === undefined ? true : !prediction.isActive) }
                : prediction;
            })
          );
          // Update selected prediction if modal is open
          if (selectedPrediction) {
            const selectedId = selectedPrediction.id || (selectedPrediction as any)._id || (selectedPrediction as any).predictionId;
            if (selectedId === predictionId) {
              setSelectedPrediction({ ...selectedPrediction, isActive: newIsActive !== undefined ? newIsActive : (selectedPrediction.isActive === undefined ? true : !selectedPrediction.isActive) });
            }
          }
        } else if (action === 'delete') {
          setPredictions(prevPredictions => prevPredictions.filter(prediction => {
            const predId = prediction.id || (prediction as any)._id || (prediction as any).predictionId;
            return predId !== predictionId;
          }));
          setShowModal(false);
          setSelectedPrediction(null);
        }
        
        // Refresh the list to ensure consistency
        fetchPredictions();
        if (action !== 'toggle-status') {
          setShowModal(false);
          setSelectedPrediction(null);
        }
      } else {
        const errorMessage = (response as any).message || 'Action failed';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error toggling prediction status:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Action failed';
      setError(errorMessage);
      
      // Show more detailed error if available
      if (err.response?.data?.errors) {
        const errors = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors.map((e: any) => e.message || e.msg).join(', ')
          : err.response.data.errors;
        toast.error(errors || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setTogglingPredictionId(null);
    }
  };

  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPrediction(false);
  };

  const handleUpdatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrediction) return;
    await submitPrediction(true);
  };

  const submitPrediction = async (isEdit: boolean) => {
    try {
      // Get lottery config for formatting numbers
      const config = lotteryConfigs[newPrediction.lotteryType];
      
      // Combine date and time into ISO8601 datetime string
      const drawDateTime = new Date(`${newPrediction.drawDate}T${newPrediction.drawTime}`).toISOString();
      
      const predictionData: any = {
        lotteryType: newPrediction.lotteryType,
        lotteryDisplayName: newPrediction.lotteryDisplayName,
        drawDate: drawDateTime,
        drawTime: newPrediction.drawTime,
        price: newPrediction.price === '' ? 0 : parseFloat(newPrediction.price.toString()),
        notes: newPrediction.notes || undefined
      };

      // Format non-viable numbers based on lottery type (these are the numbers to avoid)
      if (config.type === 'double') {
        const whiteBalls = newPrediction.whiteBalls.filter(n => n != null && !isNaN(n));
        const redBalls = newPrediction.redBalls.filter(n => n != null && !isNaN(n));
        predictionData.nonViableNumbers = {
          whiteBalls: whiteBalls,
          redBalls: redBalls
        };
        console.log('📤 FRONTEND - Sending nonViableNumbers:', JSON.stringify(predictionData.nonViableNumbers, null, 2));
        console.log('📤 FRONTEND - White balls array:', whiteBalls);
        console.log('📤 FRONTEND - Red balls array:', redBalls);
      } else if (config.type === 'single') {
        const numbers = newPrediction.singleNumbers.filter(n => n != null && !isNaN(n));
        predictionData.nonViableNumbersSingle = numbers;
        console.log('📤 FRONTEND - Sending nonViableNumbersSingle:', numbers);
      } else if (config.type === 'pick3') {
        const numbers = newPrediction.pick3Numbers.filter(n => n != null && !isNaN(n));
        predictionData.nonViableNumbersPick3 = numbers;
        console.log('📤 FRONTEND - Sending nonViableNumbersPick3:', numbers);
      }

      console.log('📤 FRONTEND - Full predictionData being sent:', JSON.stringify(predictionData, null, 2));

      if (isEdit && editingPrediction) {
        // Update existing prediction
        const predictionId = editingPrediction.id || (editingPrediction as any)._id || (editingPrediction as any).predictionId;
        if (!predictionId) {
          const errorMsg = 'Prediction ID is missing. Cannot update prediction.';
          setError(errorMsg);
          toast.error(errorMsg);
          console.error('Editing prediction missing ID:', editingPrediction);
          return;
        }

        console.log('📤 FRONTEND - Updating prediction with ID:', predictionId);
        const response = await apiService.put(`/admin/predictions/${predictionId}`, predictionData);
        
        if ((response as any).success) {
          setShowEditModal(false);
          setEditingPrediction(null);
          resetPredictionForm();
          fetchPredictions();
          setError(null);
          setFieldErrors({});
          toast.success('Prediction updated successfully!');
        } else {
          const errorMsg = (response as any).message || 'Failed to update prediction';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } else {
        // Create new prediction
        const response = await apiService.post('/admin/predictions', predictionData);
        if ((response as any).success) {
          setShowCreateModal(false);
          resetPredictionForm();
          fetchPredictions();
          setError(null);
          setFieldErrors({});
          toast.success('Prediction created successfully!');
        } else {
          const errorMsg = (response as any).message || 'Failed to create prediction';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      }
    } catch (err: any) {
      // Handle validation errors from backend
      if (err.response?.status === 400 || err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors;
        if (Array.isArray(validationErrors)) {
          const errors: Record<string, string> = {};
          validationErrors.forEach((error: any) => {
            const field = error.param || error.path || error.field;
            const message = error.msg || error.message || 'Validation error';
            if (field) {
              errors[field] = message;
            }
          });
          setFieldErrors(errors);
          // Don't show toast for validation errors - they're shown on fields
          return;
        }
      }
      
      // For other errors, show toast
      const errorMsg = err.response?.data?.message || err.message || `Failed to ${isEdit ? 'update' : 'create'} prediction`;
      setError(errorMsg);
      toast.error(errorMsg);
      setFieldErrors({});
    }
  };

  const handleAddResult = async () => {
    if (!selectedPredictionForResult) return;

    try {
      // Check if this prediction already has results
      const predictionId = selectedPredictionForResult.id || (selectedPredictionForResult as any)._id;
      if (!predictionId) {
        toast.error('Prediction ID is missing');
        return;
      }
      
      try {
        const resultsResponse = await apiService.get(`/admin/predictions/${predictionId}/results`);
        const existingResults = (resultsResponse as any).data?.results || [];
        
        if (existingResults.length > 0) {
          toast.error('This prediction already has a result. Please use "Update Result" to modify it.');
          setShowAddResultModal(false);
          // Open edit modal instead
          const latestResult = existingResults[0];
          setEditingResult(latestResult);
          
          const whiteBalls = Array.isArray(latestResult.winningNumbers?.whiteBalls) 
            ? latestResult.winningNumbers.whiteBalls 
            : (latestResult.winningNumbers?.whiteBalls ? [latestResult.winningNumbers.whiteBalls] : []);
          const redBalls = Array.isArray(latestResult.winningNumbers?.redBalls) 
            ? latestResult.winningNumbers.redBalls 
            : (latestResult.winningNumbers?.redBalls ? [latestResult.winningNumbers.redBalls] : []);
          const singleNumbers = Array.isArray(latestResult.winningNumbersSingle) 
            ? latestResult.winningNumbersSingle 
            : (latestResult.winningNumbersSingle ? [latestResult.winningNumbersSingle] : []);
          const pick3Numbers = Array.isArray(latestResult.winningNumbersPick3) 
            ? latestResult.winningNumbersPick3 
            : (latestResult.winningNumbersPick3 ? [latestResult.winningNumbersPick3] : []);
          
          const editData = {
            drawDate: new Date(latestResult.drawDate).toISOString().split('T')[0],
            winningNumbers: {
              whiteBalls: whiteBalls,
              redBalls: redBalls,
              singleNumbers: singleNumbers,
              pick3Numbers: pick3Numbers
            },
            jackpot: latestResult.jackpot?.toString() || '',
            winners: {
              jackpot: latestResult.winners?.jackpot?.toString() || '',
              match5: latestResult.winners?.match5?.toString() || '',
              match4: latestResult.winners?.match4?.toString() || '',
              match3: latestResult.winners?.match3?.toString() || '',
              exact: latestResult.winners?.exact?.toString() || '',
              any: latestResult.winners?.any?.toString() || ''
            }
          };
          setResultData(editData);
          setShowEditResultModal(true);
          return;
        }
      } catch (checkError) {
        // If check fails, continue with add (might be network issue)
        console.warn('Could not check existing results:', checkError);
      }

      const config = lotteryConfigs[selectedPredictionForResult.lotteryType];
      let winningNumbers: any = {};

      // No validation - allow any number of winning numbers
      if (config.type === 'double') {
        winningNumbers = {
          whiteBalls: resultData.winningNumbers.whiteBalls || [],
          redBalls: resultData.winningNumbers.redBalls || []
        };
      } else if (config.type === 'single') {
        winningNumbers = {
          singleNumbers: resultData.winningNumbers.singleNumbers || []
        };
      } else if (config.type === 'pick3') {
        winningNumbers = {
          pick3Numbers: resultData.winningNumbers.pick3Numbers || []
        };
      }

      const resultPayload = {
        drawDate: resultData.drawDate,
        winningNumbers: winningNumbers,
        jackpot: resultData.jackpot ? parseFloat(resultData.jackpot) : 0,
        winners: {
          jackpot: resultData.winners.jackpot ? parseInt(resultData.winners.jackpot) : 0,
          match5: resultData.winners.match5 ? parseInt(resultData.winners.match5) : 0,
          match4: resultData.winners.match4 ? parseInt(resultData.winners.match4) : 0,
          match3: resultData.winners.match3 ? parseInt(resultData.winners.match3) : 0,
          exact: resultData.winners.exact ? parseInt(resultData.winners.exact) : 0,
          any: resultData.winners.any ? parseInt(resultData.winners.any) : 0
        }
      };

      console.log('📤 Adding result for prediction:', predictionId);
      console.log('📤 Result payload:', resultPayload);
      const response = await apiService.post(`/admin/predictions/${predictionId}/result`, resultPayload);
      
      if ((response as any).success) {
        toast.success('Result added successfully!');
        setShowAddResultModal(false);
        setSelectedPredictionForResult(null);
        fetchPredictions();
        // Refresh results if modal is open
        if (selectedPrediction) {
          await fetchPredictionResults(selectedPrediction);
        }
      } else {
        throw new Error((response as any).message || 'Failed to add result');
      }
    } catch (error: any) {
      console.error('Error adding result:', error);
      // Don't show error if it's the validation check
      if (!error.message?.includes('already has a result')) {
        toast.error(error.message || 'Failed to add result');
      }
    }
  };

  const handleEditResult = async () => {
    if (!editingResult) return;

    try {
      const config = lotteryConfigs[selectedPredictionForResult?.lotteryType || 'powerball'];
      let winningNumbers: any = {};

      // No validation - allow any number of winning numbers
      if (config.type === 'double') {
        winningNumbers = {
          whiteBalls: resultData.winningNumbers.whiteBalls || [],
          redBalls: resultData.winningNumbers.redBalls || []
        };
      } else if (config.type === 'single') {
        winningNumbers = {
          singleNumbers: resultData.winningNumbers.singleNumbers || []
        };
      } else if (config.type === 'pick3') {
        winningNumbers = {
          pick3Numbers: resultData.winningNumbers.pick3Numbers || []
        };
      }

      const resultPayload = {
        drawDate: resultData.drawDate,
        winningNumbers: winningNumbers,
        jackpot: resultData.jackpot ? parseFloat(resultData.jackpot) : 0,
        winners: {
          jackpot: resultData.winners.jackpot ? parseInt(resultData.winners.jackpot) : 0,
          match5: resultData.winners.match5 ? parseInt(resultData.winners.match5) : 0,
          match4: resultData.winners.match4 ? parseInt(resultData.winners.match4) : 0,
          match3: resultData.winners.match3 ? parseInt(resultData.winners.match3) : 0,
          exact: resultData.winners.exact ? parseInt(resultData.winners.exact) : 0,
          any: resultData.winners.any ? parseInt(resultData.winners.any) : 0
        }
      };

      const resultId = editingResult._id;
      const response = await apiService.put(`/admin/results/${resultId}`, resultPayload);
      
      if ((response as any).success) {
        toast.success('Result updated successfully!');
        setShowEditResultModal(false);
        setEditingResult(null);
        // Reset result data
        setResultData({
          drawDate: new Date().toISOString().split('T')[0],
          winningNumbers: {
            whiteBalls: [],
            redBalls: [],
            singleNumbers: [],
            pick3Numbers: []
          },
          jackpot: '',
          winners: {
            jackpot: '',
            match5: '',
            match4: '',
            match3: '',
            exact: '',
            any: ''
          }
        });
        // Refresh results
        if (selectedPrediction) {
          await fetchPredictionResults(selectedPrediction);
        }
      } else {
        throw new Error((response as any).message || 'Failed to update result');
      }
    } catch (error: any) {
      console.error('Error updating result:', error);
      toast.error(error.message || 'Failed to update result');
    }
  };

  const resetPredictionForm = () => {
    setNewPrediction({
      lotteryType: 'powerball',
      lotteryDisplayName: '',
      drawDate: '',
      drawTime: '',
      drawDay: '',
      whiteBalls: [],
      redBalls: [],
      singleNumbers: [],
      pick3Numbers: [],
      price: '' as any,
      notes: ''
    });
    setFieldErrors({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPredictions();
  };

  const openPredictionModal = async (prediction: Prediction) => {
    setSelectedPrediction(prediction);
    setShowModal(true);
    // Fetch results for this prediction
    await fetchPredictionResults(prediction);
  };

  const fetchPredictionResults = async (prediction: Prediction) => {
    try {
      setLoadingResults(true);
      const predictionId = prediction.id || (prediction as any)._id;
      if (predictionId) {
        const response = await apiService.get(`/admin/predictions/${predictionId}/results`);
        if ((response as any).success) {
          setPredictionResults((response as any).data.results || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching prediction results:', error);
      setPredictionResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const openEditModal = (prediction: Prediction) => {
    setEditingPrediction(prediction);
    
    // Extract non-viable numbers based on lottery type
    // The admin endpoint returns raw MongoDB documents with separate fields
    const config = lotteryConfigs[prediction.lotteryType];
    const predAny = prediction as any; // Access raw fields
    let whiteBalls: number[] = [];
    let redBalls: number[] = [];
    let singleNumbers: number[] = [];
    let pick3Numbers: number[] = [];

    // Handle the nonViableNumbers data structure from raw model (preferred), fall back to viableNumbers (legacy)
    if (config.type === 'double') {
      // Check nonViableNumbers first (new format), then fall back to viableNumbers (legacy)
      if (predAny.nonViableNumbers && typeof predAny.nonViableNumbers === 'object') {
        whiteBalls = Array.isArray(predAny.nonViableNumbers.whiteBalls) 
          ? predAny.nonViableNumbers.whiteBalls 
          : [];
        redBalls = Array.isArray(predAny.nonViableNumbers.redBalls) 
          ? predAny.nonViableNumbers.redBalls 
          : [];
      } else if (predAny.viableNumbers && typeof predAny.viableNumbers === 'object') {
        // Legacy support
        whiteBalls = Array.isArray(predAny.viableNumbers.whiteBalls) 
          ? predAny.viableNumbers.whiteBalls 
          : [];
        redBalls = Array.isArray(predAny.viableNumbers.redBalls) 
          ? predAny.viableNumbers.redBalls 
          : [];
      }
    } else if (config.type === 'single') {
      // Check nonViableNumbersSingle first, then fall back to viableNumbersSingle (legacy)
      if (Array.isArray(predAny.nonViableNumbersSingle)) {
        singleNumbers = predAny.nonViableNumbersSingle;
      } else if (Array.isArray(predAny.viableNumbersSingle)) {
        singleNumbers = predAny.viableNumbersSingle;
      }
    } else if (config.type === 'pick3') {
      // Check nonViableNumbersPick3 first, then fall back to viableNumbersPick3 (legacy)
      if (Array.isArray(predAny.nonViableNumbersPick3)) {
        pick3Numbers = predAny.nonViableNumbersPick3;
      } else if (Array.isArray(predAny.viableNumbersPick3)) {
        pick3Numbers = predAny.viableNumbersPick3;
      }
    }

    // Format date and time for input fields
    const drawDate = new Date(prediction.drawDate);
    const formattedDate = drawDate.toISOString().split('T')[0];
    const formattedTime = prediction.drawTime || '';

    setNewPrediction({
      lotteryType: prediction.lotteryType,
      lotteryDisplayName: prediction.lotteryDisplayName || '',
      drawDate: formattedDate,
      drawTime: formattedTime,
      drawDay: (prediction as any).drawDay || '',
      whiteBalls,
      redBalls,
      singleNumbers,
      pick3Numbers,
      price: prediction.price,
      notes: prediction.notes || ''
    });

    setShowEditModal(true);
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPrediction(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetPredictionForm();
    setError(null);
    setFieldErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPrediction(null);
    resetPredictionForm();
    setError(null);
    setFieldErrors({});
  };

  const toggleNumber = (number: number, type: 'whiteBalls' | 'redBalls' | 'singleNumbers' | 'pick3Numbers') => {
    setNewPrediction(prev => {
      const currentNumbers = prev[type];
      const isSelected = currentNumbers.includes(number);
      
      return {
        ...prev,
        [type]: isSelected
          ? currentNumbers.filter(n => n !== number)
          : [...currentNumbers, number].sort((a, b) => a - b)
      };
    });
  };

  const clearNumbers = (type: 'whiteBalls' | 'redBalls' | 'singleNumbers' | 'pick3Numbers') => {
    setNewPrediction(prev => ({
      ...prev,
      [type]: []
    }));
  };

  const NumberSelector: React.FC<{
    min: number;
    max: number;
    selected: number[];
    onToggle: (num: number) => void;
    onClear: () => void;
    label: string;
  }> = ({ min, max, selected, onToggle, onClear, label }) => {
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    
    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label fw-bold">{label}</label>
          <div>
            <span className="badge me-2 bg-info">
              Selected: {selected.length}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClear}
              disabled={selected.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>
        <div
          className="border rounded p-3"
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: '#f8f9fa'
          }}
        >
          <div className="d-flex flex-wrap gap-2">
            {numbers.map(num => {
              const isSelected = selected.includes(num);
              
              return (
                <button
                  key={num}
                  type="button"
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{
                    minWidth: '50px',
                    fontSize: '0.9rem'
                  }}
                  onClick={() => onToggle(num)}
                  title={isSelected ? 'Click to deselect' : 'Click to select'}
                >
                  {num.toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
        {selected.length > 0 && (
          <div className="mt-2">
            <small className="text-muted">
              Selected: {selected.join(', ')}
            </small>
          </div>
        )}
      </div>
    );
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="container py-5 mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">Prediction Management</h1>
            <div className="d-flex align-items-center gap-2">
              <button 
                className="btn btn-success me-2" 
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Prediction
              </button>
              <div className="dropdown me-2">
                <button
                  className="btn btn-danger dropdown-toggle"
                  type="button"
                  id="exportPdfDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  disabled={exportPdfLoading}
                >
                  {exportPdfLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-pdf me-2"></i>
                      Export PDF
                    </>
                  )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="exportPdfDropdown">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleExportPdf('selected')}
                    >
                      <i className="bi bi-check2-square me-2"></i>
                      Download selected ({selectedPredictionIds.length})
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><h6 className="dropdown-header">Download all for one lottery</h6></li>
                  {lotteryTypes.map((lt) => (
                    <li key={lt.value}>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => handleExportPdfByLottery(lt.value)}
                      >
                        <i className="bi bi-collection me-2"></i>
                        All {lt.label}
                      </button>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleExportPdf('all')}
                    >
                      <i className="bi bi-download me-2"></i>
                      Download all predictions
                    </button>
                  </li>
                </ul>
              </div>
              <button className="btn btn-outline-primary" onClick={fetchPredictions}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <form onSubmit={handleSearch} className="row g-3">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search predictions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(e);
                      }
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filterLottery}
                    onChange={(e) => {
                      setFilterLottery(e.target.value as LotteryType | 'all');
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <option value="all">All Lotteries</option>
                    {lotteryTypes.map((lottery) => (
                      <option key={lottery.value} value={lottery.value}>
                        {lottery.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value as 'all' | 'active' | 'inactive');
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-search me-2"></i>
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Predictions List</h6>
            </div>
            <div className="card-body">
              {error && !showCreateModal && !showEditModal && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={predictions.length > 0 && predictions.every((p) => selectedPredictionIds.includes(p.id || (p as any)._id))}
                          onChange={toggleSelectAllOnPage}
                          aria-label="Select all on page"
                        />
                      </th>
                      <th>Lottery</th>
                      <th>Draw Date</th>
                      <th>Price</th>
                      <th>Downloads</th>
                      <th>Purchases</th>
                      <th>Accuracy</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((prediction) => {
                      const predId = prediction.id || (prediction as any)._id || (prediction as any).predictionId;
                      return (
                      <tr key={predId}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={predId ? selectedPredictionIds.includes(predId) : false}
                            onChange={() => predId && toggleSelectPrediction(predId)}
                            aria-label={`Select ${prediction.lotteryDisplayName}`}
                          />
                        </td>
                        <td>
                          <div>
                            <strong>{prediction.lotteryDisplayName}</strong>
                            <br />
                            <small className="text-muted">{prediction.lotteryType}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            {new Date(prediction.drawDate).toLocaleDateString()}
                            <br />
                            <small className="text-muted">{prediction.drawTime}</small>
                          </div>
                        </td>
                        <td>${prediction.price.toFixed(2)}</td>
                        <td>{prediction.downloadCount}</td>
                        <td>{prediction.purchaseCount}</td>
                        <td>
                          {prediction.accuracy ? (
                            <span className="badge bg-success">
                              {prediction.accuracy.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="badge bg-secondary">N/A</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${prediction.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {prediction.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{new Date(prediction.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => openPredictionModal(prediction)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            onClick={() => openEditModal(prediction)}
                            title="Edit Prediction"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className={`btn btn-sm me-2 ${!prediction.isActive ? 'btn-outline-success' : 'btn-outline-warning'}`}
                            onClick={() => {
                              const predictionId = prediction.id || (prediction as any)._id || (prediction as any).predictionId;
                              if (predictionId) {
                                handlePredictionAction(predictionId, 'toggle-status');
                              } else {
                                console.error('Prediction ID not found:', prediction);
                                toast.error('Prediction ID is missing');
                              }
                            }}
                            disabled={togglingPredictionId === (prediction.id || (prediction as any)._id) || !(prediction.id || (prediction as any)._id)}
                            title={!prediction.isActive ? 'Activate Prediction' : 'Deactivate Prediction'}
                          >
                            {togglingPredictionId === (prediction.id || (prediction as any)._id) ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className={`bi ${!prediction.isActive ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={async () => {
                              setSelectedPredictionForResult(prediction);
                              // Check if this prediction already has results
                              const predictionId = prediction.id || (prediction as any)._id;
                              try {
                                const response = await apiService.get(`/admin/predictions/${predictionId}/results`);
                                const results = (response as any).data?.results || [];
                                
                                if (results.length > 0) {
                                  // Has results - open edit modal with latest result
                                  const latestResult = results[0]; // Results are sorted by drawDate desc
                                  setEditingResult(latestResult);
                                  
                                  // Populate edit form with result data
                                  const whiteBalls = Array.isArray(latestResult.winningNumbers?.whiteBalls) 
                                    ? latestResult.winningNumbers.whiteBalls 
                                    : (latestResult.winningNumbers?.whiteBalls ? [latestResult.winningNumbers.whiteBalls] : []);
                                  const redBalls = Array.isArray(latestResult.winningNumbers?.redBalls) 
                                    ? latestResult.winningNumbers.redBalls 
                                    : (latestResult.winningNumbers?.redBalls ? [latestResult.winningNumbers.redBalls] : []);
                                  const singleNumbers = Array.isArray(latestResult.winningNumbersSingle) 
                                    ? latestResult.winningNumbersSingle 
                                    : (latestResult.winningNumbersSingle ? [latestResult.winningNumbersSingle] : []);
                                  const pick3Numbers = Array.isArray(latestResult.winningNumbersPick3) 
                                    ? latestResult.winningNumbersPick3 
                                    : (latestResult.winningNumbersPick3 ? [latestResult.winningNumbersPick3] : []);
                                  
                                  const editData = {
                                    drawDate: new Date(latestResult.drawDate).toISOString().split('T')[0],
                                    winningNumbers: {
                                      whiteBalls: whiteBalls,
                                      redBalls: redBalls,
                                      singleNumbers: singleNumbers,
                                      pick3Numbers: pick3Numbers
                                    },
                                    jackpot: latestResult.jackpot?.toString() || '',
                                    winners: {
                                      jackpot: latestResult.winners?.jackpot?.toString() || '',
                                      match5: latestResult.winners?.match5?.toString() || '',
                                      match4: latestResult.winners?.match4?.toString() || '',
                                      match3: latestResult.winners?.match3?.toString() || '',
                                      exact: latestResult.winners?.exact?.toString() || '',
                                      any: latestResult.winners?.any?.toString() || ''
                                    }
                                  };
                                  setResultData(editData);
                                  setShowEditResultModal(true);
                                } else {
                                  // No results - open add modal
                                  // Use prediction's draw date
                                  const predictionDrawDate = prediction.drawDate 
                                    ? new Date(prediction.drawDate).toISOString().split('T')[0]
                                    : new Date().toISOString().split('T')[0];
                                  
                                  setResultData({
                                    drawDate: predictionDrawDate,
                                    winningNumbers: {
                                      whiteBalls: [],
                                      redBalls: [],
                                      singleNumbers: [],
                                      pick3Numbers: []
                                    },
                                    jackpot: '',
                                    winners: {
                                      jackpot: '',
                                      match5: '',
                                      match4: '',
                                      match3: '',
                                      exact: '',
                                      any: ''
                                    }
                                  });
                                  setShowAddResultModal(true);
                                }
                              } catch (error) {
                                // On error, default to add modal with prediction's draw date
                                const predictionDrawDate = prediction.drawDate 
                                  ? new Date(prediction.drawDate).toISOString().split('T')[0]
                                  : new Date().toISOString().split('T')[0];
                                
                                setResultData({
                                  drawDate: predictionDrawDate,
                                  winningNumbers: {
                                    whiteBalls: [],
                                    redBalls: [],
                                    singleNumbers: [],
                                    pick3Numbers: []
                                  },
                                  jackpot: '',
                                  winners: {
                                    jackpot: '',
                                    match5: '',
                                    match4: '',
                                    match3: '',
                                    exact: '',
                                    any: ''
                                  }
                                });
                                setShowAddResultModal(true);
                              }
                            }}
                            title="Add/Update Result"
                          >
                            <i className="bi bi-trophy"></i>
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Predictions pagination">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Details Modal */}
      {showModal && selectedPrediction && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-dialog modal-lg" style={{ zIndex: 1205, marginTop: '60px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Prediction Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Prediction Information</h6>
                    <p><strong>Lottery:</strong> {selectedPrediction.lotteryDisplayName}</p>
                    <p><strong>Type:</strong> {selectedPrediction.lotteryType}</p>
                    <p><strong>Draw Date:</strong> {new Date(selectedPrediction.drawDate).toLocaleDateString()}</p>
                    <p><strong>Draw Time:</strong> {selectedPrediction.drawTime}</p>
                    <p><strong>Price:</strong> ${selectedPrediction.price.toFixed(2)}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Statistics</h6>
                    <p><strong>Downloads:</strong> {selectedPrediction.downloadCount}</p>
                    <p><strong>Purchases:</strong> {selectedPrediction.purchaseCount}</p>
                    <p><strong>Accuracy:</strong> {selectedPrediction.accuracy ? `${selectedPrediction.accuracy.toFixed(1)}%` : 'N/A'}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${selectedPrediction.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {selectedPrediction.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Non-viable Numbers</h6>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(selectedPrediction.viableNumbers || selectedPrediction.nonViableNumbers, null, 2)}
                    </pre>
                  </div>
                </div>
                {selectedPrediction.notes && (
                  <div className="row mt-3">
                    <div className="col-12">
                      <h6>Notes</h6>
                      <p>{selectedPrediction.notes}</p>
                    </div>
                  </div>
                )}
                
                {/* Uploaded Results Section */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">
                        <i className="bi bi-trophy me-2"></i>
                        Uploaded Results ({predictionResults.length})
                      </h6>
                      {predictionResults.length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={() => {
                            // Open edit modal with latest result
                            const latestResult = predictionResults[0]; // Results are sorted by drawDate desc
                            setEditingResult(latestResult);
                            setSelectedPredictionForResult(selectedPrediction);
                            
                            // Populate edit form with result data
                            const whiteBalls = Array.isArray(latestResult.winningNumbers?.whiteBalls) 
                              ? latestResult.winningNumbers.whiteBalls 
                              : (latestResult.winningNumbers?.whiteBalls ? [latestResult.winningNumbers.whiteBalls] : []);
                            const redBalls = Array.isArray(latestResult.winningNumbers?.redBalls) 
                              ? latestResult.winningNumbers.redBalls 
                              : (latestResult.winningNumbers?.redBalls ? [latestResult.winningNumbers.redBalls] : []);
                            const singleNumbers = Array.isArray(latestResult.winningNumbersSingle) 
                              ? latestResult.winningNumbersSingle 
                              : (latestResult.winningNumbersSingle ? [latestResult.winningNumbersSingle] : []);
                            const pick3Numbers = Array.isArray(latestResult.winningNumbersPick3) 
                              ? latestResult.winningNumbersPick3 
                              : (latestResult.winningNumbersPick3 ? [latestResult.winningNumbersPick3] : []);
                            
                            const editData = {
                              drawDate: new Date(latestResult.drawDate).toISOString().split('T')[0],
                              winningNumbers: {
                                whiteBalls: whiteBalls,
                                redBalls: redBalls,
                                singleNumbers: singleNumbers,
                                pick3Numbers: pick3Numbers
                              },
                              jackpot: latestResult.jackpot?.toString() || '',
                              winners: {
                                jackpot: latestResult.winners?.jackpot?.toString() || '',
                                match5: latestResult.winners?.match5?.toString() || '',
                                match4: latestResult.winners?.match4?.toString() || '',
                                match3: latestResult.winners?.match3?.toString() || '',
                                exact: latestResult.winners?.exact?.toString() || '',
                                any: latestResult.winners?.any?.toString() || ''
                              }
                            };
                            setResultData(editData);
                            setShowEditResultModal(true);
                          }}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Update Result
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedPredictionForResult(selectedPrediction);
                            // Use prediction's draw date
                            const predictionDrawDate = selectedPrediction.drawDate 
                              ? new Date(selectedPrediction.drawDate).toISOString().split('T')[0]
                              : new Date().toISOString().split('T')[0];
                            
                            setResultData({
                              drawDate: predictionDrawDate,
                              winningNumbers: {
                                whiteBalls: [],
                                redBalls: [],
                                singleNumbers: [],
                                pick3Numbers: []
                              },
                              jackpot: '',
                              winners: {
                                jackpot: '',
                                match5: '',
                                match4: '',
                                match3: '',
                                exact: '',
                                any: ''
                              }
                            });
                            setShowAddResultModal(true);
                          }}
                        >
                          <i className="bi bi-plus-lg me-1"></i>
                          Add Result
                        </button>
                      )}
                    </div>
                    
                    {loadingResults ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : predictionResults.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead>
                            <tr>
                              <th>Draw Date</th>
                              <th>Winning Numbers</th>
                              <th>Jackpot</th>
                              <th>Winners</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {predictionResults.map((result) => {
                              let winningNumbers: any = {};
                              if (result.winningNumbers) {
                                // Get all red balls as an array, not just the first one
                                const redBalls = Array.isArray(result.winningNumbers.redBalls) 
                                  ? result.winningNumbers.redBalls 
                                  : (result.winningNumbers.redBalls ? [result.winningNumbers.redBalls] : []);
                                winningNumbers = {
                                  main: result.winningNumbers.whiteBalls || [],
                                  special: redBalls
                                };
                              } else if (result.winningNumbersSingle) {
                                winningNumbers = {
                                  main: result.winningNumbersSingle,
                                  special: []
                                };
                              } else if (result.winningNumbersPick3) {
                                winningNumbers = {
                                  main: result.winningNumbersPick3,
                                  special: []
                                };
                              }
                              
                              const totalWinners = (result.winners?.jackpot || 0) + 
                                (result.winners?.match5 || 0) + 
                                (result.winners?.match4 || 0) + 
                                (result.winners?.match3 || 0) + 
                                (result.winners?.exact || 0) + 
                                (result.winners?.any || 0);
                              
                              return (
                                <tr key={result._id}>
                                  <td>{new Date(result.drawDate).toLocaleDateString()}</td>
                                  <td>
                                    <div className="d-flex gap-1 flex-wrap">
                                      {winningNumbers.main.map((num: number, i: number) => (
                                        <span key={i} className="badge bg-primary">{num}</span>
                                      ))}
                                      {winningNumbers.special && winningNumbers.special.length > 0 && (
                                        winningNumbers.special.map((num: number, i: number) => (
                                          <span key={`special-${i}`} className="badge bg-warning text-dark">{num}</span>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                  <td>${result.jackpot?.toLocaleString() || '0'}</td>
                                  <td>{totalWinners}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => {
                                        setEditingResult(result);
                                        setSelectedPredictionForResult(selectedPrediction);
                                        // Populate edit form with result data
                                        // Ensure arrays are properly formatted
                                        const whiteBalls = Array.isArray(result.winningNumbers?.whiteBalls) 
                                          ? result.winningNumbers.whiteBalls 
                                          : (result.winningNumbers?.whiteBalls ? [result.winningNumbers.whiteBalls] : []);
                                        const redBalls = Array.isArray(result.winningNumbers?.redBalls) 
                                          ? result.winningNumbers.redBalls 
                                          : (result.winningNumbers?.redBalls ? [result.winningNumbers.redBalls] : []);
                                        const singleNumbers = Array.isArray(result.winningNumbersSingle) 
                                          ? result.winningNumbersSingle 
                                          : (result.winningNumbersSingle ? [result.winningNumbersSingle] : []);
                                        const pick3Numbers = Array.isArray(result.winningNumbersPick3) 
                                          ? result.winningNumbersPick3 
                                          : (result.winningNumbersPick3 ? [result.winningNumbersPick3] : []);
                                        
                                        console.log('📥 Loading result for edit:', {
                                          original: result.winningNumbers,
                                          whiteBalls,
                                          redBalls,
                                          singleNumbers,
                                          pick3Numbers
                                        });
                                        
                                        const editData = {
                                          drawDate: new Date(result.drawDate).toISOString().split('T')[0],
                                          winningNumbers: {
                                            whiteBalls: whiteBalls,
                                            redBalls: redBalls,
                                            singleNumbers: singleNumbers,
                                            pick3Numbers: pick3Numbers
                                          },
                                          jackpot: result.jackpot?.toString() || '',
                                          winners: {
                                            jackpot: result.winners?.jackpot?.toString() || '',
                                            match5: result.winners?.match5?.toString() || '',
                                            match4: result.winners?.match4?.toString() || '',
                                            match3: result.winners?.match3?.toString() || '',
                                            exact: result.winners?.exact?.toString() || '',
                                            any: result.winners?.any?.toString() || ''
                                          }
                                        };
                                        setResultData(editData);
                                        setShowEditResultModal(true);
                                      }}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-muted">
                        <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                        No results uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-success me-2"
                  onClick={() => {
                    closeModal();
                    openEditModal(selectedPrediction);
                  }}
                >
                  <i className="bi bi-pencil me-2"></i>
                  Edit
                </button>
                <button
                  type="button"
                  className={`btn me-2 ${!selectedPrediction.isActive ? 'btn-success' : 'btn-warning'}`}
                  onClick={() => {
                    const predictionId = selectedPrediction.id || (selectedPrediction as any)._id || (selectedPrediction as any).predictionId;
                    if (predictionId) {
                      handlePredictionAction(predictionId, 'toggle-status');
                    } else {
                      console.error('Selected prediction ID not found:', selectedPrediction);
                      toast.error('Prediction ID is missing');
                    }
                  }}
                  disabled={togglingPredictionId === (selectedPrediction.id || (selectedPrediction as any)._id) || !(selectedPrediction.id || (selectedPrediction as any)._id)}
                >
                  {togglingPredictionId === (selectedPrediction.id || (selectedPrediction as any)._id) ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`bi me-2 ${!selectedPrediction.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                      {!selectedPrediction.isActive ? 'Activate Prediction' : 'Deactivate Prediction'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    const predictionId = selectedPrediction.id || (selectedPrediction as any)._id || (selectedPrediction as any).predictionId;
                    if (predictionId) {
                      handlePredictionAction(predictionId, 'delete');
                    } else {
                      console.error('Selected prediction ID not found:', selectedPrediction);
                      toast.error('Prediction ID is missing');
                    }
                  }}
                  disabled={!selectedPrediction.id && !(selectedPrediction as any)._id}
                >
                  Delete Prediction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Result Modal */}
      {showAddResultModal && selectedPredictionForResult && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-dialog modal-lg" style={{ zIndex: 1205, marginTop: '60px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-trophy me-2"></i>
                  Add Result - {selectedPredictionForResult.lotteryDisplayName}
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowAddResultModal(false);
                  setSelectedPredictionForResult(null);
                }}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleAddResult();
                }}>
                  <div className="mb-3">
                    <label className="form-label">Draw Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={resultData.drawDate}
                      onChange={(e) => setResultData({ ...resultData, drawDate: e.target.value })}
                      required
                    />
                  </div>

                  {/* Winning Numbers Section */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Winning Numbers</label>
                    {(() => {
                      const config = lotteryConfigs[selectedPredictionForResult.lotteryType];
                      if (config.type === 'double') {
                        return (
                          <>
                            <div className="mb-3">
                              <label className="form-label">White Balls ({config.whiteBalls.min}-{config.whiteBalls.max})</label>
                              <NumberSelector
                                min={config.whiteBalls.min}
                                max={config.whiteBalls.max}
                                selected={resultData.winningNumbers.whiteBalls}
                                onToggle={(num) => {
                                  const current = resultData.winningNumbers.whiteBalls;
                                  if (current.includes(num)) {
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        whiteBalls: current.filter(n => n !== num)
                                      }
                                    });
                                  } else {
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        whiteBalls: [...current, num].sort((a, b) => a - b)
                                      }
                                    });
                                  }
                                }}
                                onClear={() => setResultData({
                                  ...resultData,
                                  winningNumbers: { ...resultData.winningNumbers, whiteBalls: [] }
                                })}
                                label="Balls"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">{config.redBalls.label}</label>
                              <NumberSelector
                                min={config.redBalls.min}
                                max={config.redBalls.max}
                                selected={Array.isArray(resultData.winningNumbers.redBalls) ? resultData.winningNumbers.redBalls : []}
                                onToggle={(num) => {
                                  const current = Array.isArray(resultData.winningNumbers.redBalls) 
                                    ? resultData.winningNumbers.redBalls 
                                    : [];
                                  if (current.includes(num)) {
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        redBalls: current.filter(n => n !== num)
                                      }
                                    });
                                  } else {
                                    const updated = [...current, num].sort((a, b) => a - b);
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        redBalls: updated
                                      }
                                    });
                                  }
                                }}
                                onClear={() => setResultData({
                                  ...resultData,
                                  winningNumbers: { ...resultData.winningNumbers, redBalls: [] }
                                })}
                                label="Balls"
                              />
                            </div>
                          </>
                        );
                      } else if (config.type === 'single') {
                        return (
                          <div className="mb-3">
                            <label className="form-label">{config.numbers.label}</label>
                            <NumberSelector
                              min={config.numbers.min}
                              max={config.numbers.max}
                              selected={resultData.winningNumbers.singleNumbers}
                              onToggle={(num) => {
                                const current = resultData.winningNumbers.singleNumbers;
                                if (current.includes(num)) {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      singleNumbers: current.filter(n => n !== num)
                                    }
                                  });
                                } else {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      singleNumbers: [...current, num].sort((a, b) => a - b)
                                    }
                                  });
                                }
                              }}
                              onClear={() => setResultData({
                                ...resultData,
                                winningNumbers: { ...resultData.winningNumbers, singleNumbers: [] }
                              })}
                              label="Balls"
                            />
                          </div>
                        );
                      } else if (config.type === 'pick3') {
                        return (
                          <div className="mb-3">
                            <label className="form-label">{config.numbers.label}</label>
                            <NumberSelector
                              min={config.numbers.min}
                              max={config.numbers.max}
                              selected={resultData.winningNumbers.pick3Numbers}
                              onToggle={(num) => {
                                const current = resultData.winningNumbers.pick3Numbers;
                                if (current.includes(num)) {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      pick3Numbers: current.filter(n => n !== num)
                                    }
                                  });
                                } else {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      pick3Numbers: [...current, num].sort((a, b) => a - b)
                                    }
                                  });
                                }
                              }}
                              onClear={() => setResultData({
                                ...resultData,
                                winningNumbers: { ...resultData.winningNumbers, pick3Numbers: [] }
                              })}
                              label="Balls"
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Jackpot */}
                  <div className="mb-3">
                    <label className="form-label">Jackpot Amount</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter jackpot amount"
                        value={resultData.jackpot}
                        onChange={(e) => setResultData({ ...resultData, jackpot: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Winners */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Winners</label>
                    <div className="row g-3">
                      {selectedPredictionForResult.lotteryType === 'pick3' ? (
                        <>
                          <div className="col-md-6">
                            <label className="form-label">Exact Match</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Number of exact match winners"
                              value={resultData.winners.exact}
                              onChange={(e) => setResultData({
                                ...resultData,
                                winners: { ...resultData.winners, exact: e.target.value }
                              })}
                              min="0"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Any Order</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Number of any order winners"
                              value={resultData.winners.any}
                              onChange={(e) => setResultData({
                                ...resultData,
                                winners: { ...resultData.winners, any: e.target.value }
                              })}
                              min="0"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-md-6">
                            <label className="form-label">Jackpot Winners</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Number of jackpot winners"
                              value={resultData.winners.jackpot}
                              onChange={(e) => setResultData({
                                ...resultData,
                                winners: { ...resultData.winners, jackpot: e.target.value }
                              })}
                              min="0"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Match 5 Winners</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Number of match 5 winners"
                              value={resultData.winners.match5}
                              onChange={(e) => setResultData({
                                ...resultData,
                                winners: { ...resultData.winners, match5: e.target.value }
                              })}
                              min="0"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Match 4 Winners</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Number of match 4 winners"
                              value={resultData.winners.match4}
                              onChange={(e) => setResultData({
                                ...resultData,
                                winners: { ...resultData.winners, match4: e.target.value }
                              })}
                              min="0"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Match 3 Winners</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Number of match 3 winners"
                              value={resultData.winners.match3}
                              onChange={(e) => setResultData({
                                ...resultData,
                                winners: { ...resultData.winners, match3: e.target.value }
                              })}
                              min="0"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddResultModal(false);
                        setSelectedPredictionForResult(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      <i className="bi bi-trophy me-2"></i>
                      Add Result
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {showEditResultModal && editingResult && selectedPredictionForResult && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-dialog modal-lg" style={{ zIndex: 1205, marginTop: '60px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Edit Result - {selectedPredictionForResult.lotteryDisplayName}
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowEditResultModal(false);
                  setEditingResult(null);
                  setSelectedPredictionForResult(null);
                }}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleEditResult();
                }}>
                  {/* Same form fields as Add Result Modal - reuse the same structure */}
                  <div className="mb-3">
                    <label className="form-label">Draw Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={resultData.drawDate}
                      onChange={(e) => setResultData({ ...resultData, drawDate: e.target.value })}
                      required
                    />
                  </div>

                  {/* Winning Numbers Section - same as Add Result Modal */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Winning Numbers</label>
                    {(() => {
                      const config = lotteryConfigs[selectedPredictionForResult.lotteryType];
                      if (config.type === 'double') {
                        return (
                          <>
                            <div className="mb-3">
                              <label className="form-label">White Balls ({config.whiteBalls.min}-{config.whiteBalls.max})</label>
                              <NumberSelector
                                min={config.whiteBalls.min}
                                max={config.whiteBalls.max}
                                selected={resultData.winningNumbers.whiteBalls}
                                onToggle={(num) => {
                                  const current = resultData.winningNumbers.whiteBalls;
                                  if (current.includes(num)) {
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        whiteBalls: current.filter(n => n !== num)
                                      }
                                    });
                                  } else {
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        whiteBalls: [...current, num].sort((a, b) => a - b)
                                      }
                                    });
                                  }
                                }}
                                onClear={() => setResultData({
                                  ...resultData,
                                  winningNumbers: { ...resultData.winningNumbers, whiteBalls: [] }
                                })}
                                label="Balls"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">{config.redBalls.label}</label>
                              <NumberSelector
                                min={config.redBalls.min}
                                max={config.redBalls.max}
                                selected={Array.isArray(resultData.winningNumbers.redBalls) ? resultData.winningNumbers.redBalls : []}
                                onToggle={(num) => {
                                  const current = Array.isArray(resultData.winningNumbers.redBalls) 
                                    ? resultData.winningNumbers.redBalls 
                                    : [];
                                  if (current.includes(num)) {
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        redBalls: current.filter(n => n !== num)
                                      }
                                    });
                                  } else {
                                    const updated = [...current, num].sort((a, b) => a - b);
                                    setResultData({
                                      ...resultData,
                                      winningNumbers: {
                                        ...resultData.winningNumbers,
                                        redBalls: updated
                                      }
                                    });
                                  }
                                }}
                                onClear={() => setResultData({
                                  ...resultData,
                                  winningNumbers: { ...resultData.winningNumbers, redBalls: [] }
                                })}
                                label="Balls"
                              />
                            </div>
                          </>
                        );
                      } else if (config.type === 'single') {
                        return (
                          <div className="mb-3">
                            <label className="form-label">{config.numbers.label}</label>
                            <NumberSelector
                              min={config.numbers.min}
                              max={config.numbers.max}
                              selected={resultData.winningNumbers.singleNumbers}
                              onToggle={(num) => {
                                const current = resultData.winningNumbers.singleNumbers;
                                if (current.includes(num)) {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      singleNumbers: current.filter(n => n !== num)
                                    }
                                  });
                                } else {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      singleNumbers: [...current, num].sort((a, b) => a - b)
                                    }
                                  });
                                }
                              }}
                              onClear={() => setResultData({
                                ...resultData,
                                winningNumbers: { ...resultData.winningNumbers, singleNumbers: [] }
                              })}
                              label="Balls"
                            />
                          </div>
                        );
                      } else if (config.type === 'pick3') {
                        return (
                          <div className="mb-3">
                            <label className="form-label">{config.numbers.label}</label>
                            <NumberSelector
                              min={config.numbers.min}
                              max={config.numbers.max}
                              selected={resultData.winningNumbers.pick3Numbers}
                              onToggle={(num) => {
                                const current = resultData.winningNumbers.pick3Numbers;
                                if (current.includes(num)) {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      pick3Numbers: current.filter(n => n !== num)
                                    }
                                  });
                                } else {
                                  setResultData({
                                    ...resultData,
                                    winningNumbers: {
                                      ...resultData.winningNumbers,
                                      pick3Numbers: [...current, num].sort((a, b) => a - b)
                                    }
                                  });
                                }
                              }}
                              onClear={() => setResultData({
                                ...resultData,
                                winningNumbers: { ...resultData.winningNumbers, pick3Numbers: [] }
                              })}
                              label="Balls"
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Jackpot */}
                  <div className="mb-3">
                    <label className="form-label">Jackpot</label>
                    <input
                      type="number"
                      className="form-control"
                      value={resultData.jackpot}
                      onChange={(e) => setResultData({ ...resultData, jackpot: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Winners */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Winners</label>
                    {(() => {
                      const config = lotteryConfigs[selectedPredictionForResult.lotteryType];
                      if (config.type === 'pick3') {
                        return (
                          <div className="row">
                            <div className="col-md-6">
                              <label className="form-label">Exact</label>
                              <input
                                type="number"
                                className="form-control"
                                value={resultData.winners.exact}
                                onChange={(e) => setResultData({
                                  ...resultData,
                                  winners: { ...resultData.winners, exact: e.target.value }
                                })}
                                min="0"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Any</label>
                              <input
                                type="number"
                                className="form-control"
                                value={resultData.winners.any}
                                onChange={(e) => setResultData({
                                  ...resultData,
                                  winners: { ...resultData.winners, any: e.target.value }
                                })}
                                min="0"
                              />
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="row">
                            <div className="col-md-6">
                              <label className="form-label">Jackpot</label>
                              <input
                                type="number"
                                className="form-control"
                                value={resultData.winners.jackpot}
                                onChange={(e) => setResultData({
                                  ...resultData,
                                  winners: { ...resultData.winners, jackpot: e.target.value }
                                })}
                                min="0"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Match 5</label>
                              <input
                                type="number"
                                className="form-control"
                                value={resultData.winners.match5}
                                onChange={(e) => setResultData({
                                  ...resultData,
                                  winners: { ...resultData.winners, match5: e.target.value }
                                })}
                                min="0"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Match 4</label>
                              <input
                                type="number"
                                className="form-control"
                                value={resultData.winners.match4}
                                onChange={(e) => setResultData({
                                  ...resultData,
                                  winners: { ...resultData.winners, match4: e.target.value }
                                })}
                                min="0"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Match 3</label>
                              <input
                                type="number"
                                className="form-control"
                                value={resultData.winners.match3}
                                onChange={(e) => setResultData({
                                  ...resultData,
                                  winners: { ...resultData.winners, match3: e.target.value }
                                })}
                                min="0"
                              />
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowEditResultModal(false);
                        setEditingResult(null);
                        setSelectedPredictionForResult(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-save me-2"></i>
                      Update Result
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Prediction Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-dialog modal-xl" style={{ zIndex: 1205, marginTop: '60px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Prediction</h5>
                <button type="button" className="btn-close" onClick={closeCreateModal}></button>
              </div>
              <form onSubmit={handleCreatePrediction}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Lottery Type</label>
                        <select
                          className={`form-select ${fieldErrors.lotteryType ? 'is-invalid' : ''}`}
                          value={newPrediction.lotteryType}
                          onChange={(e) => {
                            const newType = e.target.value as LotteryType;
                            const lotteryName = lotteryTypes.find(lt => lt.value === newType)?.label || '';
                            const autoPrice = getPriceByLotteryType(newType);
                            handleLotteryTypeChange(newType);
                            setNewPrediction(prev => ({
                              ...prev,
                              lotteryDisplayName: lotteryName,
                              // Auto-set price when lottery type changes
                              price: autoPrice > 0 ? autoPrice : prev.price,
                              // Clear numbers when type changes
                              whiteBalls: [],
                              redBalls: [],
                              singleNumbers: [],
                              pick3Numbers: []
                            }));
                            // Clear error when field changes
                            if (fieldErrors.lotteryType) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.lotteryType;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        >
                          {lotteryTypes.map((lottery) => (
                            <option key={lottery.value} value={lottery.value}>
                              {lottery.label}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.lotteryType && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.lotteryType}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display Name</label>
                        <input
                          type="text"
                          className={`form-control ${fieldErrors.lotteryDisplayName ? 'is-invalid' : ''}`}
                          value={newPrediction.lotteryDisplayName}
                          onChange={(e) => {
                            setNewPrediction({...newPrediction, lotteryDisplayName: e.target.value});
                            // Clear error when field changes
                            if (fieldErrors.lotteryDisplayName) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.lotteryDisplayName;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        />
                        {fieldErrors.lotteryDisplayName && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.lotteryDisplayName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Draw Day <span className="text-muted">(Auto-fills date & time)</span></label>
                        <select
                          className="form-control"
                          value={newPrediction.drawDay}
                          onChange={(e) => handleDrawDayChange(e.target.value)}
                        >
                          <option value="">-- Select Draw Day --</option>
                          {getAvailableDrawDays(newPrediction.lotteryType).map((day) => (
                            <option key={day} value={day}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted d-block mt-1">
                          Available: {getAvailableDrawDays(newPrediction.lotteryType).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Draw Date</label>
                        <input
                          type="date"
                          className={`form-control ${fieldErrors.drawDate ? 'is-invalid' : ''}`}
                          value={newPrediction.drawDate}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            setNewPrediction({...newPrediction, drawDate: selectedDate, drawDay: ''});
                            
                            // Clear error when field is changed
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.drawDate;
                              return newErrors;
                            });
                          }}
                          required
                        />
                        {fieldErrors.drawDate && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.drawDate}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          Draw Time 
                          <span className="text-muted ms-1">(Minnesota Time)</span>
                        </label>
                        <input
                          type="time"
                          className={`form-control ${fieldErrors.drawTime ? 'is-invalid' : ''}`}
                          value={newPrediction.drawTime}
                          onChange={(e) => {
                            setNewPrediction({...newPrediction, drawTime: e.target.value, drawDay: ''});
                            // Clear error when field changes
                            if (fieldErrors.drawTime) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.drawTime;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        />
                        <small className="text-muted d-block mt-1">
                          <i className="bi bi-clock me-1"></i>
                          All times are in Minnesota Time (CST/CDT)
                        </small>
                        {fieldErrors.drawTime && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.drawTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`form-control ${fieldErrors.price ? 'is-invalid' : ''}`}
                          value={newPrediction.price === '' ? '' : newPrediction.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string, otherwise parse as float
                            setNewPrediction({...newPrediction, price: value === '' ? '' as any : (parseFloat(value) || '' as any)});
                            // Clear error when field changes
                            if (fieldErrors.price) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.price;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        />
                        {newPrediction.lotteryType && getPriceByLotteryType(newPrediction.lotteryType) > 0 && (
                          <small className="text-success d-block mt-1">
                            <i className="bi bi-check-circle me-1"></i>
                            Auto-set to ${getPriceByLotteryType(newPrediction.lotteryType)} for {lotteryTypes.find(lt => lt.value === newPrediction.lotteryType)?.label}
                          </small>
                        )}
                        {fieldErrors.price && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Number Selection Interface */}
                  <div className="mb-3">
                    <h6 className="mb-3">Select Non-viable Numbers</h6>
                    <p className="text-muted small mb-3">
                      Select the non-viable numbers for this prediction. These are the numbers that players should avoid.
                    </p>
                    
                    {(() => {
                      const config = lotteryConfigs[newPrediction.lotteryType];
                      
                      if (config.type === 'double') {
                        return (
                          <>
                            <NumberSelector
                              min={config.whiteBalls.min}
                              max={config.whiteBalls.max}
                              selected={newPrediction.whiteBalls}
                              onToggle={(num) => toggleNumber(num, 'whiteBalls')}
                              onClear={() => clearNumbers('whiteBalls')}
                              label={config.whiteBalls.label}
                            />
                            <NumberSelector
                              min={config.redBalls.min}
                              max={config.redBalls.max}
                              selected={newPrediction.redBalls}
                              onToggle={(num) => toggleNumber(num, 'redBalls')}
                              onClear={() => clearNumbers('redBalls')}
                              label={config.redBalls.label}
                            />
                          </>
                        );
                      } else if (config.type === 'single') {
                        return (
                          <NumberSelector
                            min={config.numbers.min}
                            max={config.numbers.max}
                            selected={newPrediction.singleNumbers}
                            onToggle={(num) => toggleNumber(num, 'singleNumbers')}
                            onClear={() => clearNumbers('singleNumbers')}
                            label={config.numbers.label}
                          />
                        );
                      } else if (config.type === 'pick3') {
                        return (
                          <NumberSelector
                            min={config.numbers.min}
                            max={config.numbers.max}
                            selected={newPrediction.pick3Numbers}
                            onToggle={(num) => toggleNumber(num, 'pick3Numbers')}
                            onClear={() => clearNumbers('pick3Numbers')}
                            label={config.numbers.label}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className={`form-control ${fieldErrors.notes ? 'is-invalid' : ''}`}
                      rows={3}
                      value={newPrediction.notes}
                      onChange={(e) => {
                        setNewPrediction({...newPrediction, notes: e.target.value});
                        // Clear error when field changes
                        if (fieldErrors.notes) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.notes;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    {fieldErrors.notes && (
                      <div className="invalid-feedback d-block">
                        {fieldErrors.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Create Prediction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prediction Modal */}
      {showEditModal && editingPrediction && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-dialog modal-xl" style={{ zIndex: 1205, marginTop: '60px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Prediction</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <form onSubmit={handleUpdatePrediction}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Lottery Type</label>
                        <select
                          className={`form-select ${fieldErrors.lotteryType ? 'is-invalid' : ''}`}
                          value={newPrediction.lotteryType}
                          onChange={(e) => {
                            const newType = e.target.value as LotteryType;
                            const lotteryName = lotteryTypes.find(lt => lt.value === newType)?.label || '';
                            const autoPrice = getPriceByLotteryType(newType);
                            handleLotteryTypeChange(newType);
                            setNewPrediction(prev => ({
                              ...prev,
                              lotteryDisplayName: lotteryName,
                              // Auto-set price when lottery type changes
                              price: autoPrice > 0 ? autoPrice : prev.price,
                              // Clear numbers when type changes
                              whiteBalls: [],
                              redBalls: [],
                              singleNumbers: [],
                              pick3Numbers: []
                            }));
                            // Clear error when field changes
                            if (fieldErrors.lotteryType) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.lotteryType;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        >
                          {lotteryTypes.map((lottery) => (
                            <option key={lottery.value} value={lottery.value}>
                              {lottery.label}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.lotteryType && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.lotteryType}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display Name</label>
                        <input
                          type="text"
                          className={`form-control ${fieldErrors.lotteryDisplayName ? 'is-invalid' : ''}`}
                          value={newPrediction.lotteryDisplayName}
                          onChange={(e) => {
                            setNewPrediction({...newPrediction, lotteryDisplayName: e.target.value});
                            // Clear error when field changes
                            if (fieldErrors.lotteryDisplayName) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.lotteryDisplayName;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        />
                        {fieldErrors.lotteryDisplayName && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.lotteryDisplayName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Draw Day <span className="text-muted">(Auto-fills date & time)</span></label>
                        <select
                          className="form-control"
                          value={newPrediction.drawDay}
                          onChange={(e) => handleDrawDayChange(e.target.value)}
                        >
                          <option value="">-- Select Draw Day --</option>
                          {getAvailableDrawDays(newPrediction.lotteryType).map((day) => (
                            <option key={day} value={day}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted d-block mt-1">
                          Available: {getAvailableDrawDays(newPrediction.lotteryType).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Draw Date</label>
                        <input
                          type="date"
                          className={`form-control ${fieldErrors.drawDate ? 'is-invalid' : ''}`}
                          value={newPrediction.drawDate}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            setNewPrediction({...newPrediction, drawDate: selectedDate, drawDay: ''});
                            
                            // Clear error when field is changed
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.drawDate;
                              return newErrors;
                            });
                          }}
                          required
                        />
                        {fieldErrors.drawDate && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.drawDate}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          Draw Time 
                          <span className="text-muted ms-1">(Minnesota Time)</span>
                        </label>
                        <input
                          type="time"
                          className={`form-control ${fieldErrors.drawTime ? 'is-invalid' : ''}`}
                          value={newPrediction.drawTime}
                          onChange={(e) => {
                            setNewPrediction({...newPrediction, drawTime: e.target.value, drawDay: ''});
                            // Clear error when field changes
                            if (fieldErrors.drawTime) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.drawTime;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        />
                        <small className="text-muted d-block mt-1">
                          <i className="bi bi-clock me-1"></i>
                          All times are in Minnesota Time (CST/CDT)
                        </small>
                        {fieldErrors.drawTime && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.drawTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`form-control ${fieldErrors.price ? 'is-invalid' : ''}`}
                          value={newPrediction.price === '' ? '' : newPrediction.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string, otherwise parse as float
                            setNewPrediction({...newPrediction, price: value === '' ? '' as any : (parseFloat(value) || '' as any)});
                            // Clear error when field changes
                            if (fieldErrors.price) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.price;
                                return newErrors;
                              });
                            }
                          }}
                          required
                        />
                        {newPrediction.lotteryType && getPriceByLotteryType(newPrediction.lotteryType) > 0 && (
                          <small className="text-success d-block mt-1">
                            <i className="bi bi-check-circle me-1"></i>
                            Auto-set to ${getPriceByLotteryType(newPrediction.lotteryType)} for {lotteryTypes.find(lt => lt.value === newPrediction.lotteryType)?.label}
                          </small>
                        )}
                        {fieldErrors.price && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Number Selection Interface */}
                  <div className="mb-3">
                    <h6 className="mb-3">Select Non-viable Numbers</h6>
                    <p className="text-muted small mb-3">
                      Select the non-viable numbers for this prediction. These are the numbers that players should avoid.
                    </p>
                    
                    {(() => {
                      const config = lotteryConfigs[newPrediction.lotteryType];
                      
                      if (config.type === 'double') {
                        return (
                          <>
                            <NumberSelector
                              min={config.whiteBalls.min}
                              max={config.whiteBalls.max}
                              selected={newPrediction.whiteBalls}
                              onToggle={(num) => toggleNumber(num, 'whiteBalls')}
                              onClear={() => clearNumbers('whiteBalls')}
                              label={config.whiteBalls.label}
                            />
                            <NumberSelector
                              min={config.redBalls.min}
                              max={config.redBalls.max}
                              selected={newPrediction.redBalls}
                              onToggle={(num) => toggleNumber(num, 'redBalls')}
                              onClear={() => clearNumbers('redBalls')}
                              label={config.redBalls.label}
                            />
                          </>
                        );
                      } else if (config.type === 'single') {
                        return (
                          <NumberSelector
                            min={config.numbers.min}
                            max={config.numbers.max}
                            selected={newPrediction.singleNumbers}
                            onToggle={(num) => toggleNumber(num, 'singleNumbers')}
                            onClear={() => clearNumbers('singleNumbers')}
                            label={config.numbers.label}
                          />
                        );
                      } else if (config.type === 'pick3') {
                        return (
                          <NumberSelector
                            min={config.numbers.min}
                            max={config.numbers.max}
                            selected={newPrediction.pick3Numbers}
                            onToggle={(num) => toggleNumber(num, 'pick3Numbers')}
                            onClear={() => clearNumbers('pick3Numbers')}
                            label={config.numbers.label}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className={`form-control ${fieldErrors.notes ? 'is-invalid' : ''}`}
                      rows={3}
                      value={newPrediction.notes}
                      onChange={(e) => {
                        setNewPrediction({...newPrediction, notes: e.target.value});
                        // Clear error when field changes
                        if (fieldErrors.notes) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.notes;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    {fieldErrors.notes && (
                      <div className="invalid-feedback d-block">
                        {fieldErrors.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    <i className="bi bi-check-circle me-2"></i>
                    Update Prediction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminPredictions;

