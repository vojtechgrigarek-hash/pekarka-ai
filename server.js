// --- 1. IMPORTY KNIHOVEN ---
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// --- 2. NAČTENÍ DAT ---
const recepty = JSON.parse(fs.readFileSync('recepty.json', 'utf8'));

// --- 3. PAMĚŤ SERVERU ---
let aktualniRecept = null;

// --- 4. HLAVNÍ KOMUNIKAČNÍ BOD (ENDPOINT) ---
app.post('/chat', (req, res) => {
    
    // Z příchozí zprávy vytáhneme text
    const { dotaz } = req.body;

    // Pojistka proti prázdné zprávě
    if (!dotaz) {
        return res.json({ odpoved: "Zatím jsi nic nenapsal." });
    }

    // Převedeme vše na malá písmena (sjednotíme proměnnou na 'text')
    const text = dotaz.toLowerCase();

    // --- KROK 1: GLOBÁLNÍ PŘÍKAZY (VÝPIS VŠECH) ---
    // Toto kontrolujeme jako první. Pokud chce uživatel seznam, nehledáme konkrétní recept.
    if (text === "recepty" || text.includes("jaké jsou recepty") || text.includes("seznam receptů")) {
        // Vynulujeme paměť, protože se uživatel vrací na "hlavní menu"
        aktualniRecept = null; 
        
        const seznamNazvu = recepty.map(r => r.nazev).join(", ");
        return res.json({ 
            odpoved: `Mám v databázi tyto recepty: ${seznamNazvu}. O kterém se chceš dozvědět víc?` 
        });
    }

    // --- KROK 2: LOGIKA HLEDÁNÍ KONKRÉTNÍHO RECEPTU ---
    const nalezenyRecept = recepty.find(r => 
        text.includes(r.id) || text.includes(r.nazev.toLowerCase())
    );

    // --- SCÉNÁŘ A: Uživatel napsal název receptu (např. "Máš loupáčky?") ---
    if (nalezenyRecept) {
        aktualniRecept = nalezenyRecept; // ULOŽÍME DO PAMĚTI
        
        // Rychlá kontrola: "alergeny loupáčky"
        if (text.includes("alerg")) {
            return res.json({ odpoved: `V receptu na ${aktualniRecept.nazev} jsou tyto alergeny: ${aktualniRecept.alergeny.join(", ")}.` });
        }
        
        // Rychlá kontrola: "náhrady loupáčky"
        if (text.includes("náhrad") || text.includes("alternativ")) {
            return res.json({ odpoved: formatujNahrady(aktualniRecept) });
        }

        // Pokud napsal jen název
        return res.json({ odpoved: `Jasně, dívám se na ${nalezenyRecept.nazev}. Co konkrétně tě zajímá? (ingredience / alergeny / náhrady)` });
    }

    // --- SCÉNÁŘ B: Uživatel nenapsal název, ale server má něco v paměti ---
    if (aktualniRecept) {
        
        if (text.includes("alerg")) {
            return res.json({ odpoved: `Alergeny pro ${aktualniRecept.nazev} jsou: ${aktualniRecept.alergeny.join(", ")}.` });
        } 
        
        if (text.includes("náhrad") || text.includes("alternativ")) {
            return res.json({ odpoved: formatujNahrady(aktualniRecept) });
        }

        if (text.includes("ingredience") || text.includes("co potřebuju") || text.includes("složení")) {
            return res.json({ odpoved: `Na ${aktualniRecept.nazev} budeš potřebovat: ${aktualniRecept.ingredience.join(", ")}.` });
        }
    }

    // --- SCÉNÁŘ C: Server neví, o čem je řeč ---
    res.json({ odpoved: "Zatím nevím, o jakém receptu se bavíme. Zkus napsat 'recepty' pro seznam, nebo konkrétní název." });
});


// --- 5. POMOCNÁ FUNKCE ---
function formatujNahrady(recept) {
    // Pokud recept nemá náhrady, nebo je objekt prázdný, vrátíme info
    if (!recept.nahrady || Object.keys(recept.nahrady).length === 0) {
        return `Pro recept ${recept.nazev} nemám žádné specifické náhrady.`;
    }

    const nahrady = recept.nahrady;
    let vypis = `Náhrady pro ${recept.nazev}: `;
    const polozky = Object.entries(nahrady).map(([co, cim]) => `${co} -> ${cim}`);
    return vypis + polozky.join("; "); // Použil jsem středník pro lepší čitelnost
}


// --- 6. SPUŠTĚNÍ SERVERU ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});