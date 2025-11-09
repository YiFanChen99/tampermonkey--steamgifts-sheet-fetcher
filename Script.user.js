// ==UserScript==
// @name         Steamgifts-sheet-fetcher
// @namespace    https://github.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher
// @version      1.2.0a1
// @description  Fetch games from Google Sheet via App Script
// @author       YiFanChen99
// @match        *://www.steamgifts.com/giveaways/search*
// @match        *://www.steamgifts.com/giveaway/*
// @grant        GM_xmlhttpRequest
// @icon         https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/favicon.ico
// @downloadURL  https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/Script.user.js
// @updateURL    https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/Script.meta.js
// @require      https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/src/dataFetcher.js
// ==/UserScript==

'use strict';

const sheetData = await getOrFetchData();
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
            if (!game.G) {
                return min;
            }
            const date = new Date(game.G);
            return (!min || date < min) ? date : min;
        }, null);
        if (!earliest) {
            return 'Y-';
        }
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


class DomModifier {
    /**
     * @param {HTMLElement} headerElement
     * @returns {boolean} Whether modified successfully
     */
    static modify(headerElement) {
        if (!headerElement) return false;

        const name = headerElement.innerText.replace(/(\.{3})$/, '');
        let games = sheetData.games.filter((game) => (game.B.includes(name)));

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

        const pointElement = headerElement.nextElementSibling;
        if (pointElement) {
            // HACK: Use change innerText instead to insert a new node
            pointElement.innerText += ` (${want})${yearMaybe}`;
            return true;
        }
        return false;
    }
}

/**
 * @returns {number} Count of modified giveaways
 */
function modifyPageGiveaways() {
    const headers = document.querySelectorAll('.giveaway__heading__name');
    // next should be .giveaway__heading__thin
    let count = 0;
    headers.forEach((header) => {
        if (DomModifier.modify(header)) {
            count += 1;
        }
    });
    return count;
}

/**
 * @returns {boolean} Whether the giveaway was modified
 */
function modifyPageGiveaway() {
    const header = document.querySelector('.featured__heading__medium');
    // next should be .featured__heading__small
    return DomModifier.modify(header);
}

modifyDom();
