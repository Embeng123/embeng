addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method !== 'POST') {
        return new Response('Metode tidak diperbolehkan', { status: 405 });
    }

    try {
        const data = await request.json();
        const chatId = data.callback_query ? data.callback_query.message.chat.id : data.message.chat.id;
        const userMessage = data.callback_query ? data.callback_query.data : data.message.text.trim();
        const TELEGRAM_API_URL = 'https://api.telegram.org/bot7982446530:AAEbaK5XCpHGE8k8S6v5ssQsetbAYEY-sU4';

        if (data.callback_query) {
            await handleCallbackQuery(data.callback_query, chatId, TELEGRAM_API_URL);
        } else {
            await handleUserMessage(userMessage, chatId, TELEGRAM_API_URL);
        }

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Terjadi kesalahan umum:', error);
        return new Response('Terjadi kesalahan dalam memproses permintaan', { status: 500 });
    }
}

// Fungsi untuk menangani callback query dari tombol inline
async function handleCallbackQuery(callbackQuery, chatId, TELEGRAM_API_URL) {
    const callbackQueryId = callbackQuery.id;
    const callbackData = callbackQuery.data;

    if (callbackData.startsWith('vless')) {
        const [_, ...ipPorts] = callbackData.split('|');
        let vlessConfigs = [];

        for (let ipPort of ipPorts) {
            const [ip, port = '443'] = ipPort.split(':');
            try {
                const response = await fetch(`https://ipcf.rmtq.fun/json/?ip=${ip}:${port}`);
                if (!response.ok) throw new Error('Gagal mengambil data ISP');

                const ipInfo = await response.json();
                const ISP = ipInfo.ISP ? ipInfo.ISP.replace(/, Inc\.|, Ltd\.| .*/g, '').trim() : 'UnknownISP';

                const vlessConfig = `Berhasil Membuat Vless untuk ${ISP}
\\\@embeng1                         
vless://Israel=Babi@embeng.us.kg:443?path=%2Fvl%3D${ip}%3A${port}&security=tls&encryption=none&host=embeng.us.kg&type=ws&sni=embeng.us.kg#${ISP}
\\\n`;
                vlessConfigs.push(vlessConfig);
            } catch (error) {
                console.error(`Gagal mengambil data ISP untuk ${ipPort}:`, error);
                await sendMessage(chatId, `${ipPort} ✘ Gagal mengambil data ISP ✘`, TELEGRAM_API_URL);
                return;
            }
        }

        const vlessMessage = vlessConfigs.join('');
        await sendMessage(chatId, vlessMessage, TELEGRAM_API_URL);
        await removeInlineKeyboard(chatId, callbackQuery.message.message_id, TELEGRAM_API_URL);
    }
}
// Fungsi untuk menangani pesan dari pengguna
async function handleUserMessage(userMessage, chatId, TELEGRAM_API_URL) {
    const waitMessageResponse = await sendMessage(chatId, 'Mohon tunggu sebentar...', TELEGRAM_API_URL);
    const waitMessageData = await waitMessageResponse.json();
    const waitMessageId = waitMessageData.result.message_id;

    if (userMessage === '/start') {
        const startMessage = `
Masukkan format IP CF dengan:
PROXY:PORT
Contoh: 103.6.207.108:8080
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬                   
Jika PROXY:PORT yang Anda masukkan aktif,
bot akan membuat VPN.
Jika tidak aktif,
maka tidak ada VPN yang dibuat.
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Pemilik Bot: @embeng1
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
`;
        await deleteMessage(chatId, waitMessageId, TELEGRAM_API_URL);
        await sendMessage(chatId, startMessage, TELEGRAM_API_URL);
        return;
    }

    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g;
    let matches = userMessage.match(ipRegex);

    if (!matches || matches.length === 0) {
        await deleteMessage(chatId, waitMessageId, TELEGRAM_API_URL);
        await sendMessage(chatId, 'Tidak ada IP yang valid ditemukan dalam teks.', TELEGRAM_API_URL);
        return;
    }

    matches = [...new Set(matches)].slice(0, 10);

    let finalMessage = '';
    let aktifIPs = [];

    for (let ipPort of matches) {
        const [ip, port = '443'] = ipPort.split(':');
        try {
            const response = await fetch(`https://ipcf.rmtq.fun/json/?ip=${ip}:${port}`);
            if (!response.ok) throw new Error('Gagal mengambil data ISP dan negara');

            const ipInfo = await response.json();
            finalMessage += `IP: ${ip}:${port}\n`;
            for (let key in ipInfo) {
                finalMessage += `${key}: ${ipInfo[key]}\n`;
                if (ipInfo[key] === '✔ AKTIF ✔') {
                    aktifIPs.push(`${ip}:${port}`);
                }
            }
            finalMessage += '\n';
        } catch (error) {
            console.error(`Gagal memproses ${ipPort}:`, error);
            finalMessage += `✘ Gagal, IP:Port salah atau API tidak tersedia ✘\n`;
        }
    }

    await deleteMessage(chatId, waitMessageId, TELEGRAM_API_URL);

    const messagePayload = {
        chat_id: chatId,
        text: finalMessage,
        parse_mode: 'Markdown'
    };

    if (aktifIPs.length > 0) {
        const callbackData = `vless|${aktifIPs.slice(0, 3).join('|')}`;
        messagePayload.reply_markup = {
            inline_keyboard: [
                [{ text: 'BUAT KONFIGURASI VLESS', callback_data: callbackData }]
            ]
        };
    }

    await sendMessage(chatId, messagePayload, TELEGRAM_API_URL);
}
// Fungsi untuk mengirim pesan
async function sendMessage(chatId, text, TELEGRAM_API_URL) {
    return await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        })
    });
}

// Fungsi untuk menghapus pesan
async function deleteMessage(chatId, messageId, TELEGRAM_API_URL) {
    await fetch(`${TELEGRAM_API_URL}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId
        })
    });
}

// Fungsi untuk menghapus tombol inline
async function removeInlineKeyboard(chatId, messageId, TELEGRAM_API_URL) {
    try {
        await fetch(`${TELEGRAM_API_URL}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: []
                }
            })
        });
    } catch (error) {
        console.error('Gagal menghapus keyboard inline:', error);
    }
            }
