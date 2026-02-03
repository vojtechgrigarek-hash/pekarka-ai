// --- 1. IMPORTY KNIHOVEN ---
// Express je framework, který zjednodušuje tvorbu webového serveru
const express = require('express');
// CORS (Cross-Origin Resource Sharing) dovoluje, aby se tvůj frontend (Framer) mohl spojit s tímto backendem
const cors = require('cors');
// FS (File System) je modul pro práci se soubory (potřebujeme ho pro načtení recepty.json)
const fs = require('fs');

// Vytvoření samotné aplikace (serveru)
const app = express();

// Povolíme CORS pro všechny (aby se na server dalo připojit odkudkoliv)
app.use(cors());
// Říkáme serveru, aby uměl číst data ve formátu JSON (to, co posíláme z frontendu)
app.use(express.json());


// --- 2. NAČTENÍ DAT ---
// Tady se synchronně (ihned při startu) načte soubor recepty.json a převede se na JavaScript objekt
// 'utf8' zajistí, že se správně načte čeština
const recepty = JSON.parse(fs.readFileSync('recepty.json', 'utf8'));


// --- 3. PAMĚŤ SERVERU ---
// Toto je proměnná, kam si server "poznamená", o čem se zrovna bavíme.
// Na začátku je null (prázdná), protože jsme se o ničem nebavili.
let aktualniRecept = null;


// --- 4. HLAVNÍ KOMUNIKAČNÍ BOD (ENDPOINT) ---
// Tady definujeme, co se stane, když přijde požadavek na adresu ".../chat"
app.post('/chat', (req, res) => {
    
    // Z příchozí zprávy (req.body) vytáhneme text, co uživatel napsal
    const { dotaz } = req.body;

    // Pojistka: Pokud uživatel poslal prázdnou zprávu, server ho upozorní a skončí
    if (!dotaz) {
        return res.json({ odpoved: "Zatím jsi nic nenapsal." });
    }

    // Převedeme vše na malá písmena (aby "Loupáčky", "loupáčky" i "LOUPÁČKY" bylo to samé)
    const text = dotaz.toLowerCase();

    // --- LOGIKA HLEDÁNÍ ---
    // Funkce .find() projede všechny recepty v databázi.
    // Hledá, jestli se ID receptu nebo jeho NÁZEV nachází v textu, co uživatel napsal.
    const nalezenyRecept = recepty.find(r => 
        text.includes(r.id) || text.includes(r.nazev.toLowerCase())
    );

    // --- SCÉNÁŘ A: Uživatel napsal název receptu (např. "Máš loupáčky?") ---
    if (nalezenyRecept) {
        aktualniRecept = nalezenyRecept; // ULOŽÍME SI HO DO PAMĚTI! Odteď víme, že řešíme tento recept.
        
        // Okamžitá kontrola: Uživatel mohl napsat rovnou "alergeny loupáčky"
        if (text.includes("alerg")) {
            // .join(", ") spojí pole alergenů ["lepek", "vejce"] do textu "lepek, vejce"
            return res.json({ odpoved: `V receptu na ${aktualniRecept.nazev} jsou tyto alergeny: ${aktualniRecept.alergeny.join(", ")}.` });
        }
        
        // Okamžitá kontrola: Uživatel napsal "náhrady loupáčky"
        if (text.includes("náhrad") || text.includes("alternativ")) {
            // Voláme pomocnou funkci dole, která hezky vypíše náhrady
            return res.json({ odpoved: formatujNahrady(aktualniRecept) });
        }

        // Pokud napsal jen název, odpovíme obecně a zeptáme se dál
        return res.json({ odpoved: `Jasně, dívám se na ${nalezenyRecept.nazev}. Co konkrétně tě zajímá? (ingredience / alergeny / náhrady )` });
    }

    // --- SCÉNÁŘ B: Uživatel nenapsal název, ale server má něco v paměti ---
    // (Tohle nastane, když uživatel napíše třeba jen "a co alergeny?")
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
    // Ani nenašel nový recept, ani si nic nepamatuje, nebo se uživatel ptá na hlouposti.
    res.json({ odpoved: "Zatím nevím, o jakém receptu se bavíme. Zkus napsat jeden z receptů na webu." });
});


// --- 5. POMOCNÁ FUNKCE ---
// Slouží k tomu, aby se kód nahoře nezaneprázdnil složitým formátováním textu
function formatujNahrady(recept) {
    const nahrady = recept.nahrady;
    let vypis = `Náhrady pro ${recept.nazev}: `;
    
    // Object.entries vezme objekt { "mleko": "voda", "vejce": "banan" }
    // a udělá z něj pole, které projdeme (.map) a vytvoříme text "mleko -> voda"
    const polozky = Object.entries(nahrady).map(([co, cim]) => `${co} -> ${cim}`);
    
    // Nakonec to spojíme čárkami
    return vypis + polozky.join(", ");
}


// --- 6. SPUŠTĚNÍ SERVERU ---
// process.env.PORT je port, který nám přidělí Render (v cloudu).
// Pokud ho nemáme (běžíme doma), použije se 3000.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});