// _Root_prerequest
// ece48a21-6d6f-49b6-9271-6b3a796d42f8



const _ = require('lodash'),
  tv4 = require('tv4'),
pm = {};

/* eslint-disable no-unused-expressions,no-extend-native */
var sii_token = pm.environment.get('sii_token');
if (sii_token) {
    pm.request.headers.upsert({
        key: 'X-Sii-Token',
        value: sii_token
    });
}