const express = require('express');
const axios = require('axios');
const moment = require('moment-timezone');
const router = express.Router();
const crypto = require('crypto-js');
const { MbAccountModel } = require('../account');
const randomstring = require('randomstring');
const CryptoJS = require('crypto-js');

const MB_URL = {
    IMG_CAPTCHA: 'https://online.mbbank.com.vn/api/retail-web-internetbankingms/getCaptchaImage',
    CAPTCHA: 'http://ai.mggtd.com/captcha_v4',
    DO_LOGIN: 'https://online.mbbank.com.vn/api/retail_web/internetbanking/doLogin',
    TRANSACTION: 'https://online.mbbank.com.vn/api/retail-web-transactionservice/transaction/getTransactionAccountHistory'
};

function getVietnamTime() {
    return moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmssSS');
}

function createPasswordHash(password) {
    const hash = crypto.MD5(password).toString();
    return hash;
}

function getFilePathProfile(username, password) {
    const message = `MB_${username}${password}`;
    const hashDigest = CryptoJS.SHA256(message);
    return hashDigest.toString(CryptoJS.enc.Hex);
}

function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const deviceid = generateRandomString(8) + '-mbib-0000-0000-' + getVietnamTime();



async function getImageCaptcha(refNo, deviceIdCommon) {
    const data = {
        refNo: refNo,
        deviceIdCommon: deviceIdCommon,
        sessionId: '',
    };
    try {
        const response = await axios.post(MB_URL.IMG_CAPTCHA, data, config);
        return response.data.imageString;
    } catch (error) {
        console.error('Error fetching image captcha:', error.message);
        throw error;
    }
}

async function getCaptcha(imageString) {
    const data = {
        image: imageString,
        model: "mb"
    };
    try {
        const response = await axios.post(MB_URL.CAPTCHA, data);
        return response.data.result;
    } catch (error) {
        console.error('Error fetching captcha:', error.message);
        throw error;
    }
}

function generateFingerprint() {
    const randomString = randomstring.generate({
        length: 500,
        charset: 'alphanumeric'
    });

    const fingerprint = crypto.MD5(randomString).toString();

    return fingerprint;
}

const config = {
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'vi-VN,vi',
        'Authorization': 'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json; charset=UTF-8',
        'Host': 'online.mbbank.com.vn',
        'Origin': 'https://online.mbbank.com.vn',
        'Referer': 'https://online.mbbank.com.vn/pl/login?returnUrl=%2F',
    }
};
async function doLogin(captcha, deviceIdCommon, password, refNo, sessionId, username) {
    const data = {
        captcha: captcha,
        deviceIdCommon: deviceIdCommon,
        password: password,
        refNo: refNo,
        sessionId: sessionId,
        userId: username,
    };
    try {
        const response = await axios.post(MB_URL.DO_LOGIN, data, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching captcha:', error.message);
        throw error;
    }
}


async function getTransactionAccountHistory(accountNo, deviceIdCommon, refNo, sessionId) {

    const data = {
        accountNo: accountNo,
        deviceIdCommon: deviceIdCommon,
        refNo: refNo,
        sessionId: sessionId,
        fromDate: "21/11/2023",
        toDate: "28/11/2023",
    }
    try {
        const response = await axios.post(MB_URL.TRANSACTION, data, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching captcha:', error.message);
        throw error;
    }
}


router.post('/login', async (req, res) => {
    const { username, password, accountNo } = req.body;

    try {
        const MbExists = await MbAccountModel.findOne({ username });

        if (MbExists) {
            const sessionId = "";
            const refNo = MbExists.refNo;
            const deviceIdCommon = MbExists.deviceIdCommon;
            const imageString = await getImageCaptcha(refNo, deviceIdCommon);
            const captcha = await getCaptcha(imageString);
            const hashedPassword = MbExists.password;

            const dataDoLogin = await doLogin(captcha, deviceIdCommon, hashedPassword, refNo, sessionId, username);

            if (dataDoLogin.result.ok) {
                if (dataDoLogin.sessionId) {
                    await MbAccountModel.updateOne({ username }, { $set: { sessionId: dataDoLogin.sessionId, password: hashedPassword } });

                    return res.status(200).json({ status: true, message: 'Session updated with new login', dataDoLogin });
                } else {
                    return res.status(500).json({ status: false, message: 'Failed to update session' });
                }
            }
            else {
                const hashedPassword = hashedPassword(password);
                const dataDoLogin = await doLogin(captcha, deviceIdCommon, hashedPassword, refNo, sessionId, username);
                if (dataDoLogin.sessionId) {
                    await MbAccountModel.updateOne({ username }, { $set: { sessionId: dataDoLogin.sessionId, password: hashedPassword } });
                    return res.status(200).json({ status: true, message: 'Session updated with new login', dataDoLogin });
                } else {
                    return res.status(500).json({ status: false, message: 'Failed to update session' });
                }
            }

        } else {
            const sessionId = "";
            const refNo = generateFingerprint() + "-" + getVietnamTime();
            const imageString = await getImageCaptcha(refNo, deviceid);
            const captcha = await getCaptcha(imageString);
            const hashedPassword = createPasswordHash(password);

            const dataDoLogin = await doLogin(captcha, deviceid, hashedPassword, refNo, sessionId, username);

            if (dataDoLogin.result.ok) {
                MbAccount = await MbAccountModel.create({ username, password: hashedPassword, accountNo, refNo, deviceIdCommon, sessionId: dataDoLogin.sessionId });
                res.status(200).json({ status: 'success', message: 'Đăng nhập thành công!', MbAccount });
            }
            if (dataDoLogin.result.ok === false && dataDoLogin.result.responseCode === "GW21") {
                res.status(403).json({ status: 'failed', message: 'Tài khoản hoặc mật khẩu không hợp lệ!' });
            }
            else {
                res.status(404).json(dataDoLogin);
            }
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});


router.post('/transaction', async (req, res) => {


    const { username, accountNo } = req.body;

    console.log('Transaction Form:'+ getVietnamTime(), accountNo);

    const MbExists = await MbAccountModel.findOne({ username });


    try {
        const sessionId = MbExists.sessionId;
        const refNo = MbExists.refNo;
        const deviceIdCommon = MbExists.deviceIdCommon;

        const dataTrans = await getTransactionAccountHistory(accountNo, deviceIdCommon, refNo, sessionId);

        if (dataTrans.result.ok === true) {
            res.status(200).json(dataTrans);
        }

        else {
            const sessionId = "";
            const imageString = await getImageCaptcha(refNo, deviceIdCommon);
            const captcha = await getCaptcha(imageString);
            const hashedPassword = MbExists.password;
            const dataDoLogin = await doLogin(captcha, deviceIdCommon, hashedPassword, refNo, sessionId, username);
            if (dataDoLogin.sessionId) {
                await MbAccountModel.updateOne({ username }, { $set: { sessionId: dataDoLogin.sessionId, password: hashedPassword } });
                const dataTrans = await getTransactionAccountHistory(accountNo, deviceIdCommon, refNo, sessionId);
                if (dataTrans.result.ok === true) {
                    res.status(200).json(dataTrans);
                }
            } else {
                return res.status(500).json({ status: false, message: 'Failed to update session' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

module.exports = router;
