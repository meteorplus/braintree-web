'use strict';

var BraintreeError = require('../../../src/lib/braintree-error');
var create = require('../../../src/visa-checkout').create;
var VisaCheckout = require('../../../src/visa-checkout/visa-checkout');
var analytics = require('../../../src/lib/analytics');
var fake = require('../../helpers/fake');
var version = require('../../../package.json').version;

describe('visaCheckout.create', function () {
  beforeEach(function () {
    var configuration = fake.configuration();

    configuration.gatewayConfiguration.visaCheckout = {};

    this.configuration = configuration;
    this.client = {
      getConfiguration: function () {
        return configuration;
      }
    };
  });

  it('calls callback with a VisaCheckout instance when successful', function (done) {
    var client = this.client;

    this.sandbox.stub(analytics, 'sendEvent');

    create({
      client: client
    }, function (err, visaCheckoutInstance) {
      expect(err).not.to.exist;
      expect(visaCheckoutInstance).to.be.an.instanceof(VisaCheckout);

      done();
    });
  });

  it('throws an error when called without a callback', function () {
    var err;

    try {
      create({});
    } catch (e) {
      err = e;
    }

    expect(err).to.be.an.instanceof(BraintreeError);
    expect(err.code).to.equal('CALLBACK_REQUIRED');
    expect(err.type).to.equal('MERCHANT');
    expect(err.message).to.equal('create must include a callback function.');
  });

  it('calls callback with an error when missing client', function (done) {
    create({}, function (err, visaCheckoutInstance) {
      expect(visaCheckoutInstance).not.to.exist;

      expect(err).to.be.an.instanceof(BraintreeError);
      expect(err.code).to.equal('INSTANTIATION_OPTION_REQUIRED');
      expect(err.type).to.equal('MERCHANT');
      expect(err.message).to.equal('options.client is required when instantiating Visa Checkout.');

      done();
    });
  });

  it('calls callback with an error when called with a mismatched version', function (done) {
    this.configuration.analyticsMetadata.sdkVersion = '1.2.3';

    create({client: this.client}, function (err, visaCheckoutInstance) {
      expect(visaCheckoutInstance).not.to.exist;

      expect(err).to.be.an.instanceof(BraintreeError);
      expect(err.code).to.equal('INCOMPATIBLE_VERSIONS');
      expect(err.type).to.equal('MERCHANT');
      expect(err.message).to.equal('Client (version 1.2.3) and Visa Checkout (version ' + version + ') components must be from the same SDK version.');

      done();
    });
  });

  it('calls callback with an error when visa checkout is not enabled in configuration', function (done) {
    delete this.configuration.gatewayConfiguration.visaCheckout;

    create({client: this.client}, function (err, visaCheckoutInstance) {
      expect(visaCheckoutInstance).not.to.exist;

      expect(err).to.be.an.instanceof(BraintreeError);
      expect(err.code).to.equal('VISA_CHECKOUT_NOT_ENABLED');
      expect(err.type).to.equal('MERCHANT');
      expect(err.message).to.equal('Visa Checkout is not enabled for this merchant.');

      done();
    });
  });

  it('sends an analytics event', function (done) {
    var client = this.client;

    this.sandbox.stub(analytics, 'sendEvent');

    create({
      client: client
    }, function (err) {
      expect(err).not.to.exist;
      expect(analytics.sendEvent).to.be.calledWith(client, 'visacheckout.initialized');

      done();
    });
  });
});
