// 02_01_Cargar certificado_test
// 987fb9f9-c161-4482-a668-33352ac17476



const _ = require('lodash'),
  tv4 = require('tv4'),
pm = {};

/* eslint-disable no-unused-expressions,no-extend-native */
pm.test("id is a string", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.id).to.be.a('string');
    pm.environment.set('certificado_id',jsonData.data.id);
});