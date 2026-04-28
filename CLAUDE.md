# CLAUDE.md — Navigatore Villaggio San Francesco

> File di memoria per Claude Code. Leggere SEMPRE all'inizio di ogni sessione.
> Aggiornare ad ogni decisione importante o step completato.

## 🎯 Obiettivo del progetto

Costruire una **web app PWA** che funzioni come un **vero navigatore turn-by-turn** dentro al Villaggio San Francesco a Caorle (VE), con esperienza utente analoga a Google Maps.

L'utente cerca una piazzola/servizio → la mappa traccia un **percorso** sulle strade interne → guida l'utente in tempo reale durante la pedalata con istruzioni di svolta.

### Funzionalità target
1. Visualizzazione planimetria villaggio (pan/zoom mobile-first)
2. Ricerca per numero piazzola o nome servizio (es. "Ristorante Tropical")
3. **Calcolo percorso** dalla posizione GPS attuale alla destinazione, sulle strade reali
4. **Visualizzazione percorso** (linea blu come Google Maps) + distanza + tempo stimato in bici
5. **Turn-by-turn**: istruzioni "gira a destra in Via dei Tigli tra 50m"
6. Posizione live GPS con "snap to road"
7. (Opzionale) istruzioni vocali in italiano
8. Funzionamento offline (PWA installabile)

## 📍 Contesto

- **Villaggio**: San Francesco, Caorle (VE) — villaggiosanfrancesco.com
- **Estensione**: ~800+ unità numerate divise in 4 zone, ~50 vie interne
- **Numerazione piazzole**:
  - Zona 1 (lato mare): serie 1xxx — Lodge Deluxe Sea View, Premium Sea Breeze
  - Zona 2 (centro-est): serie 2xxx — Lodge Prestige, Holiday Home
  - Zona 3 (centro): serie 3xxx — Lodge, Holiday Home, Piazzole standard
  - Zona 4 (ovest): serie 4xxx — Holiday Home Residence Plus, Comfort, Mini

## 🛠 Stack tecnico (DEFINITIVO)

| Componente | Scelta | Perché |
|---|---|---|
| Frontend | HTML5 + CSS + JS vanilla | No framework, max compatibilità |
| Mappa | **Leaflet.js 1.9.x** | Leggera, mobile-first, image overlay |
| Coord transform | Affine 6-param (custom) | Da pixel mappa → lat/lng GPS |
| **Routing** | **Dijkstra custom in JS** | Algoritmo su grafo strade interne |
| Turn-by-turn | Modulo custom | Calcolo bearing + istruzioni in italiano |
| Voice (v2) | Web Speech API nativa | Gratuita, italiano supportato |
| Geolocation | `navigator.geolocation` HTML5 | Native API |
| Compass | `DeviceOrientationEvent` | Per ruotare mappa con direzione |
| PWA | Service Worker + Cache API | Offline, installabile |
| Hosting | Netlify o GitHub Pages | HTTPS gratuito |

## 📁 Struttura progetto

```
mappa-villaggio/
├── CLAUDE.md
├── README.md
├── index.html                  # App principale (modalità ricerca + navigazione)
├── manifest.json               # PWA manifest
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── app.js                  # Entry point, state management
│   ├── map-init.js             # Setup Leaflet + image overlay
│   ├── geo-transform.js        # Pixel ↔ GPS (calibrazione affine)
│   ├── graph.js                # Caricamento + struttura grafo strade
│   ├── routing.js              # Dijkstra: trova percorso ottimale
│   ├── navigation.js           # Turn-by-turn: posizione → istruzioni
│   ├── snap-to-road.js         # GPS → punto più vicino sul grafo
│   ├── search.js               # Ricerca piazzole + servizi
│   ├── ui.js                   # UI Google-Maps-like (search bar, card)
│   └── voice.js                # Web Speech API (italiano)
├── data/
│   ├── pitches.json            # Piazzole: numero, pixel, GPS, entry-node
│   ├── services.json           # Servizi/POI con entry-node
│   ├── roads-graph.json        # Grafo strade: nodes + edges
│   └── calibration.json        # Punti GPS reali per georeferencing
├── assets/
│   ├── map.jpg                 # Mappa villaggio (4000px, ~2.5MB)
│   └── icons/                  # Icone PWA + categorie POI
└── tools/                      # Tool di sviluppo (non in produzione)
    ├── calibrate.html          # Tool calibrazione GPS
    ├── graph-editor.html       # Editor visuale grafo strade
    ├── pitch-extractor.html    # OCR + verifica piazzole
    └── extract-pitches.py      # Script OCR Tesseract
```

## 🗺 Approcci tecnici chiave

### Georeferencing (pixel → GPS)
Trasformazione affine a 6 parametri calcolata via minimi quadrati da ≥4 punti GPS reali. Con 8+ punti distribuiti agli angoli + centro l'errore atteso è <2m.

### Grafo strade interne
Costruito manualmente con `tools/graph-editor.html`:
- **Nodi**: incroci e punti decisionali, identificati da ID + (px, py)
- **Archi**: segmenti bidirezionali con `from`, `to`, `name` (via), `length` calcolata
- Stimati ~100-150 nodi e ~200 archi totali

