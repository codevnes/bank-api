const express = require('express');
const axios = require('axios');
const HttpAgent = require('http').Agent;
const HttpsAgent = require('https').Agent;
const AcbAccountModel = require('./account');
const router = express.Router();

const API_ENDPOINTS = {
    LOGIN: 'https://apiapp.acb.com.vn/mb/auth/tokens',
    TRANSACTION_HISTORY: 'https://apiapp.acb.com.vn/mb/legacy/ss/cs/bankservice/saving/tx-history'
};

class ACBService {
    constructor(clientId) {
        this.clientId = clientId;
    }

    async login(username, password) {
        try {
            const data = { clientId: this.clientId, username, password };
            const response = await axios.post(API_ENDPOINTS.LOGIN, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response.data.message || 'Login failed');
        }
    }

    async getTransactionHistory(accountNo, rows, token) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.TRANSACTION_HISTORY}?maxRows=${rows}&account=${accountNo}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    // Other headers as needed...
                },
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch transaction history');
        }
    }
}

const clientId = process.env.ACB_CLIENT_ID; // Use environment variable for clientId
const acbService = new ACBService(clientId);

router.post('/login', async (req, res, next) => {
    const { accountNo, username, password } = req.body;

    try {
        const authToken = await acbService.login(username, password);

        let acbAccount = await AcbAccountModel.findOne({ accountNo });

        if (acbAccount) {
            acbAccount.accessToken = authToken.accessToken;
            await acbAccount.save();
        } else {
            acbAccount = await AcbAccountModel.create({ username, password, accountNo, accessToken: authToken.accessToken });
        }

        res.json({ status: true, message: 'Login successful', authToken });
    } catch (error) {
        next(error);
    }
});

router.post('/transactions', async (req, res, next) => {
    const { accountNo, rows } = req.body;
    const acbAccount = await AcbAccountModel.findOne({ accountNo });

    if (!acbAccount) {
        return next(new Error('Account not found'));
    }

    try {
        const transactionData = await acbService.getTransactionHistory(accountNo, rows, acbAccount.accessToken);
        res.json(transactionData);
    } catch (error) {
        next(error);
    }
});


router.get('/', (req, res, next) => {
    res.json({ status: true, message: 'Xin chao ACB' });
});


router.use((error, req, res, next) => {
    res.status(500).json({ status: false, message: error.message });
});

module.exports = router;
