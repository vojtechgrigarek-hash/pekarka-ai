// --- 1. IMPORTY KNIHOVEN ---
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// --- 2. NAČTENÍ DAT ---
// Předpokládám, že recepty.json obsahuje pole: ingredience (array), alergeny (array), nahrady (object)
const recepty = JSON.parse(fs.readFileSync('recepty.json', 'utf8'));

// --- 3. PAMĚŤ SERVERU ---
let aktualniRecept = null;

// --- 4. HLAVNÍ KOMUNIKAČNÍ BOD ---
app.post('/chat', (req, res) => {
    
    const { dotaz } = req.body;

    if (!dotaz) {
        return res.json({ odpoved: "Zatím jsi nic nenapsal." });
    }

    const text = dotaz.toLowerCase();

    // --- KROK 1: GLOBÁLNÍ PŘÍKAZY (VÝPIS VŠECH) ---
    if (text === "recepty" || text.includes("jaké jsou recepty") || text.includes("seznam")) {
        aktualniRecept = null; 
        
        // Vypíše recepty pod sebe s pomlčkou
        const seznamNazvu = recepty.map(r => r.nazev).join("\n- ");
        
        return res.json({ 
            odpoved: `Mám v databázi tyto recepty:\n- ${seznamNazvu}\n\nO kterém se chceš dozvědět víc?` 
        });
    }

    // --- KROK 2: HLEDÁNÍ NOVÉHO RECEPTU ---
    // Zkusíme najít, jestli uživatel napsal název nějakého receptu
    const nalezenyRecept = recepty.find(r => 
        text.includes(r.id) || text.includes(r.nazev.toLowerCase())
    );

    // Pokud uživatel napsal název receptu (např. "Pastel de Nata")
    if (nalezenyRecept) {
        aktualniRecept = nalezenyRecept; // Uložíme do paměti
        
        // POŽADAVEK: Název + Popis + Výzva k akci
        return res.json({ 
            odpoved: ` ${aktualniRecept.nazev}\n\n${aktualniRecept.popis || "Tento recept nemá krátký popis."}\n\nCo konkrétně tě zajímá? (ingredience / alergeny / náhrady)` 
        });
    }

    // --- KROK 3: KONTEXTOVÉ DOTAZY (Už máme vybraný recept) ---
    // Pokud uživatel nenapsal název receptu, ale máme nějaký v paměti, řešíme detaily
    if (aktualniRecept) {

        // A) INGREDIENCE
        if (text.includes("ingredience") || text.includes("složení") || text.includes("co potřebuju")) {
            // Zformátujeme pole ingrediencí pod sebe
            let seznamIngredienci = "";
            if (Array.isArray(aktualniRecept.ingredience)) {
                seznamIngredienci = aktualniRecept.ingredience.map(i => `- ${i}`).join("\n");
            } else {
                seznamIngredienci = aktualniRecept.ingredience; // Kdyby to náhodou byl jen text
            }

            return res.json({ 
                odpoved: ` Ingredience pro ${aktualniRecept.nazev}:\n${seznamIngredienci}\n\nMůžu ti vypsat také alergeny nebo náhrady.` 
            });
        }

        // B) ALERGENY
        if (text.includes("alergen")) {
            const alergenyText = Array.isArray(aktualniRecept.alergeny) 
                ? aktualniRecept.alergeny.join(", ") 
                : aktualniRecept.alergeny;

            return res.json({ 
                odpoved: `⚠️ Alergeny:\n${alergenyText}\n\nZajímají tě i náhrady?` 
            });
        }

        // C) NÁHRADY
        if (text.includes("náhrad") || text.includes("alternativ")) {
            return res.json({ odpoved: formatujNahrady(aktualniRecept) });
        }
    }

    // --- KROK 4: NEVÍM ---
    res.json({ odpoved: "Zatím nevím, o jakém receptu se bavíme. Zkus napsat 'recepty' pro seznam, nebo konkrétní název." });
});


// --- 5. POMOCNÁ FUNKCE PRO NÁHRADY ---
function formatujNahrady(recept) {
    if (!recept.nahrady || Object.keys(recept.nahrady).length === 0) {
        return `Pro recept ${recept.nazev} nemám žádné specifické náhrady.`;
    }

    const nahrady = recept.nahrady;
    let vypis = `🔄 Náhrady pro ${recept.nazev}:\n`;
    
    // Zformátujeme náhrady pod sebe
    const polozky = Object.entries(nahrady).map(([co, cim]) => `- **${co}**: ${cim}`);
    
    return vypis + polozky.join("\n");
}


// --- 6. SPUŠTĚNÍ SERVERU ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});