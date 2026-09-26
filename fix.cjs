const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(/defaultValue=\{\/\/ FORMULA INCANTATIO[\s\S]*?avert backfire\.\}/, 'defaultValue={`// FORMULA INCANTATIO: GLACIAL BURST\\n\\nVocalis: "Khor-Tek Frigid-Vael"\\n▶ Catalyst: 2x Azure Glaze + Powdered Pearl\\n▶ Cast Time: 1.8s Channeling | AoE: 14m Radius\\n▶ Vulnerability: Pierces Molten Carapace (Rank III)\\n\\n// Note: Ensure ley-line grounding before utterance to avert backfire.`}');
fs.writeFileSync('src/App.jsx', code);
