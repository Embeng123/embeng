export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/") {
      return handleHomePage(request);
    } else if (path === "/loginOtp") {
      return handleLoginOtp(request);
    } else if (path === "/detailsKuota") {
      return handleCheckQuota(request);
    } else {
      return new Response("Not Found", { status: 404 });
    }
  },
};

const style = `
  body {
    font-family: 'Courier New', Courier, monospace;
    background-color: #171717;
    color: #fff;
    padding: 2vw;
    margin: 0;
    max-width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
  h1 {
    font-size: 6vw;
    text-align: center;
    color: #f0e4c8;
    margin-bottom: 2vh;
  }
  form {
    width: 90%;
    max-width: 400px;
    margin-top: 2vh;
  }
  label {
    display: block;
    margin-bottom: 1vh;
    font-size: 4vw;
  }
  input[type="text"] {
    width: 100%;
    padding: 2vw;
    margin-bottom: 2vh;
    border: 1px solid #ccc;
    box-sizing: border-box;
    font-size: 6vw;
  }
  button {
    background-color: #45501d;
    color: white;
    padding: 2vw;
    border: none;
    cursor: pointer;
    width: 100%;
    margin-top: 2vh;
    font-size: 6vw;
  }
  button:hover {
    background-color: #35501d;
  }
  .note {
    font-size: 4vw;
    color: #ccc;
    margin-top: 2vh;
    text-align: center;
  }
  .box {
    border: 1px solid #fff;
    background-color: #98854D;
    padding: 2vw;
    margin-top: 2vh;
    text-align: center;
    width: 90%;
    max-width: 400px;
  }
  .detail {
    background-color: #543f24;
    padding: 2vw;
    border: 1px solid #f0e4c8;;
    margin-top: 4vh;
    font-size: 3.5vw;
    line-height: 1.4;
  }
  .copyright {
    bottom: 1vh;
    right: 2vw;
    font-size: 4vw;
    color: #666;
  }
`;
async function handleHomePage(request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const msisdn = formData.get("msisdn");
    const action = formData.get("action");

    if (!msisdn) {
      return new Response("MSISDN is required", { status: 400 });
    }

    if (action === "terdaftar") {
      return handleCheckSession(msisdn);
    } else if (action === "requestOtp") {
      return handleRequestOtp(msisdn);
    }
  } else {
    const html = `
      <html>
        <head>
          <style>${style}</style>
        </head>
        <body>
          <div class="box">
            <h1>XL AXIS LiveOn</h1>
          </div>
          <form method="POST">
            <label for="msisdn">Masukan Nomer Hp:</label>
            <input type="text" id="msisdn" name="msisdn" required>
            <button type="submit" name="action" value="terdaftar">Terdaftar</button>
            <div class="note">Klik "Terdaftar" jika sebelumnya anda pernah Login.</div>
            <button type="submit" name="action" value="requestOtp">Request OTP</button>
            <div class="note">Klik "Request OTP" untuk meminta kode OTP baru.</div>
          </form>
          <div class="copyright">2024 Powered by ChaGPT X Embeng</div>
        </body>
      </html>
    `;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
}

async function handleCheckSession(msisdn) {
  const response = await fetch(`https://api.embeng.xyz/?action=cek_msisdn&msisdn=${msisdn}`);
  const result = await response.json();

  if (!result.status) {
    return new Response(`Error: ${result.message}`, { status: 400 });
  }

  const accessToken = result.data.accessToken;

  const html = `
    <html>
      <head>
        <style>${style}</style>
      </head>
      <body>
        <div class="box">
          <h1>Session Check</h1>
        </div>
        <p>${result.message}</p>
        <form method="POST" action="/detailsKuota">
          <input type="hidden" name="accesstoken" value="${accessToken}">
          <button type="submit">Cek Kuota</button>
        </form>
        <div class="note">"Cek Kuota" untuk melihat rincian kuota Anda.</div>
        <div class="copyright">2024 Powered by ChaGPT X Embeng</div>
      </body>
    </html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
async function handleRequestOtp(msisdn) {
  const response = await fetch(`https://api.embeng.xyz/?action=request_otp&msisdn=${msisdn}`);
  const result = await response.json();

  if (!result.status) {
    return new Response(`Error: ${result.message}`, { status: 400 });
  }

  const html = `
    <html>
      <head>
        <style>${style}</style>
      </head>
      <body>
        <div class="box">
          <h1>OTP Requested</h1>
        </div>
        <p>${result.message}</p>
        <form method="POST" action="/loginOtp">
          <input type="hidden" name="msisdn" value="${msisdn}">
          <label for="otp">Enter OTP:</label>
          <input type="text" id="otp" name="otp" required>
          <button type="submit">Login with OTP</button>
        </form>
        <div class="note">Masukkan OTP yang telah diterima melalui SMS untuk melanjutkan.</div>
        <div class="copyright">2024 Powered by ChaGPT X Embeng</div>
      </body>
    </html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

async function handleLoginOtp(request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const msisdn = formData.get("msisdn");
    const otp = formData.get("otp");

    if (!msisdn || !otp) {
      return new Response("MSISDN and OTP are required", { status: 400 });
    }

    const response = await fetch(`https://api.embeng.xyz/?action=login_otp&msisdn=${msisdn}&otp=${otp}`);
    const result = await response.json();

    if (!result.status) {
      return new Response(`Error: ${result.message}`, { status: 400 });
    }

    const accessToken = result.data.accessToken;

    const html = `
      <html>
        <head>
          <style>${style}</style>
        </head>
        <body>
          <div class="box">
            <h1>Login Successful</h1>
          </div>
          <p>${result.message}</p>
          <form method="POST" action="/detailsKuota">
            <input type="hidden" name="accesstoken" value="${accessToken}">
            <button type="submit">Cek Kuota</button>
          </form>
          <div class="note">Klik "Cek Kuota" untuk melihat rincian kuota Anda.</div>
          <div class="copyright">2024 Powered by ChaGPT X Embeng</div>
        </body>
      </html>
    `;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } else {
    return new Response("Invalid request method", { status: 405 });
  }
}
async function handleCheckQuota(request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const accessToken = formData.get("accesstoken");

    if (!accessToken) {
      return new Response("Access token is required", { status: 400 });
    }

    const response = await fetch(`https://api.embeng.xyz/?action=check_quota&accesstoken=${accessToken}`);
    const result = await response.json();

    if (!result.status) {
      return new Response(`Error: ${result.message}`, { status: 400 });
    }

    const details = result.data.detail
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<div>${line}</div>`)
      .join("");

    const html = `
      <html>
        <head>
          <style>${style}</style>
        </head>
        <body>
          <div class="box">
            <h1>Details Kuota</h1>
          </div>
          <div class="detail">${details}</div>
          <div class="note">Berikut adalah rincian kuota Anda.</div>
          <div class="copyright">2024 Powered by ChaGPT X Embeng</div>
        </body>
      </html>
    `;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } else {
    return new Response("Invalid request method", { status: 405 });
  }
}
