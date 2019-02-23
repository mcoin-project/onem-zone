ONEmSimModule.factory('MtText', function () {
	const FOOTER_PREFIX = '--';
	const PAGING_PREFIX = '..';
	const FOOTER_THRESHOLD = 25;  // if long footer, it probably has instructions needing specialised input
	const WORD_THRESHOLD = '6'; // max number of words in an option

	function Text(text) {
		this.initialize(text);
	}

	Text.prototype.initialize = function (text) {

		this.text = text;
		this.lines = this.text.split('\n');
		for (var i = 0; i < this.lines.length; i++) {
			this.lines[i] = this.lines[i].trim();
		}

		console.log(this.lines)

		this.header = this.getHeader();
		this.footer = this.getFooter();
		this.preBody = this.getPreBody();
		this.body = this.getBody();
		this.buttons = this.getButtons();
		this.breadcrumbs = this.getBreadcrumbs();
		this.pages = this.getPages();
		this.options = this.hasOptions();
		console.log("initialized");
		console.log(this);
	}

	Text.prototype.hideInput = function () {
		var result = false;

		if (!this.footer) return false;

		if (this.options && this.preBody.length == 0 && this.footer.length <= FOOTER_THRESHOLD) {
			result = true;
		};
		var onlyActions = this.footer.match(/([A-Z //]+)/gm);
		if (onlyActions && onlyActions.length > 0 && onlyActions[0].length == this.footer.length) {
			result = true;
		}
		return result;
	}

	Text.prototype.getBreadcrumbs = function () {

		var result = [];

		if (!this.header) return result;

		var words = this.header.match(/\S+\s*/gm);
		if (words && words.length > 0) {
			result.push(words[0].toUpperCase().trim());
			var rest = "";
			for (var i = 1; i < words.length; i++) {
				rest += words[i];
			}
			if (rest.length > 0) {
				result.push(rest.toUpperCase().trim());
			}
		}
		return result;
	}

	Text.prototype.getHeader = function () {
		if (!this.lines || this.lines.length == 0) {
			return undefined;
		}
		if (this.lines[0].startsWith('#')) {
			return this.lines[0];
		} else {
			return undefined;
		}
	}

	Text.prototype.getPages = function () {
		var result = {};
		for (var i = 0; i < this.lines.length; i++) {
			if (this.lines[i].startsWith(PAGING_PREFIX)) {
				var p = this.lines[i].split('/');
				if (p.length > 1) {
					result = {};
					result.currentPage = parseInt(p[0].slice(2));
					result.numPages = parseInt(p[1]);
					break;
				}
			}
		}
		return result;
	}

	Text.prototype.hasHeader = function () {
		if (!this.lines || this.lines.length == 0) {
			return false;
		}
		return this.getHeader() ? true : false;
	}

	Text.prototype.getFooter = function () {
		if (!this.lines || this.lines.length == 0) {
			return undefined;
		}
		var lastLine = this.lines[this.lines.length - 1];

		// footer must start with '--' AND must contain more than just upper case letters or '/'  
		if (lastLine.startsWith('--')) {
			lastLine = lastLine.slice(2);
			return lastLine;
		} else {
			return undefined;
		}
	}

	Text.prototype.isFooter = function (lineNumber) {

		if (!lineNumber || lineNumber > this.lines.length - 1) return false;

		var text = this.lines[lineNumber];

		if (!text) return false;

		return text.startsWith(FOOTER_PREFIX) || text.startsWith(PAGING_PREFIX) ? true : false;
	}

	Text.prototype.getOption = function (lineNumber) {
		var optionsDescLetterRegEx = /^([A-Z]) ([A-Z#a-z].+)/gm;
		var optionNumbersRegex = /^(\d+) ([A-Z#a-z].+)/gm;
		var sectionNumbersRegex = /^\d+[\.\d]+ ([A-Z#a-z].+)/gm;
		var result;
		if (!lineNumber || lineNumber > this.lines.length - 1) return undefined;

		var text = this.lines[lineNumber];
		var no = optionNumbersRegex.exec(text);
		var no1 = optionsDescLetterRegEx.exec(text);
		var no2 = sectionNumbersRegex.exec(text);

console.log("no");
console.log(no);

		if (no && no[2] && no[2].split(' ').length <= WORD_THRESHOLD) {
			var option = no[1].trim();
			var desc = no[2].trim();
			result = { option: option, desc: desc };
		} else if (no1 && no1[2] && no1[2].split(' ').length <= WORD_THRESHOLD) {
			var option = no1[1].trim();
			var desc = no1[2].trim();
			result = { option: option, desc: desc };
		} else if (no2 && no2[1] && no2[1].split(' ').length <= WORD_THRESHOLD) {
			var option = no2[0].trim();
			var desc = no2[1].trim();
			result = { option: option, desc: desc };
		}

		return result;

	}

	Text.prototype.hasOptions = function () {
		var i = 0;
		var result = false;

		//console.log(this.lines);

		for (var i = 0; i < this.lines.length; i++) {
			if (this.getOption(i)) {
				result = true;
				break;
			}
		}
		return result;

		// there is at least one option
	}

	Text.prototype.getButtons = function () {
		var result = this.lines[this.lines.length - 1].match(/\b[A-Z]+[A-Z]+\b/gm) || null;
		if (!result) result = [];
		return result;
	}

	Text.prototype.getPreBody = function () {
		// skip the header if present
		var result = [];

		var start = 0;
		var i;
		if (this.hasHeader() && this.lines[1]) start = 1;

		// check if it's an error message and include in prebody and return
		if (!this.footer && !this.options) {
			if (start == 0) {
				return this.lines;
			} else {
				return this.lines.slice(1);
			}
		}

		i = start;

		// skip to the first option
		while (!this.getOption(i) && i < this.lines.length && !this.isFooter(i)) {
			result.push(this.lines[i]);
			i++;
		}
		if (i == this.lines.length) return [];

		return result;
		// there is at least one option

	}

	// body has at least one option otherwise it's classed as a pre-body.
	// So this function returns lines of objects starting with the first option until the last option
	Text.prototype.getBody = function () {
		var start = 0;
		var i;
		var result = [];

		// skip the header if present
		if (this.hasHeader() && this.lines[1]) start = 1;

		i = start;

		// skip to the first option
		while (!this.getOption(i) && i < this.lines.length) {
			i++;
		}
		if (i == this.lines.length) return [];

		// there is at least one option
		var opt = this.getOption(i);

		var options = [];
		while (!this.isFooter(i) && i < this.lines.length) {

			var o = {};

			if (!opt) {
				if (options.length > 0) {
					o = {
						type: "options",
						options: options
					}
					result.push(o);
					options = [];
				};
				o = {
					type: "content",
					options: undefined,
					content: this.lines[i]
				};
				result.push(o);

			} else {
				o = {
					desc: opt.desc,
					option: opt.option,
				};
				options.push(o);
			}
			i++;
			if (i < this.lines.length && !this.isFooter(i)) {
				opt = this.getOption(i);
			} else if (!this.isFooter(i - 1)) {
				o = {
					type: "options",
					options: options,
				};
				result.push(o);
			}
		}
		return result;
	}

	return Text;
});
