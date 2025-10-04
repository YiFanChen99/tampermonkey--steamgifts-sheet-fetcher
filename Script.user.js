// ==UserScript==
// @name         Steamgifts-sheet-fetcher
// @namespace    https://github.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher
// @version      1.0.1
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
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwZWh1RFJmNCUaaVQyEzMXZRPDF8NlXtPwxyqKp_Wx2uiNqjnoh_yO7k334QdeNRyQR/exec';

async function fetchData() {
    console.log('單機遊戲 Sheets: fetchData start');
    return new Promise(resolve => {
        GM_xmlhttpRequest({
            method: "GET",
            url: WEB_APP_URL,
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
    const wants = data.games
        .filter((game) => (game.B.includes(name)))
        .map((game) => { console.log('sub matched:', game); return game.N; })
    if (wants.length) {
        const text = wants.length === 1 ? `${wants[0]}` : `[${wants.join('/')}]`;
        header.nextElementSibling.innerText += ` (exp ${text})`;
    }
});
console.log('單機遊戲 Sheets: DOM modified');
