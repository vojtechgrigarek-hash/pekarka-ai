const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Načtení receptů
let recepty = [];
try {
    const data = fs.readFileSync('recepty.json', 'utf8');
    recepty = JSON.parse(data);
} catch (err) {
    console.error("Chyba při načítání JSON:", err);
}

// Proměnná pro "paměť" bota - uložíme si, o jakém receptu se právě bavíme
let aktualniRecept = null;

app.post('/chat', (req, res) => {
    const dotaz = req.body.dotaz || "";
    const text = dotaz.toLowerCase();

    // 1. ŽÁDOST O ALERGENY (U rozpracovaného receptu)
    if (text.includes("alergen") && aktualniRecept) {
        const al = aktualniRecept.alergeny.length > 0 ? aktualniRecept.alergeny.join(", ") : "Žádné významné alergeny.";
        return res.json({ 
            odpoved: `Alergeny pro ${aktualniRecept.nazev} jsou: ${al}.\n\nChceš vědět i možné náhrady?` 
        });
    }

    // 2. ŽÁDOST O NÁHRADY (U rozpracovaného receptu)
    if (text.includes("nahrad") && aktualniRecept) {
        // Tady procházíme objekt "nahrady" a skládáme text
        let nahradyText = Object.entries(aktualniRecept.nahrady)
            .map(([klic, hodnota]) => `• **${klic}**: ${hodnota}`)
            .join("\n");
        
        return res.json({ 
            odpoved: `Tady jsou možnosti náhrad pro ${aktualniRecept.nazev}:\n${nahradyText || "Žádné náhrady nejsou uvedeny."}` 
        });
    }

    // 3. SEZNAM RECEPTŮ
    if (text === "recepty" || text.includes("seznam") || text.includes("co umíš")) {
        aktualniRecept = null; // Vymažeme paměť
        const seznam = recepty.map(r => r.nazev).join("\n- ");
        return res.json({ odpoved: `Mám v databázi tyto recepty:\n- ${seznam}\n\nO kterém se chceš dozvědět víc?` });
    }

    // 4. HLEDÁNÍ KONKRÉTNÍHO RECEPTU (První krok interakce)
    const nalezeny = recepty.find(r => text.includes(r.nazev.toLowerCase()));
    
    if (nalezeny) {
        aktualniRecept = nalezeny; // Bot si "zapamatuje", že mluvíme o Apple Pie
        
        // Jelikož jsou ingredience v poli, musíme je spojit do řádků
        const ingredienceList = nalezeny.ingredience.map(i => `- ${i}`).join("\n");
        
        return res.json({ 
            odpoved: `Jasně! Tady jsou ingredience na **${nalezeny.nazev}**:\n${ingredienceList}\n\nChceš vědět, jaké má tento recept **alergeny** nebo jaké jsou **náhrady**?` 
        });
    }

    // 5. KDYŽ BOT NEROZUMÍ
    res.json({ odpoved: "Zkus napsat název receptu nebo 'seznam'. Pokud se ptáš na alergeny/náhrady, musíme nejdřív vybrat recept." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));