describe('Suite 2 - onem test suite', function() {

    browser.get('http://172.16.38.98:5000');

    it('2.2 - should execute the #account menu', function() {

        element(by.id('sms')).sendKeys('#account');
        element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
            element.all(by.repeater('obj in results')).then(function(mt) {
                var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                expect(message.getText()).toEqual(
                    '** Account menu **\n' +
                    'a mID\n' +
                    'b Subscription\n' +
                    'c Settings\n' +
                    'd Tutorial\n' +
                    '<send option>'
                );
            });
        });

        var re = new RegExp("\\*\\* Account menu \\*\\*\n" +
                    "default: " + browser.params.mid + "\n" +
                    "a mID\n" +
                    "b Subscription\n" +
                    "c Settings\n" +
                    "d Tutorial\n" +
                    "<send option>");

        element(by.id('sms')).sendKeys('a');
        element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
            element.all(by.repeater('obj in results')).then(function(mt) {
                var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                expect(message.getText()).toMatch(re);
            });
        });
    });
});