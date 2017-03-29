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
 
            element(by.id('sms')).sendKeys('#account');
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
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#aljazeera');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'ALJAZEERA mode activated\n' +
                        '** Aljazeera menu **\n' +
                        'a Headlines\n' +
                        'b Audio Shows\n' +
                        'c Tutorial\n' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#arabic');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'ARABIC mode activated\n' +
                        '** Arabic menu **\n' +
                        'a Categories\n' +
                        'b Search\n' +
                        'c History\n' +
                        'Tutorial\n' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#call');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'CALL mode activated\n' +
                        '** Call menu **\n' +
                        '#call helps you call your friends using their names. After you create contacts and xGroup, they will be shown here and you can choose who to call.\n' +
                        '<"#contacts">'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#contacts');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'CONTACTS mode activated\n' +
                        '** Contacts menu **\n' +
                        'a Add contact\n' +
                        'b List contacts\n' +
                        'c Settings' +
                        'd Tutorial' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#contacts');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'CONTACTS mode activated\n' +
                        '** Contacts menu **\n' +
                        'a Add contact\n' +
                        'b List contacts\n' +
                        'c Settings' +
                        'd Tutorial' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#contacts');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'CONTACTS mode activated\n' +
                        '** Contacts menu **\n' +
                        'a Add contact\n' +
                        'b List contacts\n' +
                        'c Settings' +
                        'd Tutorial' +
                        '<send option>'
                    );
                });
            });            

            element(by.id('sms')).sendKeys('#etisalat');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'ETISALAT mode activated\n' +
                        '** Etisalat menu **\n' +
                        'a Offers(3)\n' +
                        'b My Account\n' +
                        'c Promotions(5)' +
                        'd Tutorial' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#exchange');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'EXCHANGE mode activated\n' +
                        '** Etisalat menu **\n' +
                        'a Offers(3)\n' +
                        'b My Account\n' +
                        'c Promotions(5)' +
                        'd Tutorial' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#football');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        '** Football status **\n'+
                        'There are no more outcomes to predict this season. New season starts in 6 days\n' +
                        'a Standings\n' +
                        'b Earn more points\n' +
                        'c Manager\n' +
                        '<send option/"back">'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#frenzy');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'FRENZY mode activated\n' +
                        '** Frenzy menu **\n' +
                        'Top players:\n' +
                        'a Standings\n' +
                        'Games:' +
                        'b #football' +
                        'c #goal' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#goal');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'GOAL mode activated\n' +
                        '** Goal free **\n' +
                        'Welcome to #goal! Score and defend penalty kicks!\n' +
                        'Gain Play Points for #football!\n' +
                        'Games:' +
                        'b Play goal' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#goal');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'GOAL mode activated\n' +
                        '** Goal free **\n' +
                        'Welcome to #goal! Score and defend penalty kicks!\n' +
                        'Gain Play Points for #football!\n' +
                        'Games:' +
                        'a Play goal' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#hangman');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'HANGMAN mode activated\n' +
                        '** Hangman menu **\n' +
                        'a New' +
                        'b Tutorial' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#invite');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'INVITE mode activated\n' +
                        '** Invite **\n' +
                        'You do not have any xGroup. To create one send #xgroup create to 333100'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#jokes');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'JOKES mode activated\n' +
                        '** Jokes menu **\n' +
                        'a Start\n' +
                        'b Submit\n' +
                        'c Filter\n' +
                        'd Settings\n' +
                        'e Tutorial\n' +
                        '<send option>'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#msg');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'MSG mode activated\n' +
                        '** Message menu **\n' +
                        '#msg helps you message your friends using their names. After you create contacts and xGroup, they will be shown here and you can choose who to call.\n' +
                        '<"#contacts">'
                    );
                });
            });

            element(by.id('sms')).sendKeys('#news');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'NEWS mode activated\n' +
                        '** News menu **\n' +
                        'a Headlines\n' +
                        'b Categories\n' +
                        'c Search\n' +
                        'd Channel (CNN)\n' +
                        'e Settings\n' +
                        'f Tutorial\n' +
                        '<send option>'
                    );
                });
            });

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

            element(by.id('sms')).sendKeys('#ooreedo');
            element(by.id('sms')).sendKeys(protractor.Key.ENTER).then(function() {
                element.all(by.repeater('obj in results')).then(function(mt) {
                    var message = mt[mt.length - 1].element(by.className('sms-mt-container'));
                    expect(message.getText()).toEqual(
                        'OOREEDO mode activated\n' +
                        '** Ooreedo menu **\n' +
                        'a Offers(2)\n' +
                        'b My Account\n' +
                        'c Promotions(3)\n' +
                        'd Tutorial\n' +
                        '<send option>'
                    );
                });
            });



        });
    });
});