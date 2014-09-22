var benchmark = function() {
	const SHOULD_DEBUG = false,
		FLAGS = {
			'-c': {
				callback: turnOnCaching,
				option: 'Run with caching.'
			},
			'-r': {
				callback: runAsResponsive,
				option: 'Run at multiple breakpoints.'
			}
		},
		TABLE_ROWS = [
			{
				name: 'rowLabel',
				title: '',
				minWidth: 3
			},
			{
				name: 'DOMContentLoaded',
				title: 'DOMContentLoaded'
			},
			{
				name: 'WindowLoad',
				title: 'WindowLoad'
			}
		];

	var page = require('webpage').create(),
		systemArgs = require('system').args,
		table = require('./table'),
		tables = {
			benchmarks: table.create(TABLE_ROWS),
			stats: table.create(TABLE_ROWS)
		},
		url = '',
		tries = 1,
		triesTotal = tries,
		benchmarks = [],
		currentBenchmark = null,
		stats = require('./stats').create().setPrecision(4);

	page.settings.clearMemoryCaches = true;
	page.settings.webSecurityEnabled = false;
	page.viewportSize = {
		width: 1200,
		height: 800
	};

	function run() {
		checkSystemArgs();
		start();
		loadPage();
	}

	function checkSystemArgs() {
		setSystemArgs();

		if (systemArgs.length < 3) {
			showUsage();
		}
	}

	function showUsage() {
		console.log('Usage:');
		console.log('benchmark.js <url> <tries>');
		phantom.exit(1);
	}

	function setSystemArgs() {
		setSystemFlags();

		url = systemArgs[1];
		tries = parseInt(systemArgs[2]) + 1;
		triesTotal = tries;
	}

	function setSystemFlags() {
		var systemArgsWithoutFlags = systemArgs,
			flagIndex = -1;

		for (flag in FLAGS) {
			flagIndex = systemArgs.indexOf(flag);

			if (flagIndex > 0) {
				FLAGS[flag].callback();
				systemArgsWithoutFlags.splice(flagIndex, 1);
			}
		}

		systemArgs = systemArgsWithoutFlags;
	}

	function turnOnCaching() {
		page.settings.clearMemoryCaches = false;
	}

	function runAsResponsive() {

	}

	function start() {
		tables.benchmarks.live().start();
	}

	function loadPage() {
		if (!tries) {
			finish();
		}

		updateTries();
		addBenchmarkToTable(currentBenchmark);
		page.open(url);
	}

	function finish() {
		tables.benchmarks.live().end();

		addStatsToTable();
		tables.stats.print();

		phantom.exit();
	}

	function addStatsToTable() {
		var statRows = {
				min: 'min',
				avg: 'average',
				max: 'max'
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

	function updateTries() {
		if (currentBenchmarkIsIncomplete()) {
			benchmarks.pop();
			tries++;
		}

		tries--;
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
		loadPage();
	};

	page.onError = function() {
		// SHUT IT.
	}

	return {
		run: run
	}
}();

benchmark.run();