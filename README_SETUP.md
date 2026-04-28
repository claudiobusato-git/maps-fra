# 🚀 Setup — Mappa Villaggio San Francesco

Tutto quello che ti serve per partire. Segui in ordine.

## 1️⃣ Installa Claude Code

Sul tuo computer (Mac/Windows/Linux):

```bash
# Serve Node.js 18+ — verifica con: node --version
# Se non ce l'hai: https://nodejs.org/

# Installa Claude Code
npm install -g @anthropic-ai/claude-code

# Verifica
claude --version
```

## 2️⃣ Prepara la cartella di progetto

```bash
# Crea cartella e ci entri
mkdir mappa-villaggio
cd mappa-villaggio

# Copia dentro questa cartella i file che ti ho preparato:
# - CLAUDE.md
# - mappa_villaggio_web.jpg (rinominata in assets/map.jpg)
# - mappa_villaggio_hires.png (per OCR)

mkdir -p assets data tools js css
mv mappa_villaggio_web.jpg assets/map.jpg
mv mappa_villaggio_hires.png tools/map_hires_for_ocr.png

# Avvia Claude Code
claude
```

## 3️⃣ Primo prompt da incollare in Claude Code

Quando si apre Claude Code, **incolla esattamente questo primo prompt**:

---

> Ciao! Leggi prima `CLAUDE.md` nella root del progetto: contiene tutto il contesto, lo stack scelto e la roadmap.
>
> Poi partiamo dallo **Step 1**: crea la struttura iniziale del progetto e l'`index.html` base con Leaflet che mostra `assets/map.jpg` come image overlay navigabile (pan + zoom su mobile). Per ora niente GPS, niente marker — voglio solo vedere la mappa caricarsi e funzionare.
>
> Quando hai finito, dimmi come testarlo in locale e aggiorna il `CLAUDE.md` segnando lo Step 1 come completato.

---

## 4️⃣ Raccolta punti GPS (in parallelo, mentre Claude Code lavora)

Ti serve raccogliere **almeno 8 coordinate GPS reali** del villaggio. Strumenti:

**iPhone**: app **Bussola** (preinstallata) → mostra lat/lng in basso. Oppure app **GPS Status & Toolbox** (gratis).

**Android**: app **GPS Status & Toolbox** o **My GPS Coordinates** (gratis su Play Store).

**Per ogni punto**:
1. Vai sul posto fisicamente
2. Aspetta che il GPS si stabilizzi (errore < 5m, vedrai "accuracy" nell'app)
3. Annota: nome del punto, latitudine, longitudine (almeno 5-6 decimali)
4. Foto dello schermo come backup

**Punti consigliati** (più sono distribuiti, meglio è):
- [ ] Reception (ingresso principale)
- [ ] Ingresso spiaggia
- [ ] Angolo NW del villaggio (vicino piazzole 4400-4500)
- [ ] Angolo SW (campi sportivi/tennis)
- [ ] Acqua Park Garden (lato sud)
- [ ] Piazzetta Maxim
- [ ] Bacaro Ai Cocai (lato nord)
- [ ] Una piazzola riconoscibile in ogni zona

Salva tutto in un file `gps-punti.txt` formato così:

```
nome: Reception
lat: 45.6XXXXX
lng: 12.9XXXXX
note: angolo SW dell'edificio, vicino al gabbiotto

nome: Ingresso spiaggia
lat: 45.6XXXXX
lng: 12.9XXXXX
note: punto centrale del cancello pedonale
```

## 5️⃣ Step successivi

Dopo che lo Step 1 funziona, basta scrivere a Claude Code:

> Step 1 OK, andiamo allo Step 2.

E così via, seguendo la roadmap nel `CLAUDE.md`. Lo step più importante è il **2 (calibrazione)**: serviranno i tuoi punti GPS per ancorare la mappa al mondo reale.

## 💡 Consigli di lavoro con Claude Code

- **Una sessione = uno step**: se hai poco tempo, fai uno step e chiudi. La memoria sta nel `CLAUDE.md`.
- **Testa subito su mobile**: ogni step va provato sul telefono vero, non solo sul desktop.
- **Chiedi commit frequenti**: "fai un commit git con messaggio descrittivo" — così puoi tornare indietro.
- **Se Claude sbaglia**: spiegagli cosa non va, NON insistere a ripetere lo stesso prompt.
- **Compatta la chat**: se la conversazione si allunga, chiedi "riassumi cosa abbiamo fatto e aggiorna CLAUDE.md", poi inizia una nuova chat partendo dal CLAUDE.md aggiornato.

## 🆘 Troubleshooting

**"La geolocation non funziona"** → serve HTTPS. In sviluppo va con `localhost`, in produzione serve hosting con SSL (Netlify e GitHub Pages ce l'hanno gratis).

**"La mappa non si carica"** → controlla il path `assets/map.jpg`. Apri DevTools (F12) → tab Network.

**"Il GPS è impreciso"** → aggiungi più punti di calibrazione, soprattutto agli angoli del villaggio.

**"Claude Code esaurisce il contesto"** → chiedigli di compattare CLAUDE.md, poi apri nuova sessione.
