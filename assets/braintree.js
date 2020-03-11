$(function () {
  var backend = 'https://apple-pay-ja-backend.herokuapp.com/transaction';
  var availability = $('#availability');
  var payButton = $('.apple-pay-button');
  if (window.ApplePaySession) {
    availability.text('available').css({
      color: 'green'
    });
    var merchantIdentifier = 'merchant.jp.yauth.braintree.sandbox';
    var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
    promise.then(function (canMakePayments) {
      console.info('canMakePayments', canMakePayments);
      if (canMakePayments) {
        $.getJSON(backend, function (response) {
          braintree.client.create({
            authorization: response.token
          }, function (error, client) {
            if (error) {
              console.error('Error creating client:', error);
              return;
            }
            braintree.applePay.create({
              client: client
            }, function (error, applePay) {
              if (error) {
                console.error('Error creating applePay instance:', error);
                return;
              }
              payButton.click(function () {
                var request = applePay.createPaymentRequest({
                  total: {
                    label: 'to @nov',
                    amount: '10.25'
                  }
                });
                var session = new ApplePaySession(1, request);
                session.begin();
                session.onvalidatemerchant = function (event) {
                  applePay.performValidation({
                    validationURL: event.validationURL,
                    displayName: 'Braintree Sandbox (@nov)'
                  }, function (error, merchantSession) {
                    if (error) {
                      // You should show an error to the user, e.g. 'Apple Pay failed to load.'
                      console.error('Error validating merchant:', error);
                      session.abort();
                      return;
                    }
                    console.info('ApplePay Merchant Session', merchantSession);
                    $('#session').text(JSON.stringify(merchantSession, null, 2));
                    session.completeMerchantValidation(merchantSession);
                  });
                };
                session.onpaymentauthorized = function (event) {
                  console.info('ApplePay Payment Token', event.payment.token);
                  $('#token').text(JSON.stringify(event.payment.token, null, 2));
                  applePay.tokenize({
                    token: event.payment.token
                  }, function (error, payload) {
                    if (error) {
                      console.error('Error tokenizing Apple Pay:', error);
                      session.completePayment(ApplePaySession.STATUS_FAILURE);
                      return;
                    }
                    console.info(request);
                    console.info(payload);
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);
                    $.post(backend, {
                      amount: request.total.amount,
                      nonce: payload.nonce
                    }, function (response) {
                      console.info('Braintree Transaction Status', response);
                      $('#result').text(JSON.stringify(response, null, 2));
                    }, 'json');
                  });
                };
              });
              payButton.show();
            });
          });
        }).catch(function (e) {
          console.error('error on canMakePaymentsWithActiveCard', e);
        });
      }
    });
  } else {
    availability.text('unavailable').css({
      color: 'red'
    });
  }
});
