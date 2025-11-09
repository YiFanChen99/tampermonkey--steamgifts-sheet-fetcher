
const updateDurationMs = 24 * 60 * 60 * 1000; // 24 hours
const webAppUrl = 'https://script.google.com/macros/s/AKfycbwZWh1RFJmNCUaaVQyEzMXZRPDF8NlXtPwxyqKp_Wx2uiNqjnoh_yO7k334QdeNRyQR/exec';

async function fetchData() {
    console.log('Steamgifts-helper: fetchData starting ...');
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
async function getOrFetchData() {
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
