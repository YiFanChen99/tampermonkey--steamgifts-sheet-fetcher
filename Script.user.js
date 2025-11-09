// ==UserScript==
// @name         Steamgifts-sheet-fetcher
// @namespace    https://github.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher
// @version      1.2.1
// @description  Fetch games from Google Sheet via App Script
// @author       YiFanChen99
// @match        *://www.steamgifts.com/giveaways/search*
// @match        *://www.steamgifts.com/giveaway/*
// @grant        GM_xmlhttpRequest
// @icon         https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/favicon.ico
// @downloadURL  https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/Script.user.js
// @updateURL    https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/Script.meta.js
// @require      https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/src/dataFetcher.js
// @require      https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-sheet-fetcher/main/src/headerModifier.js
// ==/UserScript==

'use strict';

const sheetData = await getOrFetchData();
console.log('單機遊戲 Sheets: updated');

if (window.location.pathname.startsWith('/giveaways/search')) {
    const count = modifyPageGiveaways();
    console.log(`單機遊戲 Sheets: \`giveaways\` ${count} DOM modified`);
} else if (window.location.pathname.startsWith('/giveaway/')) {
    const done = modifyPageGiveaway();
    console.log(`單機遊戲 Sheets: \`giveaway\` ${done ? 'DOM modified' : 'No modification applied.'}`);
} else {
    console.log('單機遊戲 Sheets: No modification applied.');
}
