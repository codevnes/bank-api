const mongoose = require('mongoose');
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

const MBAccountsSchema = new Schema({
  username:         String,
  password:         String,
  accountNo:        String,
  refNo:            String,
  deviceIdCommon:   String,
  sessionId:        String,
}, {
  collection: 'MbAccounts'
});

const MbAccountModel = mongoose.model('MbAccounts', MBAccountsSchema);

module.exports = { AcbAccountModel, MbAccountModel };
