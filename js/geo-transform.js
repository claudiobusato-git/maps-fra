/* ============================================================
   geo-transform.js — Trasformazione affine pixel ↔ GPS
   ============================================================
   Modello affine a 6 parametri:
     lat = a*px + b*py + c
     lng = d*px + e*py + f

   Si risolve come due sistemi 3-parametrici indipendenti
   (uno per lat, uno per lng) ai minimi quadrati con N≥3 punti.
   Con 4+ punti distribuiti agli angoli + centro l'errore atteso
   è < 2m (vedi CLAUDE.md).
   ============================================================ */

(function (global) {
    'use strict';

    /* ---------- Algebra lineare (3x3) ---------- */

    // Risolve A*x = b dove A è 3x3, b è vettore di 3 elementi.
    // Usa eliminazione di Gauss con pivot parziale. Lancia se singolare.
    function solve3x3(A, b) {
        // Copia per non mutare l'input
        const M = [
            [A[0][0], A[0][1], A[0][2], b[0]],
            [A[1][0], A[1][1], A[1][2], b[1]],
            [A[2][0], A[2][1], A[2][2], b[2]]
        ];

        for (let i = 0; i < 3; i++) {
            // Pivot parziale: trova la riga con |M[k][i]| massimo
            let maxRow = i;
            for (let k = i + 1; k < 3; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
            }
            if (maxRow !== i) {
                const tmp = M[i]; M[i] = M[maxRow]; M[maxRow] = tmp;
            }
            if (Math.abs(M[i][i]) < 1e-12) {
                throw new Error('Sistema singolare: punti collineari?');
            }
            // Eliminazione
            for (let k = i + 1; k < 3; k++) {
                const factor = M[k][i] / M[i][i];
                for (let j = i; j < 4; j++) M[k][j] -= factor * M[i][j];
            }
        }
        // Back-substitution
        const x = [0, 0, 0];
        for (let i = 2; i >= 0; i--) {
            let sum = M[i][3];
            for (let j = i + 1; j < 3; j++) sum -= M[i][j] * x[j];
            x[i] = sum / M[i][i];
        }
        return x;
    }

    /* ---------- Calcolo dei coefficienti affini ---------- */

    /**
     * Calcola la trasformazione affine pixel → GPS dai punti di calibrazione.
     * @param {Array<{px:number,py:number,lat:number,lng:number}>} points - min 3
     * @returns {{a:number,b:number,c:number,d:number,e:number,f:number,
     *           inverse:{a:number,b:number,c:number,d:number,e:number,f:number}}}
     */
    function solveAffine(points) {
        if (!Array.isArray(points) || points.length < 3) {
            throw new Error('Servono almeno 3 punti di calibrazione');
        }

        // Normal equations: per ciascuno di lat e lng risolviamo
        // (A^T A) x = A^T y, dove ogni riga di A è [px, py, 1].
        const ATA = [[0,0,0],[0,0,0],[0,0,0]];
        const ATlat = [0, 0, 0];
        const ATlng = [0, 0, 0];

        for (const p of points) {
            const row = [p.px, p.py, 1];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) ATA[i][j] += row[i] * row[j];
                ATlat[i] += row[i] * p.lat;
                ATlng[i] += row[i] * p.lng;
            }
        }

        const [a, b, c] = solve3x3(ATA, ATlat);
        const [d, e, f] = solve3x3(ATA, ATlng);

        // Inversa affine: GPS → pixel.
        // Dalla matrice [[a,b],[d,e]] otteniamo l'inversa 2x2 e i nuovi termini noti.
        const det = a * e - b * d;
        if (Math.abs(det) < 1e-18) {
            throw new Error('Trasformazione affine non invertibile');
        }
        const ia =  e / det;
        const ib = -b / det;
        const id = -d / det;
        const ie =  a / det;
        const ic = -(ia * c + ib * f);
        const ifc = -(id * c + ie * f);

        return {
            a, b, c, d, e, f,
            inverse: { a: ia, b: ib, c: ic, d: id, e: ie, f: ifc }
        };
    }

    /* ---------- Conversioni ---------- */

    function pixelToGps(transform, px, py) {
        return {
            lat: transform.a * px + transform.b * py + transform.c,
            lng: transform.d * px + transform.e * py + transform.f
        };
    }

    function gpsToPixel(transform, lat, lng) {
        const inv = transform.inverse;
        return {
            px: inv.a * lat + inv.b * lng + inv.c,
            py: inv.d * lat + inv.e * lng + inv.f
        };
    }

    /* ---------- Distanze e residui ---------- */

    // Distanza ellissoidale approssimata (formula equirettangolare).
    // Sufficientemente precisa per pochi km.
    function haversineMeters(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const toRad = Math.PI / 180;
        const dLat = (lat2 - lat1) * toRad;
        const dLng = (lng2 - lng1) * toRad;
        const a = Math.sin(dLat/2) ** 2 +
                  Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
                  Math.sin(dLng/2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    /**
     * Per ogni punto, errore tra GPS osservato e GPS predetto dal modello.
     * @returns {{perPoint:Array<number>, rmse:number, max:number}}
     */
    function computeResiduals(transform, points) {
        const errors = points.map(p => {
            const pred = pixelToGps(transform, p.px, p.py);
            return haversineMeters(p.lat, p.lng, pred.lat, pred.lng);
        });
        const sumSq = errors.reduce((s, e) => s + e * e, 0);
        const rmse = Math.sqrt(sumSq / errors.length);
        const max = errors.reduce((m, e) => Math.max(m, e), 0);
        return { perPoint: errors, rmse, max };
    }

    /* ---------- Caricamento da file ---------- */

    /**
     * Carica calibration.json e restituisce un transform pronto all'uso.
     * @param {string} url
     * @returns {Promise<object>}
     */
    async function loadCalibration(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Impossibile caricare ' + url);
        const data = await res.json();
        if (!data.points || data.points.length < 3) {
            throw new Error('calibration.json incompleto: servono ≥3 punti');
        }
        return solveAffine(data.points);
    }

    global.GeoTransform = {
        solveAffine,
        pixelToGps,
        gpsToPixel,
        computeResiduals,
        haversineMeters,
        loadCalibration
    };
})(window);
