// 01_02_Iniciar sesion_test
// 72108ac6-f31c-4a8d-b6d7-e62989ef6672



const _ = require('lodash'),
  tv4 = require('tv4'),
pm = {};

/* eslint-disable no-unused-expressions,no-extend-native */
pm.test("Your test name", function () {
    var jsonData = pm.response.json();
     pm.expect(jsonData.access_token).to.be.a('string');
    pm.environment.set('access_token',jsonData.access_token);
    
});