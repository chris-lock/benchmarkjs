var benchmark = function() {
	const NAME = 'benchmarkjs',
		SHOULD_DEBUG = false,
		FLAGS = {
			'-c': {
				callback: turnOnCaching,
				option: 'Run with caching.'
			},
			// '-r': {
			// 	callback: runAsResponsive,
			// 	option: 'Run at multiple breakpoints.'
			// },
			'-i': {
				callback: runWithRender,
				option: 'Render a .png for each load.'
			},
			'-l': {
				callback: runWithRenderLimited,
				option: 'Render a .png for the first load of each url.'
			},
			'-o': {
				callback: runWithOutput,
				option: 'Generate a .txt of the output.'
			}
		},
		TABLE_ROWS = [
			{
				name: 'rowLabel',
				title: '',
				minWidth: 6
			},
			{
				name: 'DOMContentLoaded',
				title: 'DOMContentLoaded'
			},
			{
				name: 'WindowLoad',
				title: 'WindowLoad'
			}
		],
		SECTION_BREAK = '\n\n';

	var page = require('webpage').create(),
		systemArgs = require('system').args,
		tableObj = require('./table'),
		statsObj = require('./stats'),
		urls = [],
		urlIndex = 0,
		url = '',
		tries = 1,
		triesTotal = tries,
		benchmarks = [],
		currentBenchmark = null,
		tables = {},
		stats = {},
		pagDidLoad = true,
		shouldRender = false,
		limitRenders = false,
		shouldOutput = false,
		outputHeader = '',
		outputBody = '',
		outputFooter = '';

	page.settings.clearMemoryCaches = true;
	page.settings.webSecurityEnabled = false;
	page.viewportSize = {
		width: 1200,
		height: 800
	};

	function run() {
		checkSystemArgs();
		loadPages();
	}

	function checkSystemArgs() {
		setSystemFlags();

		if (systemArgs.length < 3) {
			showUsage();
		}

		setSystemArgs();
	}

	function setSystemFlags() {
		var flag = {};

		for (requestedFlag in getSystemFlags()) {
			flag = FLAGS[requestedFlag];

			if (flag) {
				flag.callback();
			}
		}
	}

	function getSystemFlags() {
		var systemFlags = [];

		systemArgs = systemArgs.filter(function(arg) {
			if (arg[0] === '-') {
				systemFlags.push(arg);

				return false;
			}

			return true;
		});

		return getUniqueSystemFlag(systemFlags);
	}

	function getUniqueSystemFlag(systemFlags) {
		var uniqueSystemFlags = {},
			systemFlagString = '';

		for (i in systemFlags) {
			systemFlagString = systemFlags[i].replace('-', '');

			for (j in systemFlagString) {
				uniqueSystemFlags['-' + systemFlagString[j]] = true;
			}
		}

		return uniqueSystemFlags;
	}

	function showUsage() {
		console.log('Usage:');
		console.log('benchmark.js <url> <tries>');

		for (flag in FLAGS) {
			console.log('  ' + flag + '\t' + FLAGS[flag].option);
		}

		phantom.exit(1);
	}

	function setSystemArgs() {
		setUrls(
			systemArgs[1].split(','),
			parseInt(systemArgs[2]) + 1
		);
	}

	function turnOnCaching() {
		page.settings.clearMemoryCaches = false;
	}

	function runAsResponsive() {

	}

	function runWithOutput() {
		shouldOutput = true;
	}

	function runWithRender() {
		shouldRender = true;
	}

	function runWithRenderLimited() {
		shouldRender = true;
		limitRenders = true;
	}

	function setUrls(urlArray, tries) {
		for (i in urlArray) {
			urls.push(getUrlObj(urlArray[i], tries));
		}
	}

	function getUrlObj(url, urlTries) {
		return {
			url: url,
			tries: urlTries,
			triesTotal: urlTries,
			benchmarks: [],
			tables: {
				benchmarks: tableObj.create(TABLE_ROWS),
				stats: tableObj.create(TABLE_ROWS)
			},
			stats: statsObj.create().setPrecision(4)
		};
	}

	function loadPages() {
		var urlObj = urls[urlIndex++];

		if (urlObj) {
			setPageVars(urlObj);
			loadPage();
		} else {
			if (shouldOutput) {
				generateOutput();
			}

			phantom.exit();
		}
	}

	function setPageVars(urlObj) {
		url = urlObj.url;
		tries = urlObj.tries;
		triesTotal = urlObj.triesTotal;
		benchmarks = urlObj.benchmarks;
		tables = urlObj.tables;
		stats = urlObj.stats;

		currentBenchmark = null;
	}

	function loadPage() {
		if (tries === triesTotal) {
			start();
		} else if (!tries) {
			finish();
		}

		updateTries();
		addBenchmarkToTable(currentBenchmark);
		page.open(url);
	}

	function start() {
		console.log(url);
		tables.benchmarks.live().start();
	}

	function finish() {
		tables.benchmarks.live().end();

		addStatsToTable();
		tables.stats.print();

		if (shouldOutput) {
			addTablesToOutput();
		}

		loadPages();
	}

	function addStatsToTable() {
		var statRows = {
				'min': 'min',
				'avg': 'average',
				'avg Σ1': 'averageS1',
				'avg Σ2': 'averageS2',
				'max': 'max'
			};

		for (statRow in statRows) {
			addStatToTable(statRow, statRows[statRow]);
		}
	}

	function addStatToTable(stat, method) {
		addRowToTable(
			'stats',
			stat,
			stats[method]('DOMContentLoaded'),
			stats[method]('WindowLoad')
		);
	}

	function addRowToTable(table, rowLabel, DOMContentLoaded, WindowLoad) {
		tables[table].addRow({
			respsonsive1200: '-',
			respsonsive768: '-',
			respsonsive320: '-',
			rowLabel: rowLabel,
			DOMContentLoaded: DOMContentLoaded,
			WindowLoad: WindowLoad
		});
	}

	function addTablesToOutput() {
		var urlLine = url + '\n',
			benchmarksTable = tables.benchmarks.get(),
			statsTable = tables.stats.get();

		outputHeader += urlLine + statsTable;
		outputBody += urlLine + benchmarksTable + statsTable + SECTION_BREAK;
	}

	function updateTries() {
		if (pagDidLoad) {
			if (currentBenchmarkIsIncomplete()) {
				benchmarks.pop();
				tries++;
			}

			pagDidLoad = false;
			tries--;
		}
	}

	function currentBenchmarkIsIncomplete() {
		return (currentBenchmark
			&& (
				!currentBenchmark.DOMContentLoaded
				|| !currentBenchmark.WindowLoad
			)
		);
	}

	function addBenchmarkToTable(benchmark) {
		if (!benchmark) {
			return;
		}

		var DOMContentLoadedTime = getBenchmarkAttrTime(
				benchmark,
				'DOMContentLoaded'
			),
			WindowLoadTime = getBenchmarkAttrTime(
				benchmark,
				'WindowLoad'
			);

		addRowToTable(
			'benchmarks',
			triesTotal - benchmark.tries,
			DOMContentLoadedTime,
			WindowLoadTime
		);
		stats.add('DOMContentLoaded', DOMContentLoadedTime);
		stats.add('WindowLoad', WindowLoadTime);

		tables.benchmarks.live().print();
	}

	function getBenchmarkAttrTime(benchmark, attr) {
		return (benchmark[attr] - benchmark.time) / 1000;
	}

	page.onLoadStarted = function () {
		if (isNewTry()) {
			addBenchmark(getTime());
		}
	};

	function isNewTry() {
		return !currentBenchmark || currentBenchmark.tries !== tries;
	}

	function getTime() {
		return (new Date()).getTime();
	}

	function addBenchmark(time) {
		benchmarks.push({
			tries: tries,
			time: time
		});
		currentBenchmark = benchmarks[benchmarks.length - 1];
	}

	page.onInitialized = function() {
		pagDidLoad = true;

		page.evaluate(function() {
			document.addEventListener('DOMContentLoaded', function load() {
				document.removeEventListener('DOMContentLoaded', load, false);

				window.callPhantom('onDOMContentLoaded');
			}, false);

			window.addEventListener('load', function load() {
				window.removeEventListener('load', load, false);

				window.callPhantom('onWindowLoad');
			}, false);
		});
	};

	page.onCallback = function(callback) {
		page[callback]();
	};

	page.onDOMContentLoaded = function() {
		updateCurrentBenchmark('DOMContentLoaded');
	};

	function updateCurrentBenchmark(attr) {
		currentBenchmark[attr] = getTime();
	}

	page.onWindowLoad = function() {
		updateCurrentBenchmark('WindowLoad');

		renderPage();
		loadPage();
	};

	function renderPage() {
		if (shouldRender && tries) {
			if (!limitRenders || tries === triesTotal - 1) {
				page.render(NAME + '-img/' + getSafeUrl(url, tries) + '.png');
			}
		}
	}

	function getSafeUrl(url) {
		return (url + '-' + (triesTotal - tries))
			.split('http://').join('')
			.split('/').join('-')
			.split('--').join('-');
	}

	page.onError = function() {
		// SHUT IT.
	}

	function generateOutput() {
		var fs = require('fs'),
			name = NAME + '-' + getTime() + '.txt',
			content = [
				outputHeader,
				outputBody,
				outputFooter
			].join(SECTION_BREAK);

		fs.write(name, getCleanContent(content), 'w');

		console.log('Output generated.')
		console.log(fs.workingDirectory + '/' + name);
	}

	function getCleanContent(content) {
		return content.split('Σ').join('S');
	}

	return {
		run: run
	}
}();

benchmark.run();