describe('onem test suite', function() {
  it('should send #onem', function() {
    browser.get('http://172.16.38.98:5000');

    element(by.id('sms')).sendKeys('#onem');
  });
});