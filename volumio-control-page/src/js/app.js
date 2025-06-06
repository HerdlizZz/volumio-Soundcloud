const form = document.getElementById('songLinkForm'); // Opraveno z 'song-url-form'
const songUrlInput = document.getElementById('songUrl'); // Opraveno z 'song-url'

// Odstranit tuto řádku, jelikož není v HTML: const submitButton = document.getElementById('submit-button');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    const songUrl = songUrlInput.value;

    if (songUrl) {
        sendSongToVolumio(songUrl);
    } else {
        alert('Please enter a valid song URL.');
    }
});

function sendSongToVolumio(songUrl) {
    // Pro YouTube videa použijeme webradio přístup, který funguje
    if (songUrl.includes('youtube.com') || songUrl.includes('youtu.be') || songUrl.includes('music.youtube.com')) {
        // Použít webradio přístup, který už funguje
        webradioPlay(songUrl);
        return;
    }

    // Pro ostatní typy URL pokračujeme normálně
    let uri = songUrl;
    let serviceType = 'webradio';
    
    const volumioIp = '10.10.100.57';
    
    console.log(`Posílám na Volumio: uri=${uri}, service=${serviceType}`);

    fetch(`http://${volumioIp}/api/v1/addToQueue`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uri: uri,
            service: serviceType
        })
    })
    .then(response => {
        console.log('Status kód:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Odpověď serveru:', text);
                throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Obsah přidán do fronty');
        const responseElement = document.getElementById('responseMessage');
        responseElement.textContent = 'Obsah přidán do fronty! Spouštím...';
        responseElement.className = 'success';
        
        return fetch(`http://${volumioIp}/api/v1/commands/?cmd=play`, {
            method: 'GET'
        });
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Odpověď serveru (play):', text);
                throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from Volumio (play):', data);
        const responseElement = document.getElementById('responseMessage');
        responseElement.textContent = 'Obsah se přehrává!';
        responseElement.className = 'success';
    })
    .catch(error => {
        console.error('Error details:', error);
        const responseElement = document.getElementById('responseMessage');
        responseElement.textContent = `An error occurred: ${error.message}. Check console for details.`;
        responseElement.className = 'error';
    });
}