### Routing
Dijkstra classico su grafo pesato per lunghezza:
1. Trova nodo più vicino alla posizione GPS attuale (start)
2. Trova nodo entry-point della destinazione (end)
3. Calcola percorso più breve
4. Restituisce: lista waypoint + distanza totale + ETA (bici 12 km/h)

### Turn-by-turn
Per ogni coppia di archi consecutivi nel percorso:
- Calcola **bearing change** tra arco entrante e uscente
- < 20°: "continua dritto"
- 20-150° destra: "gira a destra in {nome via}"
- 20-150° sinistra: "gira a sinistra in {nome via}"
- > 150°: "fai inversione"
- Distanza all'istruzione = distanza GPS → nodo svolta

### Snap to road
GPS ha errore 3-10m. Proiettiamo posizione GPS sul segmento più vicino (raggio 15m). Se nessuna strada vicina, mostra posizione raw.

## 📋 Punti GPS necessari (input utente)

Target ≥8, distribuiti. Lista in `gps-punti.txt`:
- [ ] Reception
- [ ] Ingresso spiaggia
- [ ] Angolo NW (zona 4400-4500)
- [ ] Angolo SW (campi sportivi)
- [ ] Acqua Park Garden
- [ ] Piazzetta Maxim
- [ ] Bacaro Ai Cocai
- [ ] Una piazzola riconoscibile in zona 1
- [ ] Una piazzola riconoscibile in zona 3

## 🚀 Roadmap a step verificabili

**Step 1 — Mappa base** ⏳ : Leaflet + image overlay, pan/zoom mobile.

**Step 2 — Calibrazione GPS**: tool `tools/calibrate.html` → `calibration.json`. *Richiede punti GPS utente.*

**Step 3 — Editor grafo strade**: tool `tools/graph-editor.html` → `roads-graph.json`. *Richiede 2-3 ore lavoro utente.*

**Step 4 — Estrazione piazzole**: OCR Python su mappa hi-res, verifica visuale, associazione a entry-node. Output `pitches.json`.

**Step 5 — Catalogo POI/servizi**: definizione manuale (~30) con entry-node. Output `services.json`.

**Step 6 — Algoritmo routing**: `js/routing.js` con Dijkstra. Test unitari su percorso noto.

**Step 7 — Visualizzazione percorso**: linea blu su mappa, marker partenza/arrivo, card distanza+tempo. ⭐ **MVP v1 finisce qui**.

**Step 8 — Turn-by-turn**: `js/navigation.js`, istruzioni testuali italiano.

**Step 9 — GPS live + snap-to-road**: posizione che si aggiorna, snapped al grafo.

**Step 10 — Voice navigation**: Web Speech API italiano.

**Step 11 — UI Google-Maps-like**: search bar, card destinazione, modalità "navigazione attiva" fullscreen, centra-su-di-me, termina-navigazione.

**Step 12 — PWA**: manifest, service worker, installabile, offline-first.

**Step 13 — Test sul campo**: sessione in bici nel villaggio.

## 🎯 Strategia di rilascio incrementale

- **MVP v1** (Step 1-7): mappa + ricerca + percorso visivo + ETA. Già usabile.
- **v1.5** (Step 8-9): turn-by-turn testuale + GPS live.
- **v2** (Step 10-12): voice + UI completa + PWA.

## 📋 Convenzioni

- **Lingua**: italiano UI e istruzioni, inglese codice
- **Mobile-first**: testato su iPhone/Android prima di considerare done
- **No CDN in produzione**: tutto bundled per offline
- **No analytics, no tracker, no API a pagamento**
- **Privacy**: GPS resta sul device, mai inviato
- **Commit Git frequenti** con messaggi italiani

## ⚠️ Cose da NON fare

- Niente framework pesanti (React/Vue/Angular)
- Niente Google Maps API
- Niente backend
- Non ricalcolare percorso ad ogni update GPS (solo se devi >20m dal percorso)

## 🧪 Come testare

```bash
python3 -m http.server 8000

# Mobile su stessa WiFi: usa IP locale
# Da remoto con HTTPS: ngrok http 8000
```

## 📝 Decisioni prese

- **2026-04-28**: Stack confermato — Leaflet + JS vanilla, no framework
- **2026-04-28**: Routing con Dijkstra custom (no Leaflet Routing Machine)
- **2026-04-28**: Grafo strade manuale via tool dedicato
- **2026-04-28**: Velocità bici stimata 12 km/h per ETA
- **2026-04-28**: Snap-to-road raggio 15m
- **2026-04-28**: Ricalcolo percorso solo se deviazione >20m
- **2026-04-28**: MVP v1 si ferma allo Step 7 (rilascio rapido)

## 🔄 Manutenzione di questo file

A fine sessione Claude Code DEVE:
1. Aggiornare ✅ sugli step completati
2. Aggiungere decisioni nuove in "Decisioni prese"
3. Compattare se >300 righe
4. Mai cancellare contesto critico senza riassumerlo
