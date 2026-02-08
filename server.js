const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Načtení receptů ze souboru JSON
let recepty = [];
try {
    const data = fs.readFileSync('recepty.json', 'utf8');
    recepty = JSON.parse(data);
    console.log("Recepty byly úspěšně načteny.");
} catch (err) {
    console.error("Chyba při načítání recepty.json:", err);
}

// Pomocná proměnná pro udržení kontextu (o čem se bavíme)
let aktualniRecept = null;

app.post('/chat', (req, res) => {
    const dotaz = req.body.dotaz || "";
    const text = dotaz.toLowerCase(); // Převedeme na malá písmena pro snadnější hledání

    // --- 1. SEZNAM VŠECH RECEPTŮ ---
    if (text === "recepty" || text.includes("seznam") || text.includes("co umíš")) {
        const seznam = recepty.map(r => r.nazev).join("\n- ");
        return res.json({ 
            odpoved: `Mám v databázi tyto recepty:\n- ${seznam}\n\nO kterém se chceš dozvědět víc?` 
        });
    }

    // --- 2. FILTROVÁNÍ: BEZ LEPKU ---
    if (text.includes("bez lepku") || text.includes("bezlepkov")) {
        const bezlepkove = recepty.filter(r => r.vlastnosti && r.vlastnosti.includes("bez-lepku"));
        if (bezlepkove.length > 0) {
            const seznam = bezlepkove.map(r => r.nazev).join("\n- ");
            return res.json({ odpoved: `Bezlepkové dobroty:\n- ${seznam}` });
        } else {
            return res.json({ odpoved: "Bohužel zatím nemám v databázi žádný bezlepkový recept." });
        }
    }

    // --- 3. FILTROVÁNÍ: BEZ LAKTÓZY ---
    if (text.includes("bez laktoz") || text.includes("bez laktóz")) {
        const bezLaktozy = recepty.filter(r => r.vlastnosti && r.vlastnosti.includes("bez-laktozy"));
        if (bezLaktozy.length > 0) {
            const seznam = bezLaktozy.map(r => r.nazev).join("\n- ");
            return res.json({ odpoved: `Recepty bez laktózy:\n- ${seznam}` });
        } else {
            return res.json({ odpoved: "Všechny mé recepty zatím obsahují laktózu. Ale můžeme zkusit náhrady!" });
        }
        
    }

    // --- 4. DETAIL KONKRÉTNÍHO RECEPTU ---
    // Hledáme, jestli text obsahuje název nějakého receptu
    const nalezeny = recepty.find(r => text.includes(r.nazev.toLowerCase()));
    
    if (nalezeny) {
        aktualniRecept = nalezeny;
        return res.json({ 
            odpoved: `Recept na ${nalezeny.nazev}:\n\nBudeme potřebovat: ${nalezeny.ingredience}\n\nChceš vědět, jak na to (postup)?` 
        });
    }

    // --- 5. DOTAZ NA POSTUP (KONTEXT) ---
    if ((text.includes("postup") || text.includes("jak na to")) && aktualniRecept) {
        return res.json({ 
            odpoved: `Tady je postup pro ${aktualniRecept.nazev}:\n${aktualniRecept.postup}` 
        });
    }

    // --- 6. NEZNÁMÝ DOTAZ ---
    res.json({ 
        odpoved: "Zatím ti nerozumím. Zkus napsat 'recepty' nebo název konkrétního dezertu (např. Makronky)." 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));