// Vylepšená webradio funkce pro YouTube
function webradioPlay(originalUrl) {
    const volumioIp = '10.10.100.57';
    
    return new Promise((resolve, reject) => {
        // Nejdříve vyčistit frontu
        fetch(`http://${volumioIp}/api/v1/commands/?cmd=clearQueue`, { method: 'GET' })
        .then(() => {
            // Přidat YouTube URL jako webradio stream
            return fetch(`http://${volumioIp}/api/v1/addToQueue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uri: originalUrl,
                    service: 'webradio',
                    title: 'YouTube Stream',
                    name: 'YouTube Video'
                })
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Webradio failed:', text);
                    throw new Error(`Webradio failed: ${response.status} - ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('YouTube přidán jako webradio stream');
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = 'YouTube video přidáno! Spouštím přehrávání...';
            responseElement.className = 'success';
            
            // Počkat chvíli před spuštěním
            return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
            // Spustit přehrávání
            return fetch(`http://${volumioIp}/api/v1/commands/?cmd=play`, {
                method: 'GET'
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Play command failed:', text);
                    throw new Error(`Play failed: ${response.status} - ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('YouTube video se přehrává přes webradio');
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = 'YouTube video se přehrává!';
            responseElement.className = 'success';
            resolve(data);
        })
        .catch(error => {
            console.error('Webradio play error:', error);
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = `Chyba při přehrávání: ${error.message}`;
            responseElement.className = 'error';
            reject(error);
        });
    });
}

// Nová funkce pro zkoušení více přístupů
function tryMultipleApproaches(videoId, originalUrl, isYouTubeMusic) {
    const volumioIp = '10.10.100.57';
    
    // Definujeme různé kombinace, které zkusíme
    const approaches = [
        // Přístup 1: Použít search API pro přidání do fronty
        () => searchAndPlay(videoId),
        // Přístup 2: Přímé přehrání přes exploreUri
        () => directPlay(videoId),
        // Přístup 3: Použití webradio s původní URL
        () => webradioPlay(originalUrl),
        // Přístup 4: Různé formáty s různými pluginy
        () => standardPluginPlay(videoId, 'youtube'),
        () => standardPluginPlay(videoId, 'youtube2'),
        () => standardPluginPlay(`yt:${videoId}`, 'youtube'),
    ];
    
    let currentApproach = 0;
    
    function tryNext() {
        if (currentApproach >= approaches.length) {
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = 'Všechny přístupy selhaly. YouTube video nelze přehrát.';
            responseElement.className = 'error';
            return;
        }
        
        console.log(`Zkouším přístup ${currentApproach + 1}/${approaches.length}`);
        const responseElement = document.getElementById('responseMessage');
        responseElement.textContent = `Zkouším přístup ${currentApproach + 1}/${approaches.length} pro přehrání YouTube...`;
        responseElement.className = 'info';
        
        approaches[currentApproach]()
            .then(() => {
                console.log(`Přístup ${currentApproach + 1} byl úspěšný!`);
                responseElement.textContent = `YouTube video se přehrává! (přístup ${currentApproach + 1})`;
                responseElement.className = 'success';
            })
            .catch(error => {
                console.log(`Přístup ${currentApproach + 1} selhal:`, error);
                currentApproach++;
                setTimeout(tryNext, 1000); // Počkat sekundu a zkusit další přístup
            });
    }
    
    tryNext();
}

// Přístup 1: Použití search API
function searchAndPlay(videoId) {
    const volumioIp = '10.10.100.57';
    
    return fetch(`http://${volumioIp}/api/v1/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            value: videoId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Search result:', data);
        if (data && data.length > 0) {
            // Přehrát první výsledek
            return fetch(`http://${volumioIp}/api/v1/commands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: 'playItemByUri',
                    uri: data[0].uri
                })
            });
        } else {
            throw new Error('No search results found');
        }
    });
}

// Přístup 2: Přímé přehrání
function directPlay(videoId) {
    const volumioIp = '10.10.100.57';
    
    return fetch(`http://${volumioIp}/api/v1/exploreUri`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uri: videoId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Explore URI failed: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Explore result:', data);
        return fetch(`http://${volumioIp}/api/v1/commands/?cmd=play`, {
            method: 'GET'
        });
    });
}

// Přístup 3: Webradio s původní URL
function webradioPlay(originalUrl) {
    const volumioIp = '10.10.100.57';
    
    return new Promise((resolve, reject) => {
        // Nejdříve vyčistit frontu
        fetch(`http://${volumioIp}/api/v1/commands/?cmd=clearQueue`, { method: 'GET' })
        .then(() => {
            // Přidat YouTube URL jako webradio stream
            return fetch(`http://${volumioIp}/api/v1/addToQueue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uri: originalUrl,
                    service: 'webradio',
                    title: 'YouTube Stream',
                    name: 'YouTube Video'
                })
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Webradio failed:', text);
                    throw new Error(`Webradio failed: ${response.status} - ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('YouTube přidán jako webradio stream');
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = 'YouTube video přidáno! Spouštím přehrávání...';
            responseElement.className = 'success';
            
            // Počkat chvíli před spuštěním
            return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
            // Spustit přehrávání
            return fetch(`http://${volumioIp}/api/v1/commands/?cmd=play`, {
                method: 'GET'
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Play command failed:', text);
                    throw new Error(`Play failed: ${response.status} - ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('YouTube video se přehrává přes webradio');
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = 'YouTube video se přehrává!';
            responseElement.className = 'success';
            resolve(data);
        })
        .catch(error => {
            console.error('Webradio play error:', error);
            const responseElement = document.getElementById('responseMessage');
            responseElement.textContent = `Chyba při přehrávání: ${error.message}`;
            responseElement.className = 'error';
            reject(error);
        });
    });
}

// Přístup 4: Standardní plugin
function standardPluginPlay(uri, service) {
    const volumioIp = '10.10.100.57';
    
    return fetch(`http://${volumioIp}/api/v1/addToQueue`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uri: uri,
            service: service
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Plugin ${service} failed: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        return fetch(`http://${volumioIp}/api/v1/commands/?cmd=play`, {
            method: 'GET'
        });
    });
}

// Pomocná funkce pro extrakci ID videa z YouTube URL
function extractYoutubeVideoId(url) {
    let videoId = null;
    
    // Pro URL ve formátu youtu.be/XXXXXX
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
        if (videoId.includes('?')) {
            videoId = videoId.split('?')[0];
        }
    } 
    // Pro URL ve formátu youtube.com/watch?v=XXXXXX
    else if (url.includes('youtube.com/watch')) {
        try {
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v');
        } catch (error) {
            console.error("Chyba při parsování URL:", error);
            
            // Záložní řešení pomocí regex
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = url.match(regExp);
            videoId = (match && match[7].length === 11) ? match[7] : null;
        }
    }
    
    return videoId;
}

// Přidat na začátek souboru pro testování spojení
document.addEventListener('DOMContentLoaded', function() {
    const volumioIp = '10.10.100.57'; // Správná IP adresa zjištěná pomocí ping
    
    // Test připojení
    fetch(`http://${volumioIp}/api/v1/getState`)
        .then(response => response.json())
        .then(data => {
            console.log('Spojení s Volumio je funkční:', data);
            const testDiv = document.createElement('div');
            testDiv.textContent = 'Spojení s Volumio navázáno!';
            testDiv.style.color = 'green';
            document.body.insertBefore(testDiv, document.querySelector('.container'));
        })
        .catch(error => {
            console.error('Chyba spojení s Volumio:', error);
            const testDiv = document.createElement('div');
            testDiv.textContent = 'Nelze se připojit k Volumio! Zkontrolujte IP adresu.';
            testDiv.style.color = 'red';
            document.body.insertBefore(testDiv, document.querySelector('.container'));
        });
});

// Na konci souboru app.js
function testYoutubeFormats() {
    const volumioIp = '10.10.100.57';
    const videoId = 'dQw4w9WgXcQ'; // Testovací video
    
    // Rozšířené pole formátů k otestování
    const formats = [
        { uri: videoId, service: 'youtube' },
        { uri: videoId, service: 'youtube2' },
        { uri: `yt:${videoId}`, service: 'youtube' },
        { uri: `youtube:${videoId}`, service: 'youtube' },
        { uri: `youtube:audio:${videoId}`, service: 'youtube' },
        { uri: `https://www.youtube.com/watch?v=${videoId}`, service: 'youtube' },
        { uri: `https://www.youtube.com/watch?v=${videoId}`, service: 'youtube2' },
        { uri: videoId, service: 'mpd' },
        { uri: `youtube:${videoId}`, service: 'mpd' }
    ];
    
    // Vytvoříme div pro zobrazení výsledků
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'format-test-results';
    resultsDiv.style.margin = '10px';
    resultsDiv.style.padding = '10px';
    resultsDiv.style.border = '1px solid #ccc';
    resultsDiv.innerHTML = '<h3>Testování YouTube formátů</h3><ul id="format-results"></ul>';
    document.body.appendChild(resultsDiv);
    
    const resultsList = document.getElementById('format-results');
    
    // Testovat postupně jeden formát za druhým
    function testFormat(index) {
        if (index >= formats.length) {
            resultsList.innerHTML += '<li><strong>Všechny formáty otestovány.</strong></li>';
            return;
        }
        
        const format = formats[index];
        
        // Přidat informace o aktuálním testu
        const listItem = document.createElement('li');
        listItem.innerHTML = `Testování formátu ${index+1}/${formats.length}: uri = <code>${format.uri}</code>, service = <code>${format.service}</code>...`;
        resultsList.appendChild(listItem);
        
        // Vymazat frontu před dalším testem
        fetch(`http://${volumioIp}/api/v1/commands/?cmd=clearQueue`, { method: 'GET' })
        .then(() => {
            // Přidat do fronty testovaný formát
            return fetch(`http://${volumioIp}/api/v1/addToQueue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uri: format.uri,
                    service: format.service
                })
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    listItem.innerHTML += ` <span style="color: red">❌ Chyba: ${text}</span>`;
                    throw new Error(`Formát ${index+1} selhal: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            listItem.innerHTML += ` <span style="color: green">✅ Funguje!</span>`;
            console.log(`Formát ${index+1} fungoval! Odpověď:`, data);
            
            // Počkat chvíli a zkusit další formát
            setTimeout(() => testFormat(index + 1), 2000);
        })
        .catch(error => {
            console.error(error);
            // Zkusit další formát po určitém zpoždění
            setTimeout(() => testFormat(index + 1), 2000);
        });
    }
    
    // Začít testovat formáty
    testFormat(0);
}

// Přidat tlačítko pro spuštění testování formátů
document.addEventListener('DOMContentLoaded', function() {
    const testButton = document.createElement('button');
    testButton.textContent = 'Testovat YouTube formáty';
    testButton.style.margin = '10px';
    testButton.onclick = testYoutubeFormats;
    document.body.appendChild(testButton);
});

function restartYoutubePlugin() {
    const volumioIp = '10.10.100.57';
    
    fetch(`http://${volumioIp}/api/v1/commands`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            command: 'restartPlugin',
            plugin: 'youtube'
        })
    })
    .then(response => {
        console.log('YouTube plugin se restartuje...');
    })
    .catch(error => {
        console.error('Chyba při restartu pluginu:', error);
    });
}













