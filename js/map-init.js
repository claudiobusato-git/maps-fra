/* ============================================================
   map-init.js — Setup Leaflet + image overlay del villaggio
   ============================================================
   Usiamo L.CRS.Simple perché la mappa è una immagine raster:
   le coordinate sono pixel (y, x), non lat/lng. La conversione
   pixel ↔ GPS sarà gestita dallo Step 2 (geo-transform.js).
   ============================================================ */

(function (global) {
    'use strict';

    // Dimensioni reali di assets/map.jpg
    const MAP_IMAGE = {
        url: 'assets/map.jpg',
        width: 4000,
        height: 2693
    };

    /**
     * Inizializza la mappa Leaflet con la planimetria come image overlay.
     * @param {string} containerId  id del div contenitore
     * @returns {L.Map}
     */
    function initMap(containerId) {
        // Bounds in coordinate pixel: [[y_min, x_min], [y_max, x_max]]
        // Con CRS.Simple Leaflet tratta y come "lat" e x come "lng".
        const bounds = [
            [0, 0],
            [MAP_IMAGE.height, MAP_IMAGE.width]
        ];

        const map = L.map(containerId, {
            crs: L.CRS.Simple,
            minZoom: -3,        // permette di vedere tutta la mappa su mobile
            maxZoom: 2,         // zoom-in fino a vedere i numeri delle piazzole
            zoomSnap: 0.25,     // zoom fluido (utile per fitBounds)
            zoomDelta: 0.5,
            wheelPxPerZoomLevel: 120,
            zoomControl: true,
            attributionControl: false,
            maxBoundsViscosity: 0.85, // "rimbalza" ai bordi invece di bloccarsi
            maxBounds: [
                [-MAP_IMAGE.height * 0.2, -MAP_IMAGE.width * 0.2],
                [MAP_IMAGE.height * 1.2, MAP_IMAGE.width * 1.2]
            ]
        });

        L.imageOverlay(MAP_IMAGE.url, bounds, {
            alt: 'Planimetria Villaggio San Francesco',
            interactive: false
        }).addTo(map);

        // Mostra l'intera mappa al primo caricamento
        map.fitBounds(bounds, { padding: [10, 10] });

        // Esponi info utili per debug
        map.MAP_IMAGE = MAP_IMAGE;
        map.MAP_BOUNDS = bounds;

        return map;
    }

    global.MapInit = { initMap, MAP_IMAGE };
})(window);
