const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGOOSE_URL);

const Schema = mongoose.Schema;
const ACBAccountsSchema = new Schema({
  username: String,
  password: String,
  accountNo: String,
  accessToken: String,
}, {
  collection: 'AcbAccounts' 
});

const AcbAccountModel = mongoose.model('AcbAccounts', ACBAccountsSchema);

module.exports = AcbAccountModel;
