import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import Chart from 'chart.js/auto';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getYear, getMonth, subDays } from 'date-fns';

// ============================================================
// QUESTFOLIO — Minecraft Enchanted Forest Dashboard
// Design System: Space Grotesk + JetBrains Mono, Dark Oak Pixel UI
// ============================================================

// --- Logo Image URL ---
const LOGO_URL = "https://lh3.googleusercontent.com/aida/AEtjO1Vu6KWUXzj0k3ZiG7gzse_YAjiVcrMTgaevJ1NgEV-HZmKOXPuCjiQz1HZL-KaecZOABEKB3H3Bj8YFZ_ABOGCiBYWK1IsQ4yzATAjbwxqffNYbOZbebdpfYG_nkHq8TWOzukBSOSCho8aFaOU9D5mqcU82c2SKVGXzA-2FOEXERun5-bnOigm3-kGL_N-SSU2vL5rfcPPPCAdua9rzejrKWbOgV5LuWiRGZU2RA3Ta6EllVgMlZYZ1meA";

// ============================================================
// PANEL VINES — Corner Decorations for individual panels
// ============================================================
function PanelVines() {
  const VINE_GREEN = '#2D5A14';
  const VINE_BRIGHT = '#4A8C28';
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {/* Top Left Corner */}
      <svg className="absolute top-0 left-0 w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 32 Q16 32 32 16 Q48 0 64 0" stroke={VINE_GREEN} strokeWidth="3" strokeLinecap="round"/>
        <path d="M0 16 Q8 16 16 8 Q24 0 32 0" stroke={VINE_GREEN} strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="24" cy="24" rx="4" ry="2" fill={VINE_BRIGHT} transform="rotate(-45 24 24)"/>
        <ellipse cx="40" cy="8" rx="4" ry="2" fill={VINE_GREEN} transform="rotate(-30 40 8)"/>
        {/* Tiny pink flower */}
        <rect x="12" y="32" width="6" height="6" fill="#D84898"/>
        <rect x="14" y="34" width="2" height="2" fill="#FFD060"/>
      </svg>
      {/* Bottom Right Corner */}
      <svg className="absolute bottom-0 right-0 w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M64 32 Q48 32 32 48 Q16 64 0 64" stroke={VINE_GREEN} strokeWidth="3" strokeLinecap="round"/>
        <path d="M64 48 Q56 48 48 56 Q40 64 32 64" stroke={VINE_GREEN} strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="40" cy="40" rx="4" ry="2" fill={VINE_BRIGHT} transform="rotate(-45 40 40)"/>
        <ellipse cx="24" cy="56" rx="4" ry="2" fill={VINE_GREEN} transform="rotate(-30 24 56)"/>
        {/* Tiny orange flower */}
        <rect x="44" y="24" width="6" height="6" fill="#FF9020"/>
        <rect x="46" y="26" width="2" height="2" fill="#FFD060"/>
      </svg>
    </div>
  );
}



// ============================================================
// VINE OVERLAY — Enchanted Forest Pixel Art Border Decoration
// ============================================================
const VINE_GREEN  = '#2D5A14';
const VINE_LIGHT  = '#3D7A20';
const VINE_BRIGHT = '#4A8C28';
const LEAF_DARK   = '#1A3A08';

function PixelFlowerPink({ x, y, scale = 1 }) {
  const s = scale * 4;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={s} y={0}     width={s} height={s} fill="#D84898"/>
      <rect x={0} y={s}     width={s*3} height={s} fill="#E060A8"/>
      <rect x={-s} y={s*2}  width={s*5} height={s} fill="#D84898"/>
      <rect x={0} y={s*3}   width={s*3} height={s} fill="#E060A8"/>
      <rect x={s} y={s*4}   width={s} height={s} fill="#D84898"/>
      {/* center */}
      <rect x={s*0.5} y={s*1.5} width={s*2} height={s*2} fill="#FFD060"/>
      <rect x={s}     y={s*2}   width={s} height={s}     fill="#FFA020"/>
      {/* stem */}
      <rect x={s+2} y={s*5} width={4} height={s*3} fill={VINE_GREEN}/>
    </g>
  );
}

function PixelFlowerOrange({ x, y, scale = 1 }) {
  const s = scale * 3;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={s}   y={0}   width={s} height={s} fill="#FF9020"/>
      <rect x={0}   y={s}   width={s*3} height={s} fill="#FFAA30"/>
      <rect x={s}   y={s*2} width={s} height={s} fill="#FF9020"/>
      <rect x={s+1} y={s}   width={s-2} height={s} fill="#FFD060"/>
      {/* stem */}
      <rect x={s+1} y={s*3} width={3} height={s*2} fill={VINE_GREEN}/>
    </g>
  );
}

function PixelMushroom({ x, y, scale = 1 }) {
  const s = scale * 4;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* cap */}
      <rect x={-s} y={0}      width={s}   height={s}   fill="#C8A870"/>
      <rect x={0}  y={-s*0.5} width={s*3} height={s*1.5} fill="#D4B880"/>
      <rect x={s*3} y={0}     width={s}   height={s}   fill="#C8A870"/>
      <rect x={0}  y={s}      width={s*3} height={s*0.5} fill="#B89060"/>
      {/* stem */}
      <rect x={s*0.5} y={s*1.5} width={s*2} height={s*2.5} fill="#E8D8A8"/>
      <rect x={s}     y={s*1.5} width={s}   height={s*2.5} fill="#F0E0B8"/>
    </g>
  );
}

function VineOverlay() {
  // Blue firefly dots: [x_offset_from_edge, top, side]
  const leftDots  = [[168,200],[152,278],[172,355],[160,432],[174,510],[155,588],[163,666]];
  const rightDots = [[14,230],[6,310],[18,390],[8,470],[16,550],[5,630],[12,710]];

  // Leaf positions along vine: [cx, cy, rx, ry, rotate]
  const leftLeaves = [
    [130,690,15,7,-22],[92,678,12,5,15],[58,668,10,5,-10],
    [118,530,14,6,-26],[82,522,12,5,20],[50,514,10,5,-14],
    [122,370,13,6,-20],[92,362,11,5,16],[67,353,9,4,-8],
    [120,212,13,6,-23],[90,203,11,5,18],[64,194,9,4,-10],
  ];

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 48, pointerEvents: 'none' }}>

      {/* ═══ LEFT VINE ═══ */}
      <svg className="absolute left-0 top-0 h-full" width="200" viewBox="0 0 200 900"
           preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main stem */}
        <path d="M158 900 Q152 800 162 718 Q172 636 150 558 Q132 480 156 400 Q176 322 146 242 Q126 180 152 118 Q159 82 156 48 Q153 24 157 0"
          fill="none" stroke={VINE_GREEN} strokeWidth="5" strokeLinecap="round"/>
        {/* Side branches */}
        <path d="M162 718 Q132 706 112 698 Q88 686 66 676" fill="none" stroke={VINE_GREEN} strokeWidth="3" strokeLinecap="round"/>
        <path d="M150 558 Q122 543 100 537 Q78 530 52 520" fill="none" stroke={VINE_GREEN} strokeWidth="3" strokeLinecap="round"/>
        <path d="M156 400 Q128 385 106 378 Q82 369 58 359" fill="none" stroke={VINE_GREEN} strokeWidth="3" strokeLinecap="round"/>
        <path d="M146 242 Q124 228 102 219 Q78 209 54 199" fill="none" stroke={VINE_GREEN} strokeWidth="3" strokeLinecap="round"/>
        {/* Leaves */}
        {leftLeaves.map(([cx,cy,rx,ry,rot],i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={i%3===0?VINE_GREEN:i%3===1?LEAF_DARK:VINE_BRIGHT} transform={`rotate(${rot},${cx},${cy})`}/>
        ))}
        {/* Pink flowers */}
        <PixelFlowerPink x={52} y={620} scale={1.1}/>
        <PixelFlowerPink x={30} y={450} scale={1.0}/>
        <PixelFlowerPink x={46} y={270} scale={0.9}/>
        {/* Orange flowers */}
        <PixelFlowerOrange x={95} y={320} scale={1.0}/>
        <PixelFlowerOrange x={72} y={178} scale={0.9}/>
        <PixelFlowerOrange x={110} y={490} scale={0.85}/>
        {/* Mushrooms at bottom */}
        <PixelMushroom x={55} y={810} scale={1.2}/>
        <PixelMushroom x={92} y={828} scale={0.9}/>
        <PixelMushroom x={22} y={840} scale={0.8}/>
        {/* Ground grass line */}
        <rect x="0" y="868" width="200" height="32" fill={LEAF_DARK} opacity="0.85"/>
        <rect x="0" y="858" width="200" height="12" fill={VINE_GREEN} opacity="0.6"/>
        {[12,24,38,52,68,82,98,114,128,144,160,175].map((x,i) => (
          <rect key={i} x={x} y={848} width={i%2===0?4:3} height={10+(i%3)*2}
            fill={i%2===0?VINE_BRIGHT:VINE_GREEN}
            transform={`rotate(${i%2===0?-6:7},${x+2},855)`}/>
        ))}
      </svg>

      {/* Left firefly dots */}
      {leftDots.map(([left, top], i) => (
        <div key={`ld${i}`} style={{
          position:'absolute', left, top,
          width:6, height:6,
          background:'#4488FF',
          boxShadow:'0 0 8px #4488FF, 0 0 18px rgba(68,136,255,0.5)',
        }}/>
      ))}

      {/* ═══ RIGHT VINE (mirrored) ═══ */}
      <svg className="absolute right-0 top-0 h-full" width="40" viewBox="0 0 40 900"
           preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0 Q12 80 8 160 Q4 260 10 360 Q16 460 8 560 Q2 660 10 760 Q16 830 10 900"
          fill="none" stroke={VINE_GREEN} strokeWidth="4" strokeLinecap="round"/>
        {[150,300,450,600,750].map((cy,i) => (
          <ellipse key={i} cx={20} cy={cy} rx={14} ry={6} fill={i%2===0?VINE_BRIGHT:VINE_GREEN} transform={`rotate(${i%2===0?20:-15},20,${cy})`}/>
        ))}
        <rect x="0" y="868" width="40" height="32" fill={LEAF_DARK} opacity="0.85"/>
        <rect x="0" y="858" width="40" height="12" fill={VINE_GREEN} opacity="0.6"/>
      </svg>

      {/* Right firefly dots */}
      {rightDots.map(([right, top], i) => (
        <div key={`rd${i}`} style={{
          position:'absolute', right, top,
          width:6, height:6,
          background:'#4488FF',
          boxShadow:'0 0 8px #4488FF, 0 0 18px rgba(68,136,255,0.5)',
        }}/>
      ))}
    </div>
  );
}



