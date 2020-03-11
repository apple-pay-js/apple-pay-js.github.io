$(function () {
  var backend = 'https://apple-pay-ja-backend.herokuapp.com/';
  var availability = $('#availability');
  var payButton = $('.apple-pay-button');
  if (window.ApplePaySession) {
    availability.text('available').css({
      color: 'green'
    });
    var merchantIdentifier = 'merchant.jp.matake.recruit';
    var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
    promise.then(function (canMakePayments) {
      console.info('canMakePayments', canMakePayments);
      if (canMakePayments) {
        payButton.show();
        payButton.click(function () {
          var request = {
            countryCode: 'US',
            currencyCode: 'USD',
            supportedNetworks: ['visa', 'masterCard'],
            merchantCapabilities: ['supports3DS'],
            requiredBillingContactFields: ['name'],
            requiredShippingContactFields: ['name', 'email'],
            applicationData: 'app-specific-data',
            total: { label: 'to @nov', amount: '10' },
          };
          var session = new ApplePaySession(1, request);
          session.begin();
          session.onvalidatemerchant = function (event) {
            console.info('onvalidatemerchant', event);
            $.getJSON(backend, {validation_url: event.validationURL}, function (merchantSession) {
              console.info('completeMerchantValidation', merchantSession);
              $('#session').text(JSON.stringify(merchantSession, null, 2));
              session.completeMerchantValidation(merchantSession);
            });
          };
          session.onpaymentauthorized = function (event) {
            console.info('onpaymentauthorized', event);
            $('#result').text(JSON.stringify(event.payment.token, null, 2));
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
          };
        });
      }
    }).catch(function (e) {
      console.error('error on canMakePaymentsWithActiveCard', e);
    });
  } else {
    availability.text('unavailable').css({
      color: 'red'
    });
  }
});
