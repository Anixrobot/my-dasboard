/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ============================================================
        // MINECRAFT ENCHANTED DARK FOREST — QUESTFOLIO Design Tokens
        // Vibe: Dark oak logs · Deep forest greens · Golden lantern glow
        // ============================================================

        // ── BACKGROUNDS — deep dark forest floor / night ──
        "background":                "#0A0702",   // near-black forest night
        "surface":                   "#160C04",   // very dark surface
        "surface-bright":            "#221408",   // slightly lighter dark oak
        "surface-dim":               "#0C0802",   // darker than surface
        "surface-variant":           "#2A1A0C",   // bark variant

        // Surface containers — dark oak log layers
        "surface-container-lowest":  "#100804",
        "surface-container-low":     "#1A1006",   // dark oak low
        "surface-container":         "#241608",   // dark oak mid
        "surface-container-high":    "#2E1E0C",   // dark oak high
        "surface-container-highest": "#3A2512",   // slightly exposed bark

        // ── PRIMARY — Golden Lantern / Torch light ──
        "primary":                   "#C89020",   // warm lantern gold
        "primary-container":         "#5C3A10",   // dark oak container
        "primary-fixed":             "#FFD060",   // bright torch glow
        "primary-fixed-dim":         "#D4A830",
        "inverse-primary":           "#3A2408",
        "on-primary":                "#1A0E02",
        "on-primary-container":      "#FFD880",   // warm gold text
        "on-primary-fixed":          "#1A0E02",
        "on-primary-fixed-variant":  "#3A2208",

        // ── SECONDARY — Enchanted Forest Leaf Green ──
        "secondary":                 "#4A9A20",   // vibrant leaf green
        "secondary-container":       "#1A3A08",   // deep forest green
        "secondary-fixed":           "#90E050",
        "secondary-fixed-dim":       "#60B830",
        "on-secondary":              "#0A1A02",
        "on-secondary-container":    "#B0F060",   // bright leaf text
        "on-secondary-fixed":        "#0A1A02",
        "on-secondary-fixed-variant":"#1A3A0A",

        // ── TERTIARY — Mossy Stone / Mushroom cream ──
        "tertiary":                  "#8A7A50",   // mossy stone
        "tertiary-container":        "#3A3018",   // dark mossy
        "tertiary-fixed":            "#C8B870",
        "tertiary-fixed-dim":        "#A09850",
        "on-tertiary":               "#FFFFFF",
        "on-tertiary-fixed":         "#1A1502",
        "on-tertiary-fixed-variant": "#3A3010",
        "on-tertiary-container":     "#F0D890",

        // ── ERROR — Redstone ──
        "error":                     "#E05050",
        "error-container":           "#4A0808",
        "on-error":                  "#FFFFFF",
        "on-error-container":        "#FFAAAA",

        // ── INVERSE — Light Birch (for contrast elements) ──
        "inverse-surface":           "#D4C090",   // aged birch / parchment
        "inverse-on-surface":        "#1A0E06",
        "surface-tint":              "#C89020",

        // ── TEXT — Warm cream by lantern light ──
        "on-surface":                "#E8D4A0",   // warm parchment text
        "on-background":             "#E8D4A0",
        "on-surface-variant":        "#9A7A50",   // dim warm bark text
        "outline":                   "#5A3E20",   // medium bark outline
        "outline-variant":           "#3A2810",   // dark bark outline
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
      },
      spacing: {
        "step-lg": "24px",
        "step-3xl": "64px",
        "container-max": "1200px",
        "step-xl": "32px",
        "step-2xl": "48px",
        "gutter-desktop": "24px",
        "step-sm": "8px",
        "step-xs": "4px",
        "gutter-mobile": "16px",
        "pixel-unit": "2px",
        "step-md": "16px",
      },
      fontFamily: {
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "label-sm": ["JetBrains Mono", "monospace"],
        "headline-lg-mobile": ["Space Grotesk", "sans-serif"],
        "body-md": ["Space Grotesk", "sans-serif"],
        "body-lg": ["Space Grotesk", "sans-serif"],
        "display-mobile": ["Space Grotesk", "sans-serif"],
        "body-sm": ["Space Grotesk", "sans-serif"],
        "display": ["Space Grotesk", "sans-serif"],
        "headline-sm": ["Space Grotesk", "sans-serif"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "label-lg": ["JetBrains Mono", "monospace"],
        "label-md": ["JetBrains Mono", "monospace"],
        "section-title": ["Space Grotesk", "sans-serif"],
        "headline-display": ["Space Grotesk", "sans-serif"],
        "body-base": ["Space Grotesk", "sans-serif"],
        "data-mono": ["JetBrains Mono", "monospace"],
        "label-caps": ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "38px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.08em", fontWeight: "700" }],
        "headline-lg-mobile": ["26px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-md": ["15px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "display-mobile": ["36px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-sm": ["13px", { lineHeight: "20px", fontWeight: "400" }],
        "display": ["48px", { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "26px", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "30px", fontWeight: "600" }],
        "label-lg": ["14px", { lineHeight: "18px", letterSpacing: "0.04em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
}