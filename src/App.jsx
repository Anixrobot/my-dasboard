import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import Chart from 'chart.js/auto';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getYear, getMonth, subDays } from 'date-fns';

// ============================================================
// QUESTFOLIO â€” Minecraft Enchanted Forest Dashboard
// Design System: Space Grotesk + JetBrains Mono, Dark Oak Pixel UI
// ============================================================

// --- Logo Image URL ---
const LOGO_URL = "https://lh3.googleusercontent.com/aida/AEtjO1Vu6KWUXzj0k3ZiG7gzse_YAjiVcrMTgaevJ1NgEV-HZmKOXPuCjiQz1HZL-KaecZOABEKB3H3Bj8YFZ_ABOGCiBYWK1IsQ4yzATAjbwxqffNYbOZbebdpfYG_nkHq8TWOzukBSOSCho8aFaOU9D5mqcU82c2SKVGXzA-2FOEXERun5-bnOigm3-kGL_N-SSU2vL5rfcPPPCAdua9rzejrKWbOgV5LuWiRGZU2RA3Ta6EllVgMlZYZ1meA";

// ============================================================
// SHARED SIDEBAR
// ============================================================
function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    { id: 'command-center', icon: 'explore', label: 'Command Center', textClass: 'text-primary' },
    { id: 'study-workspace', icon: 'menu_book', label: 'Study Workspace', textClass: 'text-secondary' },
    { id: 'asset-vault', icon: 'savings', label: 'Asset Vault', textClass: 'text-primary-fixed-dim' },
    { id: 'profit-analytics', icon: 'trending_up', label: 'Profit Analytics', textClass: 'text-tertiary-container' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[2px_0_12px_rgba(0,0,0,0.6)] select-none">
      <div className="flex flex-col">
        <div className="p-space-lg bg-surface-container-low">
          <div className="flex items-center gap-space-sm">
            <div className="w-7 h-7 bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-headline-md shadow-[0_0_8px_rgba(244,184,67,0.4)]">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md tracking-wider text-primary uppercase">QUESTFOLIO</span>
              <span className="font-label-sm text-label-sm text-secondary tracking-widest">STUDY &amp; VAULT OS</span>
            </div>
          </div>
          <div className="mt-space-md p-space-sm bg-surface-container flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[16px]">shield_person</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-primary-fixed">LVL 55 ARCHMAGE</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Kael Fireweaver</span>
              </div>
            </div>
            <span className="w-2.5 h-2.5 bg-secondary shadow-[0_0_6px_#99d77a]"></span>
          </div>
        </div>

        <div className="h-1.5 w-full bg-surface-container-high flex items-center justify-between px-space-xs">
          <div className="w-1.5 h-1.5 bg-secondary"></div>
          <div className="w-1.5 h-1.5 bg-tertiary-container"></div>
          <div className="w-1.5 h-1.5 bg-primary"></div>
          <div className="w-1.5 h-1.5 bg-secondary"></div>
        </div>

        <div className="px-space-md pt-space-md">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider px-space-sm mb-space-xs block">Guild Navigation</span>
          <nav className="flex flex-col gap-space-xs" data-active-classes="bg-surface-container-high text-primary font-bold shadow-[inset_0_0_8px_rgba(244,184,67,0.2)]">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-space-md px-space-md py-space-sm transition-colors font-label-md text-label-md text-left w-full ${
                  activePage === item.id
                    ? 'bg-surface-container-high text-primary font-bold shadow-[inset_0_0_8px_rgba(244,184,67,0.2)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${item.textClass}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-space-md bg-surface-container-low flex flex-col gap-space-sm">
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          <span className="text-outline flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[14px] text-secondary">auto_awesome</span>MANA ENGINE
          </span>
          <span className="text-secondary font-bold">820 / 1000 MP</span>
        </div>
        <div className="w-full h-2.5 bg-surface-container-lowest p-[1px]">
          <div className="h-full bg-secondary shadow-[0_0_8px_rgba(153,215,122,0.6)]" style={{ width: '82%' }}></div>
        </div>
        <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-secondary"></span>Realm: Astraea-01</span>
          <span className="text-primary-fixed">Ping: 14ms</span>
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
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md z-40 flex items-center justify-between px-space-lg shadow-[0_2px_12px_rgba(0,0,0,0.5)] select-none">
      <div className="flex items-center gap-space-lg">
        <div className="flex items-center gap-space-xs bg-surface-container px-space-md py-space-xs">
          <span className="material-symbols-outlined text-primary text-[18px]">local_fire_department</span>
          <span className="font-label-md text-label-md text-primary font-bold">24 DAY STREAK</span>
        </div>
        <div className="flex items-center gap-space-xs bg-surface-container px-space-md py-space-xs">
          <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
          <span className="font-label-md text-label-md text-on-surface">
            {formatIDR ? formatIDR(tabunganBalance) : 'Rp 0'} <span className="text-outline">/</span> <span className="text-secondary font-bold">{gtNetDL ? gtNetDL.toFixed(2) : '0.00'} DL</span>
          </span>
        </div>
        <div className="hidden xl:flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs">
          <span className="material-symbols-outlined text-tertiary text-[18px]">hourglass_top</span>
          <span className="font-headline-md text-headline-md text-tertiary tracking-widest">25:00</span>
          <button className="bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container hover:text-on-primary font-label-sm text-label-sm px-space-sm py-0.5 uppercase tracking-wider transition-colors" type="button">
            + CAST FOCUS
          </button>
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs">
          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            className="bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary-fixed font-label-md text-label-md px-space-md py-space-xs transition-colors flex items-center gap-space-xs"
            type="button"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            <span>Sync</span>
          </button>
          <button className="bg-surface-container hover:bg-surface-container-high text-secondary hover:text-secondary-fixed font-label-md text-label-md px-space-md py-space-xs transition-colors flex items-center gap-space-xs" type="button">
            <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
            <span>Konversi</span>
          </button>
        </div>
        <div className="h-6 w-[1px] bg-surface-container-high"></div>
        <button className="relative p-space-xs text-on-surface-variant hover:text-on-surface transition-colors" type="button">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-tertiary-container"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-fixed transition-colors">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// PAGE: COMMAND CENTER
// ============================================================
function CommandCenterPage({
  gtNetIDR, gtNetDL, blocksPercent, dailyTasks
}) {
  const [stickyNotes, setStickyNotes] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_sticky_notes')) || [
        { title: 'NOTE 1: BOSS RAID', content: 'Inventory: 12x Greater Mana Drafts\nFormation: Ice Ward @ Vanguard line\nRaid Lock: Sun 22:00 UTC sharp', tag: 'SECTOR: SUNKEN CRYPT', tag2: 'TIER S+' },
        { title: 'NOTE 2: GATHERING BOTANY', content: 'Mandrake: Whispering Marsh basin\nStarflower: Dew Peak (Night Only)\nGuild Buff: +25% Botany Yield', tag: 'LOGISTICS QUOTA: 80/100', tag2: 'HERBALIST' },
        { title: 'NOTE 3: SPELL CRAFT', content: 'Transmute: Pure Crystal Core\nRatio: 3 Ignis / 1 Aqua Flux\nStatus: Inverted Rune Matrix', tag: 'LAB ATELIER 4', tag2: 'TEST IN PROGRESS' },
        { title: 'NOTE 4: GUILD DISCIPLINE', content: 'Border Watch: Shift C (20:00 - 02:00)\nTardiness: 50 Gold / 10 GT Fine\nProhibited: No Imp Summons in Dorms', tag: 'DECREE #4102', tag2: 'ENFORCED' },
      ];
    } catch (e) {
      return Array(4).fill({ title: '', content: '' });
    }
  });

  const updateStickyNote = (index, field, value) => {
    const updated = stickyNotes.map((n, i) => i === index ? { ...n, [field]: value } : n);
    setStickyNotes(updated);
    localStorage.setItem('cc_sticky_notes', JSON.stringify(updated));
  };
  
  const quickDirectives = (dailyTasks || []).slice(0, 3);
  
  return (
    <div className="flex flex-col w-full px-space-lg py-space-lg">
      <div className="flex flex-col gap-space-lg select-none">
        {/* Desk Header & Realm Vitality Bar */}
        <div className="relative bg-surface-container-low p-space-md shadow-xl overflow-hidden">
          {/* Decorative Pixel Vine Corner Accents */}
          <svg className="absolute -top-1 -left-1 w-24 h-24 pointer-events-none opacity-85 z-10" fill="none" viewBox="0 0 96 96">
            <rect fill="#1b5201" height="8" width="8" x="0" y="0"></rect>
            <rect fill="#99d77a" height="8" width="8" x="8" y="0"></rect>
            <rect fill="#1b5201" height="8" width="8" x="16" y="0"></rect>
            <rect fill="#99d77a" height="8" width="8" x="0" y="8"></rect>
            <rect fill="#f4b843" height="8" width="8" x="8" y="8"></rect>
            <rect fill="#1b5201" height="8" width="8" x="0" y="16"></rect>
            <rect fill="#99d77a" height="8" width="8" x="8" y="16"></rect>
            <rect fill="#ffabbc" height="8" width="8" x="16" y="16"></rect>
            <rect fill="#1b5201" height="8" width="8" x="24" y="8"></rect>
            <rect fill="#99d77a" height="8" width="8" x="32" y="0"></rect>
            <rect fill="#ffd999" height="8" width="8" x="24" y="24"></rect>
          </svg>
          <svg className="absolute -top-1 -right-1 w-24 h-24 pointer-events-none opacity-85 z-10" fill="none" viewBox="0 0 96 96">
            <rect fill="#1b5201" height="8" width="8" x="88" y="0"></rect>
            <rect fill="#99d77a" height="8" width="8" x="80" y="0"></rect>
            <rect fill="#1b5201" height="8" width="8" x="72" y="0"></rect>
            <rect fill="#99d77a" height="8" width="8" x="88" y="8"></rect>
            <rect fill="#ffabbc" height="8" width="8" x="80" y="8"></rect>
            <rect fill="#1b5201" height="8" width="8" x="88" y="16"></rect>
            <rect fill="#99d77a" height="8" width="8" x="64" y="8"></rect>
            <rect fill="#f4b843" height="8" width="8" x="72" y="16"></rect>
          </svg>
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-space-md pl-space-md pr-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 bg-surface-container-highest shadow-inner flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">token</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-sm">
                  <span className="font-headline-lg text-headline-lg text-primary tracking-wide">COMMAND CENTER &amp; ARCANE DESK</span>
                  <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-space-xs py-0.5 shadow-sm uppercase">Active Realm</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-xs">
                  <span className="text-secondary font-bold">â—†</span> Archmage Terminal: Session Active Â· Chronos: 14:22:09 UTC Â· Scribe Matrix: Operational
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg bg-surface-container p-space-xs px-space-md shadow-md">
              <div className="flex flex-col items-end">
                <span className="font-label-sm text-label-sm text-outline">MANA VESSEL</span>
                <span className="font-headline-md text-headline-md text-secondary">98% CAP</span>
              </div>
              <div className="w-24 h-3 bg-surface-container-lowest p-[1px]">
                <div className="h-full bg-secondary shadow-[0_0_8px_#99d77a]" style={{ width: '98%' }}></div>
              </div>
              <div className="h-6 w-0.5 bg-surface-container-highest"></div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">hourglass_bottom</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">SPELL TIMER</span>
                  <span className="font-headline-md text-headline-md text-primary tracking-widest" id="chrono-clock">25:00</span>
                </div>
              </div>
              <button className="bg-primary hover:bg-primary-fixed text-on-primary font-label-sm text-label-sm px-space-sm py-space-xs uppercase shadow-sm transition-transform active:translate-y-0.5" type="button">
                Reset Ward
              </button>
            </div>
          </div>
        </div>

        {/* Main Workspace Bento / Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
          {/* LEFT COLUMN */}
          <div className="xl:col-span-7 flex flex-col gap-space-lg">
            {/* Guild Pinboard Section */}
            <div className="relative bg-surface-container-low p-space-md shadow-2xl">
              <div className="flex items-center justify-between pb-space-sm mb-space-md bg-surface-container-lowest px-space-md py-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">push_pin</span>
                  <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">GUILD PINBOARD</span>
                  <span className="text-outline text-body-sm text-body-sm">| 4 Pinned Directives</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 bg-secondary"></span>
                  <span className="w-2 h-2 bg-primary"></span>
                  <span className="w-2 h-2 bg-tertiary-container"></span>
                  <span className="font-label-sm text-label-sm text-outline-variant pl-space-xs">REF:DESK-01</span>
                </div>
              </div>
              
              {/* 4 Pastel Sticky Notes Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md relative">
                {stickyNotes.map((note, idx) => {
                  const colors = [
                    'bg-primary-fixed text-on-primary-fixed', 
                    'bg-secondary-fixed text-on-secondary-fixed', 
                    'bg-tertiary-fixed text-on-tertiary-fixed', 
                    'bg-tertiary-container text-on-tertiary-container'
                  ];
                  const titleColors = [
                    'bg-on-primary-container text-on-primary-fixed', 
                    'bg-secondary-container text-on-secondary-fixed', 
                    'bg-tertiary-container text-on-tertiary-fixed', 
                    'bg-on-tertiary-container text-on-tertiary-container'
                  ];
                  return (
                    <div key={idx} className={`relative ${colors[idx]} p-space-md shadow-lg flex flex-col justify-between min-h-[175px] transition-transform hover:-translate-y-1`}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary-container rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-on-primary-container rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-space-xs">
                        <span className="font-label-md text-label-md tracking-wider uppercase flex items-center gap-1 w-full mr-2">
                          <span className={`w-1.5 h-1.5 shrink-0 ${titleColors[idx].split(' ')[0]}`}></span> 
                          <input type="text" className="bg-transparent outline-none w-full" value={note.title} onChange={e => updateStickyNote(idx, 'title', e.target.value)} />
                        </span>
                        <button className="w-5 h-5 shrink-0 flex items-center justify-center font-bold hover:bg-black/10 text-body-sm transition-colors" title="Clear note" type="button" onClick={() => updateStickyNote(idx, 'content', '')}>[X]</button>
                      </div>
                      <textarea
                        value={note.content}
                        onChange={e => updateStickyNote(idx, 'content', e.target.value)}
                        className="font-body-sm text-body-sm flex flex-col gap-1 py-space-xs leading-tight bg-transparent resize-none outline-none h-full mt-2"
                        style={{ minHeight: '80px' }}
                      />
                      <div className="flex items-center justify-between text-[9px] font-label-sm pt-space-xs opacity-75">
                        <input type="text" className="bg-transparent outline-none w-1/2" value={note.tag || ''} onChange={e => updateStickyNote(idx, 'tag', e.target.value)} placeholder="TAG 1" />
                        <input type="text" className="bg-transparent outline-none w-1/2 text-right" value={note.tag2 || ''} onChange={e => updateStickyNote(idx, 'tag2', e.target.value)} placeholder="TAG 2" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-space-md pt-space-sm bg-surface-container flex items-center justify-between px-space-sm">
                <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                  <span className="w-2 h-2 bg-secondary shadow-[0_0_4px_#99d77a]"></span> PINBOARD SYNCHRONIZED
                </span>
                <span className="font-body-sm text-body-sm text-outline">+ Add Parchment Note [N]</span>
              </div>
            </div>

            {/* Telemetry & Inventory Cache Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-low p-space-md shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Arcane Vault GT</span>
                  <span className="material-symbols-outlined text-[16px] text-primary">monetization_on</span>
                </div>
                <div className="my-space-xs">
                  <span className="font-headline-lg text-headline-lg text-primary">{Math.floor(gtNetIDR/100).toLocaleString('id-ID') || '142,850'}</span>
                  <span className="font-label-sm text-label-sm text-secondary block">+12.4% yield</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5">
                  <div className="bg-primary h-full" style={{ width: '74%' }}></div>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-md shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Diamond Locks</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">lock_open</span>
                </div>
                <div className="my-space-xs">
                  <span className="font-headline-lg text-headline-lg text-secondary">{gtNetDL.toFixed(2)} DL</span>
                  <span className="font-label-sm text-label-sm text-primary block">Equiv: {(gtNetDL*100).toFixed(0)} WL</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5">
                  <div className="bg-secondary h-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-md shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Focus Mastery</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary-container">vital_signs</span>
                </div>
                <div className="my-space-xs">
                  <span className="font-headline-lg text-headline-lg text-tertiary">6.4 Hrs</span>
                  <span className="font-label-sm text-label-sm text-secondary block">Dungeon Delve Top 5%</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5">
                  <div className="bg-tertiary-container h-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-5 flex flex-col gap-space-lg">
            {/* Ancient Spell Scroll Scratchpad */}
            <div className="relative bg-surface-container-low p-space-md shadow-2xl flex flex-col justify-between min-h-[380px]">
              <div className="flex items-center justify-between pb-space-xs mb-space-sm bg-surface-container-lowest px-space-md py-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                  <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">SPELL SCROLL SCRATCHPAD</span>
                </div>
                <span className="font-label-sm text-label-sm bg-surface-container text-secondary px-space-xs py-0.5">DRAFT v2.4</span>
              </div>
              
              <div className="relative bg-primary-fixed text-on-primary-fixed p-space-md shadow-inner flex flex-col justify-between flex-grow">
                <div className="flex items-center justify-between pb-space-xs border-b border-on-primary-fixed/20">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 bg-primary-container shadow-sm"></span>
                    <span className="font-label-sm text-label-sm uppercase font-bold tracking-widest text-on-primary-fixed">SCROLL OF INCANTATION</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-primary-container font-mono">SEAL: #ARC-982</span>
                </div>
                <div className="py-space-md flex flex-col gap-space-xs font-mono text-on-primary-fixed select-text h-full">
                  <textarea className="w-full h-full bg-transparent resize-none outline-none font-mono text-body-sm leading-relaxed" 
                    defaultValue={`// FORMULA INCANTATIO: GLACIAL BURST\n\nVocalis: "Khor-Tek Frigid-Vael"\n▶ Catalyst: 2x Azure Glaze + Powdered Pearl\n▶ Cast Time: 1.8s Channeling | AoE: 14m Radius\n▶ Vulnerability: Pierces Molten Carapace (Rank III)\n\n// Note: Ensure ley-line grounding before utterance to avert backfire.`} 
                  />
                </div>
                <div className="pt-space-sm flex items-center justify-between bg-primary-fixed-dim/60 p-space-xs">
                  <div className="flex items-center gap-space-xs text-on-primary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[14px]">water_drop</span>
                    <span>Ink: 82% | Word Runes: 24</span>
                  </div>
                  <button className="bg-on-primary text-primary-fixed hover:bg-surface-container-lowest hover:text-primary font-label-md text-label-md px-space-md py-space-xs uppercase shadow-md flex items-center gap-space-xs transition-transform active:translate-y-0.5" type="button">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>SAVE SCROLL</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-space-sm flex items-center justify-between text-body-sm font-body-sm text-outline px-space-xs">
                <span>Scroll Archival: Shelf C-12</span>
                <span className="text-secondary font-label-sm text-label-sm">Ready to Inscribe</span>
              </div>
            </div>

            {/* Quest Directives Task Mini-List */}
            <div className="bg-surface-container-low p-space-md shadow-md flex flex-col gap-space-xs">
              <div className="flex items-center justify-between pb-space-xs">
                <span className="font-label-md text-label-md text-primary uppercase">Immediate Desk Directives</span>
                <span className="font-label-sm text-label-sm text-secondary">{quickDirectives.length} PENDING</span>
              </div>
              {quickDirectives.length === 0 ? (
                <div className="text-center font-body-sm text-on-surface-variant py-2">No pending directives.</div>
              ) : (
                quickDirectives.map((task, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface-container p-space-xs px-space-sm hover:bg-surface-container-high transition-colors cursor-pointer">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-3.5 h-3.5 bg-surface-container-lowest flex items-center justify-center">
                        {task.status === 'DONE' && <div className="w-2 h-2 bg-secondary"></div>}
                      </div>
                      <span className={`font-body-sm text-body-sm ${task.status==='DONE'?'line-through text-outline':'text-on-surface'}`}>
                        {task.content || 'Quest Directive'}
                      </span>
                    </div>
                    <span className={`font-label-sm text-label-sm ${task.status==='DONE'?'text-secondary':'text-primary'}`}>+{task.exp || 150} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Enchanted Bookshelf (Grimoire Collection) */}
        <div className="relative bg-surface-container-low p-space-md shadow-2xl">
          <div className="flex flex-wrap items-center justify-between pb-space-sm mb-space-md bg-surface-container-lowest px-space-md py-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_stories</span>
              <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">ENCHANTED BOOKSHELF</span>
              <span className="text-outline text-body-sm font-body-sm hidden md:inline">| Arcane Tomes &amp; Grimoire Repository</span>
            </div>
            <div className="flex items-center gap-space-md">
              <span className="font-label-sm text-label-sm text-outline">SHELF CAPACITY: <span className="text-primary font-bold">3/8 TOMES</span></span>
              <button className="bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm px-space-sm py-1 uppercase shadow-sm" type="button">
                + BIND NEW TOME
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Tome 1 */}
            <div className="group relative bg-surface-container p-space-md shadow-xl flex flex-col justify-between transition-all hover:bg-surface-container-high hover:-translate-y-1">
              <div className="flex items-start gap-space-md">
                <div className="w-16 h-24 bg-gradient-to-b from-[#63092a] via-[#812340] to-[#3f0017] shadow-lg flex flex-col justify-between p-1 flex-shrink-0 relative">
                  <div className="w-full h-1 bg-[#ffabbc] opacity-60"></div>
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-tertiary-container text-[20px]">local_fire_department</span>
                    <span className="font-label-sm text-[8px] text-tertiary font-bold tracking-tighter">VOL. I</span>
                  </div>
                  <div className="w-full h-1 bg-[#ffabbc] opacity-60"></div>
                  <span className="absolute top-1 right-1 w-1 h-1 bg-primary"></span>
                  <span className="absolute bottom-1 right-1 w-1 h-1 bg-primary"></span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-tertiary-container"></span>
                    <span className="font-label-sm text-label-sm text-tertiary tracking-wider uppercase truncate">TOME VOL. I</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary truncate">PYRO RITUALS</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Ancient combustion theorems and dragon flame channel stabilization glyphs.
                  </p>
                  <div className="flex items-center gap-space-xs text-[10px] font-label-sm text-outline pt-1">
                    <span>18 SPELLS</span> Â· <span className="text-secondary">RANK: ADEPT</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-lowest px-space-sm py-space-xs">
                <span className="font-label-sm text-label-sm text-primary-fixed">SLOT #01</span>
                <button className="bg-surface-variant hover:bg-primary-container hover:text-on-primary-container text-primary font-label-sm text-label-sm px-space-md py-1 uppercase shadow-sm flex items-center gap-1 transition-colors" type="button">
                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                  <span>OPEN TOME</span>
                </button>
              </div>
            </div>
            
            {/* Tome 2 */}
            <div className="group relative bg-surface-container p-space-md shadow-xl flex flex-col justify-between transition-all hover:bg-surface-container-high hover:-translate-y-1">
              <div className="flex items-start gap-space-md">
                <div className="w-16 h-24 bg-gradient-to-b from-[#1b3a4b] via-[#215a75] to-[#0d222e] shadow-lg flex flex-col justify-between p-1 flex-shrink-0 relative">
                  <div className="w-full h-1 bg-secondary opacity-60"></div>
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-secondary text-[20px]">ac_unit</span>
                    <span className="font-label-sm text-[8px] text-secondary font-bold tracking-tighter">VOL. IV</span>
                  </div>
                  <div className="w-full h-1 bg-secondary opacity-60"></div>
                  <span className="absolute top-1 right-1 w-1 h-1 bg-primary"></span>
                  <span className="absolute bottom-1 right-1 w-1 h-1 bg-primary"></span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-secondary"></span>
                    <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase truncate">TOME VOL. IV</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary truncate">FROST MANIFEST</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Absolute zero manifestation, blizzard barriers, and crystalline cryogenic runes.
                  </p>
                  <div className="flex items-center gap-space-xs text-[10px] font-label-sm text-outline pt-1">
                    <span>24 SPELLS</span> Â· <span className="text-secondary">RANK: MASTER</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-lowest px-space-sm py-space-xs">
                <span className="font-label-sm text-label-sm text-secondary">SLOT #02</span>
                <button className="bg-surface-variant hover:bg-secondary hover:text-on-secondary text-secondary font-label-sm text-label-sm px-space-md py-1 uppercase shadow-sm flex items-center gap-1 transition-colors" type="button">
                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                  <span>OPEN TOME</span>
                </button>
              </div>
            </div>
            
            {/* Tome 3 */}
            <div className="group relative bg-surface-container p-space-md shadow-xl flex flex-col justify-between transition-all hover:bg-surface-container-high hover:-translate-y-1">
              <div className="flex items-start gap-space-md">
                <div className="w-16 h-24 bg-gradient-to-b from-[#6a4a00] via-[#855e00] to-[#3a2800] shadow-lg flex flex-col justify-between p-1 flex-shrink-0 relative">
                  <div className="w-full h-1 bg-primary opacity-60"></div>
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
                    <span className="font-label-sm text-[8px] text-primary font-bold tracking-tighter">VOL. IX</span>
                  </div>
                  <div className="w-full h-1 bg-primary opacity-60"></div>
                  <span className="absolute top-1 right-1 w-1 h-1 bg-primary"></span>
                  <span className="absolute bottom-1 right-1 w-1 h-1 bg-primary"></span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary"></span>
                    <span className="font-label-sm text-label-sm text-primary tracking-wider uppercase truncate">TOME VOL. IX</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary truncate">CELESTIAL MAGIC</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                    Astral navigation, solar beam transmutations, and gravitational anchors.
                  </p>
                  <div className="flex items-center gap-space-xs text-[10px] font-label-sm text-outline pt-1">
                    <span>31 SPELLS</span> Â· <span className="text-primary font-bold">RANK: ARCHMAGE</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-lowest px-space-sm py-space-xs">
                <span className="font-label-sm text-label-sm text-primary">SLOT #03</span>
                <button className="bg-surface-variant hover:bg-primary hover:text-on-primary text-primary font-label-sm text-label-sm px-space-md py-1 uppercase shadow-sm flex items-center gap-1 transition-colors" type="button">
                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                  <span>OPEN TOME</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wooden Desk Base Runner Footer */}
        <div className="mt-space-lg pt-space-xs bg-surface-container-lowest p-space-xs flex flex-wrap items-center justify-between text-body-sm font-body-sm text-outline">
          <div className="flex items-center gap-space-md">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-secondary"></span> Arcane Engine: Synchronized</span>
            <span>â€¢ Ley-Line Pulse: 60Hz</span>
            <span>â€¢ Timber Polish: Dark Mahogany</span>
          </div>
          <span className="text-primary-fixed font-label-sm text-label-sm tracking-widest uppercase">QUESTFOLIO COMMAND SYSTEM Â© ERA 2026</span>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// ============================================================
// BOOK MODAL â€” Minecraft-Style Enchanted Book
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

        {/* â”€â”€ BOOK OUTER COVER â”€â”€ */}
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
                â€“ Del Page
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

        {/* â”€â”€ ACTION BUTTONS (below book) â”€â”€ */}
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

  // Sticky Notes â€” persisted to localStorage
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
            alert('âœ¨ FOCUS SPELL COMPLETE! +150 XP AWARDED!');
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
    <div className="flex flex-col w-full relative select-none animate-entrance px-space-lg py-space-lg">
      <div className="relative bg-surface-container-lowest p-space-md mb-space-md shadow-md overflow-hidden">
        <div className="absolute -top-3 -right-3 pointer-events-none opacity-80">
          <svg className="text-secondary" fill="none" height="64" viewBox="0 0 64 64" width="64">
            <rect fill="#99d77a" height="6" width="6" x="32" y="16"></rect>
            <rect fill="#1b5201" height="6" width="6" x="26" y="22"></rect>
            <rect fill="#99d77a" height="6" width="6" x="38" y="22"></rect>
            <rect fill="#f4b843" height="6" width="6" x="32" y="28"></rect>
            <rect fill="#ffd3da" height="6" width="6" x="44" y="28"></rect>
            <rect fill="#ffabbc" height="6" width="6" x="38" y="34"></rect>
            <rect fill="#ffd999" height="6" width="6" x="48" y="34"></rect>
          </svg>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm relative z-10">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center shadow-[inset_0_0_6px_rgba(244,184,67,0.3)]">
              <span className="material-symbols-outlined text-primary text-[24px]">auto_stories</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Study Dungeon &amp; Enchanted Library</h1>
                <span className="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-space-xs py-0.5 uppercase tracking-widest font-bold">Act IV</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-space-xs tracking-wider">
                <span className="text-secondary font-bold">CHRONICLES //</span>
                <span>GRIMOIRE MASTERY</span>
                <span className="text-outline">Â·</span>
                <span className="text-primary-fixed">RANK: ARCANE SCHOLAR</span>
                <span className="text-outline">Â·</span>
                <span className="text-secondary bg-surface-container px-space-xs font-bold">+450 EXP TODAY</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs">
            <button onClick={toggleTimer} className={`bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md px-space-md py-space-xs transition-transform active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-space-xs shadow-sm ${isTimerRunning ? 'bg-error-container text-on-error-container hover:bg-error-container' : ''}`}>
              <span className="material-symbols-outlined text-[16px] text-primary-fixed">{isTimerRunning ? 'stop' : 'magic_button'}</span>
              <span>{isTimerRunning ? formatTime(timerSeconds) : 'QUICK STUDY RITUAL'}</span>
            </button>
            <div className="w-1.5 h-1.5 bg-secondary mx-space-xs"></div>
            <button onClick={() => handleAddNote('Enchanted Book', '')} className="bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-space-md py-space-xs transition-colors flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">library_add</span>
              <span>NEW GRIMOIRE</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Column: Target Lists */}
        <div className="lg:col-span-3 flex flex-col gap-gutter">
          <div className="relative bg-surface-container-low shadow-md overflow-hidden">
            <div className="h-2 w-full bg-surface-container-highest flex items-center justify-between px-2">
              <span className="w-1.5 h-1.5 bg-secondary"></span>
              <span className="w-1.5 h-1.5 bg-tertiary-container"></span>
              <span className="w-1.5 h-1.5 bg-secondary-container"></span>
              <span className="w-1.5 h-1.5 bg-primary"></span>
            </div>
            <div className="p-space-md bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">track_changes</span>
                <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">TARGET LISTS</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-sm text-label-sm text-secondary bg-surface-container-lowest px-space-xs py-0.5">{currentPageGroups.length} PENDING</span>
                <button onClick={() => setIsAddingGroup(!isAddingGroup)} className="text-secondary hover:text-primary font-bold px-1">+</button>
              </div>
            </div>

            {isAddingGroup && (
              <div className="p-space-xs flex gap-space-xs bg-surface-container border-b border-surface-container-highest">
                <input
                  type="text"
                  autoFocus
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTargetGroup()}
                  placeholder="New target group..."
                  className="flex-1 bg-surface-dim border border-inverse-surface px-space-xs py-1 font-label-sm text-label-sm text-on-surface outline-none"
                />
                <button onClick={handleAddTargetGroup} className="bg-primary-container text-on-primary-container font-label-sm px-2">OK</button>
              </div>
            )}

            <div className="p-space-md flex flex-col gap-space-md">
              {currentPageGroups.map((groupType, gIdx) => {
                const groupBlocks = (blocks || []).filter(b => b.type === groupType);
                const titleKey = `title_${groupType}_${activePageId}`;
                const completed = groupBlocks.filter(b => b.is_completed).length;
                const pct = groupBlocks.length === 0 ? 0 : Math.round((completed / groupBlocks.length) * 100);
                const isPrimary = gIdx === 0;
                const isSecondary = gIdx === 1;
                
                const cMap = isPrimary 
                  ? { container: 'bg-primary-container', text: 'text-primary', bg: 'bg-primary', shadow: 'var(--md-sys-color-primary)' }
                  : isSecondary
                  ? { container: 'bg-secondary-container', text: 'text-secondary', bg: 'bg-secondary', shadow: 'var(--md-sys-color-secondary)' }
                  : { container: 'bg-tertiary-container', text: 'text-tertiary', bg: 'bg-tertiary', shadow: 'var(--md-sys-color-tertiary)' };

                return (
                  <div key={groupType} className="bg-surface-container-lowest p-space-sm transition-all hover:bg-surface-container-high group">
                    <div className="flex items-center justify-between mb-space-xs">
                      <div className="flex items-center gap-1 font-bold">
                        <span className={`w-1.5 h-1.5 ${cMap.container} ${isPrimary ? 'animate-pulse' : ''}`}></span>
                        <input
                          type="text"
                          value={subtitles[titleKey] || (groupType === 'todo' ? 'Target Utama' : groupType)}
                          onChange={e => setSubtitles({ ...subtitles, [titleKey]: e.target.value })}
                          className={`bg-transparent border-none outline-none font-label-sm text-label-sm ${cMap.text} uppercase p-0 max-w-[120px]`}
                        />
                      </div>
                      <span className={`font-label-sm text-label-sm ${cMap.text} font-bold`}>{pct}% FLOW</span>
                    </div>

                    <div className="mt-space-sm w-full h-2 bg-surface-container-high p-[1px]">
                      <div className={`h-full ${cMap.bg} transition-all`} style={{ width: `${pct}%`, boxShadow: `0 0 6px ${cMap.shadow}` }}></div>
                    </div>

                    <div className="mt-space-sm flex flex-col gap-space-xs">
                      {groupBlocks.map(block => (
                        <div key={block.id} className="flex items-start gap-space-xs group/item">
                          <div className="cursor-pointer mt-0.5" onClick={() => toggleBlock(block.id, block.is_completed)}>
                            {block.is_completed ? (
                              <span className={`w-3 h-3 ${cMap.bg} flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-[10px] text-on-primary">check</span>
                              </span>
                            ) : (
                              <div className="w-3 h-3 border border-outline"></div>
                            )}
                          </div>
                          <span className={`flex-1 font-body-sm text-body-sm leading-tight ${block.is_completed ? 'line-through text-outline' : 'text-on-surface'}`}>
                            {block.content}
                          </span>
                          <button onClick={() => deleteBlock(block.id)} className="text-error opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {activeGroupInput === groupType ? (
                      <div className="flex items-center gap-space-xs mt-space-xs">
                        <input
                          type="text"
                          autoFocus
                          value={newBlockContent[groupType] || ''}
                          onChange={e => setNewBlockContent({ ...newBlockContent, [groupType]: e.target.value })}
                          onKeyDown={e => handleAddBlockInGroup(e, groupType)}
                          onBlur={() => setActiveGroupInput(null)}
                          placeholder="New task..."
                          className="flex-1 bg-surface-dim border border-inverse-surface px-space-xs py-1 font-body-sm text-body-sm text-on-surface outline-none"
                        />
                      </div>
                    ) : (
                      <div className="mt-space-xs flex items-center justify-between text-body-sm font-body-sm text-outline">
                        <button onClick={() => setActiveGroupInput(groupType)} className="hover:text-primary transition-colors">+ Add step</button>
                        {groupType !== 'todo' && (
                          <button onClick={() => handleDeleteTargetGroup(groupType)} className="hover:text-error transition-colors text-[10px] uppercase">Del List</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bg-surface-container p-space-sm flex flex-col gap-space-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center justify-between">
                <span>+ NEW MONTHLY DRAFT</span>
              </label>
              <div className="flex items-center gap-space-xs bg-surface-container-lowest p-space-xs">
                <span className="material-symbols-outlined text-secondary text-[16px]">edit_note</span>
                <input
                  type="text"
                  value={newMonthlyTodo}
                  onChange={e => setNewMonthlyTodo(e.target.value)}
                  onKeyDown={e => handleAddCustomBlockEnter(e, `monthly_todo_${monthKey}`, newMonthlyTodo, setNewMonthlyTodo)}
                  placeholder="Monthly goal (Enter)..."
                  className="bg-transparent font-body-sm text-body-sm text-on-surface w-full focus:outline-none placeholder:text-outline"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low p-space-md shadow-md flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">science</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-primary font-bold">HERBAL DYE LAB</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Batch 44 Steeping...</span>
              </div>
            </div>
            <span className="font-headline-md text-headline-md text-secondary tracking-widest font-bold">88Â°C</span>
          </div>
        </div>

        {/* Center Column: Calendar & Quests */}
        <div className="lg:col-span-6 flex flex-col gap-gutter">
          <div className="relative bg-surface-container-low shadow-md overflow-hidden">
            <div className="absolute top-0 right-0 pointer-events-none z-20 flex items-center gap-1 p-1">
              <svg fill="none" height="20" viewBox="0 0 40 20" width="40">
                <rect fill="#99d77a" height="4" width="4" x="0" y="2"></rect>
                <rect fill="#1b5201" height="4" width="4" x="4" y="6"></rect>
                <rect fill="#99d77a" height="4" width="4" x="8" y="2"></rect>
                <rect fill="#f4b843" height="4" width="4" x="12" y="6"></rect>
                <rect fill="#ffabbc" height="4" width="4" x="16" y="2"></rect>
                <rect fill="#99d77a" height="4" width="4" x="20" y="6"></rect>
                <rect fill="#ffd999" height="4" width="4" x="24" y="2"></rect>
                <rect fill="#1b5201" height="4" width="4" x="28" y="6"></rect>
                <rect fill="#99d77a" height="4" width="4" x="32" y="2"></rect>
              </svg>
            </div>
            <div className="p-space-md bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">calendar_month</span>
                <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">STUDY CALENDAR</span>
              </div>
              <div className="flex items-center gap-space-xs text-label-sm font-label-sm z-30">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-6 h-6 bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface transition-colors">&lt;</button>
                <span className="text-primary font-bold px-space-xs">{format(currentMonth, 'MMM yyyy').toUpperCase()}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-6 h-6 bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface transition-colors">&gt;</button>
              </div>
            </div>
            {renderCalendarDesktop && renderCalendarDesktop()}
            
            <div className="p-space-sm bg-surface-container flex items-center justify-between gap-space-sm mt-1">
              <div className="flex flex-col gap-space-xs w-full">
                {(monthlyTodos || []).map(todo => (
                  <div key={todo.id} className="flex items-start gap-space-xs">
                    <span onClick={() => toggleBlock(todo.id, todo.is_completed)} className={`material-symbols-outlined text-[16px] cursor-pointer ${todo.is_completed ? 'text-primary' : 'text-outline'}`}>{todo.is_completed ? 'check_circle' : 'radio_button_unchecked'}</span>
                    <span className={`font-body-sm text-body-sm ${todo.is_completed ? 'line-through text-outline' : 'text-on-surface'}`}>{todo.content}</span>
                    <button onClick={() => deleteBlock(todo.id)} className="text-error hover:text-error-container ml-auto"><span className="material-symbols-outlined text-[14px]">close</span></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative bg-surface-container-low shadow-md overflow-hidden">
            <div className="p-space-md bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[18px]">receipt_long</span>
                <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">TODAY'S QUEST LOG</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{format(selectedDate, 'dd MMM yyyy').toUpperCase()}</span>
                <span className="w-2 h-2 bg-secondary"></span>
              </div>
            </div>
            <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-sm">
              {(dailyTasks || []).map(task => (
                <div key={task.id} className={`flex items-start gap-space-sm p-space-xs hover:bg-surface-container-low transition-colors group ${task.is_completed ? 'bg-surface-container-low/60' : 'bg-surface-container-high shadow-inner'}`}>
                  <div className={`w-4 h-4 flex items-center justify-center cursor-pointer mt-0.5 shadow-sm ${task.is_completed ? 'bg-secondary text-on-secondary' : 'bg-surface-dim'}`} onClick={() => toggleDailyTask(task.id, task.is_completed)}>
                    {task.is_completed && <span className="material-symbols-outlined text-[13px] font-bold">check</span>}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-body-md text-body-md ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-primary font-bold tracking-wide'}`}>
                        {task.task_name}
                      </span>
                      <button onClick={() => deleteDailyTask(task.id)} className="opacity-0 group-hover:opacity-100 text-error"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-space-xs flex items-center gap-space-xs p-space-xs bg-surface-container">
                <span className="text-primary font-bold">&gt;</span>
                <input
                  type="text"
                  value={newDailyTaskName}
                  onChange={e => setNewDailyTaskName(e.target.value)}
                  onKeyDown={handleAddDailyTask}
                  placeholder="Tuliskan quest baru... (enter)"
                  className="bg-transparent font-body-sm text-body-sm text-on-surface w-full focus:outline-none placeholder:text-outline"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pinboard, Scratchpad, Bookshelf */}
        <div className="lg:col-span-3 flex flex-col gap-gutter">
          <div className="bg-surface-container-low shadow-md overflow-hidden">
            <div className="p-space-md bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary-container text-[18px]">push_pin</span>
                <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">GUILD PINBOARD</span>
              </div>
              <span className="w-2 h-2 bg-primary"></span>
            </div>
            <div className="p-space-sm grid grid-cols-2 gap-space-sm">
              <div className="relative bg-[#fef08a] text-[#1c110b] p-space-sm shadow-md flex flex-col justify-between min-h-[92px] group">
                <div className="w-2.5 h-2.5 bg-[#b91c1c] rounded-full mx-auto -mt-2 shadow-sm"></div>
                <input value={stickyNotes[0].title} onChange={e => updateStickyNote(0, 'title', e.target.value)} className="bg-transparent border-none outline-none text-[9px] font-bold uppercase tracking-wider text-[#713f12] w-full" />
                <textarea value={stickyNotes[0].content} onChange={e => updateStickyNote(0, 'content', e.target.value)} className="bg-transparent font-body-sm text-body-sm text-[#1c110b] font-bold leading-tight mt-1 resize-none outline-none h-full" />
              </div>
              <div className="relative bg-[#bbf7d0] text-[#14532d] p-space-sm shadow-md flex flex-col justify-between min-h-[92px] group">
                <div className="w-2.5 h-2.5 bg-[#15803d] rounded-full mx-auto -mt-2 shadow-sm"></div>
                <input value={stickyNotes[1].title} onChange={e => updateStickyNote(1, 'title', e.target.value)} className="bg-transparent border-none outline-none text-[9px] font-bold uppercase tracking-wider text-[#14532d] w-full" />
                <textarea value={stickyNotes[1].content} onChange={e => updateStickyNote(1, 'content', e.target.value)} className="bg-transparent font-body-sm text-body-sm text-[#14532d] font-bold leading-tight mt-1 resize-none outline-none h-full" />
              </div>
              <div className="relative bg-[#bfdbfe] text-[#1e3a8a] p-space-sm shadow-md flex flex-col justify-between min-h-[92px] group">
                <div className="w-2.5 h-2.5 bg-[#2563eb] rounded-full mx-auto -mt-2 shadow-sm"></div>
                <input value={stickyNotes[2].title} onChange={e => updateStickyNote(2, 'title', e.target.value)} className="bg-transparent border-none outline-none text-[9px] font-bold uppercase tracking-wider text-[#1e3a8a] w-full" />
                <textarea value={stickyNotes[2].content} onChange={e => updateStickyNote(2, 'content', e.target.value)} className="bg-transparent font-body-sm text-body-sm text-[#1e3a8a] font-bold leading-tight mt-1 resize-none outline-none h-full" />
              </div>
              <div className="relative bg-[#fbcfe8] text-[#831843] p-space-sm shadow-md flex flex-col justify-between min-h-[92px] group">
                <div className="w-2.5 h-2.5 bg-[#be185d] rounded-full mx-auto -mt-2 shadow-sm"></div>
                <input value={stickyNotes[3].title} onChange={e => updateStickyNote(3, 'title', e.target.value)} className="bg-transparent border-none outline-none text-[9px] font-bold uppercase tracking-wider text-[#831843] w-full" />
                <textarea value={stickyNotes[3].content} onChange={e => updateStickyNote(3, 'content', e.target.value)} className="bg-transparent font-body-sm text-body-sm text-[#831843] font-bold leading-tight mt-1 resize-none outline-none h-full" />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low shadow-md overflow-hidden">
            <div className="p-space-md bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                <span className="font-headline-md text-headline-md text-primary tracking-wider uppercase">SPELL SCROLL</span>
              </div>
              <button onClick={saveNotes} className="font-label-sm text-label-sm text-primary hover:text-primary-fixed bg-surface-container-high px-space-xs py-0.5">{saveStatus || 'SAVE SCROLL'}</button>
            </div>
            <div className="p-space-sm bg-surface-container-lowest">
              <textarea
                value={scratchpadContent}
                onChange={e => setScratchpadContent(e.target.value)}
                className="w-full bg-transparent font-body-sm text-body-sm text-on-surface-variant focus:text-on-surface focus:outline-none resize-none leading-relaxed"
                placeholder="Tulis catatan mantra singkat..."
                rows="4"
              />
            </div>
          </div>

          <div className="bg-surface-container-low border-2 border-outline/30 p-space-md shadow-md overflow-hidden flex flex-col flex-1 relative min-h-[300px]">
            {/* Vine decorations */}
            <svg className="absolute top-0 left-0 w-24 h-24 pointer-events-none opacity-80" fill="none" viewBox="0 0 64 64">
              <path d="M0 16 Q32 16 32 0" stroke="#99d77a" strokeWidth="2" fill="none" />
              <path d="M0 32 Q48 32 48 0" stroke="#1b5201" strokeWidth="2" fill="none" />
            </svg>
            <svg className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-80" fill="none" viewBox="0 0 64 64">
              <path d="M64 48 Q32 48 32 64" stroke="#99d77a" strokeWidth="2" fill="none" />
              <path d="M64 32 Q16 32 16 64" stroke="#1b5201" strokeWidth="2" fill="none" />
            </svg>

            <div className="flex items-center justify-between mb-space-lg z-10 relative">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">menu_book</span>
                <span className="font-headline-md text-headline-md text-on-surface tracking-wider uppercase font-bold">ENCHANTED BOOKSHELF</span>
                <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-space-md py-1 font-bold ml-2">{(noteBlocks || []).length} BUKU</span>
              </div>
              <button 
                className="font-label-md text-label-md bg-surface-container-highest hover:bg-primary-container text-primary hover:text-on-primary-container px-space-md py-space-xs border border-primary/50 transition-colors uppercase font-bold tracking-widest flex items-center gap-1"
                onClick={() => {
                  const titleInput = prompt("Judul buku baru:");
                  if (titleInput) {
                    addBlock('note', '', titleInput);
                  }
                }}
              >
                + BUKU BARU
              </button>
            </div>
            
            <div className="flex-1 z-10 relative overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex flex-wrap items-end gap-space-xl pb-0 border-b-8 border-outline min-h-[160px] pt-space-lg px-space-md">
                {(noteBlocks || []).map((note, idx) => {
                  const displayTitle = note.title || (note.content ? note.content.split('\n')[0].replace(/===PAGE===/g, '').trim() : '') || `Buku ${idx + 1}`;
                  const colors = ['#8d2c48', '#1b5201', '#422c00', '#1a3a5c', '#4a1a4a'];
                  const color = colors[idx % colors.length];
                  const pageCount = (note.content || '').split('===PAGE===').length;
                  return (
                    <div key={note.id} onClick={() => setOpenBook(note)} className="flex flex-col items-center gap-2 cursor-pointer group hover:-translate-y-2 transition-transform mb-1">
                      {/* Book Cover */}
                      <div className="w-20 h-28 shadow-[4px_0_12px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-r-md border-l-[6px] border-black/40" style={{ backgroundColor: color }}>
                        {/* Spine details */}
                        <div className="absolute left-1 top-3 w-2 h-1.5 bg-black/30 rounded-sm"></div>
                        <div className="absolute left-1 top-12 w-2 h-1.5 bg-black/30 rounded-sm"></div>
                        <div className="absolute left-1 bottom-4 w-2 h-1.5 bg-black/30 rounded-sm"></div>
                        {/* Title accent */}
                        <div className="absolute right-0 top-6 w-8 h-10 border-l border-t border-b border-black/20 bg-black/10"></div>
                        {/* Page label */}
                        <div className="absolute bottom-2 right-2 bg-surface-container-lowest/90 text-on-surface font-label-sm text-[10px] px-1.5 py-0.5 rounded-sm border border-outline/30 shadow-sm">{pageCount}p</div>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-primary max-w-[5rem] truncate text-center">{displayTitle}</span>
                    </div>
                  );
                })}
                {(noteBlocks || []).length === 0 && (
                  <div className="text-center w-full font-body-sm text-body-sm text-on-surface-variant pb-4">Belum ada buku di rak ini.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-space-md p-space-sm bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
        <div className="flex items-center gap-space-md">
          <span className="flex items-center gap-1 text-secondary font-bold">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            FOCUS BUFFER: ACTIVE (98.4%)
          </span>
          <span className="text-outline">Â·</span>
          <span className="text-primary-fixed">DESK EXP GAIN: +450 EXP</span>
          <span className="text-outline">Â·</span>
          <span className="text-tertiary">SANCTUARY LEVEL: MASTER RUNESMITH</span>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">ARCANE PIGEON DISPATCH v2.6.4</span>
          <span className="w-2 h-2 bg-secondary"></span>
        </div>
      </div>

      {openBook && (
        <BookModal
          note={openBook}
          onClose={() => setOpenBook(null)}
          onSave={(id, content, title) => {
            handleUpdateBlockContent(id, content);
          }}
          onDelete={(id) => deleteBlock(id)}
        />
      )}
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
    <div className="flex flex-col w-full relative select-none animate-entrance px-space-lg py-space-lg pb-space-xl">
      <div className="absolute -top-6 -right-6 pointer-events-none select-none z-10 opacity-90 hidden lg:block">
        <svg className="text-secondary" fill="none" height="180" viewBox="0 0 180 180" width="180" xmlns="http://www.w3.org/2000/svg">
          <path className="opacity-50" d="M180 0H140V10H130V20H120V30H110V50H100V60H90V80H80V100H60V120H40V140H20V160H0V180" stroke="currentColor" strokeDasharray="6 4" strokeWidth="4"></path>
          <rect fill="#99d77a" height="12" width="12" x="130" y="8"></rect>
          <rect fill="#1b5201" height="10" width="10" x="110" y="24"></rect>
          <rect fill="#99d77a" height="14" width="14" x="95" y="45"></rect>
          <rect fill="#1b5201" height="10" width="10" x="75" y="75"></rect>
          <rect fill="#ffabbc" height="8" width="8" x="118" y="18"></rect>
          <rect fill="#ffabbc" height="8" width="16" x="114" y="22"></rect>
          <rect fill="#ffd999" height="4" width="4" x="122" y="24"></rect>
          <rect fill="#ffd3da" height="6" width="6" x="68" y="98"></rect>
          <rect fill="#f9bc47" height="4" width="4" x="88" y="68"></rect>
          <rect fill="#99d77a" height="8" width="8" x="42" y="132"></rect>
          <rect fill="#1b5201" height="6" width="12" x="36" y="140"></rect>
        </svg>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg relative">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="px-space-xs py-0.5 bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider">Treasury Vault â€¢ Ledger SYNCED</span>
            <span className="w-1.5 h-1.5 bg-secondary"></span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-primary tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Treasury &amp; P&amp;L Guild
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Real-time asset arbitration, lock yield trajectories, and transactional ledger logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm select-none">
          <div className="bg-surface-container-lowest p-space-xs flex items-center gap-1 shadow-inner">
            <button className={`px-space-sm py-1 font-label-sm text-label-sm font-bold shadow-sm transition-colors ${rangeFilter === '7D' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`} onClick={() => setRangeFilter('7D')}>7D</button>
            <button className={`px-space-sm py-1 font-label-sm text-label-sm font-bold shadow-sm transition-colors ${rangeFilter === '30D' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`} onClick={() => setRangeFilter('30D')}>30D</button>
            <button className={`px-space-sm py-1 font-label-sm text-label-sm font-bold shadow-sm transition-colors ${rangeFilter === 'ALL' ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`} onClick={() => setRangeFilter('ALL')}>ALL</button>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => { setIsAddingTx(true); setIsTransferring(false); }}
              className="px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary-fixed transition-all font-label-md text-label-md flex items-center gap-space-xs shadow-md active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_box</span>
              <span>+ TRADE BARU</span>
            </button>
            <button
              onClick={() => { setIsTransferring(true); setIsAddingTx(false); }}
              className="px-space-md py-space-xs bg-primary-container hover:bg-surface-tint text-on-primary-container font-label-md text-label-md flex items-center gap-space-xs shadow-[0_0_10px_rgba(244,184,67,0.3)] transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>+ KONVERSI</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md mb-space-lg">
        <div className="bg-surface-container-low p-space-md relative flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <div className="absolute top-1 right-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div>
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">TABUNGAN IDR</span>
              <span className="material-symbols-outlined text-[16px] text-primary">account_balance_wallet</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">Pundi Tabungan Guild</p>
            <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold drop-shadow-[0_0_6px_rgba(255,217,153,0.3)]">
              {formatIDR(tabunganBalance)}
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between font-label-sm text-label-sm bg-surface-container-lowest/60 px-space-xs py-1">
            <span className="text-secondary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">north</span>
              Masuk: {formatIDR(tabunganIn)}
            </span>
            <span className="text-outline">IDR</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md relative flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <div className="absolute top-1 right-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div>
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">GROSS VALUATION</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">Harta Karun Guild</p>
            <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold drop-shadow-[0_0_6px_rgba(255,217,153,0.3)]">
              {formatIDR(totalKekayaanIDR)}
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between font-label-sm text-label-sm bg-surface-container-lowest/60 px-space-xs py-1">
            <span className="text-primary-fixed-dim font-bold">{gtNetDL >= 0 ? '+' : ''} {gtNetDL.toFixed(2)} DL</span>
            <span className="text-outline">TOTAL NET</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md relative flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <div className="absolute top-1 right-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div>
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary font-bold">NET PROFIT GT</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary-container">ssid_chart</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">Keuntungan Misi GT</p>
            <div className="font-headline-lg text-headline-lg text-primary-fixed tracking-tight font-bold drop-shadow-[0_0_8px_rgba(244,184,67,0.4)]">
              {isGtProfit ? '+' : ''}{gtNetDL.toFixed(2)} DL
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between font-label-sm text-label-sm bg-surface-container-lowest/60 px-space-xs py-1">
            <span className="text-secondary font-bold">{isGtProfit ? '+' : ''} {formatIDR(gtNetIDR)}</span>
            <span className="text-secondary">PROFIT</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md relative flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <div className="absolute top-1 right-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div>
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">WIN RATE</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">Rasio Keberhasilan Misi</p>
            <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold drop-shadow-[0_0_6px_rgba(255,217,153,0.3)]">
              {winRate}%
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between font-label-sm text-label-sm bg-surface-container-lowest/60 px-space-xs py-1">
            <span className="text-secondary font-bold">{wins} Wins</span>
            <span className="text-error font-bold">{losses} Losses</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md relative flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
          <div className="absolute top-1 right-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-surface-container-highest opacity-70"></div>
          <div>
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">ROI</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">percent</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">Pengembalian Investasi Guild</p>
            <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold drop-shadow-[0_0_6px_rgba(255,217,153,0.3)]">
              {roi > 0 ? '+' : ''}{roi}%
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between font-label-sm text-label-sm bg-surface-container-lowest/60 px-space-xs py-1">
            <span className="text-on-surface-variant">Modal: {gtModalDL.toFixed(2)} DL</span>
            <span className="text-secondary-fixed">YIELD</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-space-lg mb-space-lg relative shadow-xl overflow-hidden">
        <div className="absolute -top-3 left-1/3 pointer-events-none opacity-80 hidden md:flex items-center gap-1">
          <div className="w-2 h-2 bg-secondary"></div>
          <div className="w-3 h-3 bg-secondary-container"></div>
          <div className="w-2 h-2 bg-tertiary-container"></div>
          <div className="w-2 h-1 bg-secondary"></div>
        </div>
        <div className="absolute bottom-0 right-0 pointer-events-none opacity-60">
          <svg fill="none" height="40" viewBox="0 0 90 40" width="90">
            <rect fill="#1b5201" height="8" width="8" x="10" y="24"></rect>
            <rect fill="#99d77a" height="12" width="12" x="18" y="20"></rect>
            <rect fill="#ffabbc" height="4" width="4" x="22" y="22"></rect>
            <rect fill="#1b5201" height="6" width="10" x="36" y="28"></rect>
            <rect fill="#99d77a" height="10" width="14" x="52" y="24"></rect>
            <rect fill="#1b5201" height="8" width="16" x="70" y="32"></rect>
          </svg>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-xs border-b border-surface-container-high/40">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[22px]">show_chart</span>
            <div>
              <h2 className="font-headline-md text-headline-md text-primary tracking-wide flex items-center gap-2">
                Cumulative Net Worth Trajectory
                <span className="text-[10px] font-label-sm px-1.5 py-0.5 bg-surface-container text-secondary font-bold uppercase">Live Arcane Feed</span>
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Perkembangan nilai portofolio dari waktu ke waktu</p>
            </div>
          </div>
        </div>

        <div className="relative w-full h-72 sm:h-80 bg-surface-container-lowest mt-space-md p-space-md flex flex-col justify-between shadow-inner overflow-hidden">
          <canvas ref={financeChartRef} className="w-full h-full relative z-10"></canvas>
        </div>
      </div>

      <div className="bg-surface-container-low p-space-lg relative shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 pointer-events-none opacity-70">
          <svg fill="none" height="60" viewBox="0 0 60 60" width="60">
            <rect fill="#1b5201" height="8" width="8" x="0" y="0"></rect>
            <rect fill="#99d77a" height="6" width="12" x="8" y="0"></rect>
            <rect fill="#99d77a" height="12" width="6" x="0" y="8"></rect>
            <rect fill="#ffabbc" height="8" width="8" x="8" y="8"></rect>
            <rect fill="#ffd999" height="4" width="4" x="10" y="10"></rect>
          </svg>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">menu_book</span>
            <div>
              <h2 className="font-headline-md text-headline-md text-primary tracking-wide">
                Guild P&amp;L Ledger Book
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Audit log setiap transaksi aset dan keuangan guild</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2 text-[16px] text-outline pointer-events-none">search</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-7 pr-3 py-1.5 focus:outline-none focus:bg-surface-container-highest transition-colors placeholder:text-outline w-48 sm:w-60 shadow-inner" placeholder="Cari transaksi..." type="text"/>
            </div>
            <div className="flex items-center bg-surface-container-lowest p-0.5 shadow-inner">
              <button onClick={() => setTypeFilter('ALL')} className={`px-space-sm py-1 font-label-sm text-label-sm font-bold ${typeFilter === 'ALL' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>SEMUA</button>
              <button onClick={() => setTypeFilter('PROFIT')} className={`px-space-sm py-1 font-label-sm text-label-sm font-bold ${typeFilter === 'PROFIT' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>MASUK</button>
              <button onClick={() => setTypeFilter('LOSS')} className={`px-space-sm py-1 font-label-sm text-label-sm font-bold ${typeFilter === 'LOSS' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>KELUAR</button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto bg-surface-container-lowest shadow-inner">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-space-sm px-space-md font-bold">Tanggal</th>
                <th className="py-space-sm px-space-md font-bold">Tipe</th>
                <th className="py-space-sm px-space-md font-bold">Deskripsi</th>
                <th className="py-space-sm px-space-md font-bold text-right">Jumlah</th>
                <th className="py-space-sm px-space-md font-bold text-center">Status</th>
                <th className="py-space-sm px-space-md font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-high/30">
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-space-lg text-on-surface-variant">
                    {searchQuery || typeFilter !== 'ALL' ? 'Tidak ada hasil pencarian.' : 'Belum ada transaksi di ledger.'}
                  </td>
                </tr>
              )}
              {filteredTx.map(tx => {
                const isIn = tx.type === 'pemasukan';
                const isBankTx = tx.currency_type === 'TABUNGAN' || tx.currency_type === 'IDR';
                return (
                  <tr key={tx.id} className="hover:bg-surface-container transition-colors group">
                    <td className="py-space-md px-space-md text-on-surface-variant whitespace-nowrap font-label-sm text-label-sm">
                      {tx.date}
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-label-sm text-label-sm font-bold ${isIn ? 'bg-secondary-container text-secondary' : 'bg-surface-container-high text-tertiary-container'}`}>
                        <span className="material-symbols-outlined text-[12px]">{isIn ? 'download' : 'upload'}</span>
                        {isIn ? 'INCOME' : 'EXPENSE'}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-on-surface font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 ${isBankTx ? 'bg-secondary' : 'bg-primary'}`}></span>
                        <span>{tx.description}</span>
                      </div>
                      <span className="text-[10px] text-outline block pl-3">{tx.currency_type} Transaction</span>
                    </td>
                    <td className={`py-space-md px-space-md text-right whitespace-nowrap font-headline-md text-headline-md font-bold ${isIn ? (isBankTx ? 'text-secondary' : 'text-primary-fixed') : 'text-tertiary-container'}`}>
                      {isIn ? '+' : '-'}{isBankTx ? formatIDR(tx.amount) : `${tx.amount} ${tx.currency_type}`}
                    </td>
                    <td className="py-space-md px-space-md text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-surface-container-high text-secondary font-label-sm text-label-sm">
                        Selesai
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-right whitespace-nowrap">
                      <button onClick={() => deleteTransaction(tx.id)} className="text-error opacity-0 group-hover:opacity-100 font-label-sm text-label-sm uppercase underline underline-offset-2 transition-opacity" type="button">
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-md font-label-sm text-label-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary"></span>
            <span>Menampilkan {filteredTx.length} dari {(transactions || []).length} entri guild</span>
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





