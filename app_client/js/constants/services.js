ONEmSimModule.constant('ServicesConfig',
    {
        services: [
            { name: ['onem'], icon: 'home' },
            { name: ['call'], icon: 'call', template: 'partials/onemSim.html', call: true },
            { name: ['account'], icon: 'account' },
            { name: ['subscribe'], icon: 'subscribe' },
            { name: ['market'], icon: 'cart', default: true },
            { name: ['wallet'], icon: 'wallet' },
            { name: ['msg'], icon: 'message' },
            { name: ['xgroup'], icon: 'xgroup' },
     //       { name: ['translate'], icon: 'translate' },
            { name: ['post'], icon: 'post' },
            { name: ['wiki'], icon: 'wikipedia' },
            { name: ['france24'], icon: 'france24' },
            { name: ['football'], icon: 'football' },
            { name: ['dw'], icon: 'dw' },
            { name: ['weather'], icon: 'weather' },
            { name: ['time'], icon: 'clock' },
            { name: ['stock'], icon: 'chartgrow' },
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