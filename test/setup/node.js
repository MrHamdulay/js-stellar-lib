global.StellarLib = require('../../src/index');
global.chai = require('chai');
global.sinon = require('sinon');
global.chai.use(require('sinon-chai'));
global.request = require("superagent");
global.dev_server = {hostname: "localhost", port: 1337};

global.expect = global.chai.expect;

beforeEach(function() {
  this.sandbox = global.sinon.sandbox.create();
  global.stub = this.sandbox.stub.bind(this.sandbox);
  global.spy  = this.sandbox.spy.bind(this.sandbox);
});

afterEach(function() {
  delete global.stub;
  delete global.spy;
  this.sandbox.restore();
});
