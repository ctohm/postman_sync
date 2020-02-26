// 02_04_Obtener token SII con un certificado_test
// 39c57dde-7f06-4c7d-966a-fb7715f3cf4c



const _ = require('lodash'),
  tv4 = require('tv4'),
pm = {};

/* eslint-disable no-unused-expressions,no-extend-native */
pm.test("Your test name", function () {
    var jsonData = pm.response.json();
     pm.expect(jsonData.data).to.be.a('object');
     pm.expect(jsonData.data.token).to.be.a('string');
     pm.expect(jsonData.success).to.eq(true);
    pm.environment.set('sii_token',jsonData.data.token);
    
});
