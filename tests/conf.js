exports.config = {
	params: {
		mid: "\\d{15}"
	},
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['all.js'],
    resultJsonOutputFile: './result.json'
};