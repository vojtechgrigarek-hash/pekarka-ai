const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Načtení databáze receptů ze souboru
const recepty = JSON.parse(fs.readFileSync('recepty.json', 'utf8'));

// 2. Proměnná pro "paměť" serveru (kontext)
let aktualniRecept = null;

app.post('/chat', (req, res) => {
    const { dotaz } = req.body;
    if (!dotaz) {
        return res.json({ odpoved: "Zatím jsi nic nenapsal." });
    }

    const text = dotaz.toLowerCase();

    // 3. LOGIKA: Hledání receptu v textu
    const nalezenyRecept = recepty.find(r => 
        text.includes(r.id) || text.includes(r.nazev.toLowerCase())
    );

    // A) Pokud uživatel zmínil název receptu (přepneme kontext)
    if (nalezenyRecept) {
        aktualniRecept = nalezenyRecept;
        
        // Pokud rovnou v jedné větě napsal i "alergeny" nebo "náhrady"
        if (text.includes("alerg")) {
            return res.json({ odpoved: `V receptu na ${aktualniRecept.nazev} jsou tyto alergeny: ${aktualniRecept.alergeny.join(", ")}.` });
        }
        if (text.includes("náhrad") || text.includes("alternativ")) {
            return res.json({ odpoved: formatujNahrady(aktualniRecept) });
        }

        return res.json({ odpoved: `Jasně, dívám se na ${nalezenyRecept.nazev}. Co konkrétně tě zajímá? (alergeny / náhrady / ingredience)` });
    }

    // B) Pokud uživatel nenapsal název, ale máme recept v "paměti"
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

    // C) Pokud bot neví, o čem je řeč
    res.json({ odpoved: "Zatím nevím, o jakém receptu se bavíme. Zkus napsat třeba 'houstičky' nebo 'loupáčky'." });
});

// Pomocná funkce pro hezké vypsání náhrad
function formatujNahrady(recept) {
    const nahrady = recept.nahrady;
    let vypis = `Náhrady pro ${recept.nazev}: `;
    const polozky = Object.entries(nahrady).map(([co, cim]) => `${co} -> ${cim}`);
    return vypis + polozky.join(", ");
}

// Spuštění serveru
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});