// ============================================================
// SHARED SIDEBAR
// ============================================================
function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    { id: 'command-center', icon: 'swords', label: 'Command Center' },
    { id: 'study-workspace', icon: 'menu_book', label: 'Study Workspace' },
    { id: 'asset-vault', icon: 'lock', label: 'Asset Vault' },
    { id: 'profit-analytics', icon: 'monitoring', label: 'Profit Analytics' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between shadow-[4px_0_0_0_#050300] border-r-2 border-inverse-surface">
      <div className="flex flex-col">
        {/* Logo */}
        <div className="h-16 px-step-md flex items-center gap-step-sm bg-surface-container border-b-2 border-inverse-surface">
          <img src={LOGO_URL} alt="QUESTFOLIO Logo" className="h-8 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">QUESTFOLIO</span>
            <span className="font-label-sm text-label-sm text-primary font-bold tracking-widest">STUDY &amp; VAULT</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="p-step-md">
          <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[2px_2px_0_0_#050300]">
            <div className="flex items-center justify-between mb-step-xs">
              <div className="flex items-center gap-step-xs">
                <span className="bg-inverse-surface text-tertiary-fixed-dim px-step-xs py-pixel-unit font-label-sm text-label-sm border border-tertiary-fixed-dim">LVL 18</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">MAGE</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">8.420 / 10k XP</span>
            </div>
            <div className="h-3 w-full bg-surface-dim border-2 border-inverse-surface p-[1px] shadow-[inset_1px_1px_0_0_#050300]">
              <div className="h-full bg-primary-container mana-glow transition-all" style={{ width: '84%' }}></div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-step-xs px-step-md">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-step-sm px-step-md py-step-sm rounded transition-all text-left w-full ${
                activePage === item.id
                  ? 'bg-primary-container text-on-primary-container font-bold border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300]'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-lg text-label-lg">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Status */}
      <div className="p-step-md border-t-2 border-inverse-surface bg-surface-container flex flex-col gap-step-sm">
        <div className="flex items-center justify-between bg-surface-container-high p-step-xs border border-inverse-surface">
          <div className="flex items-center gap-step-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">music_note</span>
            <span className="font-label-sm text-label-sm text-on-surface">BGM: Lofi Mana</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-container px-step-xs border border-inverse-surface font-bold">ON</span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-pixel-unit">
            <span className="h-2 w-2 bg-primary-container border border-inverse-surface inline-block"></span>
            <span>SERVER ONLINE</span>
          </div>
          <span>24ms</span>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// SHARED HEADER
// ============================================================
function Header({ formatIDR, tabunganBalance, gtNetDL, isSyncing, handleSyncData }) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-md z-40 border-b-2 border-inverse-surface shadow-[0_2px_0_0_#050300]">
      <div className="h-16 w-full px-step-lg flex items-center justify-between">
        <div className="flex items-center gap-step-md">
          {/* Streak badge */}
          <div className="flex items-center gap-step-xs px-step-sm py-pixel-unit bg-surface-container-high border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300]">
            <span className="material-symbols-outlined text-primary text-[18px]">local_fire_department</span>
            <span className="font-label-md text-label-md text-on-surface">24 DAY STREAK</span>
          </div>
          {/* Wallet summary */}
          <div className="hidden md:flex items-center gap-step-sm px-step-md py-pixel-unit bg-surface-container border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300]">
            <div className="flex items-center gap-step-xs font-label-md text-label-md text-on-surface">
              <span className="material-symbols-outlined text-primary text-[16px]">payments</span>
              <span>{formatIDR ? formatIDR(tabunganBalance) : 'Rp 0'}</span>
            </div>
            <span className="text-outline-variant font-label-sm text-label-sm">|</span>
            <div className="flex items-center gap-step-xs font-label-md text-label-md text-on-surface">
              <span className="material-symbols-outlined text-primary text-[16px]">diamond</span>
              <span>{gtNetDL ? `${gtNetDL.toFixed(1)} DL` : '0 DL'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-step-md">
          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            className="h-9 w-9 bg-surface-container-high border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300] flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors pixel-btn"
            title="Sync Data"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
          </button>
          <button className="h-9 w-9 bg-surface-container-high border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300] flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors pixel-btn">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
          </button>
          <div className="flex items-center gap-step-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-inverse-surface">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
            <span className="hidden sm:inline font-label-md text-label-md text-on-surface font-bold">Archmage Kael</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// PAGE: COMMAND CENTER
// ============================================================
function CommandCenterPage({
  transactions, formatIDR, tabunganBalance, tabunganIn, tabunganOut,
  gtNetDL, gtNetIDR, totalKekayaanIDR, isGtProfit,
  dailyTasks, allPageTasks, toggleDailyTask, deleteDailyTask,
  newDailyTaskName, setNewDailyTaskName, handleAddDailyTask,
  blocks, toggleBlock, deleteBlock,
  isAddingTx, setIsAddingTx, isTransferring, setIsTransferring,
  newTxDesc, setNewTxDesc, newTxDate, setNewTxDate, newTxAmount, setNewTxAmount,
  newTxType, setNewTxType, newTxCurrency, setNewTxCurrency, txCategory, setTxCategory,
  handleTxCategoryToggle, handleAddTransaction,
  transferDirection, setTransferDirection, transferDate, setTransferDate,
  transferAmountIDR, setTransferAmountIDR, transferDesc, setTransferDesc,
  handleTransferAction, dlRate, setDlRate, saveDlRateToDB,
  deleteTransaction, transactions: txList, txFilter, setTxFilter,
  financeChartRef, selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
  renderCalendarDesktop, calcPercent, blocksPercent, dailyPercent,
  isSyncing
}) {
  const today = new Date();

  const completedTodayTasks = (allPageTasks || []).filter(t =>
    t.task_date === format(today, 'yyyy-MM-dd') && t.is_completed
  );
  const totalTodayTasks = (allPageTasks || []).filter(t =>
    t.task_date === format(today, 'yyyy-MM-dd')
  );

  const recentTx = (txList || []).slice(0, 5);

  return (
    <div className="flex flex-col w-full animate-entrance">
      {/* HERO BANNER */}
      <section className="relative w-full overflow-hidden bg-surface-container-high shadow-[0_4px_0_0_#050300]">
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply bg-cover bg-center pointer-events-none retro-scanlines"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBNKnPuqlgFgaYIGTjVtIGKJBTKuZAnQNXyIiJmf34JK2HxEOKipreBnj9yVCBff3Stng6j8H8bBtMzpw1bRKwRQBgOsDEqnMjHOAHJhubakf7uQy43i-Getcs3N0ZImYxe7gFWCjxWc4A4Jv9bgrqq9SifmTLuaYLTKnqwIPg_BhWlINZvHZG61hn_mJ8beXwYXqo1RaQEJGN66LS5rKiepd2Uj8KKLPdCT_PXlmtbQIaeXt5w46t0')" }}
        />
        <div className="relative z-10 px-step-lg py-step-lg flex flex-col xl:flex-row xl:items-center xl:justify-between gap-step-md">
          <div>
            <div className="flex items-center gap-step-sm mb-step-xs flex-wrap">
              <span className="font-label-sm text-label-sm bg-inverse-surface text-tertiary-fixed-dim px-step-sm py-pixel-unit shadow-[2px_2px_0_0_#050300]">
                QUESTFOLIO // REALM VAULT
              </span>
              <span className="inline-flex items-center gap-pixel-unit bg-primary-container text-on-primary-container px-step-sm py-pixel-unit font-label-sm text-label-sm shadow-[2px_2px_0_0_#050300]">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                ACTIVE BUFF +25% XP
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Command Center</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
              Hub utama pencatatan keuangan, quest harian, dan manajemen aset game dalam satu realm.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-step-sm">
            <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[3px_3px_0_0_#050300] flex flex-col gap-pixel-unit min-w-[120px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Net Worth</span>
              <span className={`font-headline-sm text-headline-sm font-bold ${totalKekayaanIDR >= 0 ? 'text-primary' : 'text-error'}`}>
                {formatIDR(totalKekayaanIDR)}
              </span>
            </div>
            <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[3px_3px_0_0_#050300] flex flex-col gap-pixel-unit min-w-[120px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Aset GT</span>
              <span className={`font-headline-sm text-headline-sm font-bold ${isGtProfit ? 'text-primary' : 'text-error'}`}>
                {isGtProfit ? '+' : ''}{gtNetDL.toFixed(2)} DL
              </span>
            </div>
            <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[3px_3px_0_0_#050300] flex flex-col gap-pixel-unit min-w-[120px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Quest Selesai</span>
              <span className="font-headline-sm text-headline-sm font-bold text-tertiary">
                {completedTodayTasks.length} / {totalTodayTasks.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="p-step-lg grid grid-cols-1 lg:grid-cols-12 gap-step-lg">

        {/* LEFT: Finance Summary */}
        <div className="lg:col-span-4 flex flex-col gap-step-md">
          {/* Finance Header */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[3px_3px_0_0_#050300] flex items-center justify-between">
            <div className="flex items-center gap-step-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">DOMPET KU</span>
            </div>
            <div className="flex gap-step-xs">
              <button
                onClick={() => { setIsAddingTx(!isAddingTx); setIsTransferring(false); }}
                className={`px-step-sm py-pixel-unit font-label-sm text-label-sm border border-inverse-surface shadow-[2px_2px_0_0_#050300] pixel-btn transition-colors ${isAddingTx ? 'bg-error text-on-error' : 'bg-primary-container text-on-primary-container'}`}
              >
                {isAddingTx ? 'BATAL' : '+ KAS'}
              </button>
              <button
                onClick={() => { setIsTransferring(!isTransferring); setIsAddingTx(false); }}
                className={`px-step-sm py-pixel-unit font-label-sm text-label-sm border border-inverse-surface shadow-[2px_2px_0_0_#050300] pixel-btn transition-colors ${isTransferring ? 'bg-error text-on-error' : 'bg-surface-container-high text-on-surface'}`}
              >
                ⇄ ASET
              </button>
            </div>
          </div>

          {/* DL Rate */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[2px_2px_0_0_#050300] flex items-center gap-step-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant">KURS 1 DL:</span>
            <span className="font-label-sm text-label-sm text-primary font-bold">Rp</span>
            <input
              type="number"
              value={dlRate}
              onChange={e => setDlRate(e.target.value)}
              onBlur={e => saveDlRateToDB(e.target.value)}
              className="bg-transparent font-label-sm text-label-sm text-primary font-bold border-b border-primary w-20 outline-none"
            />
          </div>

          {/* Balance Cards */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <div className="font-label-sm text-label-sm text-on-surface-variant mb-step-xs uppercase">Tabungan IDR</div>
            <div className={`font-headline-md text-headline-md font-bold ${tabunganBalance >= 0 ? 'text-primary' : 'text-error'}`}>
              {formatIDR(tabunganBalance)}
            </div>
            <div className="mt-step-sm pt-step-xs border-t border-surface-variant flex justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Masuk: <span className="text-primary font-bold">{formatIDR(tabunganIn)}</span></span>
              <span className="text-on-surface-variant">Keluar: <span className="text-error font-bold">{formatIDR(tabunganOut)}</span></span>
            </div>
          </div>

          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <div className="font-label-sm text-label-sm text-on-surface-variant mb-step-xs uppercase">Aset Game (GT)</div>
            <div className={`font-headline-md text-headline-md font-bold ${isGtProfit ? 'text-primary' : 'text-error'}`}>
              {isGtProfit ? '+' : ''}{gtNetDL.toFixed(2)} DL
            </div>
            <div className="mt-step-xs font-label-sm text-label-sm text-on-surface-variant">≈ {formatIDR(gtNetIDR)}</div>
          </div>

          {/* Add Transaction Form */}
          {isAddingTx && (
            <div className="bg-surface-container-low border-2 border-inverse-surface p-step-md shadow-[3px_3px_0_0_#050300] flex flex-col gap-step-sm animate-entrance">
              <div className="flex bg-surface-dim border border-inverse-surface p-pixel-unit">
                <button onClick={() => handleTxCategoryToggle('TABUNGAN')} className={`flex-1 py-step-xs font-label-sm text-label-sm font-bold ${txCategory === 'TABUNGAN' ? 'bg-inverse-surface text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>BANK</button>
                <button onClick={() => handleTxCategoryToggle('GT')} className={`flex-1 py-step-xs font-label-sm text-label-sm font-bold ${txCategory === 'GT' ? 'bg-inverse-surface text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>ASET GT</button>
              </div>
              <input type="text" value={newTxDesc} onChange={e => setNewTxDesc(e.target.value)} placeholder="Deskripsi transaksi..." className="w-full bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-body-sm text-body-sm text-on-surface outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-step-sm">
                <input type="date" value={newTxDate} onChange={e => setNewTxDate(e.target.value)} className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
                <select value={newTxType} onChange={e => setNewTxType(e.target.value)} className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none">
                  <option value="pemasukan">Masuk (+)</option>
                  <option value="pengeluaran">Keluar (-)</option>
                  <option value="pengeluaran_modal">Keluar Modal (-)</option>
                </select>
              </div>
              <div className="flex gap-step-xs">
                <input type="number" value={newTxAmount} onChange={e => setNewTxAmount(e.target.value)} placeholder="Jumlah..." className="flex-1 bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
                {txCategory === 'GT' && (
                  <select value={newTxCurrency} onChange={e => setNewTxCurrency(e.target.value)} className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none">
                    <option value="WL">WL</option>
                    <option value="DL">DL</option>
                    <option value="BGL">BGL</option>
                  </select>
                )}
              </div>
              <button onClick={handleAddTransaction} className="w-full py-step-sm bg-primary-container text-on-primary-container font-label-md text-label-md font-bold border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn">
                CATAT TRANSAKSI
              </button>
            </div>
          )}

          {/* Transfer Form */}
          {isTransferring && (
            <div className="bg-surface-container-low border-2 border-inverse-surface p-step-md shadow-[3px_3px_0_0_#050300] flex flex-col gap-step-sm animate-entrance">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Konversi Aset IDR ⇄ GT</div>
              <select value={transferDirection} onChange={e => setTransferDirection(e.target.value)} className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none">
                <option value="TABUNGAN_TO_GT">Beli Aset GT (Rp → DL)</option>
                <option value="GT_TO_TABUNGAN">Jual Aset GT (DL → Rp)</option>
              </select>
              <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
              <input type="number" value={transferAmountIDR} onChange={e => setTransferAmountIDR(e.target.value)} placeholder="Nominal Rp..." className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
              <input type="text" value={transferDesc} onChange={e => setTransferDesc(e.target.value)} placeholder="Keterangan..." className="bg-surface-dim border border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
              <button onClick={handleTransferAction} className="w-full py-step-sm bg-tertiary-container text-on-tertiary-container font-label-md text-label-md font-bold border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn">
                EKSEKUSI KONVERSI
              </button>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300] flex flex-col gap-step-sm">
            <div className="flex items-center gap-step-xs mb-step-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">TRANSAKSI TERBARU</span>
            </div>
            {recentTx.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-step-md">Belum ada transaksi.</p>
            )}
            {recentTx.map(tx => {
              const isIn = tx.type === 'pemasukan';
              const isBankTx = tx.currency_type === 'TABUNGAN' || tx.currency_type === 'IDR';
              return (
                <div key={tx.id} className="flex items-center justify-between p-step-xs bg-surface-container-low border border-inverse-surface group hover:bg-surface-container transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-label-md text-label-md text-on-surface font-bold truncate">{tx.description}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">{tx.date} · {isBankTx ? 'IDR' : tx.currency_type}</div>
                  </div>
                  <div className="flex items-center gap-step-xs shrink-0">
                    <span className={`font-label-md text-label-md font-bold ${isIn ? 'text-primary' : 'text-error'}`}>
                      {isIn ? '+' : '-'}{isBankTx ? formatIDR(tx.amount) : `${tx.amount} ${tx.currency_type}`}
                    </span>
                    <button onClick={() => deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-error p-pixel-unit transition-opacity">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Quest Log & Calendar */}
        <div className="lg:col-span-5 flex flex-col gap-step-md">
          {/* Calendar */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <div className="flex items-center justify-between mb-step-sm">
              <div className="flex items-center gap-step-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">STUDY CALENDAR</h2>
              </div>
              <div className="flex items-center gap-step-xs">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-6 h-6 bg-surface-container-high border border-inverse-surface flex items-center justify-center hover:bg-surface-container-highest pixel-btn">
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <span className="font-label-sm text-label-sm text-on-surface font-bold px-step-xs">{format(currentMonth, 'MMMM yyyy').toUpperCase()}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-6 h-6 bg-surface-container-high border border-inverse-surface flex items-center justify-center hover:bg-surface-container-highest pixel-btn">
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
            {renderCalendarDesktop && renderCalendarDesktop()}
          </div>

          {/* Daily Quest Log */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300] flex flex-col flex-1">
            <div className="flex items-center justify-between mb-step-md">
              <div className="flex items-center gap-step-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">format_list_bulleted</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">QUEST LOG HARIAN</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{format(selectedDate, 'dd MMM yyyy').toUpperCase()}</span>
            </div>

            <div className="flex flex-col gap-step-sm flex-1">
              {(dailyTasks || []).map(task => (
                <div key={task.id} className={`flex items-start gap-step-sm p-step-sm border-2 border-inverse-surface group hover:bg-surface-container-high transition-colors ${task.is_completed ? 'bg-surface-container-low opacity-75' : 'bg-surface-bright shadow-[2px_2px_0_0_#5C3A10]'}`}>
                  <div className="mt-0.5 cursor-pointer" onClick={() => toggleDailyTask(task.id, task.is_completed)}>
                    {task.is_completed ? (
                      <span className="w-5 h-5 bg-primary border border-inverse-surface flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    ) : (
                      <div className="w-5 h-5 bg-surface-dim border-2 border-inverse-surface"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-headline-sm text-[15px] leading-tight ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                      {task.task_name}
                    </span>
                  </div>
                  <button onClick={() => deleteDailyTask(task.id)} className="opacity-0 group-hover:opacity-100 text-error transition-opacity">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <input
              type="text"
              value={newDailyTaskName}
              onChange={e => setNewDailyTaskName(e.target.value)}
              onKeyDown={handleAddDailyTask}
              placeholder="+ Tambah quest baru... (Enter)"
              className="mt-step-md w-full py-step-sm px-step-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-2 border-inverse-surface font-label-md text-label-md shadow-[3px_3px_0_0_#050300] outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* RIGHT: Activity Log & Memos */}
        <div className="lg:col-span-3 flex flex-col gap-step-md">
          {/* Net Worth Highlight */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300] relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <span className="material-symbols-outlined text-[120px] text-primary">account_balance</span>
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant mb-step-xs uppercase">TOTAL NET WORTH</div>
            <div className={`font-headline-lg text-headline-lg font-bold ${totalKekayaanIDR >= 0 ? 'text-primary' : 'text-error'}`}>
              {formatIDR(totalKekayaanIDR)}
            </div>
            <div className="mt-step-sm flex items-center gap-pixel-unit font-label-sm text-label-sm text-tertiary">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Posisi Aman</span>
            </div>
          </div>

          {/* Quick Activity */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <div className="flex items-center gap-step-xs mb-step-md">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">AKTIVITAS</span>
            </div>
            <div className="flex flex-col gap-step-sm">
              {(txList || []).slice(0, 4).map(tx => (
                <div key={tx.id} className="flex items-start gap-step-sm">
                  <span className={`w-2 h-2 mt-1 shrink-0 ${tx.type === 'pemasukan' ? 'bg-primary-container' : 'bg-error-container'} border border-inverse-surface`}></span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">{tx.description}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{tx.date}</span>
                  </div>
                </div>
              ))}
              {(txList || []).length === 0 && (
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-step-md">Belum ada aktivitas.</p>
              )}
            </div>
          </div>

          {/* Sticky Notes */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <div className="flex items-center gap-step-xs mb-step-sm">
              <span className="material-symbols-outlined text-primary text-[18px]">push_pin</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">MEMO CEPAT</span>
            </div>
            <div className="grid grid-cols-2 gap-step-sm">
              <div className="bg-[#fef9c3] text-[#422006] p-step-sm border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] sticky-note rotate-[-1deg]">
                <div className="font-label-sm text-[10px] font-bold mb-1 border-b border-[#ca8a04]/40 pb-pixel-unit">TARGET IPK</div>
                <p className="font-headline-sm text-[15px] font-bold">IPK &gt; 3.80!</p>
                <p className="font-body-sm text-[10px] text-[#92400e] mt-pixel-unit">Zero procrastination!</p>
              </div>
              <div className="bg-[#dcfce7] text-[#14532d] p-step-sm border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] sticky-note rotate-[1.5deg]">
                <div className="font-label-sm text-[10px] font-bold mb-1 border-b border-[#16a34a]/40 pb-pixel-unit">GT RATE</div>
                <p className="font-body-sm text-[11px] leading-tight">Rate DL: Rp {Number(dlRate).toLocaleString('id-ID')}</p>
                <p className="font-label-sm text-[10px] text-[#166534] mt-pixel-unit">Update berkala</p>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <div className="flex items-center gap-step-xs mb-step-md">
              <span className="material-symbols-outlined text-primary text-[18px]">military_tech</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">PROGRES QUEST</span>
            </div>
            <div className="space-y-step-sm">
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-pixel-unit">
                  <span className="text-on-surface-variant">Checklist</span>
                  <span className="text-primary font-bold">{blocksPercent}%</span>
                </div>
                <div className="h-2 w-full bg-surface-dim border border-inverse-surface p-[1px]">
                  <div className="h-full bg-primary-container" style={{ width: `${blocksPercent}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-pixel-unit">
                  <span className="text-on-surface-variant">Quest Hari Ini</span>
                  <span className="text-primary font-bold">{dailyPercent}%</span>
                </div>
                <div className="h-2 w-full bg-surface-dim border border-inverse-surface p-[1px]">
                  <div className="h-full bg-tertiary-container" style={{ width: `${dailyPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ============================================================
// BOOK MODAL — Minecraft-Style Enchanted Book
// ============================================================
const PAGE_BREAK = '\n===PAGE===\n';
const CHARS_PER_PAGE = 480;

function BookModal({ note, onClose, onSave, onDelete }) {
  const rawPages = note.content ? note.content.split(PAGE_BREAK) : [''];
  const [pages, setPages] = useState(rawPages.length > 0 ? rawPages : ['']);
  const [currentPage, setCurrentPage] = useState(0);
  const [title, setTitle] = useState(note.title || 'Enchanted Book');
  const [isFlipping, setIsFlipping] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentPage]);

  const goToPage = (dir) => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(p => Math.max(0, Math.min(pages.length - 1, p + dir)));
      setIsFlipping(false);
    }, 180);
  };

  const updateCurrentPage = (text) => {
    const updated = [...pages];
    updated[currentPage] = text;
    setPages(updated);
  };

  const addPage = () => {
    const updated = [...pages, ''];
    setPages(updated);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(updated.length - 1);
      setIsFlipping(false);
    }, 180);
  };

  const deletePage = () => {
    if (pages.length === 1) { updateCurrentPage(''); return; }
    const updated = pages.filter((_, i) => i !== currentPage);
    setPages(updated);
    setCurrentPage(p => Math.max(0, p - 1));
  };

  const handleSave = () => {
    const content = pages.join(PAGE_BREAK);
    onSave(note.id, content, title);
    onClose();
  };

  // Spiral binding dots
  const spiralDots = Array.from({ length: 14 });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(6,32,13,0.75)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) { handleSave(); } }}
    >
      <div className="book-open relative flex flex-col" style={{ width: 380, maxWidth: '95vw' }}>

        {/* ── BOOK OUTER COVER ── */}
        <div
          className="relative w-full"
          style={{
            background: 'linear-gradient(135deg, #7c3d1a 0%, #5c2a0f 40%, #7c3d1a 100%)',
            border: '4px solid #3d1a08',
            boxShadow: '6px 6px 0 0 #1c0a02, inset 0 0 0 2px #a0522d',
            borderRadius: 2,
            padding: '10px 10px 10px 36px',
            minHeight: 480,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Spiral binding */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center gap-[10px] pl-[6px] pr-[4px]" style={{ width: 30 }}>
            {spiralDots.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 12,
                  border: '2px solid #8b1a1a',
                  borderLeft: 'none',
                  borderRadius: '0 6px 6px 0',
                  background: '#c0392b',
                  boxShadow: '1px 0 0 0 #5a0a0a',
                }}
              />
            ))}
          </div>

          {/* Book pages area */}
          <div
            className={`book-paper book-lines flex-1 flex flex-col relative ${isFlipping ? 'page-flip' : ''}`}
            style={{
              border: '2px solid #8b6914',
              boxShadow: 'inset 0 0 0 1px rgba(139,105,20,0.3)',
              padding: '14px 14px 10px 14px',
              minHeight: 400,
            }}
          >
            {/* Page corner dog-ear */}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 0, height: 0,
              borderStyle: 'solid',
              borderWidth: '0 0 22px 22px',
              borderColor: 'transparent transparent #c8a95a transparent',
              filter: 'drop-shadow(-1px -1px 0 #8b6914)',
            }} />

            {/* Page header */}
            <div className="flex items-start justify-between mb-2">
              {/* Editable title */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-transparent font-label-lg text-[13px] font-bold text-[#4a2c0a] outline-none border-b border-[#8b6914]/40 flex-1 mr-2 leading-tight"
                placeholder="Judul buku..."
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                onClick={e => e.stopPropagation()}
              />
              <span
                className="font-label-sm text-[10px] text-[#6b4c1a] shrink-0"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Page {currentPage + 1} of {pages.length}
              </span>
            </div>

            {/* Editable page content */}
            <textarea
              ref={textareaRef}
              value={pages[currentPage] || ''}
              onChange={e => updateCurrentPage(e.target.value)}
              className="flex-1 bg-transparent resize-none outline-none text-[#2d1a06] leading-[28px]"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13,
                minHeight: 300,
                paddingTop: 4,
              }}
              placeholder="Tulis catatan di sini..."
              onClick={e => e.stopPropagation()}
            />

            {/* Page navigation */}
            <div className="flex items-center justify-between mt-2 pt-1" style={{ borderTop: '1px solid rgba(139,105,20,0.25)' }}>
              <button
                onClick={e => { e.stopPropagation(); deletePage(); }}
                className="font-label-sm text-[10px] text-[#8b1a1a] hover:underline"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                title="Hapus halaman ini"
              >
                – Del Page
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); goToPage(-1); }}
                  disabled={currentPage === 0}
                  className="w-7 h-7 flex items-center justify-center disabled:opacity-30 hover:bg-[#c8a95a]/30 transition-colors"
                  style={{ border: '2px solid #8b6914' }}
                >
                  <span className="material-symbols-outlined text-[16px] text-[#4a2c0a]">chevron_left</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); goToPage(1); }}
                  disabled={currentPage === pages.length - 1}
                  className="w-7 h-7 flex items-center justify-center disabled:opacity-30 hover:bg-[#c8a95a]/30 transition-colors"
                  style={{ border: '2px solid #8b6914' }}
                >
                  <span className="material-symbols-outlined text-[16px] text-[#4a2c0a]">chevron_right</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); addPage(); }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#c8a95a]/30 transition-colors"
                  style={{ border: '2px solid #8b6914' }}
                  title="Tambah halaman baru"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#4a2c0a]">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS (below book) ── */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); handleSave(); }}
            className="flex-1 py-2 bg-primary-container text-on-primary-container font-label-md text-label-md font-bold border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            SIMPAN & TUTUP
          </button>
          <button
            onClick={e => { e.stopPropagation(); if(window.confirm('Hapus buku ini?')) { onDelete(note.id); onClose(); } }}
            className="w-10 h-10 bg-error-container text-on-error-container border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE: STUDY WORKSPACE
// ============================================================
function StudyWorkspacePage({
  blocks, toggleBlock, deleteBlock,
  newBlockContent, setNewBlockContent, activeGroupInput, setActiveGroupInput,
  handleAddBlockInGroup,
  isAddingGroup, setIsAddingGroup, newGroupName, setNewGroupName, handleAddTargetGroup,
  currentPageGroups, subtitles, setSubtitles, handleDeleteTargetGroup,
  dailyTasks, allPageTasks, toggleDailyTask, deleteDailyTask,
  newDailyTaskName, setNewDailyTaskName, handleAddDailyTask,
  noteBlocks, isAddingNote, setIsAddingNote, newNoteContent, setNewNoteContent,
  handleAddNote, editingNoteId, setEditingNoteId, editNoteContent, setEditNoteContent,
  handleUpdateBlockContent,
  selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
  renderCalendarDesktop, monthlyTodos, newMonthlyTodo, setNewMonthlyTodo,
  handleAddCustomBlockEnter, monthKey,
  calcPercent, blocksPercent,
  activePageId
}) {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [openBook, setOpenBook] = useState(null); // note object currently open in BookModal

  // Sticky Notes — persisted to localStorage
  const [stickyNotes, setStickyNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sticky_notes')) || [
        { title: 'NOTE 1', content: '' },
        { title: 'NOTE 2', content: '' },
        { title: 'NOTE 3', content: '' },
        { title: 'NOTE 4', content: '' },
      ];
    } catch (e) {
      return [
        { title: 'NOTE 1', content: '' },
        { title: 'NOTE 2', content: '' },
        { title: 'NOTE 3', content: '' },
        { title: 'NOTE 4', content: '' },
      ];
    }
  });

  const updateStickyNote = (index, field, value) => {
    const updated = stickyNotes.map((n, i) => i === index ? { ...n, [field]: value } : n);
    setStickyNotes(updated);
    localStorage.setItem('sticky_notes', JSON.stringify(updated));
  };


  const timerRef = useRef(null);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerRef.current);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            alert('✨ FOCUS SPELL COMPLETE! +150 XP AWARDED!');
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const saveNotes = () => {
    setSaveStatus('Inscribing scroll...');
    setTimeout(() => {
      setSaveStatus(`Saved ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full animate-entrance">
      {/* TOP BANNER */}
      <div className="relative w-full overflow-hidden bg-surface-container-high px-step-lg py-step-lg shadow-[4px_4px_0_0_#050300]">
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply bg-cover bg-center pointer-events-none retro-scanlines"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDp1O9Uzwv6FyoWIJghTKDmwjH8QZ0xfVzQimAagTUTVrbavXoW4OHMEHgrtlmZZ_HbjA_6YCBGDEgBHbMPRZ5hAgPyC4_8MA2shG0zw2GFMZjNUN6HH8jdzjaRpAlQ5gGFIIqhkT0vHWwdopjt7m52FU6lVubUrXDU32Xe5hAnZakrtWNInOiAdZm3RldmKGmOG2d11lhpcqOMLQSkxBCazsCkda92Ha9I9jLG9kuj4OECeIc5-Jec')" }}
        />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-step-md">
          <div>
            <div className="flex items-center gap-step-sm mb-step-xs flex-wrap">
              <span className="font-label-sm text-label-sm bg-inverse-surface text-tertiary-fixed-dim px-step-sm py-pixel-unit shadow-[2px_2px_0_0_#050300]">
                DUNGEON GUILD ARCHIVE // STUDY SECTOR
              </span>
              <span className="inline-flex items-center gap-pixel-unit bg-primary-container text-on-primary-container px-step-sm py-pixel-unit font-label-sm text-label-sm shadow-[2px_2px_0_0_#050300]">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                ACTIVE BUFF +25% XP
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Study Dungeon &amp; Enchanted Library</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
              Channel ancient scrolls, master algorithmic incantations, and manage your quest log.
            </p>
          </div>

          {/* Pomodoro Timer */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[4px_4px_0_0_#050300] flex flex-col sm:flex-row items-stretch sm:items-center gap-step-md">
            <div className="flex items-center gap-step-sm">
              <div className="w-12 h-12 bg-inverse-surface flex items-center justify-center text-tertiary-fixed-dim shadow-[inset_2px_2px_0_0_#050300]">
                <span className="material-symbols-outlined text-[28px]">hourglass_top</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">FOCUS SPELL TIMER</div>
                <div className="font-label-lg text-[26px] leading-tight text-on-surface tracking-widest font-bold">{formatTime(timerSeconds)}</div>
              </div>
            </div>
            <button
              onClick={toggleTimer}
              className={`px-step-md py-step-xs font-label-md text-label-md border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn flex items-center gap-pixel-unit ${isTimerRunning ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>{isTimerRunning ? 'DISPEL (PAUSE)' : 'CAST FOCUS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-COLUMN WORKSPACE */}
      <div className="p-step-lg grid grid-cols-1 lg:grid-cols-12 gap-step-lg">

        {/* LEFT: Checklist / Targets */}
        <div className="lg:col-span-3 flex flex-col gap-step-md relative bg-surface-container-low border-2 border-inverse-surface p-step-sm shadow-[4px_4px_0_0_#050300]">
          <PanelVines />
          <div className="relative z-20 flex flex-col gap-step-md">
          {/* Section Header */}
          <div className="bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[3px_3px_0_0_#050300] flex items-center justify-between">
            <div className="flex items-center gap-step-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">TARGET LISTS</span>
            </div>
            <div className="flex items-center gap-step-xs">
              <span className="font-label-sm text-label-sm bg-inverse-surface text-tertiary-fixed-dim px-step-xs">{currentPageGroups.length} GROUPS</span>
              <button
                onClick={() => setIsAddingGroup(!isAddingGroup)}
                className="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-step-xs py-pixel-unit border border-inverse-surface pixel-btn"
              >
                +
              </button>
            </div>
          </div>

          {/* Add Group Input */}
          {isAddingGroup && (
            <div className="flex gap-step-xs animate-entrance">
              <input
                type="text"
                autoFocus
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTargetGroup()}
                placeholder="Nama group baru..."
                className="flex-1 bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none focus:border-primary"
              />
              <button onClick={handleAddTargetGroup} className="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-step-sm border-2 border-inverse-surface pixel-btn">OK</button>
              <button onClick={() => setIsAddingGroup(false)} className="text-on-surface-variant font-label-sm text-label-sm px-step-xs border-2 border-inverse-surface pixel-btn">X</button>
            </div>
          )}

          {/* Groups */}
          {currentPageGroups.map(groupType => {
            const groupBlocks = (blocks || []).filter(b => b.type === groupType);
            const titleKey = `title_${groupType}_${activePageId}`;
            const completed = groupBlocks.filter(b => b.is_completed).length;
            const pct = groupBlocks.length === 0 ? 0 : Math.round((completed / groupBlocks.length) * 100);
            return (
              <div key={groupType} className="bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
                <div className="flex items-start justify-between mb-step-xs">
                  <div>
                    <input
                      type="text"
                      value={subtitles[titleKey] || (groupType === 'todo' ? 'Target Utama' : groupType)}
                      onChange={e => setSubtitles({ ...subtitles, [titleKey]: e.target.value })}
                      className="bg-transparent border-none outline-none font-headline-sm text-[16px] text-on-surface w-full font-bold p-0"
                    />
                  </div>
                  <div className="flex items-center gap-step-xs shrink-0">
                    <span className="font-label-sm text-label-sm bg-inverse-surface text-tertiary-fixed-dim px-step-xs py-pixel-unit border border-inverse-surface font-bold">
                      {pct}%
                    </span>
                    {groupType !== 'todo' && (
                      <button onClick={() => handleDeleteTargetGroup(groupType)} className="text-error opacity-50 hover:opacity-100">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-dim border border-inverse-surface mb-step-sm">
                  <div className="h-full bg-primary-container" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="flex flex-col gap-step-xs">
                  {groupBlocks.map(block => (
                    <div key={block.id} className={`flex items-start gap-step-xs p-step-xs border border-inverse-surface ${block.is_completed ? 'bg-surface-container-low opacity-70' : 'bg-surface-bright'}`}>
                      <div className="cursor-pointer mt-0.5" onClick={() => toggleBlock(block.id, block.is_completed)}>
                        {block.is_completed ? (
                          <span className="w-4 h-4 bg-primary flex items-center justify-center border border-inverse-surface">
                            <span className="material-symbols-outlined text-on-primary text-[12px]">check</span>
                          </span>
                        ) : (
                          <div className="w-4 h-4 bg-surface-dim border border-inverse-surface"></div>
                        )}
                      </div>
                      <span className={`flex-1 font-body-sm text-[12px] ${block.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {block.content}
                      </span>
                      <button onClick={() => deleteBlock(block.id)} className="text-error opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[12px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
                {activeGroupInput === groupType ? (
                  <div className="flex items-center gap-step-xs mt-step-xs">
                    <input
                      type="text"
                      autoFocus
                      value={newBlockContent[groupType] || ''}
                      onChange={e => setNewBlockContent({ ...newBlockContent, [groupType]: e.target.value })}
                      onKeyDown={e => handleAddBlockInGroup(e, groupType)}
                      onBlur={() => setActiveGroupInput(null)}
                      placeholder="Ketik lalu Enter..."
                      className="flex-1 bg-surface-dim border border-inverse-surface px-step-xs py-pixel-unit font-body-sm text-[12px] text-on-surface outline-none"
                    />
                  </div>
                ) : (
                  <button onClick={() => setActiveGroupInput(groupType)} className="mt-step-xs flex items-center gap-pixel-unit font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>New Item</span>
                  </button>
                )}
              </div>
            );
          })}

          {/* Familiar advice */}
          <div className="bg-surface-dim border-2 border-inverse-surface p-step-sm shadow-[3px_3px_0_0_#050300] flex items-center gap-step-sm">
            <div className="w-10 h-10 bg-inverse-surface text-tertiary-fixed-dim flex items-center justify-center shrink-0 border border-inverse-surface">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <div className="font-label-sm text-label-sm text-primary font-bold">FAMILIAR'S ADVICE</div>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                "Reviewing key topics 20 mins before lab increases exam roll odds by +15%."
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* CENTER: Calendar + Quest Timeline */}
        <div className="lg:col-span-5 flex flex-col gap-step-md">
          {/* Calendar */}
          <div className="relative bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <PanelVines />
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-step-sm">
              <div className="flex items-center gap-step-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">STUDY CALENDAR</h2>
              </div>
              <div className="flex items-center gap-step-xs">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-6 h-6 bg-surface-container-high border border-inverse-surface flex items-center justify-center hover:bg-surface-container-highest pixel-btn">
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <span className="font-label-sm text-label-sm text-on-surface font-bold px-step-xs">{format(currentMonth, 'MMM yyyy').toUpperCase()}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-6 h-6 bg-surface-container-high border border-inverse-surface flex items-center justify-center hover:bg-surface-container-highest pixel-btn">
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
            {renderCalendarDesktop && renderCalendarDesktop()}

            {/* Monthly Targets */}
            <div className="mt-step-md pt-step-sm border-t-2 border-surface-variant">
              <h3 className="font-label-sm text-label-sm text-primary font-bold mb-step-sm uppercase">Target Bulanan</h3>
              <div className="flex flex-col gap-step-xs">
                {(monthlyTodos || []).map(task => (
                  <div key={task.id} className={`flex items-center gap-step-xs p-step-xs border border-inverse-surface ${task.is_completed ? 'bg-surface-container-low opacity-70' : 'bg-surface-bright'}`}>
                    <div className="cursor-pointer" onClick={() => toggleBlock(task.id, task.is_completed)}>
                      {task.is_completed ? (
                        <span className="w-4 h-4 bg-primary flex items-center justify-center border border-inverse-surface">
                          <span className="material-symbols-outlined text-on-primary text-[11px]">check</span>
                        </span>
                      ) : (
                        <div className="w-4 h-4 bg-surface-dim border border-inverse-surface"></div>
                      )}
                    </div>
                    <span className={`flex-1 font-body-sm text-[12px] ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.content}</span>
                    <button onClick={() => deleteBlock(task.id)} className="text-error opacity-50 hover:opacity-100">
                      <span className="material-symbols-outlined text-[12px]">delete</span>
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={newMonthlyTodo}
                  onChange={e => setNewMonthlyTodo(e.target.value)}
                  onKeyDown={e => handleAddCustomBlockEnter(e, `monthly_todo_${monthKey}`, newMonthlyTodo, setNewMonthlyTodo)}
                  placeholder="+ Target bulan ini... (Enter)"
                  className="w-full bg-transparent border-b border-surface-variant font-body-sm text-[12px] text-on-surface px-step-xs py-pixel-unit outline-none focus:border-primary"
                />
              </div>
            </div>
            </div>
          </div>

          {/* Daily Quest Log */}
          <div className="relative bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300] flex flex-col flex-1">
            <PanelVines />
            <div className="relative z-20 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-step-md">
              <div className="flex items-center gap-step-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">format_list_bulleted</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">TODAY'S QUEST LOG</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{format(selectedDate, 'dd MMM yyyy').toUpperCase()}</span>
            </div>

            <div className="flex flex-col gap-step-sm flex-1">
              {(dailyTasks || []).map(task => (
                <div key={task.id} className={`flex items-start gap-step-sm p-step-sm border-2 border-inverse-surface group transition-colors ${task.is_completed ? 'bg-surface-container-low opacity-75' : 'bg-surface-bright shadow-[4px_4px_0_0_#5C3A10]'}`}>
                  <div className="mt-0.5 cursor-pointer" onClick={() => toggleDailyTask(task.id, task.is_completed)}>
                    {task.is_completed ? (
                      <span className="w-5 h-5 bg-primary border border-inverse-surface flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    ) : (
                      <div className="w-5 h-5 bg-surface-dim border-2 border-inverse-surface flex items-center justify-center">
                        <span className="w-2.5 h-2.5 bg-primary-container animate-ping"></span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-headline-sm text-[16px] leading-tight ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                      {task.task_name}
                    </h4>
                  </div>
                  <button onClick={() => deleteDailyTask(task.id)} className="opacity-0 group-hover:opacity-100 text-error transition-opacity">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <input
              type="text"
              value={newDailyTaskName}
              onChange={e => setNewDailyTaskName(e.target.value)}
              onKeyDown={handleAddDailyTask}
              placeholder="+ Tambah quest baru... (Enter)"
              className="mt-step-md w-full py-step-sm px-step-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-2 border-inverse-surface font-label-md text-label-md shadow-[3px_3px_0_0_#050300] outline-none focus:border-primary"
            />
            </div>
          </div>
        </div>

        {/* RIGHT: Pinboard + Scratchpad */}
        <div className="lg:col-span-4 flex flex-col gap-step-md">
          {/* Guild Pinboard */}
          <div className="relative bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <PanelVines />
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-step-sm">
              <div className="flex items-center gap-step-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">push_pin</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">GUILD PINBOARD</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-step-sm">
              {/* NOTE 1 — Kuning */}
              <div className="bg-[#fef9c3] text-[#422006] p-step-sm border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] sticky-note rotate-[-1deg] flex flex-col">
                <div className="flex items-center justify-between border-b border-[#ca8a04]/40 pb-pixel-unit mb-step-xs">
                  <input
                    type="text"
                    value={stickyNotes[0].title}
                    onChange={e => updateStickyNote(0, 'title', e.target.value)}
                    className="bg-transparent font-label-sm text-[10px] font-bold text-[#422006] outline-none w-full border-none"
                    placeholder="Judul..."
                  />
                  <span className="material-symbols-outlined text-[12px] text-[#ca8a04] shrink-0">push_pin</span>
                </div>
                <textarea
                  value={stickyNotes[0].content}
                  onChange={e => updateStickyNote(0, 'content', e.target.value)}
                  className="bg-transparent font-label-sm text-[11px] leading-tight text-[#422006] outline-none resize-none flex-1 min-h-[60px] placeholder:text-[#92400e]/50 placeholder:italic"
                  placeholder="Tulis catatan di sini..."
                />
              </div>
              {/* NOTE 2 — Hijau */}
              <div className="bg-[#dcfce7] text-[#14532d] p-step-sm border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] sticky-note rotate-[1.5deg] flex flex-col">
                <div className="flex items-center justify-between border-b border-[#16a34a]/40 pb-pixel-unit mb-step-xs">
                  <input
                    type="text"
                    value={stickyNotes[1].title}
                    onChange={e => updateStickyNote(1, 'title', e.target.value)}
                    className="bg-transparent font-label-sm text-[10px] font-bold text-[#14532d] outline-none w-full border-none"
                    placeholder="Judul..."
                  />
                  <span className="material-symbols-outlined text-[12px] text-[#16a34a] shrink-0">push_pin</span>
                </div>
                <textarea
                  value={stickyNotes[1].content}
                  onChange={e => updateStickyNote(1, 'content', e.target.value)}
                  className="bg-transparent font-label-sm text-[11px] leading-tight text-[#14532d] outline-none resize-none flex-1 min-h-[60px] placeholder:text-[#166534]/50 placeholder:italic"
                  placeholder="Tulis catatan di sini..."
                />
              </div>
              {/* NOTE 3 — Biru/Ungu */}
              <div className="bg-[#e0e7ff] text-[#1e1b4b] p-step-sm border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] sticky-note rotate-[-1.5deg] flex flex-col">
                <div className="flex items-center justify-between border-b border-[#4f46e5]/40 pb-pixel-unit mb-step-xs">
                  <input
                    type="text"
                    value={stickyNotes[2].title}
                    onChange={e => updateStickyNote(2, 'title', e.target.value)}
                    className="bg-transparent font-label-sm text-[10px] font-bold text-[#1e1b4b] outline-none w-full border-none"
                    placeholder="Judul..."
                  />
                  <span className="material-symbols-outlined text-[12px] text-[#4f46e5] shrink-0">push_pin</span>
                </div>
                <textarea
                  value={stickyNotes[2].content}
                  onChange={e => updateStickyNote(2, 'content', e.target.value)}
                  className="bg-transparent font-label-sm text-[11px] leading-tight text-[#1e1b4b] outline-none resize-none flex-1 min-h-[60px] placeholder:text-[#312e81]/50 placeholder:italic"
                  placeholder="Tulis catatan di sini..."
                />
              </div>
              {/* NOTE 4 — Merah */}
              <div className="bg-[#fee2e2] text-[#7f1d1d] p-step-sm border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] sticky-note rotate-[1deg] flex flex-col">
                <div className="flex items-center justify-between border-b border-[#dc2626]/40 pb-pixel-unit mb-step-xs">
                  <input
                    type="text"
                    value={stickyNotes[3].title}
                    onChange={e => updateStickyNote(3, 'title', e.target.value)}
                    className="bg-transparent font-label-sm text-[10px] font-bold text-[#7f1d1d] outline-none w-full border-none"
                    placeholder="Judul..."
                  />
                  <span className="material-symbols-outlined text-[12px] text-[#dc2626] shrink-0">push_pin</span>
                </div>
                <textarea
                  value={stickyNotes[3].content}
                  onChange={e => updateStickyNote(3, 'content', e.target.value)}
                  className="bg-transparent font-label-sm text-[11px] leading-tight text-[#7f1d1d] outline-none resize-none flex-1 min-h-[60px] placeholder:text-[#991b1b]/50 placeholder:italic"
                  placeholder="Tulis catatan di sini..."
                />
              </div>
            </div>
            </div>
          </div>

          {/* Scratchpad */}
          <div className="relative bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300] flex flex-col flex-1">
            <PanelVines />
            <div className="relative z-20 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-step-xs">
                <div className="flex items-center gap-step-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">SPELL SCROLL SCRATCHPAD</h2>
              </div>
              <span className="font-label-sm text-[10px] bg-inverse-surface text-tertiary-fixed-dim px-step-xs py-pixel-unit">MARKDOWN</span>
            </div>
            <div className="flex-1 bg-inverse-surface border-2 border-inverse-surface p-step-sm shadow-[inset_2px_2px_0_0_#050300] text-surface-bright flex flex-col">
              <div className="flex items-center justify-between pb-step-xs border-b border-surface-variant/20 mb-step-xs font-label-sm text-[11px] text-tertiary-fixed-dim">
                <span>// scratchpad.md</span>
                <span className="text-[10px] text-outline-variant">UTF-8</span>
              </div>
              <textarea
                value={scratchpadContent}
                onChange={e => setScratchpadContent(e.target.value)}
                className="w-full bg-transparent text-surface-bright font-label-sm text-[12px] leading-relaxed resize-none focus:outline-none flex-1 min-h-[180px] scrollbar-dark"
                spellCheck={false}
              />
            </div>
            <div className="mt-step-sm flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">{saveStatus}</span>
              <button onClick={saveNotes} className="bg-primary-container hover:bg-tertiary-fixed-dim text-on-primary-container font-label-sm text-label-sm font-bold px-step-md py-step-xs border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300] pixel-btn flex items-center gap-pixel-unit">
                <span className="material-symbols-outlined text-[15px]">save</span>
                <span>SAVE SCROLL</span>
              </button>
            </div>
            </div>
          </div>

          {/* ═══ ENCHANTED BOOKSHELF ═══ */}
          <div className="relative bg-surface-container border-2 border-inverse-surface p-step-md shadow-[4px_4px_0_0_#050300]">
            <PanelVines />
            <div className="relative z-20">
              {/* Header */}
              <div className="flex items-center justify-between mb-step-md">
                <div className="flex items-center gap-step-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">auto_stories</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">ENCHANTED BOOKSHELF</span>
                <span className="bg-inverse-surface text-tertiary-fixed-dim font-label-sm text-[10px] px-step-xs py-pixel-unit border border-inverse-surface">
                  {(noteBlocks || []).length} BUKU
                </span>
              </div>
              <button
                onClick={() => {
                  handleAddNote('Enchanted Book', '');
                }}
                className="flex items-center gap-pixel-unit bg-primary-container text-on-primary-container font-label-sm text-label-sm px-step-sm py-pixel-unit border-2 border-inverse-surface shadow-[2px_2px_0_0_#050300] pixel-btn"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                BUKU BARU
              </button>
            </div>

            {/* Shelf rail top */}
            <div className="h-2 bg-inverse-surface mb-step-sm shadow-[0_3px_0_0_#050300]" />

            {/* Book grid */}
            {(noteBlocks || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-step-xl gap-step-sm text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-40">auto_stories</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Belum ada buku catatan.</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">Klik "+ BUKU BARU" untuk membuat buku pertamamu.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-step-sm">
                {(noteBlocks || []).map((note, idx) => {
                  // Extract title from content (first line or stored title)
                  const storedTitle = note.title || '';
                  const firstLine = note.content ? note.content.split('\n')[0].replace(/===PAGE===/g, '').trim() : '';
                  const displayTitle = storedTitle || firstLine || `Buku ${idx + 1}`;
                  const pageCount = note.content ? note.content.split('===PAGE===').length : 1;

                  // Book spine colors rotate
                  const bookColors = [
                    { spine: '#5c2a0f', cover: '#7c3d1a', accent: '#c0392b' },
                    { spine: '#1a3a5c', cover: '#1e4d8c', accent: '#2980b9' },
                    { spine: '#1a4a1a', cover: '#2d6a2d', accent: '#27ae60' },
                    { spine: '#4a1a4a', cover: '#7b2d7b', accent: '#9b59b6' },
                    { spine: '#4a3a0a', cover: '#7c6414', accent: '#f39c12' },
                  ];
                  const col = bookColors[idx % bookColors.length];

                  return (
                    <div
                      key={note.id}
                      className="book-card flex flex-col items-center gap-step-xs"
                      onClick={() => setOpenBook(note)}
                      title={`Buka: ${displayTitle}`}
                    >
                      {/* Book 3D shape */}
                      <div
                        className="relative"
                        style={{
                          width: 60,
                          height: 80,
                          border: `3px solid ${col.spine}`,
                          boxShadow: `3px 3px 0 0 ${col.spine}`,
                        }}
                      >
                        {/* Cover */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(120deg, ${col.cover} 0%, ${col.spine} 100%)`,
                          }}
                        />
                        {/* Spine line */}
                        <div
                          className="absolute top-0 bottom-0 left-0"
                          style={{ width: 8, background: col.spine }}
                        />
                        {/* Spiral dots on spine */}
                        {[20, 34, 48].map(top => (
                          <div
                            key={top}
                            className="absolute"
                            style={{
                              top, left: 2,
                              width: 6, height: 5,
                              borderRadius: '0 3px 3px 0',
                              background: col.accent,
                              border: `1px solid ${col.spine}`,
                            }}
                          />
                        ))}
                        {/* Page count badge */}
                        <div
                          className="absolute bottom-1 right-1 font-label-sm text-[8px] text-white/80 px-[3px]"
                          style={{ background: 'rgba(0,0,0,0.4)', fontFamily: '"JetBrains Mono", monospace' }}
                        >
                          {pageCount}p
                        </div>
                        {/* Open indicator on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.35)' }}>
                          <span className="material-symbols-outlined text-white text-[20px]">menu_book</span>
                        </div>
                      </div>
                      {/* Title under book */}
                      <span
                        className="text-center font-label-sm text-[9px] text-on-surface-variant leading-tight max-w-[64px] truncate"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {displayTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shelf rail bottom */}
            <div className="h-3 bg-inverse-surface mt-step-sm shadow-[0_3px_0_0_#050300]" />
            <div className="h-1 bg-[#1A0E06] mt-[2px]" />
            </div>
          </div>

          {/* BookModal — renders into body when a book is open */}
          {openBook && (
            <BookModal
              note={openBook}
              onClose={() => setOpenBook(null)}
              onSave={(id, content, title) => {
                handleUpdateBlockContent(id, content);
                // Update local openBook title too (reflected on shelf after re-fetch)
              }}
              onDelete={(id) => deleteBlock(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// PAGE: PROFIT ANALYTICS
// ============================================================
function ProfitAnalyticsPage({
  transactions, formatIDR, tabunganBalance, tabunganIn, tabunganOut,
  gtNetDL, gtNetIDR, totalKekayaanIDR, isGtProfit, gtModalDL, gtOmsetDL,
  deleteTransaction, financeChartRef,
  isAddingTx, setIsAddingTx, isTransferring, setIsTransferring,
  newTxDesc, setNewTxDesc, newTxDate, setNewTxDate, newTxAmount, setNewTxAmount,
  newTxType, setNewTxType, newTxCurrency, setNewTxCurrency, txCategory,
  handleTxCategoryToggle, handleAddTransaction,
  transferDirection, setTransferDirection, transferDate, setTransferDate,
  transferAmountIDR, setTransferAmountIDR, transferDesc, setTransferDesc,
  handleTransferAction, dlRate, setDlRate, saveDlRateToDB,
  txFilter, setTxFilter
}) {
  const [rangeFilter, setRangeFilter] = useState('30D');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTx = (transactions || []).filter(tx => {
    if (typeFilter === 'PROFIT' && tx.type !== 'pemasukan') return false;
    if (typeFilter === 'LOSS' && tx.type !== 'pengeluaran') return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const wins = (transactions || []).filter(t => t.type === 'pemasukan').length;
  const losses = (transactions || []).filter(t => t.type === 'pengeluaran').length;
  const winRate = wins + losses === 0 ? 0 : Math.round((wins / (wins + losses)) * 100);
  const roi = gtModalDL === 0 ? 0 : ((gtNetDL / gtModalDL) * 100).toFixed(1);

  return (
    <div className="flex flex-col w-full animate-entrance">
      {/* HEADER */}
      <div className="relative bg-surface-container-low px-step-lg py-step-lg shadow-[4px_4px_0_0_#050300]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-step-md">
          <div>
            <div className="flex items-center gap-step-xs flex-wrap mb-step-xs">
              <span className="inline-flex items-center gap-1 bg-inverse-surface text-tertiary-fixed-dim px-step-xs py-pixel-unit font-label-sm text-label-sm shadow-[2px_2px_0_0_#1E0E02]">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                FINANCE GUILD — LEDGER SYNCED
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Treasury &amp; P&amp;L Guild</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
              Real-time asset arbitration, lock yield trajectories, and transactional ledger logs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-step-sm">
            <div className="inline-flex p-pixel-unit bg-surface-dim border border-inverse-surface">
              {['7D', '30D', '3M', 'ALL'].map(r => (
                <button key={r} onClick={() => setRangeFilter(r)} className={`px-step-sm py-pixel-unit font-label-sm text-label-sm transition-colors ${rangeFilter === r ? 'bg-inverse-surface text-tertiary-fixed-dim font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>{r}</button>
              ))}
            </div>
            <div className="flex items-center gap-step-xs">
              <button onClick={() => { setIsAddingTx(!isAddingTx); setIsTransferring(false); }} className={`inline-flex items-center gap-step-xs px-step-md py-step-sm font-label-md text-label-md shadow-[3px_3px_0_0_#050300] pixel-btn ${isAddingTx ? 'bg-error text-on-error' : 'bg-surface-container text-on-surface border-2 border-inverse-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">add_box</span>
                <span>{isAddingTx ? 'Batal' : '+ Trade Baru'}</span>
              </button>
              <button onClick={() => { setIsTransferring(!isTransferring); setIsAddingTx(false); }} className={`inline-flex items-center gap-step-xs px-step-md py-step-sm font-label-md text-label-md shadow-[3px_3px_0_0_#050300] pixel-btn ${isTransferring ? 'bg-error text-on-error' : 'bg-primary-container text-on-primary-container border-2 border-inverse-surface'}`}>
                <span>⇄ Konversi</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full px-step-md sm:px-step-lg py-step-lg flex flex-col gap-step-lg">
        {/* Forms */}
        {isAddingTx && (
          <div className="bg-surface-container-low border-2 border-inverse-surface p-step-md shadow-[3px_3px_0_0_#050300] flex flex-col gap-step-sm animate-entrance">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase mb-step-xs">Catat Transaksi Baru</div>
            <div className="flex bg-surface-dim border border-inverse-surface p-pixel-unit w-fit">
              <button onClick={() => handleTxCategoryToggle('TABUNGAN')} className={`px-step-md py-step-xs font-label-sm text-label-sm font-bold ${txCategory === 'TABUNGAN' ? 'bg-inverse-surface text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>BANK</button>
              <button onClick={() => handleTxCategoryToggle('GT')} className={`px-step-md py-step-xs font-label-sm text-label-sm font-bold ${txCategory === 'GT' ? 'bg-inverse-surface text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>ASET GT</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-step-sm">
              <input type="text" value={newTxDesc} onChange={e => setNewTxDesc(e.target.value)} placeholder="Deskripsi transaksi..." className="col-span-2 bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-body-sm text-body-sm text-on-surface outline-none focus:border-primary" />
              <input type="date" value={newTxDate} onChange={e => setNewTxDate(e.target.value)} className="bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
              <select value={newTxType} onChange={e => setNewTxType(e.target.value)} className="bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none">
                <option value="pemasukan">Masuk / Profit (+)</option>
                <option value="pengeluaran">Keluar / Loss (-)</option>
                <option value="pengeluaran_modal">Keluar Modal (-)</option>
              </select>
            </div>
            <div className="flex gap-step-sm items-end">
              <div className="flex">
                <input type="number" value={newTxAmount} onChange={e => setNewTxAmount(e.target.value)} placeholder="Jumlah..." className="w-32 bg-surface-dim border-2 border-l-2 border-y-2 border-r-0 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
                {txCategory === 'GT' && (
                  <select value={newTxCurrency} onChange={e => setNewTxCurrency(e.target.value)} className="bg-surface-container-high border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none">
                    <option value="WL">WL</option>
                    <option value="DL">DL</option>
                    <option value="BGL">BGL</option>
                  </select>
                )}
              </div>
              <button onClick={handleAddTransaction} className="px-step-lg py-step-sm bg-primary-container text-on-primary-container font-label-md text-label-md font-bold border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn">
                CATAT
              </button>
            </div>
          </div>
        )}

        {isTransferring && (
          <div className="bg-surface-container-low border-2 border-inverse-surface p-step-md shadow-[3px_3px_0_0_#050300] flex flex-wrap gap-step-sm items-end animate-entrance">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase w-full">Konversi Aset IDR ⇄ GT</div>
            <select value={transferDirection} onChange={e => setTransferDirection(e.target.value)} className="bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none">
              <option value="TABUNGAN_TO_GT">Beli Aset GT (Rp → DL)</option>
              <option value="GT_TO_TABUNGAN">Jual Aset GT (DL → Rp)</option>
            </select>
            <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
            <input type="number" value={transferAmountIDR} onChange={e => setTransferAmountIDR(e.target.value)} placeholder="Nominal Rp..." className="w-36 bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
            <input type="text" value={transferDesc} onChange={e => setTransferDesc(e.target.value)} placeholder="Keterangan..." className="flex-1 bg-surface-dim border-2 border-inverse-surface px-step-sm py-step-xs font-label-sm text-label-sm text-on-surface outline-none" />
            <button onClick={handleTransferAction} className="px-step-lg py-step-sm bg-tertiary-container text-on-tertiary-container font-label-md text-label-md font-bold border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300] pixel-btn">EKSEKUSI</button>
          </div>
        )}

        {/* METRIC HUD CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-step-md">
          {[
            { label: 'Tabungan IDR', value: formatIDR(tabunganBalance), color: tabunganBalance >= 0 ? 'text-primary' : 'text-error', icon: 'account_balance_wallet', sub: `Masuk: ${formatIDR(tabunganIn)}` },
            { label: 'Gross Valuation', value: formatIDR(tabunganBalance + gtNetIDR), color: 'text-on-surface', icon: 'shield_lock', sub: `≈ ${gtNetDL.toFixed(2)} DL` },
            { label: 'Net Profit GT', value: `${isGtProfit ? '+' : ''}${gtNetDL.toFixed(2)} DL`, color: isGtProfit ? 'text-primary' : 'text-error', icon: 'trending_up', sub: `${isGtProfit ? '+' : ''}${formatIDR(gtNetIDR)}`, highlight: true },
            { label: 'Win Rate', value: `${winRate}%`, color: 'text-on-surface', icon: 'verified', sub: `${wins} Wins / ${losses} Losses` },
            { label: 'ROI', value: `${roi}%`, color: parseFloat(roi) >= 0 ? 'text-primary' : 'text-error', icon: 'percent', sub: `Modal: ${gtModalDL.toFixed(2)} DL` },
          ].map((card, i) => (
            <div key={i} className={`relative bg-surface-container-low p-step-md flex flex-col justify-between shadow-[4px_4px_0_0_#050300] hover:-translate-y-0.5 transition-transform ${card.highlight ? 'ring-2 ring-primary-container' : ''} border-2 border-inverse-surface`}><PanelVines />
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{card.label}</span>
                <span className="material-symbols-outlined text-primary text-[20px]">{card.icon}</span>
              </div>
              <div className="my-step-sm">
                <div className={`font-headline-md text-headline-md font-bold tracking-tight ${card.color}`}>{card.value}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-pixel-unit">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CHART */}
        <div className="relative bg-surface-container-low border-2 border-inverse-surface p-step-md sm:p-step-lg shadow-[4px_4px_0_0_#050300]">
          <PanelVines />
          <div className="relative z-20 flex items-center justify-between mb-step-md">
            <div>
              <div className="flex items-center gap-step-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Cumulative Net Worth Trajectory</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Progression of portfolio value over time</p>
            </div>
            <div className="flex items-center gap-step-md font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-primary-container border border-inverse-surface inline-block"></span>
                <span className="text-on-surface">Net Worth</span>
              </div>
            </div>
          </div>
          <div className="relative w-full h-64 bg-surface-container border-2 border-inverse-surface p-step-sm shadow-[inset_2px_2px_0_0_#050300]">
            <canvas ref={financeChartRef} className="w-full h-full"></canvas>
          </div>
          <div className="mt-step-sm grid grid-cols-1 sm:grid-cols-3 gap-step-sm pt-step-xs border-t-2 border-surface-dim">
            <div className="flex items-center gap-step-sm">
              <div className="w-7 h-7 bg-surface-container flex items-center justify-center border border-inverse-surface shadow-[2px_2px_0_0_#050300]">
                <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Total Pemasukan</div>
                <div className="font-label-md text-label-md text-on-surface font-bold">{formatIDR(tabunganIn)}</div>
              </div>
            </div>
            <div className="flex items-center gap-step-sm">
              <div className="w-7 h-7 bg-surface-container flex items-center justify-center border border-inverse-surface shadow-[2px_2px_0_0_#050300]">
                <span className="material-symbols-outlined text-[16px] text-error">trending_down</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Total Pengeluaran</div>
                <div className="font-label-md text-label-md text-on-surface font-bold">{formatIDR(tabunganOut)}</div>
              </div>
            </div>
            <div className="flex items-center gap-step-sm">
              <div className="w-7 h-7 bg-surface-container flex items-center justify-center border border-inverse-surface shadow-[2px_2px_0_0_#050300]">
                <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Aset GT (DL)</div>
                <div className="font-label-md text-label-md text-primary font-bold">{gtNetDL.toFixed(2)} DL</div>
              </div>
            </div>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="relative bg-surface-container-low border-2 border-inverse-surface p-step-md sm:p-step-lg shadow-[4px_4px_0_0_#050300] flex flex-col gap-step-md">
          <PanelVines />
          <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-step-md">
            <div className="flex items-center gap-step-sm">
              <div className="w-8 h-8 bg-inverse-surface text-tertiary-fixed-dim flex items-center justify-center shadow-[2px_2px_0_0_#1E0E02]">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Guild P&amp;L Ledger Book</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Audit log setiap transaksi aset dan keuangan</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-step-sm">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari transaksi..."
                  className="w-full sm:w-52 bg-surface-dim font-label-sm text-label-sm text-on-surface px-step-md py-step-xs pl-8 border-2 border-inverse-surface outline-none focus:border-primary"
                />
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
              </div>
              <div className="flex items-center gap-step-xs">
                {[['ALL', 'SEMUA'], ['PROFIT', 'MASUK'], ['LOSS', 'KELUAR']].map(([val, label]) => (
                  <button key={val} onClick={() => setTypeFilter(val)} className={`px-step-sm py-step-xs font-label-sm text-label-sm border border-inverse-surface pixel-btn ${typeFilter === val ? 'bg-inverse-surface text-tertiary-fixed-dim font-bold shadow-[2px_2px_0_0_#1E0E02]' : 'bg-surface-container text-on-surface-variant shadow-[2px_2px_0_0_#050300]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto border-2 border-inverse-surface shadow-[3px_3px_0_0_#050300]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b-2 border-inverse-surface font-label-sm text-label-sm text-on-surface uppercase">
                  <th className="py-step-sm px-step-md">Tanggal</th>
                  <th className="py-step-sm px-step-md">Tipe</th>
                  <th className="py-step-sm px-step-md">Deskripsi</th>
                  <th className="py-step-sm px-step-md">Jumlah</th>
                  <th className="py-step-sm px-step-md">Status</th>
                  <th className="py-step-sm px-step-md text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-inverse-surface/20 bg-surface-container-lowest">
                {filteredTx.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-step-lg font-body-sm text-body-sm text-on-surface-variant">
                      {searchQuery || typeFilter !== 'ALL' ? 'Tidak ada hasil yang cocok.' : 'Belum ada transaksi. Tambahkan yang pertama!'}
                    </td>
                  </tr>
                )}
                {filteredTx.map(tx => {
                  const isIn = tx.type === 'pemasukan';
                  const isBankTx = tx.currency_type === 'TABUNGAN' || tx.currency_type === 'IDR';
                  return (
                    <tr key={tx.id} className="hover:bg-surface-container/50 transition-colors group">
                      <td className="py-step-sm px-step-md font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{tx.date}</td>
                      <td className="py-step-sm px-step-md">
                        <span className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-step-xs py-pixel-unit border border-inverse-surface ${isBankTx ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface'}`}>
                          <span className="material-symbols-outlined text-[12px] text-primary">{isBankTx ? 'payments' : 'diamond'}</span>
                          {isBankTx ? 'IDR' : tx.currency_type}
                        </span>
                      </td>
                      <td className="py-step-sm px-step-md">
                        <div className="font-bold text-on-surface">{tx.description}</div>
                        {tx.asset_status && <div className="font-label-sm text-label-sm text-on-surface-variant">{tx.asset_status}</div>}
                      </td>
                      <td className="py-step-sm px-step-md whitespace-nowrap">
                        <span className={`font-label-md text-label-md font-bold ${isIn ? 'text-primary' : 'text-error'}`}>
                          {isIn ? '+' : '-'}{isBankTx ? formatIDR(tx.amount) : `${tx.amount} ${tx.currency_type}`}
                        </span>
                      </td>
                      <td className="py-step-sm px-step-md whitespace-nowrap">
                        <span className={`px-step-xs py-pixel-unit font-label-sm text-label-sm font-bold border border-inverse-surface ${isIn ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                          {isIn ? 'MASUK' : 'KELUAR'}
                        </span>
                      </td>
                      <td className="py-step-sm px-step-md text-right whitespace-nowrap">
                        <button onClick={() => deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 p-pixel-unit hover:bg-surface-dim border border-inverse-surface shadow-[1px_1px_0_0_#050300] transition-opacity pixel-btn">
                          <span className="material-symbols-outlined text-[16px] text-error">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between font-label-sm text-label-sm">
            <div className="text-on-surface-variant">
              Menampilkan <span className="text-on-surface font-bold">{filteredTx.length}</span> dari {(transactions || []).length} entri
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE: ASSET VAULT (Stub)
// ============================================================
function AssetVaultPage() {
  return (
    <div className="flex flex-col w-full animate-entrance">
      <div className="relative w-full overflow-hidden bg-surface-container-high px-step-lg py-step-lg shadow-[4px_4px_0_0_#050300]">
        <div className="relative z-10">
          <div className="flex items-center gap-step-sm mb-step-xs">
            <span className="font-label-sm text-label-sm bg-inverse-surface text-tertiary-fixed-dim px-step-sm py-pixel-unit shadow-[2px_2px_0_0_#050300]">
              SECURE VAULT // REALM ARCHIVE
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Asset Vault</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            Inventaris lengkap semua aset game, item, dan koleksi digital dalam satu brankas.
          </p>
        </div>
      </div>
      <div className="p-step-lg flex flex-col items-center justify-center min-h-[60vh] gap-step-lg">
        <div className="bg-surface-container border-2 border-inverse-surface p-step-3xl shadow-[8px_8px_0_0_#050300] flex flex-col items-center gap-step-lg text-center max-w-md">
          <div className="w-24 h-24 bg-inverse-surface flex items-center justify-center text-tertiary-fixed-dim shadow-[inset_4px_4px_0_0_#050300]">
            <span className="material-symbols-outlined text-[56px]">lock</span>
          </div>
          <div>
            <div className="font-label-sm text-label-sm bg-primary-container text-on-primary-container px-step-md py-pixel-unit border border-inverse-surface font-bold inline-block mb-step-sm">
              COMING SOON
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-step-xs">Vault Sedang Dibangun</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Fitur inventaris aset game (Growtopia BGL/DL, CreativePS items) akan segera hadir. Archmage sedang mengukir runic seal terakhir...
            </p>
          </div>
          <div className="w-full h-3 bg-surface-dim border-2 border-inverse-surface p-[1px]">
            <div className="h-full bg-primary-container mana-glow" style={{ width: '40%' }}></div>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">PROGRESS: 40%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP COMPONENT
// ============================================================
function App() {
  // ===== PAGE ROUTING =====
  const [activePage, setActivePage] = useState('command-center');

  // ===== SUPABASE DATA STATE =====
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Groups & Checklist
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newBlockContent, setNewBlockContent] = useState({});
  const [activeGroupInput, setActiveGroupInput] = useState(null);

  // Notes
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');

  // Subtitles / Saved State
  const [subtitles, setSubtitles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('page_subtitles')) || {}; } catch (e) { return {}; }
  });
  useEffect(() => localStorage.setItem('page_subtitles', JSON.stringify(subtitles)), [subtitles]);

  const [targetGroups, setTargetGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('target_groups_data')) || {}; } catch (e) { return {}; }
  });
  useEffect(() => localStorage.setItem('target_groups_data', JSON.stringify(targetGroups)), [targetGroups]);
  const currentPageGroups = targetGroups[activePageId] || ['todo'];

  // ===== FINANCE STATE =====
  const [transactions, setTransactions] = useState([]);
  const todayISOStr = new Date().toISOString().split('T')[0];
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txCategory, setTxCategory] = useState('TABUNGAN');
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxDate, setNewTxDate] = useState(todayISOStr);
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxType, setNewTxType] = useState('pengeluaran');
  const [newTxCurrency, setNewTxCurrency] = useState('TABUNGAN');
  const [txFilter, setTxFilter] = useState('ALL');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferDirection, setTransferDirection] = useState('TABUNGAN_TO_GT');
  const [transferDate, setTransferDate] = useState(todayISOStr);
  const [transferAmountIDR, setTransferAmountIDR] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [dlRate, setDlRate] = useState(() => localStorage.getItem('finance_dl_rate') || 10000);
  useEffect(() => localStorage.setItem('finance_dl_rate', dlRate), [dlRate]);

  // ===== PLANNER STATE =====
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyTasks, setDailyTasks] = useState([]);
  const [newDailyTaskName, setNewDailyTaskName] = useState('');
  const [allPageTasks, setAllPageTasks] = useState([]);
  const monthKey = format(currentMonth, 'yyyy_MM');
  const [newMonthlyTodo, setNewMonthlyTodo] = useState('');

  // ===== REFS =====
  const financeChartRef = useRef(null);

  // ===== COMPUTED FINANCE =====
  const financeData = useMemo(() => {
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
    return { tabunganIn, tabunganOut, gtModalDL, gtOmsetDL, tabunganBalance, gtNetDL, isGtProfit, gtNetIDR, totalKekayaanIDR };
  }, [transactions, dlRate]);

  const { tabunganIn, tabunganOut, gtModalDL, gtOmsetDL, tabunganBalance, gtNetDL, isGtProfit, gtNetIDR, totalKekayaanIDR } = financeData;

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  // ===== COMPUTED STATS =====
  const activePage_page = (pages || []).find(p => p.id === activePageId);
  const noteBlocks = (blocks || []).filter(b => b.type === 'note');
  const allChecklistBlocks = (blocks || []).filter(b => currentPageGroups.includes(b.type));
  const totalTodos = allChecklistBlocks.length;
  const completedTodos = allChecklistBlocks.filter(b => b.is_completed).length;
  const blocksPercent = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);
  const calcPercent = useCallback((tasksArray) => (!tasksArray || tasksArray.length === 0) ? 0 : Math.round((tasksArray.filter(t => t.is_completed).length / tasksArray.length) * 100), []);
  const dailyPercent = calcPercent((allPageTasks || []).filter(t => t.task_date === format(new Date(), 'yyyy-MM-dd')));

  const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
  const monthlyTodos = (blocks || []).filter(b => b.type === `monthly_todo_${monthKey}`);

  // ===== FINANCE CHART =====
  useEffect(() => {
    if (!financeChartRef.current) return;
    const ctx = financeChartRef.current.getContext('2d');
    const sortedTx = [...(transactions || [])].reverse();
    let runTotal = 0;
    const labels = [];
    const data = [];
    if (sortedTx.length === 0) { labels.push('Start'); data.push(0); }
    else {
      sortedTx.forEach(t => {
        let valIDR = 0;
        if (t.currency_type === 'TABUNGAN' || t.currency_type === 'IDR') valIDR = t.amount;
        else if (['WL', 'DL', 'BGL'].includes(t.currency_type)) valIDR = (t.currency_type === 'BGL' ? t.amount * 100 : (t.currency_type === 'WL' ? t.amount / 100 : t.amount)) * dlRate;
        if (t.type === 'pemasukan') runTotal += valIDR; else runTotal -= valIDR;
        labels.push(t.date || '');
        data.push(runTotal);
      });
    }
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    const chart = new Chart(financeChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Net Worth (IDR)',
          data,
          borderColor: '#6B3A1F',
          backgroundColor: grad,
          borderWidth: 3,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          tension: 0,
          stepped: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            position: 'right',
            grid: { color: 'rgba(28, 54, 33, 0.15)' },
            ticks: { color: '#9A7A50', callback: v => formatIDR(v) }
          },
          x: { grid: { display: false }, ticks: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#050300',
            titleColor: '#C89020',
            bodyColor: '#241608',
            callbacks: { label: ctx => ` ${formatIDR(ctx.parsed.y)}` }
          }
        }
      }
    });
    return () => chart.destroy();
  }, [transactions, dlRate, activePage]);

  // ===== FETCH & CRUD =====
  const fetchTasksData = async (date, pillar) => {
    const { data: dailyData } = await supabase.from('daily_tasks').select('*').eq('task_date', format(date, 'yyyy-MM-dd')).eq('pillar', pillar || '').order('id', { ascending: true });
    setDailyTasks(dailyData || []);
    const { data: allData } = await supabase.from('daily_tasks').select('*').eq('pillar', pillar || '');
    setAllPageTasks(allData || []);
  };
  const fetchPages = async () => {
    const { data } = await supabase.from('pages').select('*').order('created_at', { ascending: true });
    setPages(data || []);
    if (!activePageId && data && data.length > 0) setActivePageId(data[0].id);
  };
  const fetchBlocks = async (pageId) => {
    const { data } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('created_at', { ascending: true });
    setBlocks(data || []);
  };
  const fetchTransactions = async (pageId) => {
    const { data } = await supabase.from('growtopia_transactions').select('*').eq('page_id', pageId).order('id', { ascending: false });
    setTransactions(data || []);
  };

  useEffect(() => {
    // Always fetch daily tasks (tidak tergantung activePageId) agar Quest Log selalu bisa dipakai
    fetchTasksData(selectedDate, activePage_page?.pillar || '');
    if (activePageId) {
      fetchBlocks(activePageId);
      fetchTransactions(activePageId);
    }
  }, [activePageId, selectedDate, currentMonth]);

  useEffect(() => {
    const init = async () => { setLoading(true); await fetchPages(); setLoading(false); };
    init();
  }, []);

  // Sync dlRate from DB blocks
  useEffect(() => {
    const rateBlock = (blocks || []).find(b => b.type === 'setting_dlRate');
    if (rateBlock && rateBlock.content) setDlRate(rateBlock.content);
    const subBlock = (blocks || []).find(b => b.type === 'setting_subtitles');
    if (subBlock && subBlock.content) { try { setSubtitles(JSON.parse(subBlock.content)); } catch (e) {} }
  }, [blocks]);

  const handleSyncData = async () => {
    setIsSyncing(true);
    await fetchPages();
    if (activePageId) {
      await fetchTasksData(selectedDate, activePage_page?.pillar || '');
      await fetchBlocks(activePageId);
      await fetchTransactions(activePageId);
    }
    setTimeout(() => setIsSyncing(false), 800);
  };

  const saveDlRateToDB = async (newRate) => {
    if (!activePageId) return;
    const existing = (blocks || []).find(b => b.type === 'setting_dlRate');
    if (existing) await supabase.from('blocks').update({ content: newRate.toString() }).eq('id', existing.id);
    else await supabase.from('blocks').insert([{ page_id: activePageId, type: 'setting_dlRate', content: newRate.toString(), is_completed: false }]);
    fetchBlocks(activePageId);
  };
  const saveSubtitlesToDB = async (newSubs) => {
    if (!activePageId) return;
    const existing = (blocks || []).find(b => b.type === 'setting_subtitles');
    if (existing) await supabase.from('blocks').update({ content: JSON.stringify(newSubs) }).eq('id', existing.id);
    else await supabase.from('blocks').insert([{ page_id: activePageId, type: 'setting_subtitles', content: JSON.stringify(newSubs), is_completed: false }]);
    fetchBlocks(activePageId);
  };

  const handleAddBlockInGroup = async (e, groupType) => {
    const text = newBlockContent[groupType] || '';
    if (e.key === 'Enter' && text.trim() !== '' && activePageId) {
      await supabase.from('blocks').insert([{ page_id: activePageId, type: groupType, content: text.trim(), is_completed: false }]);
      setNewBlockContent({ ...newBlockContent, [groupType]: '' });
      setActiveGroupInput(null);
      fetchBlocks(activePageId);
    }
  };
  const handleAddCustomBlockEnter = async (e, type, content, setContentFunc) => {
    if (e.key === 'Enter' && content.trim() !== '' && activePageId) {
      await supabase.from('blocks').insert([{ page_id: activePageId, type, content: content.trim(), is_completed: false }]);
      if (setContentFunc) setContentFunc('');
      fetchBlocks(activePageId);
    }
  };
  const handleAddCustomBlockClick = async (type, content) => {
    if (activePageId) {
      await supabase.from('blocks').insert([{ page_id: activePageId, type, content, is_completed: false }]);
      fetchBlocks(activePageId);
    }
  };
  const handleUpdateBlockContent = async (id, newContent) => {
    if (newContent.trim() !== '') {
      await supabase.from('blocks').update({ content: newContent }).eq('id', id);
      setEditingNoteId(null);
      fetchBlocks(activePageId);
    }
  };
  const handleAddNote = async (titleParam, contentParam) => {
    const noteContent = contentParam !== undefined ? contentParam : newNoteContent;
    if (!activePageId) return; // blocks table requires page_id
    await supabase.from('blocks').insert([{
      page_id: activePageId,
      type: 'note',
      content: noteContent,
      is_completed: false
    }]);
    if (contentParam === undefined) {
      setNewNoteContent('');
      setIsAddingNote(false);
    }
    fetchBlocks(activePageId);
  };

  const toggleBlock = async (id, currentStatus) => {
    await supabase.from('blocks').update({ is_completed: !currentStatus }).eq('id', id);
    fetchBlocks(activePageId);
  };
  const deleteBlock = async (id) => {
    if (window.confirm('Hapus item ini?')) {
      await supabase.from('blocks').delete().eq('id', id);
      fetchBlocks(activePageId);
    }
  };
  const handleAddDailyTask = async (e) => {
    if (e.key === 'Enter' && newDailyTaskName.trim() !== '') {
      const { data } = await supabase.from('daily_tasks').insert([{
        task_name: newDailyTaskName,
        task_date: format(selectedDate, 'yyyy-MM-dd'),
        is_completed: false,
        pillar: activePage_page?.pillar || ''
      }]).select();
      if (data) {
        setDailyTasks([...(dailyTasks || []), ...data]);
        setAllPageTasks([...(allPageTasks || []), ...data]);
        setNewDailyTaskName('');
      }
    }
  };
  const toggleDailyTask = async (id, currentStatus) => {
    await supabase.from('daily_tasks').update({ is_completed: !currentStatus }).eq('id', id);
    fetchTasksData(selectedDate, activePage_page?.pillar);
  };
  const deleteDailyTask = async (id) => {
    if (window.confirm('Hapus quest ini?')) {
      await supabase.from('daily_tasks').delete().eq('id', id);
      fetchTasksData(selectedDate, activePage_page?.pillar);
    }
  };
  const handleAddTargetGroup = () => {
    if (newGroupName.trim() !== '' && activePageId) {
      const clean = newGroupName.trim().toLowerCase().replace(/\s+/g, '_');
      setTargetGroups({ ...targetGroups, [activePageId]: [...currentPageGroups, clean] });
      setSubtitles({ ...subtitles, [`title_${clean}_${activePageId}`]: newGroupName.trim() });
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };
  const handleDeleteTargetGroup = (groupType) => {
    if (window.confirm('Hapus list ini?')) {
      const groupBlocks = (blocks || []).filter(b => b.type === groupType);
      groupBlocks.forEach(async (b) => await supabase.from('blocks').delete().eq('id', b.id));
      setTargetGroups({ ...targetGroups, [activePageId]: currentPageGroups.filter(g => g !== groupType) });
      fetchBlocks(activePageId);
    }
  };
  const handleTxCategoryToggle = (category) => {
    setTxCategory(category);
    if (category === 'TABUNGAN') setNewTxCurrency('TABUNGAN'); else setNewTxCurrency('DL');
  };
  const handleAddTransaction = async () => {
    if (newTxDesc.trim() === '' || newTxAmount === '') { alert('Isi form terlebih dahulu!'); return; }
    const finalCurrency = txCategory === 'TABUNGAN' ? 'TABUNGAN' : newTxCurrency;
    let finalType = newTxType;
    let assetStatus = null;
    if (newTxType === 'pengeluaran_modal') { finalType = 'pengeluaran'; assetStatus = 'MODAL'; }
    else if (newTxType === 'pengeluaran') { assetStatus = 'NON_MODAL'; }
    await supabase.from('growtopia_transactions').insert([{
      description: newTxDesc,
      amount: parseFloat(newTxAmount),
      type: finalType,
      currency_type: finalCurrency,
      date: newTxDate || todayISOStr,
      page_id: activePageId,
      asset_status: assetStatus
    }]);
    setNewTxDesc(''); setNewTxAmount(''); setIsAddingTx(false); setNewTxDate(todayISOStr);
    fetchTransactions(activePageId);
  };
  const handleTransferAction = async () => {
    if (!transferAmountIDR || parseFloat(transferAmountIDR) <= 0) return;
    const amountIDR = parseFloat(transferAmountIDR);
    const amountDL = amountIDR / (dlRate || 1);
    try {
      if (transferDirection === 'TABUNGAN_TO_GT') {
        await supabase.from('growtopia_transactions').insert([
          { description: transferDesc || 'Beli Aset', amount: amountIDR, type: 'pengeluaran', currency_type: 'TABUNGAN', date: transferDate || todayISOStr, page_id: activePageId },
          { description: transferDesc || 'Beli Aset', amount: amountDL, type: 'pemasukan', currency_type: 'DL', date: transferDate || todayISOStr, page_id: activePageId }
        ]);
      } else {
        await supabase.from('growtopia_transactions').insert([
          { description: transferDesc || 'Jual Aset', amount: amountDL, type: 'pengeluaran', currency_type: 'DL', date: transferDate || todayISOStr, page_id: activePageId },
          { description: transferDesc || 'Jual Aset', amount: amountIDR, type: 'pemasukan', currency_type: 'TABUNGAN', date: transferDate || todayISOStr, page_id: activePageId }
        ]);
      }
      setTransferAmountIDR(''); setTransferDesc(''); setIsTransferring(false); setTransferDate(todayISOStr);
      fetchTransactions(activePageId);
    } catch (error) { console.error(error); }
  };
  const deleteTransaction = async (id) => {
    if (window.confirm('Hapus transaksi?')) {
      await supabase.from('growtopia_transactions').delete().eq('id', id);
      fetchTransactions(activePageId);
    }
  };

  // ===== CALENDAR RENDERER =====
  const renderCalendarDesktop = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const dayLabels = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
    const rows = [];
    let days = [];
    let day = startDate;

    const header = (
      <div key="header" className="grid grid-cols-7 gap-pixel-unit bg-inverse-surface p-pixel-unit mb-pixel-unit">
        {dayLabels.map(d => (
          <div key={d} className="bg-surface-dim font-label-sm text-[11px] py-1 text-on-surface-variant font-bold text-center">{d}</div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelectedDay = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const dayTasks = (allPageTasks || []).filter(t => t.task_date === format(cloneDay, 'yyyy-MM-dd'));
        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`relative p-step-xs h-14 flex flex-col justify-between text-left cursor-pointer transition-colors ${
              !isCurrentMonth ? 'bg-surface-container-low opacity-40' :
              isSelectedDay ? 'bg-surface-container-high border-2 border-primary-container shadow-[inset_0_0_4px_#5C3A10]' :
              isToday ? 'bg-primary-container/20 border-2 border-primary-container' :
              'bg-surface-container-low hover:bg-surface-container'
            }`}
          >
            {/* Random small vine on some dates */}
            {(cloneDay.getDate() % 7 === 3 || cloneDay.getDate() % 11 === 0) && (
              <svg className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12 Q18 12 12 18 Q6 24 0 24" stroke="#2D5A14" strokeWidth="2" strokeLinecap="round"/>
                <ellipse cx="12" cy="18" rx="2" ry="1" fill="#4A8C28" transform="rotate(-45 12 18)"/>
                {cloneDay.getDate() % 2 === 0 && <rect x="8" y="18" width="3" height="3" fill="#D84898" />}
                {cloneDay.getDate() % 2 !== 0 && <rect x="14" y="14" width="3" height="3" fill="#FF9020" />}
              </svg>
            )}
            <span className={`relative z-10 font-label-sm text-[11px] ${isToday ? 'text-primary font-bold' : isSelectedDay ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              {format(day, 'd')}
            </span>
            {dayTasks.length > 0 && (
              <div className="flex gap-pixel-unit flex-wrap">
                {dayTasks.slice(0, 2).map((t, i) => (
                  <span key={i} className={`text-[8px] px-pixel-unit font-label-sm truncate max-w-full ${t.is_completed ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                    {t.task_name.slice(0, 8)}
                  </span>
                ))}
                {dayTasks.length > 2 && <span className="text-[8px] text-on-surface-variant font-label-sm">+{dayTasks.length - 2}</span>}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-pixel-unit bg-inverse-surface p-pixel-unit mb-pixel-unit">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{header}{rows}</div>;
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-surface-container border-2 border-inverse-surface p-step-xl shadow-[8px_8px_0_0_#050300] flex flex-col items-center gap-step-lg">
          <div className="w-16 h-16 bg-inverse-surface flex items-center justify-center border-2 border-inverse-surface">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[40px]">hourglass_top</span>
          </div>
          <div>
            <div className="font-headline-sm text-headline-sm text-on-surface font-bold text-center">QUESTFOLIO</div>
            <div className="font-label-sm text-label-sm text-primary text-center mt-pixel-unit">LOADING REALM DATA...</div>
          </div>
          <div className="w-48 h-3 bg-surface-dim border-2 border-inverse-surface p-[1px]">
            <div className="h-full bg-primary-container mana-glow" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // ===== SHARED PROPS =====
  const sharedFinanceProps = {
    transactions, formatIDR,
    tabunganBalance, tabunganIn, tabunganOut,
    gtNetDL, gtNetIDR, totalKekayaanIDR, isGtProfit, gtModalDL, gtOmsetDL,
    dlRate, setDlRate, saveDlRateToDB,
    isAddingTx, setIsAddingTx, isTransferring, setIsTransferring,
    newTxDesc, setNewTxDesc, newTxDate, setNewTxDate,
    newTxAmount, setNewTxAmount, newTxType, setNewTxType,
    newTxCurrency, setNewTxCurrency, txCategory,
    handleTxCategoryToggle, handleAddTransaction,
    transferDirection, setTransferDirection, transferDate, setTransferDate,
    transferAmountIDR, setTransferAmountIDR, transferDesc, setTransferDesc,
    handleTransferAction, deleteTransaction, txFilter, setTxFilter,
    financeChartRef,
  };

  const sharedQuestProps = {
    blocks, toggleBlock, deleteBlock,
    dailyTasks, allPageTasks, toggleDailyTask, deleteDailyTask,
    newDailyTaskName, setNewDailyTaskName, handleAddDailyTask,
    noteBlocks, isAddingNote, setIsAddingNote, newNoteContent, setNewNoteContent,
    handleAddNote, editingNoteId, setEditingNoteId, editNoteContent, setEditNoteContent,
    handleUpdateBlockContent,
    selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
    renderCalendarDesktop, monthlyTodos, newMonthlyTodo, setNewMonthlyTodo,
    handleAddCustomBlockEnter, monthKey,
    calcPercent, blocksPercent, dailyPercent,
    newBlockContent, setNewBlockContent, activeGroupInput, setActiveGroupInput,
    handleAddBlockInGroup, isAddingGroup, setIsAddingGroup, newGroupName, setNewGroupName,
    handleAddTargetGroup, currentPageGroups, subtitles, setSubtitles, handleDeleteTargetGroup,
    activePageId,
  };

  // ===== RENDER =====
  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased">
      <VineOverlay />
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="pl-72">
        <Header
          formatIDR={formatIDR}
          tabunganBalance={tabunganBalance}
          gtNetDL={gtNetDL}
          isSyncing={isSyncing}
          handleSyncData={handleSyncData}
        />
        <main className="relative pt-16 bg-surface min-h-screen">
          {activePage === 'command-center' && (
            <CommandCenterPage {...sharedFinanceProps} {...sharedQuestProps} isSyncing={isSyncing} />
          )}
          {activePage === 'study-workspace' && (
            <StudyWorkspacePage {...sharedQuestProps} />
          )}
          {activePage === 'asset-vault' && (
            <AssetVaultPage />
          )}
          {activePage === 'profit-analytics' && (
            <ProfitAnalyticsPage {...sharedFinanceProps} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;



