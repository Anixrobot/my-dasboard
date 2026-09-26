const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');

const startIdx = code.indexOf('function CommandCenterPage({');
const endMarker = '\n// ============================================================\n// ============================================================\n// BOOK MODAL';
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find start or end index");
  process.exit(1);
}

const newComponent = `function CommandCenterPage({
  gtNetIDR, gtNetDL, blocksPercent, dailyTasks
}) {
  const [stickyNotes, setStickyNotes] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_sticky_notes')) || [
        { title: 'NOTE 1: BOSS RAID', content: 'Inventory: 12x Greater Mana Drafts\\nFormation: Ice Ward @ Vanguard line\\nRaid Lock: Sun 22:00 UTC sharp', tag: 'SECTOR: SUNKEN CRYPT', tag2: 'TIER S+' },
        { title: 'NOTE 2: GATHERING BOTANY', content: 'Mandrake: Whispering Marsh basin\\nStarflower: Dew Peak (Night Only)\\nGuild Buff: +25% Botany Yield', tag: 'LOGISTICS QUOTA: 80/100', tag2: 'HERBALIST' },
        { title: 'NOTE 3: SPELL CRAFT', content: 'Transmute: Pure Crystal Core\\nRatio: 3 Ignis / 1 Aqua Flux\\nStatus: Inverted Rune Matrix', tag: 'LAB ATELIER 4', tag2: 'TEST IN PROGRESS' },
        { title: 'NOTE 4: GUILD DISCIPLINE', content: 'Border Watch: Shift C (20:00 - 02:00)\\nTardiness: 50 Gold / 10 GT Fine\\nProhibited: No Imp Summons in Dorms', tag: 'DECREE #4102', tag2: 'ENFORCED' },
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
                    <div key={idx} className={\`relative \${colors[idx]} p-space-md shadow-lg flex flex-col justify-between min-h-[175px] transition-transform hover:-translate-y-1\`}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary-container rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-on-primary-container rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-space-xs">
                        <span className="font-label-md text-label-md tracking-wider uppercase flex items-center gap-1 w-full mr-2">
                          <span className={\`w-1.5 h-1.5 shrink-0 \${titleColors[idx].split(' ')[0]}\`}></span> 
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
                    defaultValue={`// FORMULA INCANTATIO: GLACIAL BURST\\n\\nVocalis: "Khor-Tek Frigid-Vael"\\n▶ Catalyst: 2x Azure Glaze + Powdered Pearl\\n▶ Cast Time: 1.8s Channeling | AoE: 14m Radius\\n▶ Vulnerability: Pierces Molten Carapace (Rank III)\\n\\n// Note: Ensure ley-line grounding before utterance to avert backfire.`} 
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
                      <span className={\`font-body-sm text-body-sm \${task.status==='DONE'?'line-through text-outline':'text-on-surface'}\`}>
                        {task.content || 'Quest Directive'}
                      </span>
                    </div>
                    <span className={\`font-label-sm text-label-sm \${task.status==='DONE'?'text-secondary':'text-primary'}\`}>+{task.exp || 150} XP</span>
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
}`;

const updatedCode = code.slice(0, startIdx) + newComponent + '\n\n' + code.slice(endIdx);
fs.writeFileSync('src/App.jsx', updatedCode);
console.log("Updated CommandCenterPage in App.jsx");


