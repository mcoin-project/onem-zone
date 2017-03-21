describe('onem test suite', function() {
    it('should send #onem', function() {
        browser.get('http://172.16.38.98:5000').then(function() {
            element(by.id('sms')).sendKeys('#onem');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        '** ONEm menu **\n' +
                        'a My account\n' +
                        'b Invite friends to chat for free\n' +
                        'c Create free SMS group chats (xGroup)\n' +
                        'd Free services\n' +
                        'e How to use\n' +
                        '<send option>'
                    );
                });
            });
            element(by.id('sms')).sendKeys('a');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'ACCOUNT mode activated\n' +
                        '** Account menu **\n' +
                        'a mID\n' +
                        'b Subscription\n' +
                        'c Settings\n' +
                        'd Tutorial\n' +
                        '<send option>  '
                    );
                });
            });
        });
    });
    it('should send #post search', function() {
        element(by.id('sms')).sendKeys('#post search');
        element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
            element.all(by.repeater('obj in results')).then(function(mt) {
                var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                expect(message.getText()).toEqual(
                    'POST mode activated\n' +
                    '** Post search **\n' +
                    'Send post code, user name, any keyword or \"back\"\n' +
                    '<\"back\">'
                );
            });
        });

    });
});