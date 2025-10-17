// ==UserScript==
// @name         Steamgifts-sheet-fetcher
// @namespace    https://github.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher
// @version      1.1.5
// @description  Fetch games from Google Sheet via App Script
// @author       YiFanChen99
// @match        *://www.steamgifts.com/giveaways/search*
// @match        *://www.steamgifts.com/giveaway/*
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


/**
 * Format data from Google Sheet to display text.
 */
class DisplayFormatter {
    static currentYear = new Date().getFullYear();

    static toWant(games) {
        const want = games.map(game => (game.K)).join('/');
        return `${/^(\d|$)/.test(want) ? 'W' : 'W-'}${want}`;
    };
    /**
     * @returns /Y\d{2}/ | ''
     */
    static toUpdateYear(games) {
        const earliest = games.reduce((min, game) => {
            const date = new Date(game.G);
            return (!min || date < min) ? date : min;
        }, null);
        const year = earliest.getFullYear();
        return year < (this.currentYear - 3) ? `Y${String(year).slice(2)}` : '';
    };
}


/**
 * @returns {void}
 */
function modifyDom() {
    if (window.location.pathname.startsWith('/giveaways/search')) {
        const count = modifyPageGiveaways();
        console.log(`單機遊戲 Sheets: \`giveaways\` ${count} DOM modified`);
    } else if (window.location.pathname.startsWith('/giveaway/')) {
        const done = modifyPageGiveaway();
        console.log(`單機遊戲 Sheets: \`giveaway\` ${done ? 'DOM modified' : 'No modification applied.'}`);
    } else {
        console.log('單機遊戲 Sheets: No modification applied.');
    }
}

/**
 * @returns {number} Count of modified giveaways
 */
function modifyPageGiveaways() {
    let count = 0;

    const headers = document.querySelectorAll('.giveaway__heading__name');
    headers.forEach((header) => {
        const name = header.innerText.replace(/(\.{3})$/, '');
        let games = data.games.filter((game) => (game.B.includes(name)));

        if (!games.length) {
            return;
        }

        const exactMatches = games.filter(game => {
            if (game.B === name) { return true; }
            return game.B.split('/').some(part => {
                return part.trim() === name;
            });
        });
        if (exactMatches.length) {
            games = exactMatches;
        }

        const want = DisplayFormatter.toWant(games);
        const year = DisplayFormatter.toUpdateYear(games);
        const yearMaybe = year ? ` (${year})` : '';

        const pointElement = header.nextElementSibling; // .giveaway__heading__thin
        // HACK: Use change innerText instead to insert a new node
        pointElement.innerText += ` (${want})${yearMaybe}`;

        count += 1;
    });

    return count;
}

/**
 * TODO: share logic with modifyPageGiveaways
 * @returns {boolean} Whether the giveaway was modified
 */
function modifyPageGiveaway() {
    const header = document.querySelector('.featured__heading__medium');
    if (!header) return false;

    const name = header.innerText.replace(/(\.{3})$/, '');
    let games = data.games.filter((game) => (game.B.includes(name)));

    if (!games.length) {
        return false;
    }

    const exactMatches = games.filter(game => {
        if (game.B === name) { return true; }
        return game.B.split('/').some(part => {
            return part.trim() === name;
        });
    });
    if (exactMatches.length) {
        games = exactMatches;
    }

    const want = DisplayFormatter.toWant(games);
    const year = DisplayFormatter.toUpdateYear(games);
    const yearMaybe = year ? ` (${year})` : '';

    const pointElement = header.nextElementSibling; // .featured__heading__small
    // HACK: Use change innerText instead to insert a new node
    pointElement.innerText += ` (${want})${yearMaybe}`;

    return true;
}

modifyDom();
