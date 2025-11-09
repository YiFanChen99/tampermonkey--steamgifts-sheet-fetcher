// ==UserScript==
// @name         Steamgifts-helper
// @namespace    https://github.com/YiFanChen99/tampermonkey--steamgifts-helper
// @version      1.2.2
// @description  Fetch games from Google Sheet via App Script
// @author       YiFanChen99
// @match        *://www.steamgifts.com/giveaways/search*
// @match        *://www.steamgifts.com/giveaway/*
// @grant        GM_xmlhttpRequest
// @icon         https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-helper/main/favicon.ico
// @downloadURL  https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-helper/main/Script.user.js
// @updateURL    https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-helper/main/Script.meta.js
// @require      https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-helper/main/src/dataFetcher.js
// @require      https://raw.githubusercontent.com/YiFanChen99/tampermonkey--steamgifts-helper/main/src/headerModifier.js
// ==/UserScript==

'use strict';

const sheetData = await getOrFetchData();
console.log('Steamgifts-helper: updated');

if (window.location.pathname.startsWith('/giveaways/search')) {
    const count = modifyPageGiveaways();
    console.log(`Steamgifts-helper: \`giveaways\` ${count} DOM modified`);
} else if (window.location.pathname.startsWith('/giveaway/')) {
    const done = modifyPageGiveaway();
    console.log(`Steamgifts-helper: \`giveaway\` ${done ? 'DOM modified' : 'No modification applied.'}`);
} else {
    console.log(`Steamgifts-helper: No modification applied.`);
}
