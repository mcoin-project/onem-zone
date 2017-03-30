exports.config = {
	params: {
		mid: "\\d{15}",
		word: ".*",
		words: ".*",
		onemName: "[A-Za-z0-9_.-]+",
	},
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['account.js'],
    resultJsonOutputFile: './result.json'
};