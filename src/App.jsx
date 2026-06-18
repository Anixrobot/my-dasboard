import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Chart from 'chart.js/auto';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getYear, getMonth, subDays } from 'date-fns';

function App() {
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Customization States
  const [addingPageUnder, setAddingPageUnder] = useState(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const [newIconVal, setNewIconVal] = useState('');

  // Target Groups & Checklist
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newBlockContent, setNewBlockContent] = useState({});
  const [activeGroupInput, setActiveGroupInput] = useState(null);

  // Notes
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');

  // Widgets Toggle
  const [pageWidgets, setPageWidgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('page_widgets')) || {}; } catch (e) { return {}; }
  });
  useEffect(() => localStorage.setItem('page_widgets', JSON.stringify(pageWidgets)), [pageWidgets]);

  const currentWidgetsString = (pageWidgets[activePageId] || []).join(',');
  const isStatsEnabled = currentWidgetsString.includes('stats');
  const isBusinessEnabled = currentWidgetsString.includes('business');
  const isTodosEnabled = currentWidgetsString.includes('todos');
  const isNotesEnabled = currentWidgetsString.includes('notes');
  const isPlannerEnabled = currentWidgetsString.includes('planner');

  const toggleWidget = (widgetName) => {
    setPageWidgets(prev => {
      const widgets = prev[activePageId] || [];
      if (widgets.includes(widgetName)) return { ...prev, [activePageId]: widgets.filter(w => w !== widgetName) };
      return { ...prev, [activePageId]: [...widgets, widgetName] };
    });
  };

  const [subtitles, setSubtitles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('page_subtitles')) || {}; } catch (e) { return {}; }
  });
  useEffect(() => localStorage.setItem('page_subtitles', JSON.stringify(subtitles)), [subtitles]);

  const [targetGroups, setTargetGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('target_groups_data')) || {}; } catch (e) { return {}; }
  });
  useEffect(() => localStorage.setItem('target_groups_data', JSON.stringify(targetGroups)), [targetGroups]);
  const currentPageGroups = targetGroups[activePageId] || ['todo'];

  // ================= 1. FINANCE STATES & LOGIC =================
  const [transactions, setTransactions] = useState([]);
  const todayISOStr = new Date().toISOString().split('T')[0];
  
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txCategory, setTxCategory] = useState('TABUNGAN'); 
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxDate, setNewTxDate] = useState(todayISOStr);
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxType, setNewTxType] = useState('pengeluaran'); 
  const [newTxCurrency, setNewTxCurrency] = useState('TABUNGAN'); 

  const [isTransferring, setIsTransferring] = useState(false);
  const [transferDirection, setTransferDirection] = useState('TABUNGAN_TO_GT');
  const [transferDate, setTransferDate] = useState(todayISOStr);
  const [transferAmountIDR, setTransferAmountIDR] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [editingTxId, setEditingTxId] = useState(null);
  const [editTxDate, setEditTxDate] = useState('');

  const [dlRate, setDlRate] = useState(() => localStorage.getItem('finance_dl_rate') || 10000);
  useEffect(() => localStorage.setItem('finance_dl_rate', dlRate), [dlRate]);

  let tabunganIn = 0; let tabunganOut = 0; let gtModalDL = 0; let gtOmsetDL = 0;
  (transactions || []).forEach(t => {
    if (t.currency_type === 'TABUNGAN' || t.currency_type === 'IDR') {
      if (t.type === 'pemasukan') tabunganIn += t.amount; else tabunganOut += t.amount;
    } else if (['WL', 'DL', 'BGL'].includes(t.currency_type)) {
      const valDL = t.currency_type === 'BGL' ? t.amount * 100 : (t.currency_type === 'WL' ? t.amount / 100 : t.amount);
      if (t.type === 'pemasukan') gtOmsetDL += valDL; else gtModalDL += valDL;
    }
  });

  const tabunganBalance = tabunganIn - tabunganOut;
  const gtNetDL = gtOmsetDL - gtModalDL;
  const isGtProfit = gtNetDL >= 0;
  const gtNetIDR = gtNetDL * dlRate;
  const totalKekayaanIDR = tabunganBalance + gtNetIDR;
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // ================= 2. PLANNER LOGIC =================
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyTasks, setDailyTasks] = useState([]);
  const [newDailyTaskName, setNewDailyTaskName] = useState('');
  const [allPageTasks, setAllPageTasks] = useState([]); 
  
  // Bulanan Target Logic
  const monthKey = format(currentMonth, 'yyyy_MM');
  const [newMonthlyTodo, setNewMonthlyTodo] = useState('');

  // ================= 3. STATISTIK =================
  const activePage = (pages || []).find(p => p.id === activePageId);
  const noteBlocks = (blocks || []).filter(b => b.type === 'note');
  const allChecklistBlocks = (blocks || []).filter(b => currentPageGroups.includes(b.type));
  const totalTodos = allChecklistBlocks.length;
  const completedTodos = allChecklistBlocks.filter(b => b.is_completed).length;
  const blocksPercent = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);

  const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dailyNoteBlocks = (blocks || []).filter(b => b.type === `daily_note_${currentDateStr}`);

  const calcPercent = (tasksArray) => (!tasksArray || tasksArray.length === 0) ? 0 : Math.round((tasksArray.filter(t => t.is_completed).length / tasksArray.length) * 100);
  const tasksToday = (allPageTasks || []).filter(t => t.task_date === format(new Date(), 'yyyy-MM-dd'));
  const tasksWeek = (allPageTasks || []).filter(t => new Date(t.task_date) >= startOfWeek(new Date(), { weekStartsOn: 1 }) && new Date(t.task_date) <= endOfWeek(new Date(), { weekStartsOn: 1 }));
  const tasksYear = (allPageTasks || []).filter(t => getYear(new Date(t.task_date)) === getYear(new Date()));

  const dailyPercent = calcPercent(tasksToday);
  const weeklyPercent = calcPercent(tasksWeek);
  const yearlyPercent = calcPercent(tasksYear);

  const [statsView, setStatsView] = useState('mingguan');
  const chartRef = useRef(null);

  useEffect(() => {
    if (!isStatsEnabled || !chartRef.current) return;
    let labels = []; let chartData = []; let barColor = '#7ae6ff'; const today = new Date();
    if (statsView === 'harian') {
      labels = Array.from({ length: 7 }).map((_, i) => format(subDays(today, 6 - i), 'dd MMM'));
      chartData = Array.from({ length: 7 }).map((_, i) => calcPercent((allPageTasks || []).filter(t => t.task_date === format(subDays(today, 6 - i), 'yyyy-MM-dd'))));
    } else if (statsView === 'mingguan') {
      const startWk = startOfWeek(today, { weekStartsOn: 1 });
      labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      chartData = Array.from({ length: 7 }).map((_, i) => calcPercent((allPageTasks || []).filter(t => t.task_date === format(addDays(startWk, i), 'yyyy-MM-dd'))));
    } else if (statsView === 'bulanan') {
      labels = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4']; const monthStart = startOfMonth(today);
      chartData = Array.from({ length: 4 }).map((_, i) => calcPercent((allPageTasks || []).filter(t => new Date(t.task_date) >= addDays(monthStart, i * 7) && new Date(t.task_date) <= addDays(addDays(monthStart, i * 7), 6))));
    } else if (statsView === 'tahunan') {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      chartData = Array.from({ length: 12 }).map((_, i) => calcPercent((allPageTasks || []).filter(t => getMonth(new Date(t.task_date)) === i && getYear(new Date(t.task_date)) === getYear(today))));
    } else if (statsView === 'keseluruhan') {
      labels = ['Target & Checklist', 'Daily Tasks (All Time)'];
      chartData = [blocksPercent, calcPercent(allPageTasks)]; barColor = '#8B5CF6';
    }
    const myChart = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: `Progres (%)`, data: chartData, backgroundColor: chartData.map(val => val === 100 ? '#10b981' : barColor), borderRadius: 4, barThickness: window.innerWidth < 768 ? 12 : 24 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(122,230,255,0.1)' }, ticks: { color: '#81b2c6', callback: (value) => value + '%' } }, x: { grid: { display: false }, ticks: { color: '#81b2c6', maxRotation: 45, minRotation: 45} } }, plugins: { legend: { display: false } } }
    });
    return () => { myChart.destroy(); };
  }, [allPageTasks, blocks, isStatsEnabled, statsView]);

  // ================= 4. CHART TRADING VIEW =================
  const financeChartRef = useRef(null);

  useEffect(() => {
    if (!isBusinessEnabled || !financeChartRef.current) return;
    const ctx = financeChartRef.current.getContext('2d');
    const sortedTx = [...(transactions || [])].reverse(); 
    let runTotalIDR = 0; const labels = []; const dataTotal = [];

    if (sortedTx.length === 0) { labels.push('Data'); dataTotal.push(0); } else {
      sortedTx.forEach(t => {
        let valIDR = 0;
        if (t.currency_type === 'TABUNGAN' || t.currency_type === 'IDR') valIDR = t.amount;
        else if (['WL', 'DL', 'BGL'].includes(t.currency_type)) valIDR = (t.currency_type === 'BGL' ? t.amount * 100 : (t.currency_type === 'WL' ? t.amount / 100 : t.amount)) * dlRate;
        if (t.type === 'pemasukan') runTotalIDR += valIDR; else runTotalIDR -= valIDR;
        labels.push(t.date || 'Tgl'); dataTotal.push(runTotalIDR);
      });
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

    const myFinanceChart = new Chart(financeChartRef.current, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{ label: 'Net Worth (IDR)', data: dataTotal, borderColor: '#10b981', backgroundColor: grad, borderWidth: 3, fill: true, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: '#10b981', tension: 0 }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        scales: { y: { position: 'right', grid: { color: 'rgba(122,230,255,0.1)', drawBorder: false }, ticks: { color: '#81b2c6', callback: (value) => window.innerWidth > 768 ? formatIDR(value) : (value/1000000).toFixed(0) + 'Jt' } }, x: { grid: { display: false }, ticks: { display: false } } }, 
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#001017', titleColor: '#7ae6ff', bodyColor: '#c1ecff', borderColor: '#7ae6ff', borderWidth: 1, callbacks: { label: function(context) { return ` ${formatIDR(context.parsed.y)}`; } } } } 
      }
    });
    return () => { myFinanceChart.destroy(); };
  }, [transactions, isBusinessEnabled, dlRate]);

  // ================= FETCH & CRUD LOGIC =================
  const fetchTasksData = async (date, pillar) => {
    const { data: dailyData } = await supabase.from('daily_tasks').select('*').eq('task_date', format(date, 'yyyy-MM-dd')).eq('pillar', pillar || '').order('id', { ascending: true });
    setDailyTasks(dailyData || []);
    const { data: allData } = await supabase.from('daily_tasks').select('*').eq('pillar', pillar || '');
    setAllPageTasks(allData || []);
  };

  useEffect(() => { if (activePageId) { fetchTasksData(selectedDate, activePage?.pillar || ''); fetchBlocks(activePageId); fetchTransactions(activePageId); } }, [activePageId, selectedDate, currentMonth]);

  const fetchPages = async () => { const { data } = await supabase.from('pages').select('*').order('created_at', { ascending: true }); setPages(data || []); if (!activePageId && data && data.length > 0) setActivePageId(data[0].id); };
  const fetchBlocks = async (pageId) => { const { data } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('created_at', { ascending: true }); setBlocks(data || []); };
  const fetchTransactions = async (pageId) => { const { data } = await supabase.from('growtopia_transactions').select('*').eq('page_id', pageId).order('id', { ascending: false }); setTransactions(data || []); };
  useEffect(() => { const fetchInitialData = async () => { setLoading(true); await fetchPages(); setLoading(false); }; fetchInitialData(); }, []);

  const handleAddBlockInGroup = async (e, groupType) => { const text = newBlockContent[groupType] || ''; if (e.key === 'Enter' && text.trim() !== '' && activePageId) { await supabase.from('blocks').insert([{ page_id: activePageId, type: groupType, content: text.trim(), is_completed: false }]); setNewBlockContent({ ...newBlockContent, [groupType]: '' }); setActiveGroupInput(null); fetchBlocks(activePageId); } };
  const handleAddCustomBlockEnter = async (e, type, content, setContentFunc) => { if (e.key === 'Enter' && content.trim() !== '' && activePageId) { await supabase.from('blocks').insert([{ page_id: activePageId, type: type, content: content.trim(), is_completed: false }]); if(setContentFunc) setContentFunc(''); fetchBlocks(activePageId); } };
  const handleAddCustomBlockClick = async (type, content) => { if (activePageId) { await supabase.from('blocks').insert([{ page_id: activePageId, type: type, content: content, is_completed: false }]); fetchBlocks(activePageId); } };
  const handleUpdateBlockContent = async (id, newContent) => { if(newContent.trim() !== '') { await supabase.from('blocks').update({ content: newContent }).eq('id', id); setEditingNoteId(null); fetchBlocks(activePageId); } };
  const handleAddNote = async () => { if (newNoteContent.trim() !== '' && activePageId) { await supabase.from('blocks').insert([{ page_id: activePageId, type: 'note', content: newNoteContent, is_completed: false }]); setNewNoteContent(''); setIsAddingNote(false); fetchBlocks(activePageId); } };
  const toggleBlock = async (id, currentStatus) => { await supabase.from('blocks').update({ is_completed: !currentStatus }).eq('id', id); fetchBlocks(activePageId); };
  const deleteBlock = async (id) => { if(window.confirm('Hapus item ini?')) { await supabase.from('blocks').delete().eq('id', id); fetchBlocks(activePageId); } };

  const handleAddDailyTask = async (e) => { if (e.key === 'Enter' && newDailyTaskName.trim() !== '') { const { data } = await supabase.from('daily_tasks').insert([{ task_name: newDailyTaskName, task_date: format(selectedDate, 'yyyy-MM-dd'), is_completed: false, pillar: activePage?.pillar || '' }]).select(); if (data) { setDailyTasks([...(dailyTasks||[]), ...data]); setAllPageTasks([...(allPageTasks||[]), ...data]); setNewDailyTaskName(''); } } };
  const toggleDailyTask = async (id, currentStatus) => { await supabase.from('daily_tasks').update({ is_completed: !currentStatus }).eq('id', id); fetchTasksData(selectedDate, activePage?.pillar); };
  const deleteDailyTask = async (id) => { if(window.confirm('Hapus jadwal ini?')) { await supabase.from('daily_tasks').delete().eq('id', id); fetchTasksData(selectedDate, activePage?.pillar); } };

  const handleAddTargetGroup = () => { if (newGroupName.trim() !== '' && activePageId) { const clean = newGroupName.trim().toLowerCase().replace(/\s+/g, '_'); setTargetGroups({ ...targetGroups, [activePageId]: [...currentPageGroups, clean] }); setSubtitles({ ...subtitles, [`title_${clean}_${activePageId}`]: newGroupName.trim() }); setNewGroupName(''); setIsAddingGroup(false); } };
  const handleDeleteTargetGroup = (groupType) => { if (window.confirm('Hapus seluruh list ini?')) { const groupBlocks = (blocks || []).filter(b => b.type === groupType); groupBlocks.forEach(async (b) => await supabase.from('blocks').delete().eq('id', b.id)); setTargetGroups({ ...targetGroups, [activePageId]: currentPageGroups.filter(g => g !== groupType) }); fetchBlocks(activePageId); } };

  const handleTxCategoryToggle = (category) => { setTxCategory(category); if (category === 'TABUNGAN') setNewTxCurrency('TABUNGAN'); else setNewTxCurrency('DL'); };
  const handleAddTransaction = async () => { if (newTxDesc.trim() === '' || newTxAmount === '') { alert("Isi form dengan benar!"); return; } const finalCurrency = txCategory === 'TABUNGAN' ? 'TABUNGAN' : newTxCurrency; await supabase.from('growtopia_transactions').insert([{ description: newTxDesc, amount: parseFloat(newTxAmount), type: newTxType, currency_type: finalCurrency, date: newTxDate || todayISOStr, page_id: activePageId }]); setNewTxDesc(''); setNewTxAmount(''); setIsAddingTx(false); setNewTxDate(todayISOStr); fetchTransactions(activePageId); };
  const handleTransferAction = async () => {
    if (!transferAmountIDR || parseFloat(transferAmountIDR) <= 0) return; const amountIDR = parseFloat(transferAmountIDR); const amountDL = amountIDR / (dlRate || 1); 
    try {
        if (transferDirection === 'TABUNGAN_TO_GT') { await supabase.from('growtopia_transactions').insert([ { description: transferDesc || 'Beli Aset', amount: amountIDR, type: 'pengeluaran', currency_type: 'TABUNGAN', date: transferDate || todayISOStr, page_id: activePageId }, { description: transferDesc || 'Beli Aset', amount: amountDL, type: 'pemasukan', currency_type: 'DL', date: transferDate || todayISOStr, page_id: activePageId } ]); } 
        else if (transferDirection === 'GT_TO_TABUNGAN') { await supabase.from('growtopia_transactions').insert([ { description: transferDesc || 'Jual Aset', amount: amountDL, type: 'pengeluaran', currency_type: 'DL', date: transferDate || todayISOStr, page_id: activePageId }, { description: transferDesc || 'Jual Aset', amount: amountIDR, type: 'pemasukan', currency_type: 'TABUNGAN', date: transferDate || todayISOStr, page_id: activePageId } ]); }
        setTransferAmountIDR(''); setTransferDesc(''); setIsTransferring(false); setTransferDate(todayISOStr); fetchTransactions(activePageId);
    } catch (error) { console.error(error); }
  };
  const handleUpdateTxDate = async (id, newDate) => { if (newDate.trim() !== '') { await supabase.from('growtopia_transactions').update({ date: newDate }).eq('id', id); setEditingTxId(null); fetchTransactions(activePageId); } else { setEditingTxId(null); } };
  const deleteTransaction = async (id) => { if(window.confirm('Hapus transaksi?')) { await supabase.from('growtopia_transactions').delete().eq('id', id); fetchTransactions(activePageId); } };

  const [pillars, setPillars] = useState(() => { try { return JSON.parse(localStorage.getItem('custom_pillars')) || ["Study", "Sport", "Business"]; } catch(e) { return ["Study"]; } });
  const [isAddingPillar, setIsAddingPillar] = useState(false); const [newPillarName, setNewPillarName] = useState('');
  const confirmAddPillar = () => { if (newPillarName.trim() !== '') { const updated = [...(pillars||[]), newPillarName.trim()]; setPillars(updated); localStorage.setItem('custom_pillars', JSON.stringify(updated)); setNewPillarName(''); } setIsAddingPillar(false); };
  const handleDeletePillar = (pillarToDelete) => { if(window.confirm(`Hapus pillar?`)) { const updated = (pillars||[]).filter(p => p !== pillarToDelete); setPillars(updated); localStorage.setItem('custom_pillars', JSON.stringify(updated)); } };

  const handleUpdateCover = async () => { if (newCoverUrl.trim() !== '' && activePageId) { await supabase.from('pages').update({ cover: newCoverUrl }).eq('id', activePageId); setPages(pages.map(p => p.id === activePageId ? { ...p, cover: newCoverUrl } : p)); } setIsEditingCover(false); setNewCoverUrl(''); };
  const handleUpdateIcon = async () => { if (newIconVal.trim() !== '' && activePageId) { await supabase.from('pages').update({ icon: newIconVal }).eq('id', activePageId); setPages(pages.map(p => p.id === activePageId ? { ...p, icon: newIconVal } : p)); } setIsEditingIcon(false); setNewIconVal(''); };
  const handleUpdateTitle = async (newTitle) => { if(newTitle.trim() === '' || !activePageId) return; await supabase.from('pages').update({ title: newTitle }).eq('id', activePageId); setPages(pages.map(p => p.id === activePageId ? { ...p, title: newTitle } : p)); };
  const handleAddPage = async (e, pillar) => { if (e.key === 'Enter' && newPageTitle.trim() !== '') { const { data } = await supabase.from('pages').insert([{ title: newPageTitle, pillar: pillar, icon: '📄' }]).select(); setNewPageTitle(''); setAddingPageUnder(null); if (data) { setPages([...pages, data[0]]); setActivePageId(data[0].id); } } };
  const handleDeletePage = async () => { if (activePageId && window.confirm("Hapus page?")) { await supabase.from('pages').delete().eq('id', activePageId); setPages(pages.filter(p => p.id !== activePageId)); setActivePageId(pages[0]?.id || null); } };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth); const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); const endDate = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const rows = []; let days = []; let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day; const dayStr = format(cloneDay, 'yyyy-MM-dd');
        const tasksForDay = (allPageTasks||[]).filter(t => t.task_date === dayStr);
        const hasNote = (blocks||[]).some(b => b.type === `daily_note_${dayStr}`);
        const isAllDone = tasksForDay.length > 0 && tasksForDay.every(t => t.is_completed);

        days.push(
          <div key={day.toString()} onClick={() => setSelectedDate(cloneDay)} className={`aspect-square p-1 md:p-2 border-r border-b border-border-glass text-xs hover:bg-primary/5 transition-colors cursor-pointer relative ${!isSameMonth(day, monthStart) ? "text-on-surface-variant/30" : isSameDay(day, selectedDate) ? "bg-primary/20 border-primary/50 text-primary font-bold shadow-[inset_0_0_15px_rgba(122,230,255,0.2)]" : "text-on-surface-variant"}`}>
            {format(day, "d")}
            <div className="absolute bottom-1 right-1 flex gap-0.5">
              {hasNote && <div className="w-1.5 h-1.5 rounded-sm bg-primary"></div>}
              {isAllDone && <div className="w-1.5 h-1.5 rounded-full bg-finance-accent"></div>}
              {tasksForDay.length > 0 && !isAllDone && <div className="w-1.5 h-1.5 rounded-full bg-error"></div>}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>); days = [];
    }
    return <div className="border-t border-l border-border-glass">{rows}</div>;
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-primary">System Booting...</div>;

  const isEmblemUrl = activePage?.icon?.startsWith('http') || activePage?.icon?.startsWith('data:image');
  
  // Data for Monthly Targets
  const monthlyTodos = (blocks || []).filter(b => b.type === `monthly_todo_${monthKey}`);
  const monthlyNotes = (blocks || []).filter(b => b.type === `monthly_note_${monthKey}`);

  return (
    <div className="bg-background text-on-surface font-body-base antialiased custom-scrollbar overflow-x-hidden min-h-screen flex">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR (RESPONSIVE) */}
      <aside className={`fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-border-glass flex flex-col py-6 z-50 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-6 mb-8 flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity">
          <div>
            <h1 className="text-body-base font-bold text-on-surface tracking-tight">Rafie's Dashboard</h1>
            <p className="text-label-caps font-label-caps text-on-surface-variant mt-1 uppercase">Command Center</p>
          </div>
          <button className="md:hidden text-on-surface-variant" onClick={() => setIsSidebarOpen(false)}>
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
          {(pillars||[]).map(pillar => (
            <div key={pillar}>
              <div className="flex justify-between items-center px-2 mb-3">
                <p className="text-label-caps font-label-caps text-on-surface-variant opacity-50 uppercase">{pillar}</p>
                <button onClick={() => handleDeletePillar(pillar)} className="text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined text-[12px]">close</span></button>
              </div>
              <div className="space-y-1">
                {(pages||[]).filter(p => p.pillar === pillar).map(page => (
                  <button key={page.id} onClick={() => {setActivePageId(page.id); setIsSidebarOpen(false);}} className={`w-full text-left nav-item px-4 py-3 flex items-center gap-3 transition-all duration-300 group ${activePageId === page.id ? 'bg-primary/20 text-primary border-l-4 border-primary' : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}>
                    {page.icon?.startsWith('http') || page.icon?.startsWith('data:image') ? (
                       <img src={page.icon} alt="icon" className="w-5 h-5 rounded-sm object-cover" />
                    ) : (
                       <span className="text-sm">{page.icon || '📄'}</span>
                    )}
                    <span className="font-body-sm text-body-sm truncate">{page.title}</span>
                  </button>
                ))}
                {addingPageUnder === pillar ? (
                  <div className="px-4 py-2 flex items-center gap-2"><span className="text-sm">📄</span><input type="text" autoFocus value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} onKeyDown={(e) => handleAddPage(e, pillar)} onBlur={() => setAddingPageUnder(null)} className="bg-transparent border-b border-primary text-primary outline-none w-full py-1 text-sm" placeholder="Judul Page..." /></div>
                ) : (
                  <button onClick={() => setAddingPageUnder(pillar)} className="w-full text-left px-4 py-2 flex items-center gap-3 text-on-surface-variant hover:text-primary transition-colors duration-300"><span className="material-symbols-outlined text-sm">add</span><span className="font-body-sm text-body-sm">Add Page</span></button>
                )}
              </div>
            </div>
          ))}
          <div className="pt-2">
             {isAddingPillar ? (
               <input type="text" autoFocus value={newPillarName} onChange={(e) => setNewPillarName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAddPillar()} onBlur={confirmAddPillar} placeholder="NAMA PILLAR..." className="bg-transparent border-b border-primary text-primary outline-none w-full py-1 text-xs uppercase" />
             ) : (
               <button onClick={() => setIsAddingPillar(true)} className="w-full bg-primary/10 text-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary transition-all duration-300"><span className="material-symbols-outlined text-sm">add</span><span className="text-label-caps font-label-caps">ADD PILLAR</span></button>
             )}
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="md:ml-[280px] w-full flex-1 bg-transparent relative">
        <header className="sticky top-0 z-30 w-full bg-surface/80 backdrop-blur-md border-b border-border-glass h-16 md:h-20 px-4 md:px-8 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-4">
            <button className="md:hidden text-primary p-1" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="material-symbols-outlined text-primary hidden md:block">grid_view</span>
            <h2 className="text-lg md:text-section-title font-headline-lg text-primary tracking-tight">Main Terminal</h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="bg-surface-container-high px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-border-glass text-label-caps font-label-caps hover:bg-surface-bright hover:border-primary/50 transition-all flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-[16px] md:text-sm">sync</span> <span className="hidden md:inline">Sync Data</span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
          {/* HERO BANNER */}
          <section className="relative rounded-2xl overflow-hidden h-[200px] md:h-[300px] border border-border-glass animate-entrance stagger-1 group">
             {isEditingCover && (
               <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm px-4">
                 <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-3 w-full max-w-lg">
                   <input type="text" autoFocus value={newCoverUrl} onChange={(e) => setNewCoverUrl(e.target.value)} placeholder="Paste Image URL..." className="flex-1 bg-surface-container border border-border-glass rounded px-3 py-1.5 outline-none focus:border-primary text-on-surface text-sm" />
                   <div className="flex gap-2">
                     <button onClick={handleUpdateCover} className="flex-1 md:flex-none bg-primary text-on-primary px-4 py-1.5 rounded text-sm font-bold">Save</button>
                     <button onClick={() => setIsEditingCover(false)} className="flex-1 md:flex-none bg-surface-container text-on-surface-variant px-3 py-1.5 rounded text-sm">Cancel</button>
                   </div>
                 </div>
               </div>
             )}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${activePage?.cover || "https://media3.giphy.com/media/LUIvcbR6yytz2/giphy.gif"})` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent"></div>
            
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <div className="relative">
                  {/* EDIT EMBLEM POPUP */}
                  {isEditingIcon && (
                     <div className="absolute -top-16 left-0 z-50 glass-panel p-3 rounded-xl flex gap-2 w-[250px] md:w-80 shadow-2xl animate-entrance">
                       <input type="text" autoFocus value={newIconVal} onChange={(e) => setNewIconVal(e.target.value)} placeholder="Emoji / URL Gambar..." className="flex-1 bg-surface-deep border border-border-glass rounded px-2 py-1 outline-none focus:border-primary text-on-surface text-xs" />
                       <button onClick={handleUpdateIcon} className="bg-primary text-on-primary px-3 py-1 rounded text-xs font-bold">Save</button>
                       <button onClick={() => setIsEditingIcon(false)} className="text-on-surface-variant px-2 py-1 hover:text-error text-xs font-bold">X</button>
                     </div>
                  )}

                  {/* EMBLEM / GLASS BOX */}
                  <div 
                    onClick={() => { setIsEditingIcon(true); setNewIconVal(activePage?.icon || '📄'); }}
                    className="w-16 h-16 md:w-24 md:h-24 shrink-0 glass-panel rounded-2xl flex items-center justify-center border-2 border-primary/30 text-3xl md:text-5xl transform transition hover:scale-110 duration-300 cursor-pointer overflow-hidden relative group/emblem"
                  >
                    {isEmblemUrl ? (
                        <img src={activePage.icon} alt="Emblem" className="w-full h-full object-cover group-hover/emblem:opacity-80 transition-opacity" style={{ imageRendering: 'pixelated' }} />
                    ) : (
                        <span className="group-hover/emblem:opacity-80 transition-opacity">{activePage?.icon || '📄'}</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/emblem:opacity-100 transition-opacity bg-surface-deep/40 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-primary text-xl md:text-2xl">edit</span>
                    </div>
                  </div>
              </div>

              <div className="w-full max-w-[85vw] md:max-w-lg">
                <input type="text" value={activePage?.title || ''} onChange={(e) => setPages(pages.map(p => p.id === activePageId ? { ...p, title: e.target.value } : p))} onBlur={(e) => handleUpdateTitle(e.target.value)} placeholder="Page Title..." className="bg-transparent border-none outline-none text-2xl md:font-headline-lg md:text-headline-lg font-bold text-on-surface w-full mb-2 p-0 truncate" />
                
                {/* WIDGET TOGGLES (SCROLLABLE ON MOBILE) */}
                <div className="flex gap-2 mt-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0 w-full">
                  <button onClick={() => toggleWidget('business')} className={`shrink-0 glass-panel px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-label-caps font-bold flex items-center gap-1.5 md:gap-2 transition-all duration-300 border ${isBusinessEnabled ? 'bg-finance-accent text-white border-finance-accent shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-finance-accent border-finance-accent/20 hover:bg-finance-accent/20'}`}>
                    <span className="material-symbols-outlined text-[12px] md:text-sm">account_balance_wallet</span> Finance
                  </button>
                  <button onClick={() => toggleWidget('todos')} className={`shrink-0 glass-panel px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-label-caps font-bold flex items-center gap-1.5 md:gap-2 transition-all duration-300 border ${isTodosEnabled ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-primary border-primary/20 hover:bg-primary/20'}`}>
                    <span className="material-symbols-outlined text-[12px] md:text-sm">checklist</span> Checklist
                  </button>
                  <button onClick={() => toggleWidget('notes')} className={`shrink-0 glass-panel px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-label-caps font-bold flex items-center gap-1.5 md:gap-2 transition-all duration-300 border ${isNotesEnabled ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-primary border-primary/20 hover:bg-primary/20'}`}>
                    <span className="material-symbols-outlined text-[12px] md:text-sm">description</span> Notes
                  </button>
                  <button onClick={() => toggleWidget('planner')} className={`shrink-0 glass-panel px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-label-caps font-bold flex items-center gap-1.5 md:gap-2 transition-all duration-300 border ${isPlannerEnabled ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-primary border-primary/20 hover:bg-primary/20'}`}>
                    <span className="material-symbols-outlined text-[12px] md:text-sm">calendar_month</span> Planner
                  </button>
                  <button onClick={() => toggleWidget('stats')} className={`shrink-0 glass-panel px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-label-caps font-bold flex items-center gap-1.5 md:gap-2 transition-all duration-300 border ${isStatsEnabled ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-primary border-primary/20 hover:bg-primary/20'}`}>
                    <span className="material-symbols-outlined text-[12px] md:text-sm">monitoring</span> Stats
                  </button>
                </div>
              </div>
            </div>

            <button onClick={() => { setIsEditingCover(true); setNewCoverUrl(activePage?.cover || ''); }} className="absolute top-2 right-2 md:top-4 md:right-4 glass-panel text-on-surface-variant hover:text-primary px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs md:opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 md:gap-2 z-20"><span className="material-symbols-outlined text-[12px] md:text-sm">edit</span> Edit Cover</button>
            <button onClick={handleDeletePage} className="absolute bottom-2 right-2 md:bottom-8 md:right-8 glass-panel text-error/60 hover:text-error hover:border-error/40 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs md:opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 md:gap-2"><span className="material-symbols-outlined text-[12px] md:text-sm">delete</span> Delete Page</button>
          </section>

          {/* ================= REVISI FINANCE & LEDGER ================= */}
          {isBusinessEnabled && (
            <section className="space-y-4 md:space-y-6 animate-entrance stagger-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="material-symbols-outlined text-finance-accent finance-card-pulse rounded-full p-1 hidden sm:block">payments</span>
                  <input type="text" value={subtitles[`bus_${activePageId}`] || 'Buku Keuangan Utama'} onChange={(e) => setSubtitles({ ...subtitles, [`bus_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none font-section-title text-lg md:text-section-title text-on-surface w-full p-0 focus:ring-0" />
                </div>
                <div className="glass-panel px-3 py-1.5 md:px-4 md:py-1 rounded-lg text-[10px] md:text-label-caps font-bold flex items-center gap-2 md:gap-3 border-finance-accent/20 w-fit">
                  <span className="text-on-surface-variant">Kurs 1 DL:</span>
                  <span className="text-finance-accent font-bold flex items-center">Rp <input type="number" value={dlRate} onChange={(e) => setDlRate(e.target.value)} className="bg-transparent w-14 md:w-16 ml-1 p-0 border-none focus:ring-0 text-finance-accent outline-none" /></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-gutter">
                <div className="glass-panel finance-card-pulse p-4 md:p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500"><span className="material-symbols-outlined text-6xl md:text-8xl text-finance-accent">account_balance</span></div>
                  <p className="text-[10px] md:text-label-caps font-bold text-on-surface-variant mb-1 md:mb-2">TOTAL NET WORTH</p>
                  <h5 className={`text-xl md:text-headline-lg font-bold font-data-mono ${totalKekayaanIDR >= 0 ? 'text-finance-accent' : 'text-error'}`}>{formatIDR(totalKekayaanIDR)}</h5>
                  <div className="mt-2 md:mt-4 flex items-center gap-1 md:gap-2 text-finance-accent"><span className="material-symbols-outlined text-xs md:text-sm animate-pulse">trending_up</span><span className="text-[10px] md:text-body-sm font-bold">Active & Growing</span></div>
                </div>

                <div className="glass-panel finance-card-pulse p-4 md:p-6 rounded-xl relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl md:text-8xl text-on-surface">savings</span></div>
                  <p className="text-[10px] md:text-label-caps font-bold text-on-surface-variant mb-1 md:mb-2">DOMPET TABUNGAN</p>
                  <h5 className={`text-xl md:text-headline-lg font-bold font-data-mono ${tabunganBalance >= 0 ? 'text-finance-accent' : 'text-error'}`}>{formatIDR(tabunganBalance)}</h5>
                  <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2 md:gap-4 border-t border-border-glass pt-2 md:pt-4">
                      <div><p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase">Keluar</p><p className="text-error font-data-mono text-xs md:text-sm">{formatIDR(tabunganOut)}</p></div>
                      <div className="text-right"><p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase">Masuk</p><p className="text-finance-accent font-data-mono text-xs md:text-sm">{formatIDR(tabunganIn)}</p></div>
                  </div>
                </div>

                <div className="glass-panel finance-card-pulse p-4 md:p-6 rounded-xl relative group sm:col-span-2 md:col-span-1 border-r-4 border-finance-accent/30">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl md:text-8xl text-on-surface">sports_esports</span></div>
                  <p className="text-[10px] md:text-label-caps font-bold text-on-surface-variant mb-1 md:mb-2">PROFIT GROWTOPIA</p>
                  <h5 className={`text-xl md:text-headline-lg font-bold font-data-mono ${isGtProfit ? 'text-finance-accent' : 'text-error'}`}>{isGtProfit ? '+' : ''}{gtNetDL.toFixed(2)} DL</h5>
                  <p className="text-[10px] md:text-body-sm font-bold text-on-surface-variant mt-1">≈ {formatIDR(gtNetIDR)}</p>
                  <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2 md:gap-4 text-[9px] md:text-[10px] uppercase text-on-surface-variant border-t border-border-glass pt-2 md:pt-4">
                      <span className="">Modal: <span className="text-error">{gtModalDL.toFixed(2)} DL</span></span>
                      <span className="text-right">Omset: <span className="text-finance-accent">{gtOmsetDL.toFixed(2)} DL</span></span>
                  </div>
                </div>
              </div>

              <div className="glass-panel finance-card-pulse p-4 md:p-8 rounded-xl h-[300px] md:h-[400px] flex flex-col group">
                <div className="flex justify-between items-center mb-4 md:mb-8">
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-finance-accent text-lg md:text-xl">show_chart</span><h5 className="text-sm md:text-body-base font-bold text-on-surface">Trend Kekayaan (Trading Style)</h5></div>
                </div>
                <div className="flex-1 w-full relative"><canvas ref={financeChartRef}></canvas></div>
              </div>

              <div className="glass-panel p-4 md:p-6 rounded-xl shadow-xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
                    <h3 className="text-sm md:text-body-base font-bold text-on-surface">Riwayat Transaksi</h3>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button onClick={() => {setIsAddingTx(!isAddingTx); setIsTransferring(false);}} className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2 transition-all ${isAddingTx ? 'bg-error text-white shadow-lg' : 'bg-primary text-on-primary hover:bg-primary-dim hover:shadow-[0_0_15px_rgba(122,230,255,0.4)]'}`}>
                            <span className="material-symbols-outlined text-[14px] md:text-sm">{isAddingTx ? 'close' : 'add'}</span> <span className="hidden sm:inline">{isAddingTx ? 'Batal Tambah' : 'Transaksi Biasa'}</span><span className="sm:hidden">{isAddingTx ? 'Batal' : 'Transaksi Baru'}</span>
                        </button>
                        <button onClick={() => {setIsTransferring(!isTransferring); setIsAddingTx(false);}} className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2 transition-all ${isTransferring ? 'bg-error text-white shadow-lg' : 'bg-finance-accent text-white hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}>
                            <span className="material-symbols-outlined text-[14px] md:text-sm">{isTransferring ? 'close' : 'swap_horiz'}</span> <span className="hidden sm:inline">{isTransferring ? 'Batal Trading' : 'Trading Aset / Transfer'}</span><span className="sm:hidden">{isTransferring ? 'Batal' : 'Trading Aset'}</span>
                        </button>
                    </div>
                  </div>

                  {/* FORM TRADING / TRANSFER DUA ARAH */}
                  {isTransferring && (
                    <div className="p-4 md:p-6 mb-6 bg-finance-accent/10 border border-finance-accent/50 rounded-xl animate-entrance">
                       <h4 className="text-finance-accent text-sm md:text-base font-bold mb-3 md:mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-lg">swap_horiz</span> Konversi Aset Terpadu</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-end">
                          <div className="sm:col-span-2 md:col-span-3">
                             <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Aksi Konversi</label>
                             <select value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)} className="w-full bg-surface-deep border border-border-glass rounded-lg px-3 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-finance-accent transition-colors">
                                <option value="TABUNGAN_TO_GT">Beli Aset (TBNG ➡️ GT)</option>
                                <option value="GT_TO_TABUNGAN">Jual Aset (GT ➡️ TBNG)</option>
                             </select>
                          </div>
                          <div className="md:col-span-2">
                             <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Tanggal</label>
                             <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="w-full bg-surface-deep border border-border-glass rounded-lg px-2 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-finance-accent transition-colors" />
                          </div>
                          <div className="sm:col-span-2 md:col-span-3">
                             <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Jumlah (Rupiah)</label>
                             <div className="flex">
                                <div className="bg-surface-bright border border-border-glass border-r-0 rounded-l-lg px-2 md:px-3 py-2 md:py-2.5 text-on-surface text-xs md:text-sm font-bold flex items-center">Rp</div>
                                <input type="number" value={transferAmountIDR} onChange={(e) => setTransferAmountIDR(e.target.value)} placeholder="0" className="w-full bg-surface-deep border border-border-glass rounded-r-lg px-3 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-finance-accent border-l-0 transition-colors" />
                             </div>
                             {transferAmountIDR && <p className="text-[10px] md:text-xs text-finance-accent mt-1 font-bold">≈ {(parseFloat(transferAmountIDR) / dlRate).toFixed(2)} DL</p>}
                          </div>
                          <div className="md:col-span-2">
                             <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Keterangan</label>
                             <input type="text" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Opsional..." className="w-full bg-surface-deep border border-border-glass rounded-lg px-3 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-finance-accent transition-colors" />
                          </div>
                          <div className="sm:col-span-2 md:col-span-2 mt-2 md:mt-0">
                             <button onClick={handleTransferAction} className="w-full bg-finance-accent hover:bg-emerald-400 text-white px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] md:h-[42px]">Eksekusi</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* FORM TAMBAH TRANSAKSI BIASA */}
                  {isAddingTx && (
                    <div className="p-4 md:p-6 mb-6 bg-primary/10 border border-primary/50 rounded-xl animate-entrance">
                      <div className="flex gap-2 mb-4 bg-surface-deep p-1 rounded-lg w-fit border border-border-glass">
                          <button onClick={() => handleTxCategoryToggle('TABUNGAN')} className={`px-3 py-1.5 md:px-4 md:py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${txCategory === 'TABUNGAN' ? 'bg-finance-accent text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>🏦 Tabungan</button>
                          <button onClick={() => handleTxCategoryToggle('GT')} className={`px-3 py-1.5 md:px-4 md:py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${txCategory === 'GT' ? 'bg-purple-500 text-white' : 'text-on-surface-variant hover:text-on-surface'}`}>🎮 Growtopia</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-end">
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Deskripsi Transaksi</label>
                          <input type="text" autoFocus value={newTxDesc} onChange={(e) => setNewTxDesc(e.target.value)} placeholder="Rincian..." className="w-full bg-surface-deep border border-border-glass rounded-lg px-3 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-primary transition-colors" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Tanggal</label>
                          <input type="date" value={newTxDate} onChange={(e) => setNewTxDate(e.target.value)} className="w-full bg-surface-deep border border-border-glass rounded-lg px-2 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-primary transition-colors" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Tipe</label>
                          <select value={newTxType} onChange={(e) => setNewTxType(e.target.value)} className="w-full bg-surface-deep border border-border-glass rounded-lg px-3 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-primary transition-colors">
                            <option value="pengeluaran">Keluar (-)</option>
                            <option value="pemasukan">Masuk (+)</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-[10px] md:text-[11px] font-bold text-on-surface-variant mb-1 md:mb-1.5 uppercase tracking-wider">Jml & Mata Uang</label>
                          <div className="flex">
                            <input type="number" value={newTxAmount} onChange={(e) => setNewTxAmount(e.target.value)} placeholder="0" className="w-full bg-surface-deep border border-border-glass rounded-l-lg px-3 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-primary border-r-0 transition-colors" />
                            {txCategory === 'GT' ? (
                                <select value={newTxCurrency} onChange={(e) => setNewTxCurrency(e.target.value)} className="bg-surface-bright border border-border-glass border-l-0 rounded-r-lg px-2 py-2 md:py-2.5 outline-none text-on-surface text-xs md:text-sm focus:border-primary">
                                    <option value="WL">WL</option>
                                    <option value="DL">DL</option>
                                    <option value="BGL">BGL</option>
                                </select>
                            ) : (
                                <div className="bg-surface-bright border border-border-glass border-l-0 rounded-r-lg px-3 py-2 md:py-2.5 text-finance-accent text-xs md:text-sm font-bold flex items-center">IDR</div>
                            )}
                          </div>
                        </div>
                        <div className="sm:col-span-2 md:col-span-2 mt-2 md:mt-0">
                          <button onClick={handleAddTransaction} className="w-full bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all shadow-[0_0_15px_rgba(122,230,255,0.2)] hover:shadow-[0_0_20px_rgba(122,230,255,0.5)] md:h-[42px]">Simpan</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DAFTAR TRANSAKSI DENGAN INLINE EDIT DATE */}
                  <div className="space-y-3 mt-4 md:mt-6">
                    {(transactions||[]).map((t) => {
                      const isTabungan = t.currency_type === 'TABUNGAN' || t.currency_type === 'IDR';
                      const isMasuk = t.type === 'pemasukan';
                      
                      return (
                      <div key={t.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 bg-surface-deep/30 hover:bg-primary/5 rounded-xl border border-border-glass transition-colors group gap-2">
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className={`p-2 md:p-3 rounded-lg flex items-center justify-center shrink-0 border ${isMasuk ? 'bg-finance-accent/10 text-finance-accent border-finance-accent/30' : 'bg-error/10 text-error border-error/30'}`}>
                                <span className="material-symbols-outlined text-sm md:text-base">{isMasuk ? 'arrow_downward' : 'arrow_upward'}</span>
                            </div>
                            <div>
                                <p className="text-on-surface text-xs md:text-body-sm font-bold">{t.description}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-2">
                                    {editingTxId === t.id ? (
                                        <input type="date" autoFocus value={editTxDate} onChange={(e) => setEditTxDate(e.target.value)} onBlur={() => handleUpdateTxDate(t.id, editTxDate)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateTxDate(t.id, editTxDate)} className="text-[10px] md:text-[11px] font-medium px-2 py-0.5 rounded bg-surface-container border border-primary text-on-surface outline-none" />
                                    ) : (
                                        <span onClick={() => { setEditingTxId(t.id); setEditTxDate(t.date); }} className="text-[10px] md:text-[11px] font-medium px-2 py-0.5 rounded border border-border-glass text-on-surface-variant cursor-pointer hover:border-primary hover:text-on-surface transition-colors flex items-center gap-1" title="Klik untuk ubah tanggal">{t.date} <span className="material-symbols-outlined text-[10px]">edit</span></span>
                                    )}
                                    {isTabungan ? (
                                        <span className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded uppercase bg-finance-accent/20 text-finance-accent border border-finance-accent/30">Dompet Tabungan</span>
                                    ) : (
                                        <span className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Growtopia</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pl-11 md:pl-0">
                          <div className="text-left sm:text-right">
                             <span className={`font-data-mono text-base md:text-lg font-bold ${isMasuk ? 'text-finance-accent' : 'text-error'}`}>
                                {isMasuk ? '+' : '-'}{isTabungan ? formatIDR(t.amount) : `${t.amount} ${t.currency_type}`}
                             </span>
                             {(!isTabungan) && (
                                <p className="text-[9px] md:text-[10px] text-on-surface-variant font-bold mt-0.5 md:mt-1">
                                    ≈ {formatIDR((t.currency_type === 'BGL' ? t.amount * 100 : (t.currency_type === 'WL' ? t.amount / 100 : t.amount)) * dlRate)}
                                </p>
                             )}
                          </div>
                          <button onClick={() => deleteTransaction(t.id)} className="text-error/60 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 md:p-2 hover:bg-error/20 hover:text-error rounded-lg shrink-0"><span className="material-symbols-outlined text-[16px] md:text-sm">delete</span></button>
                        </div>
                      </div>
                    )})}
                    {(transactions||[]).length === 0 && <div className="py-8 md:py-10 text-center border-2 border-dashed border-border-glass rounded-xl"><p className="text-xs md:text-sm font-medium text-on-surface-variant">Belum ada riwayat keuangan tercatat.</p></div>}
                  </div>
              </div>
            </section>
          )}

          {/* ================= PLANNER ================= */}
          {isPlannerEnabled && (
            <section className="space-y-4 md:space-y-6 animate-entrance stagger-3 mt-8 md:mt-12">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <h4 className="font-section-title text-lg md:text-section-title text-on-surface">Daily & Monthly Planner</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-gutter">
                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                    {/* KALENDER */}
                    <div className="glass-panel p-4 md:p-6 rounded-xl border-t-2 border-primary/20 overflow-x-auto custom-scrollbar">
                      <div className="flex justify-between items-center mb-4 md:mb-6 min-w-[300px]">
                        <h5 className="text-sm md:text-body-base font-bold text-on-surface">{format(currentMonth, 'MMMM yyyy')}</h5>
                        <div className="flex gap-1 md:gap-2">
                          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-primary/10 hover:text-primary rounded transition-all duration-300"><span className="material-symbols-outlined text-xs md:text-sm">chevron_left</span></button>
                          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-primary/10 hover:text-primary rounded transition-all duration-300"><span className="material-symbols-outlined text-xs md:text-sm">chevron_right</span></button>
                        </div>
                      </div>
                      
                      <div className="min-w-[300px]">
                          <div className="grid grid-cols-7 border-t border-l border-border-glass">
                            {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => (
                                <div key={day} className="p-1 md:p-2 text-center text-[9px] md:text-label-caps font-bold text-on-surface-variant border-r border-b border-border-glass bg-surface-deep/30">{day}</div>
                            ))}
                          </div>
                          {renderCalendar()}
                      </div>
                    </div>

                    {/* TARGET BULANAN (FITUR BARU) */}
                    <div className="glass-panel p-4 md:p-6 rounded-xl border-t-4 border-finance-accent">
                        <h3 className="text-sm md:text-body-base font-bold text-on-surface mb-3 md:mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-finance-accent">emoji_events</span>
                            Target Bulanan: {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <div className="space-y-2 mb-4">
                            {monthlyTodos.map(task => (
                                <div key={task.id} className="flex items-start justify-between p-2 hover:bg-primary/5 rounded group border border-transparent hover:border-border-glass">
                                <div className="flex items-start gap-2 md:gap-3 cursor-pointer flex-1" onClick={() => toggleBlock(task.id, task.is_completed)}>
                                    <div className={`mt-0.5 ${task.is_completed ? 'text-finance-accent' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-[14px] md:text-[16px]">{task.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                                    <span className={`text-xs md:text-body-sm ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.content}</span>
                                </div>
                                <button onClick={() => deleteBlock(task.id)} className="text-error/50 md:opacity-0 group-hover:opacity-100 p-1 hover:text-error"><span className="material-symbols-outlined text-[12px] md:text-[14px]">delete</span></button>
                                </div>
                            ))}
                            <input type="text" value={newMonthlyTodo} onChange={(e) => setNewMonthlyTodo(e.target.value)} onKeyDown={(e) => handleAddCustomBlockEnter(e, `monthly_todo_${monthKey}`, newMonthlyTodo, setNewMonthlyTodo)} className="w-full bg-transparent border-0 border-b border-border-glass focus:ring-0 focus:border-finance-accent text-xs md:text-sm p-1 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none" placeholder="+ Tambah target bulan ini..." />
                        </div>
                        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border-glass">
                            <h4 className="text-[10px] md:text-xs font-bold text-on-surface-variant mb-2">Catatan Bulan Ini</h4>
                            {monthlyNotes.map(note => (
                                <div key={note.id} className="relative group mb-2">
                                    <textarea className="w-full bg-surface-deep/30 border border-finance-accent/30 rounded-xl p-2 md:p-3 text-xs md:text-sm text-on-surface transition-all focus:min-h-[100px] min-h-[60px] outline-none focus:border-finance-accent custom-scrollbar" defaultValue={note.content} onBlur={(e) => handleUpdateBlockContent(note.id, e.target.value)} />
                                    <button onClick={() => deleteBlock(note.id)} className="absolute top-1 right-1 text-error md:opacity-0 group-hover:opacity-100 p-1 hover:bg-error/20 rounded bg-surface-container"><span className="material-symbols-outlined text-[10px] md:text-xs">delete</span></button>
                                </div>
                            ))}
                            {monthlyNotes.length === 0 && (
                                <div onClick={() => handleAddCustomBlockClick(`monthly_note_${monthKey}`, 'Catatan bulan ini...')} className="w-full h-12 md:h-16 bg-surface-deep/30 rounded-xl border border-dashed border-finance-accent/30 flex items-center justify-center cursor-pointer hover:bg-finance-accent/10 transition-all group">
                                    <span className="text-[9px] md:text-[10px] text-on-surface-variant group-hover:text-finance-accent uppercase">+ Klik untuk tambah catatan bulan ini</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-4 space-y-4">
                  <div className="glass-panel p-4 md:p-5 rounded-xl border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <span className="material-symbols-outlined text-primary text-sm">check_box</span>
                      <h6 className="text-sm md:text-body-sm font-bold text-on-surface">Tasks for {format(selectedDate, 'MMM d, yyyy')}</h6>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {(dailyTasks||[]).map(task => (
                         <div key={task.id} className="flex items-start justify-between p-1.5 md:p-2 hover:bg-primary/5 rounded group transition-colors border border-transparent hover:border-border-glass">
                           <div className="flex items-start gap-2 md:gap-3 cursor-pointer flex-1" onClick={() => toggleDailyTask(task.id, task.is_completed)}>
                             <div className={`mt-0.5 ${task.is_completed ? 'text-finance-accent' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-[14px] md:text-[16px]">{task.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                             <span className={`text-xs md:text-body-sm ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.task_name}</span>
                           </div>
                           <button onClick={() => deleteDailyTask(task.id)} className="text-error/50 md:opacity-0 group-hover:opacity-100 p-1 hover:text-error"><span className="material-symbols-outlined text-[12px] md:text-[14px]">delete</span></button>
                         </div>
                      ))}
                      <input type="text" value={newDailyTaskName} onChange={(e) => setNewDailyTaskName(e.target.value)} onKeyDown={handleAddDailyTask} className="w-full bg-transparent border-0 border-b border-border-glass focus:ring-0 focus:border-primary text-xs md:text-sm p-1 text-on-surface placeholder:text-on-surface-variant/40 transition-all duration-300 mt-2 outline-none" placeholder="+ Tambah jadwal harian..." />
                      
                      <div className="pt-4 md:pt-6 space-y-2 border-t border-border-glass mt-3 md:mt-4">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-on-surface-variant"><span className="material-symbols-outlined text-[12px] md:text-sm text-primary">description</span> Detail Quest Harian</div>
                        {dailyNoteBlocks.map(note => (
                            <div key={note.id} className="relative group">
                                <textarea className="w-full bg-surface-deep/30 border border-primary/30 rounded-xl p-2 md:p-3 text-xs md:text-sm text-on-surface transition-all duration-300 focus:min-h-[100px] md:focus:min-h-[150px] min-h-[60px] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:border-primary custom-scrollbar" defaultValue={note.content} onBlur={(e) => handleUpdateBlockContent(note.id, e.target.value)} />
                                <button onClick={() => deleteBlock(note.id)} className="absolute top-1 right-1 md:top-2 md:right-2 text-error md:opacity-0 group-hover:opacity-100 p-1 hover:bg-error/20 rounded bg-surface-container"><span className="material-symbols-outlined text-[10px] md:text-xs">delete</span></button>
                            </div>
                        ))}
                        {dailyNoteBlocks.length === 0 && (
                            <div onClick={() => handleAddCustomBlockClick(`daily_note_${currentDateStr}`, 'Catatan harian baru...')} className="w-full h-16 md:h-24 bg-surface-deep/30 rounded-xl border border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_15px_rgba(122,230,255,0.1)] transition-all duration-300 group">
                                <span className="text-[9px] md:text-[10px] text-on-surface-variant group-hover:text-primary uppercase">+ Klik untuk rincian note hari ini</span>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {isStatsEnabled && (
            <section className="space-y-4 md:space-y-6 animate-entrance stagger-4 mt-8 md:mt-12">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="material-symbols-outlined text-primary">monitoring</span>
                <input type="text" value={subtitles[`st_${activePageId}`] || 'Dashboard Produktivitas'} onChange={(e) => setSubtitles({ ...subtitles, [`st_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none font-section-title text-lg md:text-section-title text-on-surface w-full p-0 focus:ring-0" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="glass-panel p-4 md:p-5 rounded-xl border-b-2 border-primary/40"><p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 md:mb-2">CHECKLIST SELESAI</p><h6 className="text-2xl md:text-3xl font-bold font-headline-lg text-primary">{blocksPercent}%</h6></div>
                <div className="glass-panel p-4 md:p-5 rounded-xl border-b-2 border-primary/40"><p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 md:mb-2">HARI INI</p><h6 className="text-2xl md:text-3xl font-bold font-headline-lg text-primary">{dailyPercent}%</h6></div>
                <div className="glass-panel p-4 md:p-5 rounded-xl border-b-2 border-primary/40"><p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 md:mb-2">MINGGU INI</p><h6 className="text-2xl md:text-3xl font-bold font-headline-lg text-primary">{weeklyPercent}%</h6></div>
                <div className="glass-panel p-4 md:p-5 rounded-xl border-b-2 border-primary/40"><p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 md:mb-2">TAHUN INI</p><h6 className="text-2xl md:text-3xl font-bold font-headline-lg text-primary">{yearlyPercent}%</h6></div>
              </div>
              <div className="glass-panel p-4 md:p-8 rounded-xl border border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-6 md:mb-10">
                  <h5 className="text-sm md:text-body-base font-bold text-on-surface">Analisis Produktivitas Mendalam</h5>
                  <div className="flex flex-wrap bg-surface-deep/50 p-1 rounded-lg border border-border-glass gap-1">
                    {['harian', 'mingguan', 'bulanan', 'tahunan', 'keseluruhan'].map((tab) => (<button key={tab} onClick={() => setStatsView(tab)} className={`px-2 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-bold rounded capitalize transition-all duration-300 ${statsView === tab ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'}`}>{tab}</button>))}
                  </div>
                </div>
                <div className="relative h-[250px] md:h-[300px] w-full overflow-x-auto"><canvas ref={chartRef}></canvas></div>
              </div>
            </section>
          )}

          {/* ================= BENTO GRID (TARGETS & NOTES) ================= */}
          {(isTodosEnabled || isNotesEnabled) && (
            <div className={`grid grid-cols-1 ${isTodosEnabled && isNotesEnabled ? 'lg:grid-cols-12' : ''} gap-6 md:gap-gutter animate-entrance stagger-4 mt-8 md:mt-12`}>
              
              {isTodosEnabled && (
                <div className={`${isNotesEnabled ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
                   <div className="glass-panel p-4 md:p-6 rounded-xl border border-primary/10 group h-full">
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 md:mb-6">
                        <h5 className="text-lg md:text-section-title font-section-title flex items-center gap-2 text-on-surface">
                           <span className="material-symbols-outlined text-primary group-hover:rotate-12 transition-transform duration-300">event_note</span> Targets & Content
                        </h5>
                        {isAddingGroup ? (
                            <div className="flex gap-1 md:gap-2 w-full sm:w-auto"><input type="text" autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTargetGroup()} placeholder="Nama Target Plan..." className="bg-surface-deep border border-primary/50 rounded px-2 py-1 text-xs outline-none text-on-surface flex-1" /><button onClick={handleAddTargetGroup} className="bg-primary text-on-primary px-2 py-1 rounded text-xs font-bold">OK</button><button onClick={() => setIsAddingGroup(false)} className="text-on-surface-variant text-xs px-1 hover:text-error"><span className="material-symbols-outlined text-[14px]">close</span></button></div>
                        ) : (
                            <button onClick={() => setIsAddingGroup(true)} className="text-primary text-xs md:text-sm font-bold flex items-center gap-1 hover:underline transition-all duration-300 w-fit"><span className="material-symbols-outlined text-[12px] md:text-sm">add</span> Add Group</button>
                        )}
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1.5 md:space-y-2 mb-6 md:mb-8">
                           <div className="flex justify-between text-xs md:text-body-sm font-bold md:font-body-sm text-on-surface"><span>Overall Progress</span><span className="text-primary font-bold">{blocksPercent}%</span></div>
                           <div className="h-1.5 md:h-2 w-full bg-surface-deep rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-primary-dim rounded-full shadow-[0_0_15px_rgba(122,230,255,0.6)] transition-all duration-1000" style={{ width: `${blocksPercent}%` }}></div></div>
                        </div>

                        {currentPageGroups.map((groupType) => {
                            const groupBlocks = (blocks || []).filter(b => b.type === groupType);
                            const currentTitleKey = `title_${groupType}_${activePageId}`;
                            return (
                                <div key={groupType} className="mb-4 md:mb-6 relative group/section">
                                    <div className="flex items-center justify-between mb-2 md:mb-3 border-b border-border-glass pb-1">
                                        <input type="text" value={subtitles[currentTitleKey] || (groupType === 'todo' ? 'Target Utama' : 'Target Content')} onChange={(e) => setSubtitles({ ...subtitles, [currentTitleKey]: e.target.value })} className="bg-transparent border-none outline-none text-sm md:text-[15px] font-bold text-primary w-3/4 focus:bg-primary/10 rounded px-1 transition-colors" />
                                        {groupType !== 'todo' && (<button onClick={() => handleDeleteTargetGroup(groupType)} className="text-error/50 md:opacity-0 group-hover/section:opacity-100 hover:text-error transition-opacity p-1"><span className="material-symbols-outlined text-[12px] md:text-sm">delete</span></button>)}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                        {groupBlocks.map((block) => (
                                            <div key={block.id} className={`p-2 md:p-3 rounded-lg border transition-all duration-300 cursor-pointer group flex items-start justify-between gap-2 ${block.is_completed ? 'bg-primary/5 border-primary/20 hover:border-primary/50' : 'bg-surface-container-low/50 border-border-glass hover:border-primary/50 hover:bg-surface-bright'}`}>
                                                <div className="flex items-start gap-2 md:gap-3 flex-1" onClick={() => toggleBlock(block.id, block.is_completed)}>
                                                    <div className={`w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 rounded border flex items-center justify-center transition-all duration-300 ${block.is_completed ? 'border-primary bg-primary/20 text-primary' : 'border-on-surface-variant group-hover:border-primary'}`}>
                                                        {block.is_completed && <span className="material-symbols-outlined text-[10px] md:text-[12px] font-bold">check</span>}
                                                    </div>
                                                    <span className={`text-xs md:text-sm ${block.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{block.content}</span>
                                                </div>
                                                <button onClick={() => deleteBlock(block.id)} className="text-error/50 md:opacity-0 group-hover:opacity-100 hover:text-error p-1"><span className="material-symbols-outlined text-[12px] md:text-[14px]">delete</span></button>
                                            </div>
                                        ))}
                                    </div>
                                    {activeGroupInput === groupType ? (
                                        <div className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 mt-2 bg-surface-deep/30 rounded border border-primary/30"><span className="material-symbols-outlined text-on-surface-variant text-[12px] md:text-sm">check_box_outline_blank</span><input type="text" autoFocus value={newBlockContent[groupType] || ''} onChange={(e) => setNewBlockContent({ ...newBlockContent, [groupType]: e.target.value })} onKeyDown={(e) => handleAddBlockInGroup(e, groupType)} onBlur={() => setActiveGroupInput(null)} placeholder="Ketik lalu Enter..." className="bg-transparent border-none outline-none text-on-surface w-full text-xs md:text-sm py-0.5 focus:ring-0" /></div>
                                    ) : (
                                        <div onClick={() => setActiveGroupInput(groupType)} className="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 mt-2 cursor-pointer text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors rounded w-fit"><span className="material-symbols-outlined text-[12px] md:text-[14px]">add</span> <span className="text-[10px] md:text-xs font-bold">New Item</span></div>
                                    )}
                                </div>
                            );
                        })}
                     </div>
                   </div>
                </div>
              )}

              {isNotesEnabled && (
                <div className={`${isTodosEnabled ? 'lg:col-span-5' : 'w-full'} space-y-6`}>
                   <div className="glass-panel p-4 md:p-6 rounded-xl flex flex-col h-full border border-primary/10 group">
                      <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h5 className="text-lg md:text-body-base font-bold flex items-center gap-2 text-on-surface">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform duration-300">description</span>
                            <input type="text" value={subtitles[`nt_${activePageId}`] || 'My Notes'} onChange={(e) => setSubtitles({ ...subtitles, [`nt_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none text-on-surface w-full p-0 focus:ring-0" />
                        </h5>
                        <button onClick={() => setIsAddingNote(!isAddingNote)} className="bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 md:px-3 rounded text-[10px] md:text-xs font-bold transition-all duration-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px] md:text-xs">{isAddingNote ? 'close' : 'add'}</span> {isAddingNote ? 'Batal' : 'Tambah Note'}
                        </button>
                      </div>

                      <div className="flex-1 space-y-3 md:space-y-4">
                        {isAddingNote && (
                            <div className="p-3 md:p-4 bg-surface-deep/30 border border-primary/40 rounded-xl space-y-3 md:space-y-4 relative overflow-hidden animate-entrance">
                                <textarea autoFocus value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 text-xs md:text-sm text-on-surface resize-none h-24 md:h-32 placeholder:text-on-surface-variant/40 custom-scrollbar outline-none" placeholder="Tulis catatan di sini..."></textarea>
                                <div className="flex justify-end gap-2 md:gap-3 items-center mt-2">
                                    <button onClick={() => setIsAddingNote(false)} className="text-[9px] md:text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors">Batal</button>
                                    <button onClick={handleAddNote} className="bg-primary text-on-primary px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-[0_0_15px_rgba(122,230,255,0.2)] hover:shadow-[0_0_20px_rgba(122,230,255,0.5)] transition-all">Simpan Note</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 md:space-y-3">
                            {noteBlocks.map((note) => (
                                <div key={note.id} className="p-3 md:p-4 bg-primary/5 rounded-xl border border-primary/10 hover:border-primary/40 transition-all duration-300 relative group/note">
                                    {editingNoteId === note.id ? (
                                        <div className="flex flex-col gap-2"><textarea autoFocus value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} className="w-full h-20 md:h-24 bg-surface-deep border border-primary rounded p-2 text-on-surface outline-none resize-none text-xs md:text-sm custom-scrollbar" /><div className="flex gap-2 justify-end"><button onClick={() => setEditingNoteId(null)} className="text-[10px] md:text-xs text-on-surface-variant px-2 py-1 hover:text-on-surface">Batal</button><button onClick={() => handleUpdateBlockContent(note.id, editNoteContent)} className="bg-primary text-on-primary text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded shadow-lg">Update</button></div></div>
                                    ) : (
                                        <>
                                            <p className="text-xs md:text-sm text-on-surface whitespace-pre-wrap leading-relaxed pr-8 md:pr-10">{note.content}</p>
                                            <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-0.5 md:gap-1 md:opacity-0 group-hover/note:opacity-100 transition-opacity bg-surface-deep/80 p-0.5 md:p-1 rounded backdrop-blur-sm">
                                                <button onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }} className="text-primary p-1 md:p-1.5 hover:bg-primary/20 rounded"><span className="material-symbols-outlined text-[12px] md:text-[14px]">edit</span></button>
                                                <button onClick={() => deleteBlock(note.id)} className="text-error p-1 md:p-1.5 hover:bg-error/20 rounded"><span className="material-symbols-outlined text-[12px] md:text-[14px]">delete</span></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {noteBlocks.length === 0 && !isAddingNote && <div className="text-center py-6 md:py-8 opacity-50"><span className="material-symbols-outlined text-3xl md:text-4xl mb-1 md:mb-2">note_stack</span><p className="text-xs md:text-sm font-bold">Belum ada catatan.</p></div>}
                        </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;