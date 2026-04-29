/* ============================================================
   graph.js — Caricamento + struttura del grafo strade
   ============================================================
   Formato roads-graph.json:
   {
     "generated": "...",
     "mapImage": { "width": 4000, "height": 2693 },
     "nodes": [ { "id": "n1", "px": 1234.5, "py": 567.8 }, ... ],
     "edges": [
       { "id": "e1", "from": "n1", "to": "n2",
         "name": "Via dei Tigli", "length_px": 234.5 }, ...
     ]
   }
   Usato da routing.js (Step 6) per Dijkstra e da snap-to-road.js
   (Step 9) per la proiezione GPS sul segmento più vicino.
   ============================================================ */

(function (global) {
    'use strict';

    /**
     * Carica il grafo da JSON e costruisce strutture indicizzate.
     * @param {string} url
     * @returns {Promise<{
     *   nodes: Map<string, {id,px,py}>,
     *   edges: Map<string, {id,from,to,name,length_px}>,
     *   adjacency: Map<string, Array<{edgeId,to}>>
     * }>}
     */
    async function load(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Impossibile caricare ' + url);
        const data = await res.json();
        return build(data);
    }

    function build(data) {
        const nodes = new Map();
        for (const n of (data.nodes || [])) nodes.set(n.id, n);

        const edges = new Map();
        const adjacency = new Map();
        for (const id of nodes.keys()) adjacency.set(id, []);

        for (const e of (data.edges || [])) {
            if (!nodes.has(e.from) || !nodes.has(e.to)) {
                console.warn('Edge con nodo mancante, ignoro:', e);
                continue;
            }
            edges.set(e.id, e);
            adjacency.get(e.from).push({ edgeId: e.id, to: e.to });
            // Bidirezionale (le strade interne sono percorribili in entrambi i versi)
            adjacency.get(e.to).push({ edgeId: e.id, to: e.from });
        }

        return { nodes, edges, adjacency, mapImage: data.mapImage };
    }

    /** Distanza euclidea in pixel tra due nodi. */
    function pixelDistance(a, b) {
        return Math.hypot(a.px - b.px, a.py - b.py);
    }

    /**
     * Trova il nodo più vicino a una posizione pixel (o GPS, se passi geoTransform).
     * Lineare O(N): sufficiente per ~200 nodi.
     */
    function nearestNode(graph, target) {
        let best = null, bestD = Infinity;
        for (const n of graph.nodes.values()) {
            const d = Math.hypot(n.px - target.px, n.py - target.py);
            if (d < bestD) { bestD = d; best = n; }
        }
        return { node: best, distance: bestD };
    }

    global.Graph = { load, build, pixelDistance, nearestNode };
})(window);
