const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Načtení receptů
const recepty = JSON.parse(fs.readFileSync('recepty.json', 'utf8'));

// TADY JE TA ZMĚNA: Proměnná pro zapamatování kontextu
let aktualniRecept = null;

app.post('/chat', (req, res) => {
    const { dotaz } = req.body;
    const text = dotaz.toLowerCase(); // Převedeme na malá písmena

    // 1. Zkusíme najít nový recept podle názvu
    const nalezenyRecept = recepty.find(r => 
        text.includes(r.id) || text.includes(r.nazev.toLowerCase())
    );

    // Pokud uživatel zmínil název receptu (např. "loupáčky")
    if (nalezenyRecept) {
        aktualniRecept = nalezenyRecept; // ULOŽÍME SI HO DO PAMĚTI!
        res.json({ odpoved: `Našel jsem recept na ${nalezenyRecept.nazev}. Co tě zajímá? (alergeny / náhrady)` });
    }
    
    // 2. Pokud uživatel nenapsal název receptu, ale ptá se na detaily (a my máme recept v paměti)
    else if (aktualniRecept && (text.includes("alerg") || text.includes("náhrad") || text.includes("ingredience"))) {
        
        if (text.includes("alerg")) {
            res.json({ odpoved: `Alergeny v receptu ${aktualniRecept.nazev}: ${aktualniRecept.alergeny.join(", ")}.` });
        } 
        else if (text.includes("náhrad")) {
            // Převedeme objekt náhrad na čitelný text
            const nahradyText = JSON.stringify(aktualniRecept.nahrady).replace(/{|}|"/g, ' '); 
            res.json({ odpoved: `Náhrady pro ${aktualniRecept.nazev}: ${nahradyText}` });
        }
        else if (text.includes("ingredience")) {
            res.json({ odpoved: `Potřebuješ: ${aktualniRecept.ingredience.join(", ")}.` });
        }
    }

    // 3. Pokud nevíme, o čem je řeč
    else {
        res.json({ odpoved: "Nevím, o jakém receptu mluvíš. Zkus napsat třeba 'Loupáčky' nebo 'Koblihy'." });
    }
});

app.listen(3000, () => {
    console.log('Server běží na http://localhost:3000');
});