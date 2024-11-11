import requests
import telebot
import uuid
import random
import re

# Ganti dengan token bot Telegram Anda
TOKEN = '7982446530:AAEbaK5XCpHGE8k8S6v5ssQsetbAYEY-sU4'
PROXY_API_URL = 'https://ipcf.rmtq.fun/json/?ip='
DEFAULT_PORT = '443'  # Set default port

bot = telebot.TeleBot(TOKEN)

# Global variable to store proxy data
checked_proxy_data = {}  # Dictionary to store data of each checked proxy

# Start command with an attractive message
@bot.message_handler(commands=['start'])
def send_welcome(message):
    welcome_message = (
        "🌟 **IP Checker Bot!** 🌟\n\n"
        "🔍 **Cara Menggunakan:**\n"
        "1. Masukan IP Proxy Cf yg anda inginkan.\n"
        "2. Tunggu prosesnya, beberapa detik.\n\n"
        "💡 **Format IP yang Diterima :**\n"
        "- 192.168.1.1\n"
        "- 192.168.1.1:8080\n\n"
        "⚠️ **Catatan :**\n"
        "Jika IP Proxy Cf berstatus **DEAD**, maka tidak akan ada pembuatan akun untuk VLESS dan TROJAN.\n\n"
        "List Ip Cf Vless & Trojan :\n"
        "https://raw.githubusercontent.com/jaka9m/tesaja/refs/heads/main/ip-cf.txt\n\n"
        "Bot By: @embeng1"
    )
    bot.send_message(message.chat.id, welcome_message, parse_mode='Markdown')

# Receive message with IP addresses
@bot.message_handler(func=lambda message: True)
def handle_ip_check(message):
    text = message.text

    # Extract valid IP addresses (optionally with ports) from user's text
    ip_regex = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b'
    proxy_ips = re.findall(ip_regex, text)[:10]  # Limit to 10 IPs only

    # If valid IPs are found, check proxy status
    if proxy_ips:
        bot.send_message(message.chat.id, 'Silahkan tunggu, sedang memeriksa proxy IP...')
        check_multiple_proxies(message.chat.id, proxy_ips)
    elif text.lower() != '/start':
        bot.send_message(message.chat.id, 'Tidak ada alamat IP yang valid ditemukan. Silakan masukkan IP yang benar.')

# Function to check multiple proxies
def check_multiple_proxies(chat_id, proxy_ips):
    for proxy_ip_with_port in proxy_ips:
        proxy_ip, port = (proxy_ip_with_port.split(':') + [DEFAULT_PORT])[:2]  # Use default port if not provided

        print(f'Memeriksa proxy: {proxy_ip}:{port}')

        try:
            url = f"{PROXY_API_URL}{proxy_ip}:{port}"
            response = requests.get(url)
            data = response.json()

            if data.get('status') == 'fail':
                bot.send_message(chat_id, f'Gagal memeriksa proxy IP: {proxy_ip}')
                continue

            checked_proxy_data[proxy_ip] = {**data, 'port': port}

            message = (
                f"IP : `{proxy_ip}:{port}`\n"
                f"```\n"
                f"INFORMATION\n"
                f"ISP     : {data['asn']}\n"
                f"COUNTRY : {data['country']}\n"
                f"CITY    : {data['city']}\n"
                f"PROXY   : {data['proxyStatus']}\n"
                f"PORT    : {port}\n"
                f"```"
            )
            bot.send_message(chat_id, message, parse_mode='Markdown')

            if 'DEAD' in data['proxyStatus']:
                bot.send_message(chat_id, f'Proxy {proxy_ip} tidak aktif. Tidak ada pembuatan akun VLESS & TROJAN.')
            else:
                send_account_options(chat_id, proxy_ip)
        except Exception as error:
            print(error)
            bot.send_message(chat_id, f'Terjadi kesalahan saat memeriksa proxy IP: {proxy_ip}')

# Send account options for VLESS and TROJAN
def send_account_options(chat_id, proxy_ip):
    options = telebot.types.InlineKeyboardMarkup()
    options.add(
        telebot.types.InlineKeyboardButton(text='✨VLESS✨', callback_data=f'vless:{proxy_ip}'),
        telebot.types.InlineKeyboardButton(text='✨TROJAN✨', callback_data=f'trojan:{proxy_ip}')
    )
    bot.send_message(chat_id, 'Silakan pilih protokol:', reply_markup=options)

# Handle callback query
@bot.callback_query_handler(func=lambda call: True)
def handle_callback_query(call):
    chat_id = call.message.chat.id
    protocol, proxy_ip = call.data.split(':')
    selected_proxy_data = checked_proxy_data.get(proxy_ip)

    if not selected_proxy_data:
        return bot.send_message(chat_id, 'Data proxy tidak ditemukan.')

    if protocol == 'vless':
        user_id = generate_uuid()
        message = (
            f"```\n"
            f"INFORMATION\n"
            f"ISP     : {selected_proxy_data['isp']}\n"
            f"COUNTRY : {selected_proxy_data['country']}\n"
            f"User ID : {user_id}\n"
            f"IP PROXY: {selected_proxy_data['ip']}\n"
            f"PORT    : {selected_proxy_data['port']}\n"
            f"PROXY   : {selected_proxy_data['proxyStatus']}\n"
            f"```\n"
            f"```\n"
            f"VLESS-TLS\n"
            f"vless://{user_id}@embeng.us.kg:443?path=%2Fvl%3D{selected_proxy_data['ip']}:{selected_proxy_data['port']}&security=tls&encryption=none&host=geovless.vlessipcf.us.kg&fp=randomized&type=ws&sni=embeng.us.kg#{selected_proxy_data['isp']}\n"
            f"```\n"
            f"```\n"
            f"VLESS-NTLS\n"
            f"vless://{user_id}@embeng.us.kg:80?path=%2Fvl%3D{selected_proxy_data['ip']}:{selected_proxy_data['port']}&security=none&encryption=none&host=embeng.us.kg&fp=randomized&type=ws&sni=embeng.us.kg#{selected_proxy_data['isp']}\n"
            f"```"
        )
        bot.send_message(chat_id, message, parse_mode='Markdown')

    elif protocol == 'trojan':
        password = generate_password()
        message = (
            f"```\n"
            f"INFORMATION\n"
            f"ISP     : {selected_proxy_data['isp']}\n"
            f"COUNTRY : {selected_proxy_data['country']}\n"
            f"PASSWORD: {password}\n"
            f"IP PROXY: {selected_proxy_data['ip']}\n"
            f"PORT    : {selected_proxy_data['port']}\n"
            f"PROXY   : {selected_proxy_data['proxyStatus']}\n"
            f"```\n"
            f"```\n"
            f"TROJAN-WSTLS\n"
            f"trojan://{password}@embeng.us.kg443?path=%2Ftr%3D{selected_proxy_data['ip']}:{selected_proxy_data['port']}&security=tls&host=embeng.us.kg&fp=random&type=ws&sni=embeng.us.kg#{selected_proxy_data['isp']}\n"
            f"```"
        )
        bot.send_message(chat_id, message, parse_mode='Markdown')

# Generate a random password
def generate_password():
    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=8))

# Generate a random UUID
def generate_uuid():
    return str(uuid.uuid4())

print('Bot is running...')
bot.polling()
