
/**
 * Format data from Google Sheet to display text.
 */
class HeaderDisplayFormatter {
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

class HeaderModifier {
    constructor(sheetData) {
        this.sheetData = sheetData;
    }

    /**
     * @public
     * @returns {number} Count of modified giveaways
     */
    modifyGiveaways() {
        const headers = document.querySelectorAll('.giveaway__heading__name');
        // next should be .giveaway__heading__thin
        let count = 0;
        headers.forEach((header) => {
            if (this.modify(header)) {
                count += 1;
            }
        });
        return count;
    }

    /**
     * @public
     * @returns {boolean} Whether the giveaway was modified
     */
    modifyGiveaway() {
        const header = document.querySelector('.featured__heading__medium');
        // next should be .featured__heading__small
        return this.modify(header);
    }

    /**
     * @private
     * @param {HTMLElement} headerElement
     * @returns {boolean} Whether modified successfully
     */
    modify(headerElement) {
        if (!headerElement) return false;

        const name = headerElement.innerText.replace(/(\.{3})$/, '');
        let games = this.sheetData.games.filter((game) => (game.B.includes(name)));

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

        const want = HeaderDisplayFormatter.toWant(games);
        const year = HeaderDisplayFormatter.toUpdateYear(games);
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


class RegionModifier {
    constructor(sheetData) {
        this.sheetData = sheetData;
    }

    /**
     * @public
     * @returns {number} Count of modified giveaways
     */
    async modifyGiveaways() {
        const regions = document.querySelectorAll('.giveaway__column--region-restricted');
        let count = 0;
        for (const region of regions) {
            if (await this.modify(region)) {
                count += 1;
            }
        }
        return count;
    }

    /**
     * @public
     * @returns {boolean} Whether the giveaway was modified
     */
    async modifyGiveaway() {
        const region = document.querySelector('.featured__column--region-restricted');
        return await this.modify(region);
    }

    /**
     * TODO
     * @private
     * @param {HTMLElement} regionElement form `<a href="/giveaway/xxxxx/griftlands/region-restrictions">`
     * @returns {boolean} Whether modified successfully
     */
    async modify(regionElement) {
        if (!regionElement || !regionElement.href) {
            return false;
        }

        const targetUrl = regionElement.href;
        const targetSelector = '.table__row-outer-wrap';
        
        const counts = await new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: targetUrl,
                onload: function(response) {
                    if (response.status !== 200) {
                        return resolve(new Error(`Failed to fetch ${targetUrl}: ${response.status}`));
                    }

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const elements = doc.querySelectorAll(targetSelector);
                    resolve(elements.length);
                },
                onerror: function(error) {
                    return resolve(new Error(`Failed to fetch ${targetUrl}: ${error.message}`));
                }
            });
        });

        if (counts instanceof Error) {
            console.error(counts);
            return false;
        }

        regionElement.appendChild(document.createTextNode(`${counts}`));
        return true;
    }
}
