ONEmSimModule.constant('ServicesConfig',
    {
        services: [
            { name: ['onem'], icon: 'home' },
            { name: ['phone'], icon: 'call', template: 'partials/onemSim.html', blockRequest: true, always: true, call: true },
            { name: ['account'], icon: 'account' },
            { name: ['call'], icon: 'call' },
            { name: ['subscribe'], icon: 'subscribe' },
            { name: ['market'], icon: 'cart', default: true },
            { name: ['wallet'], icon: 'wallet' },
            { name: ['msg'], icon: 'message' },
            { name: ['xgroup'], icon: 'xgroup' },
     //       { name: ['translate'], icon: 'translate' },
            { name: ['post'], icon: 'post' },
            { name: ['wiki'], icon: 'wikipedia' },
            { name: ['jokes'], icon: 'jokes' },
            { name: ['radio'], icon: 'radio' },
            { name: ['france24'], icon: 'france24' },
            { name: ['football'], icon: 'football' },
            { name: ['dw'], icon: 'dw' },
            { name: ['weather'], icon: 'weather' },
            { name: ['time'], icon: 'clock' },
            { name: ['stock'], icon: 'chartgrow' },
            { name: ['crossword'], icon: 'crossword' },
            { name: ['convert'], icon: 'convert' },
            { name: ['quotes'], icon: 'quotes' },
            { name: ['mcat'], icon: 'mcatalog' },
            { name: ['exchange'], icon: 'exchange' },
            { name: ['contacts'], icon: 'contacts' },
            { name: ['unsubscribe'], icon: 'unsubscribe' }
        ],
        goCommand: ['go']
    }
);