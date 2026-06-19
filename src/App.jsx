import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Chart from 'chart.js/auto';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getYear, getMonth, subDays } from 'date-fns';
import { FaCheckSquare, FaPlus, FaCog, FaChevronRight, FaChevronLeft, FaRegSquare, FaTrash, FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';

function App() {
  // ================= DETEKSI MOBILE VS DESKTOP =================
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // INJEKSI FONT GLOBAL (Berlaku untuk Mobile & Desktop)
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;600;700;800&family=Atkinson+Hyperlegible+Next:wght@400;700&family=Anybody:wght@600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const setMobileWidgetOnly = (widgetName) => {
    setPageWidgets(prev => ({ ...prev, [activePageId]: [widgetName] }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      labels = ['Target & Checklist', 'Daily Tasks'];
      chartData = [blocksPercent, calcPercent(allPageTasks)]; barColor = '#00c8f9';
    }
    const myChart = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: `Progres (%)`, data: chartData, backgroundColor: chartData.map(val => val === 100 ? '#10b981' : barColor), borderRadius: 4, barThickness: window.innerWidth < 768 ? 12 : 24 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(122,230,255,0.1)' }, ticks: { color: '#879396', callback: (value) => value + '%' } }, x: { grid: { display: false }, ticks: { color: '#879396', maxRotation: 45, minRotation: 45} } }, plugins: { legend: { display: false } } }
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

  const fetchPages = async () => { const { data } = await supabase.from('pages').select('*').order('created_at', { ascending: true }); setPages(data || []); if (!activePageId && data && data.length > 0) setActivePageId(data[0].id); };
  const fetchBlocks = async (pageId) => { const { data } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('created_at', { ascending: true }); setBlocks(data || []); };
  const fetchTransactions = async (pageId) => { const { data } = await supabase.from('growtopia_transactions').select('*').eq('page_id', pageId).order('id', { ascending: false }); setTransactions(data || []); };
  
  useEffect(() => { if (activePageId) { fetchTasksData(selectedDate, activePage?.pillar || ''); fetchBlocks(activePageId); fetchTransactions(activePageId); } }, [activePageId, selectedDate, currentMonth]);
  useEffect(() => { const fetchInitialData = async () => { setLoading(true); await fetchPages(); setLoading(false); }; fetchInitialData(); }, []);

  const handleSyncData = async () => {
    setIsSyncing(true);
    await fetchPages();
    if (activePageId) { await fetchTasksData(selectedDate, activePage?.pillar || ''); await fetchBlocks(activePageId); await fetchTransactions(activePageId); }
    setTimeout(() => setIsSyncing(false), 800); 
  };

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
  const handleDeleteTargetGroup = (groupType) => { if (window.confirm('Hapus list ini?')) { const groupBlocks = (blocks || []).filter(b => b.type === groupType); groupBlocks.forEach(async (b) => await supabase.from('blocks').delete().eq('id', b.id)); setTargetGroups({ ...targetGroups, [activePageId]: currentPageGroups.filter(g => g !== groupType) }); fetchBlocks(activePageId); } };

  const handleTxCategoryToggle = (category) => { setTxCategory(category); if (category === 'TABUNGAN') setNewTxCurrency('TABUNGAN'); else setNewTxCurrency('DL'); };
  const handleAddTransaction = async () => { if (newTxDesc.trim() === '' || newTxAmount === '') { alert("Isi form!"); return; } const finalCurrency = txCategory === 'TABUNGAN' ? 'TABUNGAN' : newTxCurrency; await supabase.from('growtopia_transactions').insert([{ description: newTxDesc, amount: parseFloat(newTxAmount), type: newTxType, currency_type: finalCurrency, date: newTxDate || todayISOStr, page_id: activePageId }]); setNewTxDesc(''); setNewTxAmount(''); setIsAddingTx(false); setNewTxDate(todayISOStr); fetchTransactions(activePageId); };
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

  // ================= LOGIKA AUTO-MERGE PILLARS (FIX BUG DATA HILANG) =================
  const [localPillars, setLocalPillars] = useState(() => { try { return JSON.parse(localStorage.getItem('custom_pillars')) || ["Study", "Sport", "Business"]; } catch(e) { return ["Study"]; } });
  
  // Gabungin pillar dari LocalStorage & dari Database Supabase secara otomatis
  const pillars = Array.from(new Set([
      ...localPillars,
      ...(pages||[]).map(p => p.pillar).filter(Boolean)
  ]));

  const [isAddingPillar, setIsAddingPillar] = useState(false); const [newPillarName, setNewPillarName] = useState('');
  const confirmAddPillar = () => { if (newPillarName.trim() !== '') { const updated = [...(localPillars||[]), newPillarName.trim()]; setLocalPillars(updated); localStorage.setItem('custom_pillars', JSON.stringify(updated)); setNewPillarName(''); } setIsAddingPillar(false); };
  const handleDeletePillar = (pillarToDelete) => { if(window.confirm(`Hapus pillar ini dari menu? (Pagenya nggak bakal kehapus dari database)`)) { const updated = (localPillars||[]).filter(p => p !== pillarToDelete); setLocalPillars(updated); localStorage.setItem('custom_pillars', JSON.stringify(updated)); } };

  const handleUpdateCover = async () => { if (newCoverUrl.trim() !== '' && activePageId) { await supabase.from('pages').update({ cover: newCoverUrl }).eq('id', activePageId); setPages(pages.map(p => p.id === activePageId ? { ...p, cover: newCoverUrl } : p)); } setIsEditingCover(false); setNewCoverUrl(''); };
  const handleUpdateIcon = async () => { if (newIconVal.trim() !== '' && activePageId) { await supabase.from('pages').update({ icon: newIconVal }).eq('id', activePageId); setPages(pages.map(p => p.id === activePageId ? { ...p, icon: newIconVal } : p)); } setIsEditingIcon(false); setNewIconVal(''); };
  const handleUpdateTitle = async (newTitle) => { if(newTitle.trim() === '' || !activePageId) return; await supabase.from('pages').update({ title: newTitle }).eq('id', activePageId); setPages(pages.map(p => p.id === activePageId ? { ...p, title: newTitle } : p)); };
  const handleAddPage = async (e, pillar) => { if (e.key === 'Enter' && newPageTitle.trim() !== '') { const { data } = await supabase.from('pages').insert([{ title: newPageTitle, pillar: pillar, icon: '📄' }]).select(); setNewPageTitle(''); setAddingPageUnder(null); if (data) { setPages([...pages, data[0]]); setActivePageId(data[0].id); } } };
  const handleDeletePage = async () => { if (activePageId && window.confirm("Hapus page?")) { await supabase.from('pages').delete().eq('id', activePageId); setPages(pages.filter(p => p.id !== activePageId)); setActivePageId(pages[0]?.id || null); } };

  if (loading) return <div className="min-h-screen bg-[#000b14] flex items-center justify-center text-[#7ae6ff] font-sans">System Booting...</div>;

  const defaultCover = "https://media3.giphy.com/media/LUIvcbR6yytz2/giphy.gif";
  const defaultIcon = "https://media1.giphy.com/media/VbKLoZ51gBqA0n2K03/giphy.gif";
  const isEmblemUrl = activePage?.icon?.startsWith('http') || activePage?.icon?.startsWith('data:image');
  const monthlyTodos = (blocks || []).filter(b => b.type === `monthly_todo_${monthKey}`);
  const monthlyNotes = (blocks || []).filter(b => b.type === `monthly_note_${monthKey}`);

  const renderCalendarMobile = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelectedDay = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const dayTasks = (allPageTasks || []).filter(t => t.task_date === format(cloneDay, 'yyyy-MM-dd'));
        const allDone = dayTasks.length > 0 && dayTasks.every(t => t.is_completed);
        const hasTasks = dayTasks.length > 0;
        
        days.push(
          <div
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
            className={`p-2 border-r border-b border-[#7ae6ff]/15 flex flex-col items-center justify-center cursor-pointer transition-colors ${!isCurrentMonth ? 'text-[#3d494c] bg-[#000b14]/30' : isSelectedDay ? 'bg-[#dff8ff] text-[#00363f] font-bold shadow-[0_0_15px_rgba(122,230,255,0.4)]' : isToday ? 'bg-[#7ae6ff]/20 text-[#7ae6ff] font-bold' : 'text-[#b9eaff] hover:bg-[#7ae6ff]/10'}`}
          >
            <span className="text-xs">{formattedDate}</span>
            <div className="flex gap-0.5 mt-1">
               {hasTasks && <div className={`w-1 h-1 rounded-full ${allDone ? 'bg-[#10b981]' : 'bg-[#ffb4ab]'}`}></div>}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 border-l border-[#7ae6ff]/15" key={day}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  const renderCalendarDesktop = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelectedDay = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const dayTasks = (allPageTasks || []).filter(t => t.task_date === format(cloneDay, 'yyyy-MM-dd'));
        
        days.push(
          <div
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
            className={`min-h-[80px] p-2 border-r border-b border-[#7ae6ff]/15 flex flex-col items-start cursor-pointer transition-all duration-300 ${!isCurrentMonth ? 'text-[#3d494c] bg-[#001017]/30' : isSelectedDay ? 'bg-[#7ae6ff]/10 border-[#7ae6ff]' : isToday ? 'bg-[#10b981]/10 border-[#10b981]' : 'text-[#b9eaff] hover:bg-[#7ae6ff]/5'}`}
          >
            <span className={`text-sm font-bold ${!isCurrentMonth ? '' : isSelectedDay ? 'text-[#7ae6ff]' : isToday ? 'text-[#10b981]' : 'text-[#c1ecff]'}`}>{formattedDate}</span>
            <div className="flex flex-col gap-1 mt-2 w-full">
               {dayTasks.slice(0, 2).map((t, idx) => (
                  <div key={idx} className={`text-[9px] truncate px-1 rounded ${t.is_completed ? 'bg-[#10b981]/20 text-[#10b981] line-through' : 'bg-[#7ae6ff]/20 text-[#7ae6ff]'}`}>
                     {t.task_name}
                  </div>
               ))}
               {dayTasks.length > 2 && <span className="text-[8px] text-[#bdc9cc]">+{dayTasks.length - 2} more</span>}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 border-l border-[#7ae6ff]/15" key={day}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  // =========================================================================
  // VIEW: MOBILE CYBERPUNK (KODE ASLI DARI USER, TIDAK DIUBAH)
  // =========================================================================
  if (isMobile) {
    return (
      <>
        <style>{`
          body { background-color: #000b14; color: #b9eaff; -webkit-font-smoothing: antialiased; margin: 0; padding: 0; }
          .glass-panel { backdrop-filter: blur(12px); background: rgba(0, 26, 46, 0.6); border: 1px solid rgba(122, 230, 255, 0.15); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
          .finance-card { border-left: 4px solid #10b981; }
          .pulse-border { animation: pulse-emerald 3s infinite ease-in-out; }
          @keyframes pulse-emerald { 0%, 100% { border-color: rgba(16, 185, 129, 0.15); box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); } 50% { border-color: rgba(16, 185, 129, 0.6); box-shadow: 0 0 25px rgba(16, 185, 129, 0.5); } }
          .font-archivo { font-family: 'Archivo Narrow', sans-serif; }
          .font-anybody { font-family: 'Anybody', sans-serif; }
          .font-atkinson { font-family: 'Atkinson Hyperlegible Next', sans-serif; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #174e5f; border-radius: 10px; }
          @keyframes slideUpFade { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .animate-entrance { opacity: 0; animation: slideUpFade 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        `}</style>
        
        <div className="bg-[#000b14] text-[#b9eaff] font-atkinson antialiased custom-scrollbar overflow-x-hidden min-h-screen flex flex-col pb-24">
          
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          )}

          <aside className={`fixed left-0 top-0 h-full w-[280px] bg-[#001017]/95 border-r border-[#7ae6ff]/15 backdrop-blur-xl flex flex-col py-6 z-50 transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="px-6 mb-8 flex justify-between items-center cursor-pointer">
              <div>
                <h1 className="text-base font-bold text-[#b9eaff] font-atkinson tracking-tight">Rafie's Dashboard</h1>
                <p className="text-[11px] font-anybody text-[#bdc9cc] mt-1 uppercase tracking-widest">Command Center</p>
              </div>
              <button className="text-[#bdc9cc]" onClick={() => setIsSidebarOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
              {(pillars||[]).map(pillar => (
                <div key={pillar}>
                  <div className="flex justify-between items-center px-2 mb-3">
                    <p className="text-[11px] font-anybody text-[#bdc9cc] opacity-50 uppercase tracking-widest">{pillar}</p>
                    <button onClick={() => handleDeletePillar(pillar)} className="text-[#bdc9cc] hover:text-[#ffb4ab] transition-colors"><span className="material-symbols-outlined text-[12px]">close</span></button>
                  </div>
                  <div className="space-y-1">
                    {(pages||[]).filter(p => p.pillar === pillar).map(page => (
                      <button key={page.id} onClick={() => {setActivePageId(page.id); setIsSidebarOpen(false);}} className={`w-full text-left nav-item px-4 py-3 flex items-center gap-3 transition-all duration-300 rounded-lg group ${activePageId === page.id ? 'bg-[#dff8ff]/20 text-[#dff8ff] border-l-4 border-[#dff8ff]' : 'text-[#bdc9cc] hover:bg-[#dff8ff]/10 hover:text-[#dff8ff]'}`}>
                        {page.icon?.startsWith('http') || page.icon?.startsWith('data:image') ? (
                          <img src={page.icon} alt="icon" onError={(e) => { e.target.onerror = null; e.target.src=defaultIcon; }} className="w-5 h-5 rounded-sm object-cover" />
                        ) : (
                          <span className="text-sm">{page.icon || '📄'}</span>
                        )}
                        <span className="font-atkinson text-sm truncate">{page.title}</span>
                      </button>
                    ))}
                    {addingPageUnder === pillar ? (
                      <div className="px-4 py-2 flex items-center gap-2"><span className="text-sm">📄</span><input type="text" autoFocus value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} onKeyDown={(e) => handleAddPage(e, pillar)} onBlur={() => setAddingPageUnder(null)} className="bg-transparent border-b border-[#dff8ff] text-[#dff8ff] outline-none w-full py-1 text-sm" placeholder="Judul Page..." /></div>
                    ) : (
                      <button onClick={() => setAddingPageUnder(pillar)} className="w-full text-left px-4 py-2 flex items-center gap-3 text-[#bdc9cc] hover:text-[#dff8ff] transition-colors duration-300"><span className="material-symbols-outlined text-sm">add</span><span className="font-atkinson text-sm">Add Page</span></button>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-2">
                {isAddingPillar ? (
                  <input type="text" autoFocus value={newPillarName} onChange={(e) => setNewPillarName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAddPillar()} onBlur={confirmAddPillar} placeholder="NAMA PILLAR..." className="bg-transparent border-b border-[#dff8ff] text-[#dff8ff] outline-none w-full py-1 text-xs uppercase font-anybody" />
                ) : (
                  <button onClick={() => setIsAddingPillar(true)} className="w-full bg-[#7ae6ff]/20 text-[#7ae6ff] font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#7ae6ff] hover:text-[#00363f] transition-all duration-300"><span className="material-symbols-outlined text-sm">add</span><span className="text-[11px] font-anybody tracking-widest">ADD PILLAR</span></button>
                )}
              </div>
            </nav>
          </aside>

          <header className="fixed top-0 w-full z-30 backdrop-blur-md border-b border-[#7ae6ff]/15 bg-[#001a2e]/60 shadow-sm flex justify-between items-center px-4 h-16">
            <div className="flex items-center gap-3">
              <div onClick={() => setIsSidebarOpen(true)} className="w-8 h-8 rounded-full bg-[#00c8f9] flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[#003544]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <h1 className="font-archivo text-xl font-bold text-[#dff8ff] tracking-tight">{activePage?.title || "Command Center"}</h1>
            </div>
            <button onClick={handleSyncData} disabled={isSyncing} className="bg-[#7ae6ff]/20 text-[#7ae6ff] p-2 rounded-xl flex items-center justify-center active:scale-95 transition-all">
              <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            </button>
          </header>

          <main className="flex-1 pt-20 px-4 max-w-7xl mx-auto w-full flex flex-col gap-6">
            
            {/* HERO BANNER */}
            <section className="relative rounded-2xl overflow-hidden h-[200px] border border-[#7ae6ff]/15 group animate-entrance" style={{ animationDelay: '0.1s' }}>
               {isEditingCover && (
                 <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000b14]/80 backdrop-blur-sm px-4">
                   <div className="glass-panel p-4 rounded-xl flex flex-col gap-3 w-full max-w-lg">
                     <input type="text" autoFocus value={newCoverUrl} onChange={(e) => setNewCoverUrl(e.target.value)} placeholder="Paste Image URL..." className="flex-1 bg-[#00232e] border border-[#7ae6ff]/15 rounded px-3 py-1.5 outline-none focus:border-[#dff8ff] text-[#b9eaff] text-sm" />
                     <div className="flex gap-2">
                       <button onClick={handleUpdateCover} className="flex-1 bg-[#dff8ff] text-[#00363f] px-4 py-1.5 rounded text-sm font-bold">Save</button>
                       <button onClick={() => setIsEditingCover(false)} className="flex-1 bg-surface-container text-[#bdc9cc] px-3 py-1.5 rounded text-sm">Cancel</button>
                     </div>
                   </div>
                 </div>
               )}
              <img src={(activePage?.cover && activePage.cover.trim() !== '') ? activePage.cover : defaultCover} onError={(e) => { e.target.onerror = null; e.target.src=defaultCover; }} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00161e] via-[#00161e]/60 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 flex flex-col gap-4">
                <div className="relative">
                    {isEditingIcon && (
                       <div className="absolute -top-16 left-0 z-50 glass-panel p-3 rounded-xl flex gap-2 w-[250px] shadow-2xl animate-entrance">
                         <input type="text" autoFocus value={newIconVal} onChange={(e) => setNewIconVal(e.target.value)} placeholder="Emoji / URL Gambar..." className="flex-1 bg-[#000b14] border border-[#7ae6ff]/15 rounded px-2 py-1 outline-none focus:border-[#dff8ff] text-[#b9eaff] text-xs" />
                         <button onClick={handleUpdateIcon} className="bg-[#dff8ff] text-[#00363f] px-3 py-1 rounded text-xs font-bold">Save</button>
                         <button onClick={() => setIsEditingIcon(false)} className="text-[#bdc9cc] px-2 py-1 hover:text-[#ffb4ab] text-xs font-bold">X</button>
                       </div>
                    )}
                    <div onClick={() => { setIsEditingIcon(true); setNewIconVal(activePage?.icon || '📄'); }} className="w-16 h-16 shrink-0 glass-panel rounded-2xl flex items-center justify-center border-2 border-[#dff8ff]/30 text-3xl transform transition hover:scale-110 duration-300 cursor-pointer overflow-hidden relative group/emblem">
                      {isEmblemUrl ? <img src={activePage.icon} onError={(e) => { e.target.onerror = null; e.target.src=defaultIcon; }} alt="Emblem" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} /> : <span>{activePage?.icon || '📄'}</span>}
                    </div>
                </div>
                <div className="w-full max-w-[85vw]">
                  <input type="text" value={activePage?.title || ''} onChange={(e) => setPages(pages.map(p => p.id === activePageId ? { ...p, title: e.target.value } : p))} onBlur={(e) => handleUpdateTitle(e.target.value)} placeholder="Page Title..." className="bg-transparent border-none outline-none text-2xl font-bold text-[#b9eaff] font-archivo w-full mb-2 p-0 truncate" />
                  <div className="flex gap-2 mt-2 overflow-x-auto custom-scrollbar pb-2 w-full">
                    <button onClick={() => toggleWidget('business')} className={`shrink-0 glass-panel px-3 py-1.5 rounded-full text-[10px] font-anybody uppercase font-bold flex items-center gap-1.5 transition-all duration-300 border ${isBusinessEnabled ? 'bg-[#10b981] text-white border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981]/20'}`}><span className="material-symbols-outlined text-[12px]">account_balance_wallet</span> Finance</button>
                    <button onClick={() => toggleWidget('todos')} className={`shrink-0 glass-panel px-3 py-1.5 rounded-full text-[10px] font-anybody uppercase font-bold flex items-center gap-1.5 transition-all duration-300 border ${isTodosEnabled ? 'bg-[#dff8ff] text-[#00363f] border-[#dff8ff] shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-[#dff8ff] border-[#dff8ff]/20 hover:bg-[#dff8ff]/20'}`}><span className="material-symbols-outlined text-[12px]">checklist</span> Checklist</button>
                    <button onClick={() => toggleWidget('notes')} className={`shrink-0 glass-panel px-3 py-1.5 rounded-full text-[10px] font-anybody uppercase font-bold flex items-center gap-1.5 transition-all duration-300 border ${isNotesEnabled ? 'bg-[#dff8ff] text-[#00363f] border-[#dff8ff] shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-[#dff8ff] border-[#dff8ff]/20 hover:bg-[#dff8ff]/20'}`}><span className="material-symbols-outlined text-[12px]">description</span> Notes</button>
                    <button onClick={() => toggleWidget('planner')} className={`shrink-0 glass-panel px-3 py-1.5 rounded-full text-[10px] font-anybody uppercase font-bold flex items-center gap-1.5 transition-all duration-300 border ${isPlannerEnabled ? 'bg-[#dff8ff] text-[#00363f] border-[#dff8ff] shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-[#dff8ff] border-[#dff8ff]/20 hover:bg-[#dff8ff]/20'}`}><span className="material-symbols-outlined text-[12px]">calendar_month</span> Planner</button>
                    <button onClick={() => toggleWidget('stats')} className={`shrink-0 glass-panel px-3 py-1.5 rounded-full text-[10px] font-anybody uppercase font-bold flex items-center gap-1.5 transition-all duration-300 border ${isStatsEnabled ? 'bg-[#dff8ff] text-[#00363f] border-[#dff8ff] shadow-[0_0_15px_rgba(122,230,255,0.4)]' : 'text-[#dff8ff] border-[#dff8ff]/20 hover:bg-[#dff8ff]/20'}`}><span className="material-symbols-outlined text-[12px]">monitoring</span> Stats</button>
                  </div>
                </div>
              </div>
              <button onClick={() => { setIsEditingCover(true); setNewCoverUrl(activePage?.cover || ''); }} className="absolute top-2 right-2 glass-panel text-[#bdc9cc] px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 z-20"><span className="material-symbols-outlined text-[12px]">edit</span> Cover</button>
              <button onClick={handleDeletePage} className="absolute bottom-2 right-2 glass-panel text-[#ffb4ab]/60 px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">delete</span> Delete</button>
            </section>

            {/* FINANCE MOBILE */}
            {isBusinessEnabled && (
              <section className="flex flex-col gap-4 animate-entrance" style={{ animationDelay: '0.2s' }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 w-full">
                    <span className="material-symbols-outlined text-[#10b981] finance-card-pulse rounded-full p-1">payments</span>
                    <input type="text" value={subtitles[`bus_${activePageId}`] || 'Buku Keuangan Utama'} onChange={(e) => setSubtitles({ ...subtitles, [`bus_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none font-archivo text-xl font-bold text-[#b9eaff] w-full p-0 focus:ring-0" />
                  </div>
                  <div className="glass-panel px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 border-[#10b981]/20 w-fit">
                    <span className="text-[#bdc9cc]">Kurs 1 DL:</span>
                    <span className="text-[#10b981] font-bold flex items-center">Rp <input type="number" value={dlRate} onChange={(e) => setDlRate(e.target.value)} className="bg-transparent w-14 ml-1 p-0 border-none focus:ring-0 text-[#10b981] outline-none" /></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-panel finance-card pulse-border p-5 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl text-[#10b981]">account_balance</span></div>
                    <p className="text-[10px] font-bold font-anybody text-[#bdc9cc] mb-1">TOTAL NET WORTH</p>
                    <h5 className={`text-2xl font-bold font-data-mono ${totalKekayaanIDR >= 0 ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{formatIDR(totalKekayaanIDR)}</h5>
                    <div className="mt-2 flex items-center gap-1 text-[#10b981]"><span className="material-symbols-outlined text-xs animate-pulse">trending_up</span><span className="text-[10px] font-bold">Active & Growing</span></div>
                  </div>

                  <div className="glass-panel finance-card pulse-border p-4 rounded-xl relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl text-[#b9eaff]">savings</span></div>
                    <p className="text-[10px] font-bold font-anybody text-[#bdc9cc] mb-1">DOMPET TABUNGAN</p>
                    <h5 className={`text-xl font-bold font-data-mono ${tabunganBalance >= 0 ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{formatIDR(tabunganBalance)}</h5>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#7ae6ff]/15 pt-2">
                        <div><p className="text-[9px] text-[#bdc9cc] uppercase">Keluar</p><p className="text-[#ffb4ab] font-data-mono text-xs">{formatIDR(tabunganOut)}</p></div>
                        <div className="text-right"><p className="text-[9px] text-[#bdc9cc] uppercase">Masuk</p><p className="text-[#10b981] font-data-mono text-xs">{formatIDR(tabunganIn)}</p></div>
                    </div>
                  </div>

                  <div className="glass-panel finance-card pulse-border p-4 rounded-xl relative border-r-4 border-[#10b981]/30">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl text-[#b9eaff]">sports_esports</span></div>
                    <p className="text-[10px] font-bold font-anybody text-[#bdc9cc] mb-1">PROFIT GROWTOPIA</p>
                    <h5 className={`text-xl font-bold font-data-mono ${isGtProfit ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{isGtProfit ? '+' : ''}{gtNetDL.toFixed(2)} DL</h5>
                    <p className="text-[10px] font-bold text-[#bdc9cc] mt-1">≈ {formatIDR(gtNetIDR)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] uppercase text-[#bdc9cc] border-t border-[#7ae6ff]/15 pt-2">
                        <span className="">Modal: <span className="text-[#ffb4ab]">{gtModalDL.toFixed(2)} DL</span></span>
                        <span className="text-right">Omset: <span className="text-[#10b981]">{gtOmsetDL.toFixed(2)} DL</span></span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl h-[300px] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[#10b981] text-lg">show_chart</span><h5 className="text-sm font-bold font-archivo text-[#b9eaff]">Trend Kekayaan</h5></div>
                  </div>
                  <div className="flex-1 w-full relative"><canvas ref={financeChartRef}></canvas></div>
                </div>

                <div className="glass-panel p-4 rounded-xl shadow-xl">
                    <div className="flex flex-col mb-4 gap-3">
                      <h3 className="text-sm font-bold font-archivo text-[#b9eaff]">Riwayat Transaksi</h3>
                      <div className="flex gap-2 w-full">
                          <button onClick={() => {setIsAddingTx(!isAddingTx); setIsTransferring(false);}} className={`flex-1 justify-center px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${isAddingTx ? 'bg-[#ffb4ab] text-[#690005] shadow-lg' : 'bg-[#dff8ff] text-[#00363f]'}`}>
                              <span className="material-symbols-outlined text-[14px]">{isAddingTx ? 'close' : 'add'}</span> <span>{isAddingTx ? 'Batal' : 'Transaksi Baru'}</span>
                          </button>
                          <button onClick={() => {setIsTransferring(!isTransferring); setIsAddingTx(false);}} className={`flex-1 justify-center px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${isTransferring ? 'bg-[#ffb4ab] text-[#690005] shadow-lg' : 'bg-[#10b981] text-[#00161e]'}`}>
                              <span className="material-symbols-outlined text-[14px]">{isTransferring ? 'close' : 'swap_horiz'}</span> <span>{isTransferring ? 'Batal' : 'Trading Aset'}</span>
                          </button>
                      </div>
                    </div>

                    {isTransferring && (
                      <div className="p-4 mb-6 bg-[#10b981]/10 border border-[#10b981]/50 rounded-xl">
                         <select value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)} className="w-full bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-xs focus:border-[#10b981] mb-3">
                            <option value="TABUNGAN_TO_GT">Beli Aset (Rp ➡️ GT)</option>
                            <option value="GT_TO_TABUNGAN">Jual Aset (GT ➡️ Rp)</option>
                         </select>
                         <div className="flex gap-2 mb-3">
                            <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="w-1/2 bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-2 py-2 outline-none text-[#b9eaff] text-xs focus:border-[#10b981]" />
                            <input type="number" value={transferAmountIDR} onChange={(e) => setTransferAmountIDR(e.target.value)} placeholder="Nominal Rp..." className="w-1/2 bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-xs focus:border-[#10b981]" />
                         </div>
                         <input type="text" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Keterangan..." className="w-full bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-xs focus:border-[#10b981] mb-3" />
                         <button onClick={handleTransferAction} className="w-full bg-[#10b981] text-[#000b14] px-4 py-2 rounded-lg text-xs font-bold shadow-lg">Eksekusi</button>
                      </div>
                    )}

                    {isAddingTx && (
                      <div className="p-4 mb-6 bg-[#dff8ff]/10 border border-[#dff8ff]/50 rounded-xl">
                        <div className="flex gap-2 mb-3 bg-[#000b14] p-1 rounded-lg border border-[#7ae6ff]/15">
                            <button onClick={() => handleTxCategoryToggle('TABUNGAN')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${txCategory === 'TABUNGAN' ? 'bg-[#10b981] text-white' : 'text-[#bdc9cc]'}`}>🏦 Tabungan</button>
                            <button onClick={() => handleTxCategoryToggle('GT')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${txCategory === 'GT' ? 'bg-[#00c8f9] text-[#005065]' : 'text-[#bdc9cc]'}`}>🎮 Growtopia</button>
                        </div>
                        <input type="text" value={newTxDesc} onChange={(e) => setNewTxDesc(e.target.value)} placeholder="Rincian..." className="w-full bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-xs mb-3" />
                        <div className="flex gap-2 mb-3">
                          <input type="date" value={newTxDate} onChange={(e) => setNewTxDate(e.target.value)} className="w-1/2 bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-2 py-2 outline-none text-[#b9eaff] text-xs" />
                          <select value={newTxType} onChange={(e) => setNewTxType(e.target.value)} className="w-1/2 bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-xs"><option value="pengeluaran">Keluar (-)</option><option value="pemasukan">Masuk (+)</option></select>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input type="number" value={newTxAmount} onChange={(e) => setNewTxAmount(e.target.value)} placeholder="0" className="flex-1 bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-xs" />
                          {txCategory === 'GT' && <select value={newTxCurrency} onChange={(e) => setNewTxCurrency(e.target.value)} className="w-20 bg-[#002e3c] border border-[#7ae6ff]/15 rounded-lg px-2 py-2 outline-none text-[#b9eaff] text-xs"><option value="WL">WL</option><option value="DL">DL</option><option value="BGL">BGL</option></select>}
                        </div>
                        <button onClick={handleAddTransaction} className="w-full bg-[#dff8ff] text-[#00363f] px-4 py-2 rounded-lg text-xs font-bold">Simpan</button>
                      </div>
                    )}

                    <div className="space-y-3 mt-4">
                      {(transactions||[]).map((t) => {
                        const isTabungan = t.currency_type === 'TABUNGAN' || t.currency_type === 'IDR';
                        const isMasuk = t.type === 'pemasukan';
                        return (
                        <div key={t.id} className="flex flex-col p-3 bg-[#000b14] rounded-xl border border-[#7ae6ff]/15 gap-2 group">
                          <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg shrink-0 border ${isMasuk ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'}`}><span className="material-symbols-outlined text-sm">{isMasuk ? 'arrow_downward' : 'arrow_upward'}</span></div>
                              <div className="flex-1">
                                  <p className="text-[#b9eaff] text-xs font-bold">{t.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span onClick={() => { setEditingTxId(t.id); setEditTxDate(t.date); }} className="text-[10px] text-[#bdc9cc] border border-[#7ae6ff]/15 px-1.5 py-0.5 rounded">{t.date}</span>
                                      <span className={`text-[9px] font-bold font-anybody px-1.5 py-0.5 rounded uppercase ${isTabungan ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#00c8f9]/20 text-[#00c8f9]'}`}>{isTabungan ? 'Bank' : 'GT'}</span>
                                  </div>
                              </div>
                              <button onClick={() => deleteTransaction(t.id)} className="text-[#ffb4ab]/60 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                          </div>
                          <div className="text-left pl-11">
                               <span className={`font-data-mono text-sm font-bold ${isMasuk ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{isMasuk ? '+' : '-'}{isTabungan ? formatIDR(t.amount) : `${t.amount} ${t.currency_type}`}</span>
                          </div>
                        </div>
                      )})}
                      {(transactions||[]).length === 0 && <div className="py-8 text-center border border-dashed border-[#7ae6ff]/15 rounded-xl"><p className="text-xs text-[#bdc9cc]">Belum ada riwayat keuangan tercatat.</p></div>}
                    </div>
                </div>
              </section>
            )}

            {/* PLANNER MOBILE */}
            {isPlannerEnabled && (
              <section className="flex flex-col gap-4 animate-entrance" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#dff8ff]">calendar_month</span>
                  <h4 className="font-archivo text-xl font-bold text-[#b9eaff]">Daily & Monthly Planner</h4>
                </div>
                <div className="glass-panel p-4 rounded-xl border-t-2 border-[#dff8ff]/20">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-sm font-bold text-[#b9eaff]">{format(currentMonth, 'MMMM yyyy')}</h5>
                    <div className="flex gap-1">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded bg-[#dff8ff]/10"><span className="material-symbols-outlined text-xs">chevron_left</span></button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded bg-[#dff8ff]/10"><span className="material-symbols-outlined text-xs">chevron_right</span></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 border-t border-l border-[#7ae6ff]/15">
                    {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => <div key={day} className="p-1 text-center font-anybody text-[10px] text-[#879396] border-r border-b border-[#7ae6ff]/15 bg-[#000b14]/50">{day}</div>)}
                  </div>
                  {renderCalendarMobile()}

                  {/* TARGET BULANAN */}
                  <div className="mt-4 border-t border-[#7ae6ff]/15 pt-4">
                     <h3 className="text-sm font-bold text-[#00c8f9] mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">emoji_events</span> Monthly Targets</h3>
                     <div className="space-y-2 mb-4">
                        {monthlyTodos.map(task => (
                            <div key={task.id} className="flex items-start gap-2 p-2 bg-[#000b14] rounded">
                                <div className={`mt-0.5 cursor-pointer ${task.is_completed ? 'text-[#10b981]' : 'text-[#879396]'}`} onClick={() => toggleBlock(task.id, task.is_completed)}><span className="material-symbols-outlined text-[14px]">{task.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                                <span className={`text-xs flex-1 ${task.is_completed ? 'line-through text-[#879396]' : 'text-[#b9eaff]'}`}>{task.content}</span>
                                <button onClick={() => deleteBlock(task.id)} className="text-[#ffb4ab]/50"><span className="material-symbols-outlined text-[12px]">delete</span></button>
                            </div>
                        ))}
                        <input type="text" value={newMonthlyTodo} onChange={(e) => setNewMonthlyTodo(e.target.value)} onKeyDown={(e) => handleAddCustomBlockEnter(e, `monthly_todo_${monthKey}`, newMonthlyTodo, setNewMonthlyTodo)} className="w-full bg-transparent border-0 border-b border-[#3d494c] focus:border-[#00c8f9] text-sm p-1 text-[#b9eaff] outline-none" placeholder="+ Tambah target bulan ini..." />
                     </div>
                     <div className="pt-3 border-t border-[#7ae6ff]/15">
                        <h4 className="text-[10px] font-bold text-[#bdc9cc] mb-2">Catatan Bulan Ini</h4>
                        {monthlyNotes.map(note => (
                            <div key={note.id} className="relative mb-2">
                                <textarea className="w-full bg-[#000b14] border border-[#00c8f9]/30 rounded-xl p-2 text-xs text-[#b9eaff] outline-none min-h-[60px]" defaultValue={note.content} onBlur={(e) => handleUpdateBlockContent(note.id, e.target.value)} />
                                <button onClick={() => deleteBlock(note.id)} className="absolute top-1 right-1 text-[#ffb4ab] p-1"><span className="material-symbols-outlined text-[10px]">delete</span></button>
                            </div>
                        ))}
                        {monthlyNotes.length === 0 && (
                            <div onClick={() => handleAddCustomBlockClick(`monthly_note_${monthKey}`, 'Catatan bulan ini...')} className="w-full h-12 bg-[#000b14] rounded-xl border border-dashed border-[#00c8f9]/30 flex items-center justify-center cursor-pointer"><span className="text-[9px] text-[#bdc9cc]">+ Tambah catatan</span></div>
                        )}
                     </div>
                  </div>

                  {/* TASKS UNTUK HARI INI */}
                  <div className="mt-4 border-t border-[#7ae6ff]/15 pt-4">
                      <h6 className="text-sm font-bold text-[#b9eaff] mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[#dff8ff] text-[16px]">check_box</span> Tasks for {format(selectedDate, 'MMM d')}</h6>
                      <div className="space-y-2">
                        {(dailyTasks||[]).map(task => (
                           <div key={task.id} className="flex items-start gap-2 p-1.5 bg-[#000b14] rounded">
                             <div className={`mt-0.5 cursor-pointer ${task.is_completed ? 'text-[#10b981]' : 'text-[#879396]'}`} onClick={() => toggleDailyTask(task.id, task.is_completed)}><span className="material-symbols-outlined text-[14px]">{task.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                             <span className={`text-xs flex-1 ${task.is_completed ? 'line-through text-[#879396]' : 'text-[#b9eaff]'}`}>{task.task_name}</span>
                             <button onClick={() => deleteDailyTask(task.id)} className="text-[#ffb4ab]/50"><span className="material-symbols-outlined text-[12px]">delete</span></button>
                           </div>
                        ))}
                        <input type="text" value={newDailyTaskName} onChange={(e) => setNewDailyTaskName(e.target.value)} onKeyDown={handleAddDailyTask} className="w-full bg-transparent border-0 border-b border-[#7ae6ff]/30 text-xs p-1 text-[#b9eaff] outline-none" placeholder="+ Tambah jadwal harian..." />
                        <div className="pt-4 mt-3 border-t border-[#7ae6ff]/15">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#bdc9cc] mb-2"><span className="material-symbols-outlined text-[12px] text-[#dff8ff]">description</span> Detail Quest Harian</div>
                          {dailyNoteBlocks.map(note => (
                              <div key={note.id} className="relative">
                                  <textarea className="w-full bg-[#000b14] border border-[#dff8ff]/30 rounded-xl p-2 text-xs text-[#b9eaff] outline-none min-h-[60px]" defaultValue={note.content} onBlur={(e) => handleUpdateBlockContent(note.id, e.target.value)} />
                                  <button onClick={() => deleteBlock(note.id)} className="absolute top-1 right-1 text-[#ffb4ab] p-1"><span className="material-symbols-outlined text-[10px]">delete</span></button>
                              </div>
                          ))}
                          {dailyNoteBlocks.length === 0 && (
                              <div onClick={() => handleAddCustomBlockClick(`daily_note_${currentDateStr}`, 'Catatan harian baru...')} className="w-full h-12 bg-[#000b14] rounded-xl border border-dashed border-[#dff8ff]/30 flex items-center justify-center cursor-pointer"><span className="text-[9px] text-[#bdc9cc]">+ Rincian note hari ini</span></div>
                          )}
                        </div>
                      </div>
                  </div>
                </div>
              </section>
            )}

            {/* TODOS / STATS / NOTES MOBILE */}
            {isStatsEnabled && (
               <section className="flex flex-col gap-4 animate-entrance mt-4" style={{ animationDelay: '0.4s' }}>
                  <h2 className="font-archivo text-xl font-bold text-[#b9eaff] flex items-center gap-2"><span className="material-symbols-outlined text-[#dff8ff]">monitoring</span> Analytics</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel p-4 rounded-xl border-b-2 border-[#dff8ff]/40"><p className="text-[9px] font-anybody text-[#bdc9cc] uppercase mb-1">CHECKLIST SELESAI</p><h6 className="text-2xl font-headline-lg font-bold text-[#dff8ff]">{blocksPercent}%</h6></div>
                    <div className="glass-panel p-4 rounded-xl border-b-2 border-[#dff8ff]/40"><p className="text-[9px] font-anybody text-[#bdc9cc] uppercase mb-1">HARI INI</p><h6 className="text-2xl font-headline-lg font-bold text-[#dff8ff]">{dailyPercent}%</h6></div>
                  </div>
                  <div className="glass-panel p-4 rounded-xl">
                      <div className="flex bg-[#000b14] p-1 rounded-lg border border-[#3d494c] w-full mb-4">
                          {['harian', 'mingguan', 'bulanan'].map((tab) => (<button key={tab} onClick={() => setStatsView(tab)} className={`flex-1 py-1.5 text-[10px] rounded capitalize ${statsView === tab ? 'bg-[#00c8f9] text-[#005065]' : 'text-[#879396]'}`}>{tab}</button>))}
                      </div>
                      <div className="relative h-[200px] w-full"><canvas ref={chartRef}></canvas></div>
                  </div>
               </section>
            )}

            {isTodosEnabled && (
              <section className="flex flex-col gap-4 animate-entrance mt-4" style={{ animationDelay: '0.4s' }}>
                 <div className="glass-panel p-4 rounded-xl border border-[#dff8ff]/10">
                   <div className="flex flex-col gap-3 mb-4">
                      <h5 className="text-lg font-archivo font-bold text-[#b9eaff] flex items-center gap-2"><span className="material-symbols-outlined text-[#dff8ff]">event_note</span> Targets</h5>
                      {isAddingGroup ? (
                          <div className="flex gap-1 w-full"><input type="text" autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTargetGroup()} placeholder="Nama Plan..." className="bg-[#000b14] border border-[#dff8ff]/50 rounded px-2 py-1 text-xs outline-none text-[#b9eaff] flex-1" /><button onClick={handleAddTargetGroup} className="bg-[#dff8ff] text-[#00363f] px-2 py-1 rounded text-xs font-bold">OK</button><button onClick={() => setIsAddingGroup(false)} className="text-[#879396] text-xs px-1 hover:text-[#ffb4ab]">X</button></div>
                      ) : (
                          <button onClick={() => setIsAddingGroup(true)} className="text-[#dff8ff] text-xs font-bold flex items-center gap-1 w-fit"><span className="material-symbols-outlined text-[12px]">add</span> Add Group</button>
                      )}
                   </div>

                   <div className="space-y-4">
                      {currentPageGroups.map((groupType) => {
                          const groupBlocks = (blocks || []).filter(b => b.type === groupType);
                          const currentTitleKey = `title_${groupType}_${activePageId}`;
                          return (
                              <div key={groupType} className="bg-[#000b14] p-3 rounded-xl border border-[#7ae6ff]/15">
                                  <div className="flex items-center justify-between mb-2 border-b border-[#7ae6ff]/15 pb-1">
                                      <input type="text" value={subtitles[currentTitleKey] || (groupType === 'todo' ? 'Target Utama' : 'Target Content')} onChange={(e) => setSubtitles({ ...subtitles, [currentTitleKey]: e.target.value })} className="bg-transparent border-none outline-none text-sm font-bold text-[#dff8ff] w-3/4 px-1" />
                                      {groupType !== 'todo' && (<button onClick={() => handleDeleteTargetGroup(groupType)} className="text-[#ffb4ab]/50 p-1"><span className="material-symbols-outlined text-[12px]">delete</span></button>)}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                      {groupBlocks.map((block) => (
                                          <div key={block.id} className={`p-2 rounded-lg border flex items-start gap-2 ${block.is_completed ? 'bg-[#10b981]/5 border-[#10b981]/20' : 'bg-[#001f29] border-[#3d494c]'}`}>
                                              <div className={`mt-0.5 cursor-pointer ${block.is_completed ? 'text-[#10b981]' : 'text-[#879396]'}`} onClick={() => toggleBlock(block.id, block.is_completed)}><span className="material-symbols-outlined text-[14px]">{block.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                                              <span className={`text-xs flex-1 ${block.is_completed ? 'line-through text-[#879396]' : 'text-[#b9eaff]'}`}>{block.content}</span>
                                              <button onClick={() => deleteBlock(block.id)} className="text-[#ffb4ab]/50 p-1"><span className="material-symbols-outlined text-[12px]">delete</span></button>
                                          </div>
                                      ))}
                                  </div>
                                  {activeGroupInput === groupType ? (
                                      <div className="flex items-center gap-2 p-1.5 mt-2 bg-[#001f29] rounded border border-[#00c8f9]/30"><input type="text" autoFocus value={newBlockContent[groupType] || ''} onChange={(e) => setNewBlockContent({ ...newBlockContent, [groupType]: e.target.value })} onKeyDown={(e) => handleAddBlockInGroup(e, groupType)} onBlur={() => setActiveGroupInput(null)} placeholder="Ketik lalu Enter..." className="bg-transparent border-none outline-none text-[#b9eaff] w-full text-xs py-0.5" /></div>
                                  ) : (
                                      <div onClick={() => setActiveGroupInput(groupType)} className="flex items-center gap-1 p-1 mt-2 text-[#879396] hover:text-[#dff8ff] w-fit"><span className="material-symbols-outlined text-[12px]">add</span> <span className="text-[10px] font-bold">New Item</span></div>
                                  )}
                              </div>
                          );
                      })}
                   </div>
                 </div>
              </section>
            )}

            {isNotesEnabled && (
                <section id="notes" className="flex flex-col gap-4 animate-entrance mt-4" style={{ animationDelay: '0.4s' }}>
                   <div className="flex items-center justify-between">
                     <h2 className="font-archivo text-xl font-bold text-[#b9eaff] flex items-center gap-2"><span className="material-symbols-outlined text-[#7ae6ff]">description</span> Notes</h2>
                     <button onClick={() => setIsAddingNote(!isAddingNote)} className="bg-[#7ae6ff]/10 text-[#7ae6ff] px-2 py-1 rounded text-[10px] font-bold">{isAddingNote ? 'Batal' : '+ Tambah'}</button>
                   </div>
                   {isAddingNote && (
                      <div className="glass-panel p-3 rounded-xl animate-entrance">
                          <textarea autoFocus value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} className="w-full bg-[#000b14] border border-[#3d494c] focus:border-[#7ae6ff] rounded-xl p-3 text-xs text-[#b9eaff] resize-none h-24 outline-none custom-scrollbar" placeholder="Tulis catatan..."></textarea>
                          <button onClick={handleAddNote} className="bg-[#dff8ff] text-[#00363f] px-3 py-1.5 rounded-lg text-xs font-bold mt-2 w-full">Simpan</button>
                      </div>
                   )}
                   <div className="grid grid-cols-1 gap-3">
                      {noteBlocks.map((note) => (
                          <div key={note.id} className="p-3 bg-[#000b14] rounded-xl border border-[#7ae6ff]/15">
                              {editingNoteId === note.id ? (
                                  <div className="flex flex-col gap-2"><textarea autoFocus value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} className="w-full h-20 bg-[#001f29] border border-[#7ae6ff] rounded p-2 text-[#b9eaff] outline-none text-xs" /><div className="flex gap-2 justify-end"><button onClick={() => setEditingNoteId(null)} className="text-[10px] text-[#879396]">Batal</button><button onClick={() => handleUpdateBlockContent(note.id, editNoteContent)} className="bg-[#7ae6ff] text-[#00363f] text-[10px] font-bold px-2 py-1 rounded">Update</button></div></div>
                              ) : (
                                  <>
                                      <p className="text-xs text-[#b9eaff] whitespace-pre-wrap">{note.content}</p>
                                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[#3d494c]">
                                          <button onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }} className="text-[#7ae6ff] p-1"><span className="material-symbols-outlined text-[12px]">edit</span></button>
                                          <button onClick={() => deleteBlock(note.id)} className="text-[#ffb4ab] p-1"><span className="material-symbols-outlined text-[12px]">delete</span></button>
                                      </div>
                                  </>
                              )}
                          </div>
                      ))}
                      {noteBlocks.length === 0 && !isAddingNote && <div className="text-center py-6 border border-dashed border-[#7ae6ff]/15 rounded-xl"><p className="text-xs text-[#bdc9cc]">Belum ada catatan.</p></div>}
                   </div>
                </section>
            )}

          </main>

          <footer className="fixed bottom-0 w-full z-40 backdrop-blur-md border-t border-[#7ae6ff]/15 bg-[#001a2e]/80 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 px-4 pb-safe">
            <a onClick={() => setMobileWidgetOnly('business')} className={`flex flex-col items-center justify-center rounded-xl p-2 active:scale-90 ${isBusinessEnabled && pageWidgets[activePageId]?.length === 1 ? 'bg-[#00c8f9]/20 text-[#00c8f9]' : 'text-[#879396]'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isBusinessEnabled && pageWidgets[activePageId]?.length === 1 ? "'FILL' 1" : "'FILL' 0" }}>payments</span>
            </a>
            <a onClick={() => setMobileWidgetOnly('todos')} className={`flex flex-col items-center justify-center rounded-xl p-2 active:scale-90 ${isTodosEnabled && pageWidgets[activePageId]?.length === 1 ? 'bg-[#00c8f9]/20 text-[#00c8f9]' : 'text-[#879396]'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isTodosEnabled && pageWidgets[activePageId]?.length === 1 ? "'FILL' 1" : "'FILL' 0" }}>checklist</span>
            </a>
            <a onClick={() => setMobileWidgetOnly('notes')} className={`flex flex-col items-center justify-center rounded-xl p-2 active:scale-90 ${isNotesEnabled && pageWidgets[activePageId]?.length === 1 ? 'bg-[#00c8f9]/20 text-[#00c8f9]' : 'text-[#879396]'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isNotesEnabled && pageWidgets[activePageId]?.length === 1 ? "'FILL' 1" : "'FILL' 0" }}>description</span>
            </a>
            <a onClick={() => setMobileWidgetOnly('planner')} className={`flex flex-col items-center justify-center rounded-xl p-2 active:scale-90 ${isPlannerEnabled && pageWidgets[activePageId]?.length === 1 ? 'bg-[#00c8f9]/20 text-[#00c8f9]' : 'text-[#879396]'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isPlannerEnabled && pageWidgets[activePageId]?.length === 1 ? "'FILL' 1" : "'FILL' 0" }}>event_note</span>
            </a>
            <a onClick={() => setMobileWidgetOnly('stats')} className={`flex flex-col items-center justify-center rounded-xl p-2 active:scale-90 ${isStatsEnabled && pageWidgets[activePageId]?.length === 1 ? 'bg-[#00c8f9]/20 text-[#00c8f9]' : 'text-[#879396]'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isStatsEnabled && pageWidgets[activePageId]?.length === 1 ? "'FILL' 1" : "'FILL' 0" }}>leaderboard</span>
            </a>
          </footer>

          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#00c8f9] text-[#005065] shadow-[0_0_40px_rgba(0,200,249,0.4)] flex items-center justify-center z-40 active:scale-90">
            <span className="material-symbols-outlined text-3xl">arrow_upward</span>
          </button>
        </div>
      </>
    );
  }

  // =========================================================================
  // VIEW: DESKTOP CYBERPUNK (Sesuai kode HTML/Desain Github Baru)
  // =========================================================================
  return (
    <div className="flex h-screen bg-[#001017] font-atkinson text-[#c1ecff] selection:bg-[#00c8f9] selection:text-[#001017] overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="w-[280px] border-r border-[#7ae6ff]/15 bg-[#000b14]/80 backdrop-blur-xl hidden md:flex flex-col z-50 h-full overflow-y-auto custom-scrollbar">
        <div className="px-6 py-6 mt-2 cursor-pointer hover:opacity-80 transition-opacity">
          <h1 className="text-base font-bold text-[#b9eaff] tracking-tight">Rafie's Dashboard</h1>
          <p className="text-[11px] font-anybody text-[#bdc9cc] mt-1 uppercase tracking-widest">Productivity Engine</p>
        </div>
        
        <nav className="flex-1 mt-2 mb-4 space-y-8">
          {(pillars||[]).map(pillar => (
            <div key={pillar} className="flex flex-col">
              <div className="px-6 mb-3 flex items-center justify-between group/pillar">
                <span className="text-[11px] font-anybody font-bold text-[#bdc9cc] opacity-50 uppercase tracking-widest">{pillar}</span>
                <button onClick={() => handleDeletePillar(pillar)} className="text-[#bdc9cc] hover:text-[#ffb4ab] opacity-0 group-hover/pillar:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[14px]">close</span></button>
              </div>
              <div className="space-y-1">
                {(pages||[]).filter(p => p.pillar === pillar).map(page => (
                  <div key={page.id} className="group/page flex items-center">
                    <button onClick={() => setActivePageId(page.id)} className={`flex-1 text-left nav-item px-6 py-3 flex items-center gap-3 transition-all duration-300 ${activePageId === page.id ? 'bg-[#7ae6ff]/20 text-[#7ae6ff] border-l-4 border-[#7ae6ff]' : 'text-[#bdc9cc] hover:bg-[#7ae6ff]/10 hover:text-[#7ae6ff]'}`}>
                      {page.icon?.startsWith('http') || page.icon?.startsWith('data:image') ? (
                        <img src={page.icon} onError={(e) => { e.target.onerror = null; e.target.src=defaultIcon; }} alt="icon" className="w-5 h-5 rounded-sm object-cover" />
                      ) : (
                        <span className="text-sm">{page.icon || '📄'}</span>
                      )}
                      <span className="truncate text-sm">{page.title}</span>
                    </button>
                    <button onClick={async () => { if (window.confirm('Hapus page ini?')) { await supabase.from('pages').delete().eq('id', page.id); const updatedPages = pages.filter(p => p.id !== page.id); setPages(updatedPages); if (activePageId === page.id) setActivePageId(updatedPages[0]?.id || null); }}} className="text-[#ffb4ab]/0 group-hover/page:text-[#ffb4ab]/60 hover:!text-[#ffb4ab] p-1 mr-2 transition-all duration-200"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                  </div>
                ))}
                {addingPageUnder === pillar ? (
                  <div className="px-6 py-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#bdc9cc]">description</span>
                    <input type="text" autoFocus value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} onKeyDown={(e) => handleAddPage(e, pillar)} onBlur={() => setAddingPageUnder(null)} className="bg-transparent border-b border-[#7ae6ff] outline-none text-[#dff8ff] w-full py-1 text-sm" placeholder="Judul Page..." />
                  </div>
                ) : (
                  <button onClick={() => setAddingPageUnder(pillar)} className="w-full text-left px-6 py-2 flex items-center gap-3 text-[#bdc9cc] hover:text-[#7ae6ff] transition-colors duration-300"><span className="material-symbols-outlined text-sm">add</span><span className="text-sm">Add Page</span></button>
                )}
              </div>
            </div>
          ))}
          <div className="px-4 mt-auto pt-4 border-t border-[#7ae6ff]/15 mx-4">
             {isAddingPillar ? (
               <input type="text" autoFocus value={newPillarName} onChange={(e) => setNewPillarName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAddPillar()} onBlur={confirmAddPillar} placeholder="NAMA PILLAR..." className="bg-transparent border-b border-[#7ae6ff] outline-none text-[#dff8ff] text-[11px] font-anybody uppercase tracking-widest w-full py-1" />
             ) : (
               <button onClick={() => setIsAddingPillar(true)} className="w-full bg-[#7ae6ff] text-[#00343d] font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(122,230,255,0.4)] active:scale-95 transition-all duration-300"><span className="material-symbols-outlined text-sm">add</span><span className="text-[11px] font-anybody tracking-widest">ADD PILLAR</span></button>
             )}
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA DESKTOP */}
      <main className="flex-1 overflow-y-auto relative bg-transparent custom-scrollbar flex flex-col">
        {/* SHADER BACKGROUND */}
        <div className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none bg-[#001017]"></div>

        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-40 w-full bg-[#001017]/60 backdrop-blur-md border-b border-[#7ae6ff]/15 h-20 px-8 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#7ae6ff] text-2xl">grid_view</span>
            <h2 className="text-[24px] font-archivo font-bold text-[#7ae6ff] tracking-tight">Personal Command Center</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleSyncData} disabled={isSyncing} className="bg-[#00232e] px-4 py-2 rounded-lg border border-[#7ae6ff]/15 text-[11px] font-anybody tracking-widest hover:bg-[#00313e] hover:border-[#7ae6ff]/50 transition-all duration-300 flex items-center gap-2 text-[#c1ecff]">
              <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>sync</span> {isSyncing ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-12">
          {/* HERO BANNER */}
          <section className="relative rounded-2xl overflow-hidden h-[300px] border border-[#7ae6ff]/15 animate-entrance stagger-1 group">
             {isEditingCover && (
               <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000b14]/80 backdrop-blur-sm px-4">
                 <div className="glass-panel p-4 rounded-xl flex gap-3 w-full max-w-lg">
                   <input type="text" autoFocus value={newCoverUrl} onChange={(e) => setNewCoverUrl(e.target.value)} placeholder="Paste Image URL..." className="flex-1 bg-[#00232e] border border-[#7ae6ff]/15 rounded px-3 py-1.5 outline-none focus:border-[#dff8ff] text-[#b9eaff] text-sm" />
                   <button onClick={handleUpdateCover} className="bg-[#7ae6ff] text-[#00343d] px-4 py-1.5 rounded text-sm font-bold">Save</button>
                   <button onClick={() => setIsEditingCover(false)} className="bg-[#001017] text-[#bdc9cc] px-3 py-1.5 rounded text-sm border border-[#7ae6ff]/15">Cancel</button>
                 </div>
               </div>
             )}
             <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${activePage?.cover || defaultCover})` }}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#001017] via-[#001017]/40 to-transparent"></div>
             
             <div className="absolute bottom-8 left-8 flex items-end gap-6 w-full">
               <div className="relative">
                 {isEditingIcon && (
                   <div className="absolute -top-16 left-0 z-50 glass-panel p-2.5 rounded-xl flex gap-2 w-max shadow-xl animate-entrance">
                     <input type="text" autoFocus value={newIconVal} onChange={(e) => setNewIconVal(e.target.value)} placeholder="Emoji/URL..." className="w-24 bg-[#000b14] border border-[#7ae6ff]/15 rounded px-2 py-1 outline-none focus:border-[#dff8ff] text-[#b9eaff] text-sm text-center" />
                     <button onClick={handleUpdateIcon} className="bg-[#7ae6ff] text-[#00343d] px-3 py-1 rounded text-sm font-bold">Save</button>
                     <button onClick={() => setIsEditingIcon(false)} className="text-[#bdc9cc] px-2 py-1 font-bold hover:text-[#ffb4ab]">X</button>
                   </div>
                 )}
                 
                 <div onClick={() => { setIsEditingIcon(true); setNewIconVal(activePage?.icon || '📄'); }} className="w-24 h-24 shrink-0 glass-panel rounded-2xl flex items-center justify-center border-2 border-[#7ae6ff]/30 text-5xl transform transition hover:scale-110 duration-300 cursor-pointer overflow-hidden relative group/emblem">
                   {isEmblemUrl ? <img src={activePage.icon} onError={(e) => { e.target.onerror = null; e.target.src=defaultIcon; }} alt="icon" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} /> : <span>{activePage?.icon || '📄'}</span>}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/emblem:opacity-100 transition-opacity bg-[#000b14]/40 backdrop-blur-sm"><span className="material-symbols-outlined text-[#dff8ff] text-2xl">edit</span></div>
                 </div>
               </div>
               
               <div className="flex-1 pb-1 pr-12">
                 <input type="text" value={activePage?.title || ''} onChange={(e) => setPages(pages.map(p => p.id === activePageId ? { ...p, title: e.target.value } : p))} onBlur={(e) => handleUpdateTitle(e.target.value)} placeholder="Page Title..." className="bg-transparent border-none outline-none font-archivo text-[32px] font-bold text-[#b9eaff] w-full max-w-lg mb-2 p-0 focus:ring-0" />
                 
                 {/* Widget Toggle Pills Desktop */}
                 <div className="flex gap-2 mt-4">
                   <button onClick={() => toggleWidget('business')} className={`glass-panel px-4 py-2 rounded-full text-[11px] font-anybody uppercase flex items-center gap-2 transition-all duration-300 border ${isBusinessEnabled ? 'bg-[#10b981] text-white border-[#10b981] hover:bg-[#10b981]' : 'text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981] hover:text-white'}`}><span className="material-symbols-outlined text-sm">account_balance_wallet</span> Finance</button>
                   <button onClick={() => toggleWidget('todos')} className={`glass-panel px-4 py-2 rounded-full text-[11px] font-anybody uppercase flex items-center gap-2 transition-all duration-300 border ${isTodosEnabled ? 'bg-[#7ae6ff] text-[#001017] border-[#7ae6ff]' : 'text-[#7ae6ff] border-[#7ae6ff]/20 hover:bg-[#7ae6ff] hover:text-[#001017]'}`}><span className="material-symbols-outlined text-sm">checklist</span> Checklist</button>
                   <button onClick={() => toggleWidget('notes')} className={`glass-panel px-4 py-2 rounded-full text-[11px] font-anybody uppercase flex items-center gap-2 transition-all duration-300 border ${isNotesEnabled ? 'bg-[#7ae6ff] text-[#001017] border-[#7ae6ff]' : 'text-[#7ae6ff] border-[#7ae6ff]/20 hover:bg-[#7ae6ff] hover:text-[#001017]'}`}><span className="material-symbols-outlined text-sm">description</span> Notes</button>
                   <button onClick={() => toggleWidget('planner')} className={`glass-panel px-4 py-2 rounded-full text-[11px] font-anybody uppercase flex items-center gap-2 transition-all duration-300 border ${isPlannerEnabled ? 'bg-[#7ae6ff] text-[#001017] border-[#7ae6ff]' : 'text-[#7ae6ff] border-[#7ae6ff]/20 hover:bg-[#7ae6ff] hover:text-[#001017]'}`}><span className="material-symbols-outlined text-sm">calendar_month</span> Planner</button>
                   <button onClick={() => toggleWidget('stats')} className={`glass-panel px-4 py-2 rounded-full text-[11px] font-anybody uppercase flex items-center gap-2 transition-all duration-300 border ${isStatsEnabled ? 'bg-[#7ae6ff] text-[#001017] border-[#7ae6ff]' : 'text-[#7ae6ff] border-[#7ae6ff]/20 hover:bg-[#7ae6ff] hover:text-[#001017]'}`}><span className="material-symbols-outlined text-sm">monitoring</span> Stats</button>
                 </div>
               </div>
             </div>
             {activePageId && (
               <button onClick={handleDeletePage} className="absolute bottom-8 right-8 text-[#ffb4ab]/60 hover:text-[#ffb4ab] transition-colors duration-300 flex items-center gap-2 text-[11px] font-anybody uppercase"><span className="material-symbols-outlined text-sm">delete</span> Delete Page</button>
             )}
             <button onClick={() => { setIsEditingCover(true); setNewCoverUrl(activePage?.cover || ''); }} className="absolute top-4 right-4 glass-panel text-[#bdc9cc] hover:text-[#7ae6ff] px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 z-20"><span className="material-symbols-outlined text-sm">edit</span> Edit Cover</button>
          </section>

          {/* ================= FINANCE DESKTOP ================= */}
          {isBusinessEnabled && (
            <section className="space-y-6 animate-entrance stagger-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#10b981] finance-card-pulse rounded-full p-1">payments</span>
                  <input type="text" value={subtitles[`bus_${activePageId}`] || 'Buku Keuangan Utama'} onChange={(e) => setSubtitles({ ...subtitles, [`bus_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none font-archivo text-[20px] font-semibold text-[#c1ecff] w-full p-0 focus:ring-0" />
                </div>
                <div className="glass-panel px-4 py-1.5 rounded-lg text-[11px] font-anybody tracking-widest flex items-center gap-3 border-[#10b981]/20">
                  <span className="text-[#bdc9cc] uppercase">Kurs 1 DL:</span>
                  <span className="text-[#10b981] font-bold">Rp <input type="number" value={dlRate} onChange={(e) => setDlRate(e.target.value)} className="bg-transparent w-16 ml-1 p-0 border-none outline-none focus:ring-0 text-[#10b981]" /></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel finance-card-pulse p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-10 transform group-hover:scale-110 transition-all duration-500 pointer-events-none"><span className="material-symbols-outlined text-[#10b981]" style={{ fontSize: '160px', lineHeight: 1 }}>account_balance</span></div>
                  <p className="text-[11px] font-anybody uppercase tracking-[0.1em] text-[#bdc9cc] mb-2 relative z-10">Total Net Worth (Gabungan)</p>
                  <p className={`text-[32px] font-bold font-archivo tracking-tight relative z-10 ${totalKekayaanIDR >= 0 ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{formatIDR(totalKekayaanIDR)}</p>
                  <div className="mt-4 flex items-center gap-2 text-[#10b981] relative z-10"><span className="material-symbols-outlined text-sm animate-pulse">trending_up</span><span className="text-sm">Stable Today</span></div>
                </div>
                
                <div className="glass-panel finance-card-pulse p-6 rounded-xl relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-10 transform group-hover:scale-110 transition-all duration-500 pointer-events-none"><span className="material-symbols-outlined text-[#b9eaff]" style={{ fontSize: '160px', lineHeight: 1 }}>credit_card</span></div>
                  <p className="text-[11px] font-anybody uppercase tracking-[0.1em] text-[#bdc9cc] mb-2 relative z-10">Dompet Tabungan</p>
                  <p className={`text-[32px] font-bold font-archivo tracking-tight relative z-10 ${tabunganBalance >= 0 ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{formatIDR(tabunganBalance)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#7ae6ff]/15 pt-4 relative z-10">
                    <div><p className="text-[10px] text-[#bdc9cc] uppercase">Keluar</p><p className="text-[#ffb4ab] font-anybody font-bold text-sm">{formatIDR(tabunganOut)}</p></div>
                    <div className="text-right"><p className="text-[10px] text-[#bdc9cc] uppercase">Masuk</p><p className="text-[#10b981] font-anybody font-bold text-sm">{formatIDR(tabunganIn)}</p></div>
                  </div>
                </div>

                <div className="glass-panel finance-card-pulse p-6 rounded-xl relative overflow-hidden group border-r-4 border-[#10b981]/30">
                  <div className="absolute -bottom-4 -right-4 opacity-10 transform group-hover:scale-110 transition-all duration-500 pointer-events-none"><span className="material-symbols-outlined text-[#b9eaff]" style={{ fontSize: '160px', lineHeight: 1 }}>sports_esports</span></div>
                  <p className="text-[11px] font-anybody uppercase tracking-[0.1em] text-[#bdc9cc] mb-2 relative z-10">Profit Growtopia (Aset)</p>
                  <p className={`text-[32px] font-bold font-archivo tracking-tight relative z-10 ${isGtProfit ? 'text-[#00c8f9]' : 'text-[#ffb4ab]'}`}>{isGtProfit ? '+' : ''}{gtNetDL.toFixed(2)} DL</p>
                  <p className="text-sm text-[#bdc9cc] mt-1 relative z-10">≈ {formatIDR(gtNetIDR)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] uppercase text-[#bdc9cc] relative z-10">
                    <span>Modal: <span className="text-[#ffb4ab]">{gtModalDL.toFixed(2)} DL</span></span>
                    <span className="text-right">Omset: <span className="text-[#10b981]">{gtOmsetDL.toFixed(2)} DL</span></span>
                  </div>
                </div>
              </div>

              <div className="glass-panel finance-card-pulse p-8 rounded-xl h-[400px] flex flex-col group">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[#10b981]">show_chart</span><h5 className="text-base font-bold text-[#c1ecff]">Trend Kekayaan (Trading Style)</h5></div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold hover:bg-[#10b981]/20 transition-colors">1D</button>
                    <button className="px-3 py-1 rounded hover:bg-[#00313e] text-[#bdc9cc] text-[10px] font-bold transition-colors">1W</button>
                    <button className="px-3 py-1 rounded hover:bg-[#00313e] text-[#bdc9cc] text-[10px] font-bold transition-colors">1M</button>
                  </div>
                </div>
                <div className="flex-1 w-full relative"><canvas ref={financeChartRef}></canvas></div>
              </div>

              <div className="glass-panel p-6 rounded-xl shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-semibold text-[#c1ecff]">Buku Kas Transaksi (Ledger)</h3>
                    <div className="flex gap-3">
                        <button onClick={() => {setIsAddingTx(!isAddingTx); setIsTransferring(false);}} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isAddingTx ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#7ae6ff]/20 text-[#7ae6ff] hover:bg-[#7ae6ff]/30 border border-[#7ae6ff]/30'}`}><FaPlus /> Transaksi Kas</button>
                        <button onClick={() => {setIsTransferring(!isTransferring); setIsAddingTx(false);}} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isTransferring ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 border border-[#10b981]/30'}`}>⇄ Konversi Aset</button>
                    </div>
                 </div>

                 {isTransferring && (
                    <div className="p-4 mb-6 bg-[#001f29] border border-[#10b981]/50 rounded-xl flex gap-4 items-end animate-entrance">
                       <div><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Aksi</label><select value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)} className="bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm focus:border-[#10b981]"><option value="TABUNGAN_TO_GT">Beli Aset (Rp ➡️ DL)</option><option value="GT_TO_TABUNGAN">Jual Aset (DL ➡️ Rp)</option></select></div>
                       <div><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Tanggal</label><input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm focus:border-[#10b981]" /></div>
                       <div><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Nominal Rp</label><input type="number" value={transferAmountIDR} onChange={(e) => setTransferAmountIDR(e.target.value)} placeholder="0" className="w-32 bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm focus:border-[#10b981]" /></div>
                       <div className="flex-1"><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Keterangan</label><input type="text" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Tulis keterangan..." className="w-full bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm focus:border-[#10b981]" /></div>
                       <button onClick={handleTransferAction} className="bg-[#10b981] hover:bg-[#34d399] text-[#001017] px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">Eksekusi</button>
                    </div>
                 )}

                 {isAddingTx && (
                    <div className="p-4 mb-6 bg-[#001a2e] border border-[#7ae6ff]/30 rounded-xl flex gap-4 items-end animate-entrance">
                      <div className="flex bg-[#000b14] rounded-lg border border-[#7ae6ff]/15 p-1"><button onClick={() => handleTxCategoryToggle('TABUNGAN')} className={`px-4 py-1.5 text-[11px] font-bold rounded uppercase ${txCategory === 'TABUNGAN' ? 'bg-[#10b981] text-[#001017]' : 'text-[#bdc9cc]'}`}>Bank</button><button onClick={() => handleTxCategoryToggle('GT')} className={`px-4 py-1.5 text-[11px] font-bold rounded uppercase ${txCategory === 'GT' ? 'bg-[#00c8f9] text-[#005065]' : 'text-[#bdc9cc]'}`}>Aset GT</button></div>
                      <div className="flex-1"><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Deskripsi</label><input type="text" autoFocus value={newTxDesc} onChange={(e) => setNewTxDesc(e.target.value)} placeholder="Misal: Beli 200 Ghost Jar" className="w-full bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm focus:border-[#7ae6ff]" /></div>
                      <div><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Tanggal</label><input type="date" value={newTxDate} onChange={(e) => setNewTxDate(e.target.value)} className="bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm" /></div>
                      <div><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Tipe</label><select value={newTxType} onChange={(e) => setNewTxType(e.target.value)} className="bg-[#000b14] border border-[#7ae6ff]/15 rounded-lg px-3 py-2 outline-none text-[#b9eaff] text-sm"><option value="pengeluaran">Keluar (-)</option><option value="pemasukan">Masuk (+)</option></select></div>
                      <div><label className="block text-[11px] text-[#bdc9cc] mb-1.5 uppercase font-anybody">Jumlah</label><div className="flex"><input type="number" value={newTxAmount} onChange={(e) => setNewTxAmount(e.target.value)} placeholder="0" className="w-24 bg-[#000b14] border border-[#7ae6ff]/15 rounded-l-lg px-3 py-2 outline-none text-[#b9eaff] text-sm" />{txCategory === 'GT' ? <select value={newTxCurrency} onChange={(e) => setNewTxCurrency(e.target.value)} className="w-20 bg-[#002e3c] border border-[#7ae6ff]/15 rounded-r-lg px-2 py-2 outline-none text-[#b9eaff] text-sm"><option value="WL">WL</option><option value="DL">DL</option><option value="BGL">BGL</option></select> : <span className="bg-[#002e3c] border border-[#7ae6ff]/15 rounded-r-lg px-4 py-2 text-sm text-[#b9eaff] flex items-center font-bold">IDR</span>}</div></div>
                      <button onClick={handleAddTransaction} className="bg-[#7ae6ff] hover:bg-[#dff8ff] text-[#00343d] px-6 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(122,230,255,0.3)] transition-all">Simpan</button>
                    </div>
                 )}

                 <div className="space-y-2 mt-4">
                    {(transactions||[]).map((t) => {
                      const isTabungan = t.currency_type === 'TABUNGAN' || t.currency_type === 'IDR';
                      const isMasuk = t.type === 'pemasukan';
                      return (
                      <div key={t.id} className="flex justify-between items-center p-4 bg-[#001017] hover:bg-[#7ae6ff]/5 rounded-xl border border-[#7ae6ff]/10 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isMasuk ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'}`}><span className="material-symbols-outlined text-[18px]">{isMasuk ? 'arrow_downward' : 'arrow_upward'}</span></div>
                            <div>
                                <p className="text-[#c1ecff] text-[15px] font-semibold">{t.description}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    {editingTxId === t.id ? ( <input type="date" autoFocus value={editTxDate} onChange={(e) => setEditTxDate(e.target.value)} onBlur={() => handleUpdateTxDate(t.id, editTxDate)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateTxDate(t.id, editTxDate)} className="text-[11px] bg-[#000b14] border border-[#7ae6ff] text-[#dff8ff] px-2 py-0.5 rounded outline-none" /> ) : ( <span onClick={() => { setEditingTxId(t.id); setEditTxDate(t.date); }} className="text-[11px] font-anybody text-[#879396] cursor-pointer hover:text-[#7ae6ff] transition-colors">{t.date} ✎</span> )}
                                    <span className={`text-[10px] font-bold font-anybody px-2 py-0.5 rounded uppercase ${isTabungan ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#00c8f9]/10 text-[#00c8f9]'}`}>{isTabungan ? 'Bank' : 'Growtopia'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                              <span className={`font-data-mono text-[18px] font-bold ${isMasuk ? 'text-[#10b981]' : 'text-[#ffb4ab]'}`}>{isMasuk ? '+' : '-'}{isTabungan ? formatIDR(t.amount) : `${t.amount} ${t.currency_type}`}</span>
                              {!isTabungan && <p className="text-[11px] text-[#879396] mt-1 font-anybody">≈ {formatIDR((t.currency_type === 'BGL' ? t.amount * 100 : (t.currency_type === 'WL' ? t.amount / 100 : t.amount)) * dlRate)}</p>}
                          </div>
                          <button onClick={() => deleteTransaction(t.id)} className="text-[#ffb4ab]/60 opacity-0 group-hover:opacity-100 hover:text-[#ffb4ab] p-2 hover:bg-[#ffb4ab]/10 rounded-lg transition-all"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </div>
                    )})}
                 </div>
              </div>
            </section>
          )}

          {/* ================= PLANNER DESKTOP ================= */}
          {isPlannerEnabled && (
            <section className="space-y-6 animate-entrance stagger-3 mt-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#7ae6ff]" data-icon="calendar_month">calendar_month</span>
                <h4 className="font-archivo text-[20px] font-bold text-[#c1ecff]">Daily & Monthly Planner</h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {/* KALENDER */}
                    <div className="glass-panel p-6 rounded-xl border-t-2 border-[#7ae6ff]/30">
                      <div className="flex justify-between items-center mb-6">
                        <h5 className="text-base font-bold text-[#dff8ff]">{format(currentMonth, 'MMMM yyyy')}</h5>
                        <div className="flex gap-2">
                          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-[#7ae6ff]/10 hover:text-[#7ae6ff] rounded transition-all duration-300"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-[#7ae6ff]/10 hover:text-[#7ae6ff] rounded transition-all duration-300"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                        </div>
                      </div>
                      
                      <div>
                          <div className="grid grid-cols-7 border-t border-l border-[#7ae6ff]/15">
                            {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => (
                                <div key={day} className="p-2 text-center text-[10px] font-anybody font-bold text-[#879396] border-r border-b border-[#7ae6ff]/15 bg-[#001017]/50">{day}</div>
                            ))}
                          </div>
                          {renderCalendarDesktop()}
                      </div>
                    </div>

                    {/* TARGET BULANAN */}
                    <div className="glass-panel p-6 rounded-xl border-t-4 border-[#00c8f9]">
                        <h3 className="text-base font-bold text-[#00c8f9] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#00c8f9]">emoji_events</span>
                            Target Bulanan: {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <div className="space-y-2 mb-5">
                            {monthlyTodos.map(task => (
                                <div key={task.id} className="flex items-start justify-between p-2 hover:bg-[#7ae6ff]/5 rounded group border border-transparent hover:border-[#7ae6ff]/15 transition-colors">
                                <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => toggleBlock(task.id, task.is_completed)}>
                                    <div className={`mt-0.5 ${task.is_completed ? 'text-[#10b981]' : 'text-[#879396]'}`}><span className="material-symbols-outlined text-[16px]">{task.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                                    <span className={`text-sm ${task.is_completed ? 'line-through text-[#879396]' : 'text-[#b9eaff]'}`}>{task.content}</span>
                                </div>
                                <button onClick={() => deleteBlock(task.id)} className="text-[#ffb4ab]/50 opacity-0 group-hover:opacity-100 p-1.5 hover:text-[#ffb4ab] transition-all"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                                </div>
                            ))}
                            <div className="flex items-center gap-3 px-2 pt-2">
                                <span className="material-symbols-outlined text-[#879396] text-[16px]">add</span>
                                <input type="text" value={newMonthlyTodo} onChange={(e) => setNewMonthlyTodo(e.target.value)} onKeyDown={(e) => handleAddCustomBlockEnter(e, `monthly_todo_${monthKey}`, newMonthlyTodo, setNewMonthlyTodo)} className="w-full bg-transparent border-0 border-b border-[#3d494c] focus:ring-0 focus:border-[#00c8f9] text-sm p-1.5 text-[#b9eaff] placeholder:text-[#879396] transition-all outline-none" placeholder="Tambah target bulan ini..." />
                            </div>
                        </div>
                        <div className="pt-5 border-t border-[#7ae6ff]/15">
                            <h4 className="text-[11px] font-anybody tracking-widest font-bold text-[#879396] mb-3 uppercase">Catatan Bulan Ini</h4>
                            {monthlyNotes.map(note => (
                                <div key={note.id} className="relative group mb-3">
                                    <textarea className="w-full bg-[#000b14] border border-[#00c8f9]/30 rounded-xl p-4 text-sm text-[#b9eaff] transition-all focus:min-h-[120px] min-h-[80px] outline-none focus:border-[#00c8f9] custom-scrollbar" defaultValue={note.content} onBlur={(e) => handleUpdateBlockContent(note.id, e.target.value)} />
                                    <button onClick={() => deleteBlock(note.id)} className="absolute top-2 right-2 text-[#ffb4ab] opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#ffb4ab]/10 rounded bg-[#001017]"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                                </div>
                            ))}
                            {monthlyNotes.length === 0 && (
                                <div onClick={() => handleAddCustomBlockClick(`monthly_note_${monthKey}`, 'Catatan bulan ini...')} className="w-full h-16 bg-[#001a2e]/30 rounded-xl border border-dashed border-[#00c8f9]/30 flex items-center justify-center cursor-pointer hover:bg-[#00c8f9]/10 transition-all group">
                                    <span className="text-[10px] font-anybody tracking-widest text-[#879396] group-hover:text-[#00c8f9] uppercase">+ Klik untuk tambah catatan bulan ini</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-4 space-y-6">
                  <div className="glass-panel p-6 rounded-xl border-l-4 border-[#7ae6ff] h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="material-symbols-outlined text-[#7ae6ff] text-[18px]">check_box</span>
                      <h6 className="text-base font-bold text-[#b9eaff]">Tasks for {format(selectedDate, 'MMM d, yyyy')}</h6>
                    </div>
                    <div className="space-y-2 flex-1">
                      {(dailyTasks||[]).map(task => (
                         <div key={task.id} className="flex items-start justify-between p-2 hover:bg-[#7ae6ff]/5 rounded group transition-colors border border-transparent hover:border-[#7ae6ff]/15">
                           <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => toggleDailyTask(task.id, task.is_completed)}>
                             <div className={`mt-0.5 ${task.is_completed ? 'text-[#10b981]' : 'text-[#879396]'}`}><span className="material-symbols-outlined text-[16px]">{task.is_completed ? 'check_box' : 'check_box_outline_blank'}</span></div>
                             <span className={`text-sm ${task.is_completed ? 'line-through text-[#879396]' : 'text-[#b9eaff]'}`}>{task.task_name}</span>
                           </div>
                           <button onClick={() => deleteDailyTask(task.id)} className="text-[#ffb4ab]/50 opacity-0 group-hover:opacity-100 p-1 hover:text-[#ffb4ab] transition-colors"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                         </div>
                      ))}
                      <div className="flex items-center gap-3 px-2 pt-2">
                        <span className="material-symbols-outlined text-[#879396] text-[16px]">add</span>
                        <input type="text" value={newDailyTaskName} onChange={(e) => setNewDailyTaskName(e.target.value)} onKeyDown={handleAddDailyTask} className="w-full bg-transparent border-0 border-b border-[#3d494c] focus:ring-0 focus:border-[#7ae6ff] text-sm p-1.5 text-[#b9eaff] placeholder:text-[#879396] transition-all outline-none" placeholder="Tambah jadwal harian..." />
                      </div>
                      
                      <div className="pt-6 mt-6 border-t border-[#7ae6ff]/15">
                        <div className="flex items-center gap-2 text-[11px] font-anybody font-bold text-[#879396] uppercase tracking-widest mb-3"><span className="material-symbols-outlined text-[14px] text-[#7ae6ff]">description</span> Detail Quest Harian</div>
                        {dailyNoteBlocks.map(note => (
                            <div key={note.id} className="relative group">
                                <textarea className="w-full bg-[#000b14] border border-[#7ae6ff]/30 rounded-xl p-4 text-sm text-[#b9eaff] transition-all duration-300 focus:min-h-[150px] min-h-[100px] outline-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus:border-[#7ae6ff] custom-scrollbar" defaultValue={note.content} onBlur={(e) => handleUpdateBlockContent(note.id, e.target.value)} />
                                <button onClick={() => deleteBlock(note.id)} className="absolute top-2 right-2 text-[#ffb4ab] opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#ffb4ab]/10 rounded bg-[#001017]"><span className="material-symbols-outlined text-[12px]">delete</span></button>
                            </div>
                        ))}
                        {dailyNoteBlocks.length === 0 && (
                            <div onClick={() => handleAddCustomBlockClick(`daily_note_${currentDateStr}`, 'Catatan harian baru...')} className="w-full h-24 bg-[#001a2e]/30 rounded-xl border border-dashed border-[#7ae6ff]/30 flex items-center justify-center cursor-pointer hover:bg-[#7ae6ff]/10 hover:border-[#7ae6ff]/60 hover:shadow-[0_0_15px_rgba(122,230,255,0.1)] transition-all duration-300 group">
                                <span className="text-[10px] font-anybody text-[#879396] group-hover:text-[#7ae6ff] uppercase tracking-widest">+ Klik untuk rincian note hari ini</span>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= STATISTIK DESKTOP ================= */}
          {isStatsEnabled && (
            <section className="space-y-6 animate-entrance stagger-4 mt-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#7ae6ff]" data-icon="monitoring">monitoring</span>
                <input type="text" value={subtitles[`st_${activePageId}`] || 'Dashboard Produktivitas'} onChange={(e) => setSubtitles({ ...subtitles, [`st_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none font-archivo text-[20px] font-bold text-[#c1ecff] w-full p-0 focus:ring-0" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl border-b-2 border-[#7ae6ff]/40"><p className="text-[10px] font-anybody text-[#bdc9cc] uppercase tracking-widest mb-2">CHECKLIST SELESAI</p><h6 className="text-3xl font-bold font-headline-lg text-[#dff8ff]">{blocksPercent}%</h6></div>
                <div className="glass-panel p-5 rounded-xl border-b-2 border-[#7ae6ff]/40"><p className="text-[10px] font-anybody text-[#bdc9cc] uppercase tracking-widest mb-2">HARI INI</p><h6 className="text-3xl font-bold font-headline-lg text-[#dff8ff]">{dailyPercent}%</h6></div>
                <div className="glass-panel p-5 rounded-xl border-b-2 border-[#7ae6ff]/40"><p className="text-[10px] font-anybody text-[#bdc9cc] uppercase tracking-widest mb-2">MINGGU INI</p><h6 className="text-3xl font-bold font-headline-lg text-[#dff8ff]">{weeklyPercent}%</h6></div>
                <div className="glass-panel p-5 rounded-xl border-b-2 border-[#7ae6ff]/40"><p className="text-[10px] font-anybody text-[#bdc9cc] uppercase tracking-widest mb-2">TAHUN INI</p><h6 className="text-3xl font-bold font-headline-lg text-[#dff8ff]">{yearlyPercent}%</h6></div>
              </div>
              <div className="glass-panel p-8 rounded-xl border border-[#7ae6ff]/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <h5 className="text-base font-bold text-[#c1ecff]">Analisis Produktivitas Mendalam</h5>
                  <div className="flex bg-[#000b14] p-1.5 rounded-lg border border-[#3d494c] gap-1">
                    {['harian', 'mingguan', 'bulanan', 'tahunan', 'keseluruhan'].map((tab) => (<button key={tab} onClick={() => setStatsView(tab)} className={`px-5 py-2 text-[11px] font-anybody tracking-widest rounded-md uppercase transition-all duration-300 ${statsView === tab ? 'bg-[#7ae6ff] text-[#001017] shadow-lg' : 'text-[#879396] hover:text-[#dff8ff] hover:bg-[#7ae6ff]/10'}`}>{tab}</button>))}
                  </div>
                </div>
                <div className="relative h-[300px] w-full"><canvas ref={chartRef}></canvas></div>
              </div>
            </section>
          )}

          {/* ================= BENTO GRID (TARGETS & NOTES DESKTOP) ================= */}
          {(isTodosEnabled || isNotesEnabled) && (
            <div className={`grid grid-cols-1 ${isTodosEnabled && isNotesEnabled ? 'lg:grid-cols-12' : ''} gap-6 animate-entrance stagger-4 mt-8`}>
              
              {isTodosEnabled && (
                <div className={`${isNotesEnabled ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
                   <div className="glass-panel p-6 rounded-xl border border-[#7ae6ff]/10 group h-full">
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                        <h5 className="font-archivo text-[20px] font-bold flex items-center gap-2 text-[#c1ecff]">
                           <span className="material-symbols-outlined text-[#7ae6ff] group-hover:rotate-12 transition-transform duration-300">event_note</span> Targets & Content
                        </h5>
                        {isAddingGroup ? (
                            <div className="flex gap-2 w-full sm:w-auto"><input type="text" autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTargetGroup()} placeholder="Nama Target Plan..." className="bg-[#000b14] border border-[#7ae6ff]/50 rounded-lg px-3 py-1.5 text-xs outline-none text-[#b9eaff] flex-1" /><button onClick={handleAddTargetGroup} className="bg-[#7ae6ff] text-[#001017] px-3 py-1.5 rounded-lg text-xs font-bold">OK</button><button onClick={() => setIsAddingGroup(false)} className="text-[#879396] text-xs px-2 hover:text-[#ffb4ab]"><span className="material-symbols-outlined text-[16px]">close</span></button></div>
                        ) : (
                            <button onClick={() => setIsAddingGroup(true)} className="text-[#7ae6ff] text-xs font-bold flex items-center gap-1 hover:underline transition-all duration-300 w-fit"><span className="material-symbols-outlined text-[14px]">add</span> Add Group</button>
                        )}
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-2 mb-8">
                           <div className="flex justify-between text-sm font-bold text-[#b9eaff]"><span>Overall Progress</span><span className="text-[#7ae6ff] font-bold">{blocksPercent}%</span></div>
                           <div className="h-2 w-full bg-[#000b14] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#00c8f9] to-[#7ae6ff] rounded-full shadow-[0_0_15px_rgba(122,230,255,0.6)] transition-all duration-1000" style={{ width: `${blocksPercent}%` }}></div></div>
                        </div>

                        {currentPageGroups.map((groupType) => {
                            const groupBlocks = (blocks || []).filter(b => b.type === groupType);
                            const currentTitleKey = `title_${groupType}_${activePageId}`;
                            return (
                                <div key={groupType} className="mb-6 relative group/section bg-[#001a2e]/30 p-5 rounded-xl border border-[#7ae6ff]/10">
                                    <div className="flex items-center justify-between mb-4 border-b border-[#7ae6ff]/15 pb-2">
                                        <input type="text" value={subtitles[currentTitleKey] || (groupType === 'todo' ? 'Target Utama' : 'Target Content')} onChange={(e) => setSubtitles({ ...subtitles, [currentTitleKey]: e.target.value })} className="bg-transparent border-none outline-none text-[15px] font-bold text-[#dff8ff] w-3/4 focus:bg-[#7ae6ff]/10 rounded px-2 py-1 transition-colors" />
                                        {groupType !== 'todo' && (<button onClick={() => handleDeleteTargetGroup(groupType)} className="text-[#ffb4ab]/50 opacity-0 group-hover/section:opacity-100 hover:text-[#ffb4ab] transition-opacity p-1.5 hover:bg-[#ffb4ab]/10 rounded-lg"><span className="material-symbols-outlined text-[14px]">delete</span></button>)}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {groupBlocks.map((block) => (
                                            <div key={block.id} className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer group flex items-start justify-between gap-3 ${block.is_completed ? 'bg-[#10b981]/5 border-[#10b981]/20 hover:border-[#10b981]/50' : 'bg-[#000b14] border-[#3d494c] hover:border-[#7ae6ff]/50 hover:bg-[#001f29]'}`}>
                                                <div className="flex items-start gap-3 flex-1" onClick={() => toggleBlock(block.id, block.is_completed)}>
                                                    <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all duration-300 ${block.is_completed ? 'border-[#10b981] bg-[#10b981]/20 text-[#10b981]' : 'border-[#879396] group-hover:border-[#7ae6ff]'}`}>
                                                        {block.is_completed && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                                                    </div>
                                                    <span className={`text-sm ${block.is_completed ? 'line-through text-[#879396]' : 'text-[#b9eaff]'}`}>{block.content}</span>
                                                </div>
                                                <button onClick={() => deleteBlock(block.id)} className="text-[#ffb4ab]/50 opacity-0 group-hover:opacity-100 hover:text-[#ffb4ab] p-1 hover:bg-[#ffb4ab]/10 rounded"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                                            </div>
                                        ))}
                                    </div>
                                    {activeGroupInput === groupType ? (
                                        <div className="flex items-center gap-3 p-2.5 mt-3 bg-[#000b14] rounded-lg border border-[#7ae6ff]/30"><span className="material-symbols-outlined text-[#879396] text-[16px]">check_box_outline_blank</span><input type="text" autoFocus value={newBlockContent[groupType] || ''} onChange={(e) => setNewBlockContent({ ...newBlockContent, [groupType]: e.target.value })} onKeyDown={(e) => handleAddBlockInGroup(e, groupType)} onBlur={() => setActiveGroupInput(null)} placeholder="Ketik lalu Enter..." className="bg-transparent border-none outline-none text-[#b9eaff] w-full text-sm py-0.5 focus:ring-0" /></div>
                                    ) : (
                                        <div onClick={() => setActiveGroupInput(groupType)} className="flex items-center gap-2 p-2 mt-3 cursor-pointer text-[#879396] hover:text-[#dff8ff] hover:bg-[#7ae6ff]/10 transition-colors rounded-lg w-fit"><span className="material-symbols-outlined text-[14px]">add</span> <span className="text-xs font-bold">New Item</span></div>
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
                   <div className="glass-panel p-6 rounded-xl flex flex-col h-full border border-[#7ae6ff]/10 group">
                      <div className="flex justify-between items-center mb-6">
                        <h5 className="font-archivo text-[20px] font-bold flex items-center gap-2 text-[#c1ecff]">
                            <span className="material-symbols-outlined text-[#7ae6ff] group-hover:scale-110 transition-transform duration-300">description</span>
                            <input type="text" value={subtitles[`nt_${activePageId}`] || 'My Notes'} onChange={(e) => setSubtitles({ ...subtitles, [`nt_${activePageId}`]: e.target.value })} className="bg-transparent border-none outline-none text-[#c1ecff] w-full p-0 focus:ring-0" />
                        </h5>
                        <button onClick={() => setIsAddingNote(!isAddingNote)} className="bg-[#7ae6ff]/10 hover:bg-[#7ae6ff]/20 text-[#7ae6ff] px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">{isAddingNote ? 'close' : 'add'}</span> {isAddingNote ? 'Batal' : 'Tambah Note'}
                        </button>
                      </div>

                      <div className="flex-1 space-y-4">
                        {isAddingNote && (
                            <div className="p-4 bg-[#001a2e]/60 border border-[#7ae6ff]/40 rounded-xl space-y-4 relative overflow-hidden animate-entrance">
                                <textarea autoFocus value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 text-sm text-[#b9eaff] resize-none h-32 placeholder:text-[#879396] custom-scrollbar outline-none" placeholder="Tulis catatan di sini..."></textarea>
                                <div className="flex justify-end gap-3 items-center mt-2">
                                    <button onClick={() => setIsAddingNote(false)} className="text-[11px] font-anybody tracking-widest font-bold text-[#879396] hover:text-[#dff8ff] transition-colors uppercase">Batal</button>
                                    <button onClick={handleAddNote} className="bg-[#7ae6ff] text-[#001017] px-5 py-2 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(122,230,255,0.2)] hover:shadow-[0_0_20px_rgba(122,230,255,0.5)] transition-all">Simpan Note</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {noteBlocks.map((note) => (
                                <div key={note.id} className="p-4 bg-[#000b14] rounded-xl border border-[#7ae6ff]/15 hover:border-[#7ae6ff]/40 transition-all duration-300 relative group/note">
                                    {editingNoteId === note.id ? (
                                        <div className="flex flex-col gap-2"><textarea autoFocus value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} className="w-full h-24 bg-[#001a2e] border border-[#7ae6ff] rounded-lg p-3 text-[#b9eaff] outline-none resize-none text-sm custom-scrollbar" /><div className="flex gap-2 justify-end"><button onClick={() => setEditingNoteId(null)} className="text-[11px] font-anybody uppercase tracking-widest text-[#879396] px-2 py-1 hover:text-[#dff8ff]">Batal</button><button onClick={() => handleUpdateBlockContent(note.id, editNoteContent)} className="bg-[#7ae6ff] text-[#001017] text-[11px] font-bold font-anybody tracking-widest uppercase px-4 py-1.5 rounded-lg shadow-lg">Update</button></div></div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-[#b9eaff] whitespace-pre-wrap leading-relaxed pr-10">{note.content}</p>
                                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity bg-[#001017]/80 p-1 rounded-lg backdrop-blur-sm border border-[#7ae6ff]/15">
                                                <button onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }} className="text-[#7ae6ff] p-1.5 hover:bg-[#7ae6ff]/20 rounded-md"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                                                <button onClick={() => deleteBlock(note.id)} className="text-[#ffb4ab] p-1.5 hover:bg-[#ffb4ab]/20 rounded-md"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {noteBlocks.length === 0 && !isAddingNote && <div className="text-center py-8 opacity-50 border border-dashed border-[#7ae6ff]/20 rounded-xl"><span className="material-symbols-outlined text-4xl mb-2 text-[#879396]">note_stack</span><p className="text-sm font-bold text-[#879396]">Belum ada catatan.</p></div>}
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