describe('post test suite', function() {
    it('should send #post', function() {
        browser.get('http://172.16.38.98:5000').then(function() {
            element(by.id('sms')).sendKeys('#post');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {

                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));

                    console.log(typeof message.getText());
                    console.log(message.getText());

                    var startString, endString;

                    message.getText().then(function(text) {
                        startString = text.slice(0,18);
                        endString = text.slice(text.length-18, text.length);
                    });

                    expect(message.getText().slice(0,18).toEqual(
                        '** Post recent **\n'
                    );
                    expect(endString).toEqual(
                        '<send option/"menu/">'
                    );
                });
            });
        });
    });
});