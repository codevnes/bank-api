const express = require('express');
const axios = require('axios');

const router = express.Router();
const NodeRSA = require('node-rsa');



const TIMO_URL = {
    LOGIN: "https://app2.timo.vn/login",
    HISTORY: "https://app2.timo.vn/login",
}

const PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxi6FFvwU/SKhxK2UwAULu6Vyw0MXh3dLtuke9SPuceUj7oPBq2DP8MdRkFgMGK+Hma7Fu0qchQxI0TfIbP0tnf0gmtJIacDGylI++IgGoLQ30llGdI5iZujUQWCsPJIT3m0fzehWu1U+8lgzA4JsRr1p8RawYvut1p53Vw3JlbSp2JOxSt79LaujgO6cY2F81rvkfpaXSRmaln/dQjUsZvzzqnEIPc6JQClyH0VIdMoKBsLeH/tgQRcOtdlYv0GFJORi6EOD67A7QQi5cxSw2mqYM+HXQzfh4HXoRNq0FHk1CcdQiBLFn2nbwAkGmcDwwvwXCPSFTQJF0uqUYKk2SwIDAQAB"


router.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    const key = new NodeRSA(PUBLIC_KEY, 'pkcs8-public');
    const encrypted = key.encrypt(password, 'base64');

    let mainPass = "2f12e58983a6d980cbca9ed928ce2916d7d57707beb995c3bb52a984e4ae9331227cf335b4615743e1c6bf8ded05dbbe4b819c315dad81dad3a3ee53ad522cd0"

    const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json, text/plain',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Referer': 'https://my.timo.vn/',
        'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'X-Gofs-Context-Id': '11ae78f6ca76adbec4929a0e9f90e3e0c54d81602370cbc7eb4cb30163956403.d4360ac7-5e3f-47a2-ba92-59159c5d6d07',
        'X-Timo-Devicereg': 'dc00e675100e198420b2890e7bbe77e6:WEB:WEB:192:WEB:desktop:chrome'
    };

    const data = { lang: "vn", username, password: encrypted };

    // res.json({ response: data });

    const response = await axios.post(TIMO_URL.LOGIN, data, {
        headers: headers,
    });

    if (response.status === 200) {
        res.json({ response: response.data });
    } else {
        res.status(response.status).json({ error: 'Login failed' });
    }

});


module.exports = router;
