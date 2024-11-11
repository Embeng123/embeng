
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const data = await request.json();
            const chatId = data.callback_query ? data.callback_query.message.chat.id : data.message.chat.id;
            const userMessage = data.callback_query ? data.callback_query.data : data.message.text.trim();
            const TELEGRAM_API_URL = `https://api.telegram.org/bot7982446530:AAEbaK5XCpHGE8k8S6v5ssQsetbAYEY-sU4`;

            if (data.callback_query) {
                const callbackQueryId = data.callback_query.id;
                const callbackData = data.callback_query.data;

                if (callbackData.startsWith('vless')) {
                    const [_, ...ipPorts] = callbackData.split('|');

                    let vlessConfigs = [];

                    for (let ipPort of ipPorts) {
                        const [ip, port = '443'] = ipPort.split(':'); // Default port 443

                        try {
                            const response = await fetch(`https://ipcf.rmtq.fun/json/?ip=${ip}:${port}`); // Mengirim IP dan port
                            if (!response.ok) throw new Error('Gagal mengambil data ISP');

                            const ipInfo = await response.json();
                            const ISP = ipInfo.ISP ? ipInfo.ISP.replace(/, Inc\.|, Ltd\.| .*/g, '').trim() : 'UnknownISP';

                            const vlessConfig = `Success Create Vless ${ISP}
\`\`\`@embeng1                         
vless://Israel=Babi@embeng.us.kg:443?path=%2Fvl%3D${ip}%3A${port}&security=tls&encryption=none&host=embeng.us.kg&type=ws&sni=embeng.us.kg#${ISP}
\`\`\`
`;
                            vlessConfigs.push(vlessConfig);
                        } catch (error) {
                            console.error(`Gagal mengambil data ISP untuk ${ipPort}:`, error);
                            await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    chat_id: chatId,
                                    text: `\`${ipPort}\` ✘ Gagal mengambil data ISP ✘`,
                                    parse_mode: 'Markdown'
                                })
                            });
                            return new Response('Error fetching ISP data', { status: 500 });
                        }
                    }

                    const vlessMessage = vlessConfigs.join('');
                    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: vlessMessage,
                            parse_mode: 'Markdown'
                        })
                    });
                    await removeInlineKeyboard(chatId, data.callback_query.message.message_id);

                    return new Response('OK', { status: 200 });
                }
            } else {
                const waitMessageResponse = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: 'Please wait...',
                        parse_mode: 'Markdown'
                    })
                });

                const waitMessageData = await waitMessageResponse.json();
                const waitMessageId = waitMessageData.result.message_id;

                if (userMessage === '/start') {
                    const startMessage = `

Masukan Format Ip Cf dg :
PROXY:PORT
contoh* 103.6.207.108:8080
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬                   
Jika PROXY:PORT yg anda masukan aktif,
Bot akan membuat VPN.
Jika tidak aktif,
tidak ada pembuatan VPN.
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Owner Bot : @embeng1
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
`;

                    await fetch(`${TELEGRAM_API_URL}/deleteMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: waitMessageId
                        })
                    });

                    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: startMessage,
                            parse_mode: 'Markdown'
                        })
                    });

                    return new Response('OK', { status: 200 });
                }

                const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g;
                let matches = userMessage.match(ipRegex);

                if (!matches || matches.length === 0) {
                    await fetch(`${TELEGRAM_API_URL}/deleteMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: waitMessageId
                        })
                    });

                    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: 'Tidak ada IP yang valid ditemukan dalam teks.',
                            parse_mode: 'Markdown'
                        })
                    });
                    return new Response('No valid IP addresses found.', { status: 200 });
                }

                matches = [...new Set(matches)];

                if (matches.length > 10) {
                    matches = matches.slice(0, 10);
                    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: '️!! The first 10 IPs will be Checked !!',
                            parse_mode: 'Markdown'
                        })
                    });
                }

                let finalMessage = '';
                let aktifIPs = [];
                const processedIps = new Set();

                for (let ipPort of matches) {
                    if (processedIps.has(ipPort)) continue;

                    let [ip, port = '443'] = ipPort.split(':'); // Default port 443

                    try {
                        const response = await fetch(`https://ipcf.rmtq.fun/json/?ip=${ip}:${port}`); // Mengirim IP dan port ke API
                        if (!response.ok) throw new Error('Gagal mengambil data ISP dan negara');

                        const ipInfo = await response.json();

                        finalMessage += `IP : \`${ip}:${port}\`\n`;
                        finalMessage += '```STATUS\n';
                        for (let key in ipInfo) {
                            finalMessage += `${key}: ${ipInfo[key]}\n`;
                            if (ipInfo[key] === '✔ AKTIF ✔') {
                                aktifIPs.push(`${ip}:${port}`);
                            }
                        }
                        finalMessage += '```\n';

                        processedIps.add(ipPort);
                    } catch (error) {
                        console.error(`Gagal memproses ${ipPort}:`, error);
                        finalMessage += `✘ Failed, IP:Port is wrong or API is down ✘\n`;
                    }
                }

                if (finalMessage) {
                    await fetch(`${TELEGRAM_API_URL}/deleteMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: waitMessageId
                        })
                    });

                    const messagePayload = {
                        chat_id: chatId,
                        text: finalMessage,
                        parse_mode: 'Markdown'
                    };

                    if (aktifIPs.length > 0) {
                        let callbackData = `vless|${aktifIPs.slice(0, 3).join('|')}`;
                        messagePayload.reply_markup = {
                            inline_keyboard: [
                                [{ text: 'CREATE VLESS CONFIG', callback_data: callbackData }]
                            ]
                        };
                    }

                    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(messagePayload)
                    });
                }

                return new Response('OK', { status: 200 });
            }
        } catch (error) {
            console.error('General error:', error);
            return new Response('Error processing request', { status: 500 });
        }
    }
    return new Response('Method not allowed', { status: 405 });
}

async function removeInlineKeyboard(chatId, messageId) {
    try {
        await fetch(`https://api.telegram.org/bot7982446530:AAEbaK5XCpHGE8k8S6v5ssQsetbAYEY-sU4/editMessageReplyMarkup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: []
            }
        })
    });
} catch (error) {
    console.error('Gagal menghapus inline keyboard:', error);
}
}
