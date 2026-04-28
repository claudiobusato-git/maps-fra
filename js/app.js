/* ============================================================
   app.js — Entry point dell'applicazione
   ============================================================ */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const map = window.MapInit.initMap('map');

        // Esposto a window per ispezione da DevTools durante lo sviluppo
        window.__map = map;

        // Log diagnostico: utile in mobile DevTools
        console.log('[app] Mappa inizializzata',
            window.MapInit.MAP_IMAGE.width + 'x' + window.MapInit.MAP_IMAGE.height + 'px');
    });
})();
