// ==UserScript==
// @name         Steamgifts-sheet-fetcher
// @namespace    https://github.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher
// @version      1.0.7
// @description  Fetch games from Google Sheet via App Script
// @author       YiFanChen99
// @match        *://www.steamgifts.com/giveaways/search*
// @grant        GM_xmlhttpRequest
// @icon         https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/favicon.ico
// @downloadURL  https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/Script.user.js
// @updateURL    https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/Script.meta.js
// ==/UserScript==

'use strict';

const updateDurationMs = 24 * 60 * 60 * 1000; // 24 hours
const webAppUrl = 'https://script.google.com/macros/s/AKfycbwZWh1RFJmNCUaaVQyEzMXZRPDF8NlXtPwxyqKp_Wx2uiNqjnoh_yO7k334QdeNRyQR/exec';

async function fetchData() {
    console.log('單機遊戲 Sheets: fetchData starting ...');
    return new Promise(resolve => {
        GM_xmlhttpRequest({
            method: "GET",
            url: webAppUrl,
            onload: function(response) {
                const resp = JSON.parse(response.responseText);
                const data = { ...resp, time: Date.now() }
                localStorage.setItem('ekkoGames', JSON.stringify(data));
                resolve(data);
            }
        });
    });
}

/**
 * @returns { time, games, labelMap }
 */
async function updateData() {
    const old = localStorage.getItem('ekkoGames');
    if (old) {
        const record = JSON.parse(old);
        const diffMs = Date.now() - record.time;
        if (diffMs > updateDurationMs) {
            return await fetchData();
        } else {
            return record;
        }
    } else {
        return await fetchData();
    }
}

const data = await updateData();
console.log('單機遊戲 Sheets: updated');


const headers = document.querySelectorAll('.giveaway__heading__name');
headers.forEach((header) => {
    const name = header.innerText.replace(/(\.{3})$/, '');
    let games = data.games.filter((game) => (game.B.includes(name)));

    if (!games.length) {
        return;
    }

    const exactMatches = games.filter(game => game.B === name);
    if (exactMatches.length) {
        games = exactMatches;
    }

    const want = games.map(game => (game.J)).join('/');
    const wantDisplay = `${/^\d/.test(want) ? 'W' : 'W-'}${want}`;

    const earliest = games.reduce((min, game) => {
        const date = new Date(game.G);
        return (!min || date < min) ? date : min;
    }, null);
    const year = String(earliest.getFullYear()).slice(-2);
    const month = String(earliest.getMonth() + 1).padStart(2, '0');
    const dateDisplay = `(U${year}/${month})`;

    // HACK: Use change innerText instead to insert a new node
    header.nextElementSibling.innerText += ` (${wantDisplay}) (${dateDisplay})`;
});
console.log('單機遊戲 Sheets: DOM modified');
