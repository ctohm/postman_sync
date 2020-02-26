// 05_01_Ceder documento_test
// 387a9ffd-803c-4a91-95ed-8855adf660e7



const _ = require('lodash'),
  tv4 = require('tv4'),
pm = {};

/* eslint-disable no-unused-expressions,no-extend-native */
pm.test("id is a string", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.track_id).to.be.a('number');
    pm.environment.set('track_id',jsonData.track_id);
});