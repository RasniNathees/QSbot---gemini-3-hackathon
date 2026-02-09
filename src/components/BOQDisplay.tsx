import React, { useState, useRef, useEffect } from 'react'
import { FileText } from 'lucide-react'

import type { BOQResponse, Assumption, BOQItem, TradeGroup } from '@/util/types'

interface BOQDisplayprops {
    data: BOQResponse
}
const ASSUMPTION_CATEGORIES = ['Quantity', 'Specification', 'Site Condition', 'General', 'Pricing'];

function BOQDisplay({ data }: BOQDisplayprops) {
    const [currentData, setCurrentData] = useState<BOQResponse>(data);
    const [selectedItemId, setSlectedItemId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [analysisItem, setAnalysisItem] = useState<BOQItem | null>(null);
    const [dimSheetItem, setDimSheetItem] = useState<BOQItem | null>(null);

    // Assumption states
    const [editingAssumptionIndex, setEditingAssumptionIndex] = useState<number | null>(null);
    const [editAssumptionText, setEditAssumptionText] = useState("");
    const [editAssumptionCategory, setEditAssumptionCategory] = useState("");

    const [isAddingAssumption, setIsAddingAssumption] = useState(false);
    const [newAssumptionText, setNewAssumptionText] = useState("");
    const [newAssumptionCategory, setNewAssumptionCategory] = useState("General");

    // Refs for scrolling
    const itemRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    useEffect(() => {
        setCurrentData(data);
    }, [data]);

    // Scroll to selected item
    useEffect(() => {
        if (selectedItemId && itemRefs.current[selectedItemId] && !isEditMode) {
            itemRefs.current[selectedItemId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            itemRefs.current[selectedItemId]?.classList.add('bg-indigo-50', 'dark:bg-indigo-900/30');
            setTimeout(() => {
                itemRefs.current[selectedItemId]?.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/30');
            }, 2000);
        }
    }, [selectedItemId, isEditMode]);

    const { projectSummary, boqItems, assumptions, recommendedSuppliers, source, isInsufficientInfo, missingInfoReason } = currentData;

    // Helper to get the full unit rate (Mat + Lab + O&P)
    const getUnitOandP = (item: BOQItem) => {
        if (item.rateAnalysis?.overheadAndProfit !== undefined && item.rateAnalysis.overheadAndProfit !== null) {
            return item.rateAnalysis.overheadAndProfit;
        }
        // Default 15% if not set explicitly
        return (item.rateMaterial + item.rateLabor) * 0.15;
    };
    
  const getFullUnitRate = (item: BOQItem) => {
      return item.rateMaterial + item.rateLabor + getUnitOandP(item);
  };

  const calcItemTotal = (item: BOQItem) => {
      return item.quantity * getFullUnitRate(item);
  };

  const calcTradeTotal = (items: BOQItem[]) => {
    return items.reduce((sum, item) => sum + calcItemTotal(item), 0);
  };

  // Grand Totals Calculation
  const grandTotal = boqItems.reduce((sum, trade) => sum + calcTradeTotal(trade.items), 0);
  
  const totalPrimeCost = boqItems.reduce((sum, trade) => {
      return sum + trade.items.reduce((tSum, item) => tSum + (item.quantity * (item.rateMaterial + item.rateLabor)), 0);
  }, 0);

  const totalOverheadAndProfit = boqItems.reduce((sum, trade) => {
      return sum + trade.items.reduce((tSum, item) => tSum + (item.quantity * getUnitOandP(item)), 0);
  }, 0);

  // Format helper
  const fmt = (num: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: projectSummary.currency || 'USD',
      minimumFractionDigits: 2
  }).format(num);

  const handleRowClick = (id: string) => {
    if (!isEditMode) setSlectedItemId(id);
  };

  // --- CRUD Handlers for Edit Mode ---

  const handleUpdateItem = (tradeIdx: number, itemIdx: number, field: keyof BOQItem | 'overheadAndProfit', value: any) => {
      const newData = { ...currentData };
      const items = [...newData.boqItems[tradeIdx].items];
      const item = { ...items[itemIdx] };

      if (field === 'overheadAndProfit') {
          // Special handling for O&P which is nested in rateAnalysis
          item.rateAnalysis = {
              ...item.rateAnalysis,
              baseMaterial: item.rateMaterial, // keep sync
              baseLabor: item.rateLabor,       // keep sync
              plantAndEquipment: item.rateAnalysis?.plantAndEquipment || 0,
              narrative: item.rateAnalysis?.narrative || '',
              overheadAndProfit: parseFloat(value) || 0
          };
      } else {
          // @ts-ignore
          item[field] = value;
          // Ensure numbers are parsed
          if (['quantity', 'rateMaterial', 'rateLabor'].includes(field)) {
             // @ts-ignore
             item[field] = parseFloat(value) || 0;
          }
      }

      items[itemIdx] = item;
      newData.boqItems[tradeIdx] = { ...newData.boqItems[tradeIdx], items };
      setCurrentData(newData);
  };

  const handleAddItem = (tradeIdx: number) => {
      const newData = { ...currentData };
      const trade = newData.boqItems[tradeIdx];
      
      // Intelligent Numbering Logic
      // Default fallback
      let nextItemNo = `${tradeIdx + 1}.${trade.items.length + 1}`;
      
      if (trade.items.length > 0) {
        const lastItem = trade.items[trade.items.length - 1];
        // Try to parse the last item number
        const parts = lastItem.itemNo.split('.');
        if (parts.length > 0) {
            const lastSegment = parts[parts.length - 1];
            const lastNum = parseInt(lastSegment, 10);
            
            if (!isNaN(lastNum)) {
                // Increment the last segment (e.g. 1.3.1 -> 1.3.2)
                parts[parts.length - 1] = (lastNum + 1).toString();
                nextItemNo = parts.join('.');
            }
        }
      }

      const newItem: BOQItem = {
          id: `new-${Date.now()}`,
          itemNo: nextItemNo,
          description: "New Item Description",
          unit: "ea",
          quantity: 1,
          rateMaterial: 0,
          rateLabor: 0,
          totalRate: 0,
          totalCost: 0,
          rateAnalysis: {
            baseMaterial: 0,
            baseLabor: 0,
            plantAndEquipment: 0,
            overheadAndProfit: 0,
            narrative: "Manual Entry"
          }
      };

      trade.items.push(newItem);
      setCurrentData(newData);
  };

  const handleDeleteItem = (tradeIdx: number, itemIdx: number) => {
      const newData = { ...currentData };
      newData.boqItems[tradeIdx].items.splice(itemIdx, 1);
      setCurrentData(newData);
  };

  const handleUpdateTradeName = (tradeIdx: number, name: string) => {
      const newData = { ...currentData };
      newData.boqItems[tradeIdx].tradeName = name;
      setCurrentData(newData);
  };

  const handleAddTrade = () => {
      const newData = { ...currentData };
      const newTrade: TradeGroup = {
          tradeName: "New Trade Section",
          tradeTotal: 0,
          items: []
      };
      newData.boqItems.push(newTrade);
      setCurrentData(newData);
  };

  const handleDeleteTrade = (tradeIdx: number) => {
      if (window.confirm("Are you sure you want to delete this entire section?")) {
          const newData = { ...currentData };
          newData.boqItems.splice(tradeIdx, 1);
          setCurrentData(newData);
      }
  };

  // --- Assumption Handlers ---
  const handleAddAssumption = () => {
    if (!newAssumptionText.trim()) return;
    const newAssumption: Assumption = {
        category: newAssumptionCategory,
        text: newAssumptionText.trim()
    };
    const updatedAssumptions = [...assumptions, newAssumption];
    setCurrentData({ ...currentData, assumptions: updatedAssumptions });
    setNewAssumptionText("");
    setIsAddingAssumption(false);
  };

  const handleDeleteAssumption = (index: number) => {
      const updatedAssumptions = assumptions.filter((_, i) => i !== index);
      setCurrentData({ ...currentData, assumptions: updatedAssumptions });
  };

  const startEditAssumption = (index: number) => {
      setEditingAssumptionIndex(index);
      setEditAssumptionText(assumptions[index].text);
      setEditAssumptionCategory(assumptions[index].category);
  };

  const saveEditAssumption = () => {
      if (editingAssumptionIndex === null) return;
      const updatedAssumptions = [...assumptions];
      updatedAssumptions[editingAssumptionIndex] = {
          category: editAssumptionCategory,
          text: editAssumptionText
      };
      setCurrentData({ ...currentData, assumptions: updatedAssumptions });
      setEditingAssumptionIndex(null);
  };

  if (isInsufficientInfo) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
        <h3 className="text-red-800 font-bold mb-2">Estimation Failed</h3>
        <p className="text-red-600">{missingInfoReason}</p>
      </div>
    );
  }
    return (
        <div>

        </div>
    )
}

export default BOQDisplay
