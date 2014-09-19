var benchmark = function() {
	const SHOULD_DEBUG = false,
		TABLE_ROWS = [
			{
				name: 'rowLabel',
				title: ''
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

	function run() {
		setSystemArgs();
		loadPage();
	}

	function setSystemArgs() {
		var systemArgsLength = systemArgs.length;

		if (systemArgsLength < 3 || systemArgsLength > 4) {
			showUsage();
		}

		url = systemArgs[1];
		tries = systemArgs[2];
		triesTotal = tries;

		if (systemArgsLength === 4) {
			page.settings.clearMemoryCaches = systemArgs[3];
		}
	}

	function showUsage() {
		console.log('Usage:');
		console.log('benchmark.js <url> <tries> <clearMemoryCaches>(optional)');
		phantom.exit(1);
	}

	function loadPage() {
		if (!tries) {
			finish();
		}

		updateTries();
		page.open(url);
	}

	function finish() {
		addBenchmarksToTable();
		addStatsToTable();

		// tables.benchmarks.sort().rows('rowLabel').asc();

		for(table in tables) {
			tables[table].print();
		}

		phantom.exit();
	}

	function addBenchmarksToTable() {
		for (i in benchmarks) {
			addBenchmarkToTable(benchmarks[i]);
		}
	}

	function addBenchmarkToTable(benchmark) {
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
	}

	function getBenchmarkAttrTime(benchmark, attr) {
		return (benchmark[attr] - benchmark.time) / 1000;
	}

	function addRowToTable(table, rowLabel, DOMContentLoaded, WindowLoad) {
		tables[table].addRow({
			rowLabel: rowLabel,
			DOMContentLoaded: DOMContentLoaded,
			WindowLoad: WindowLoad
		});
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

	function updateTries() {
		if (currentBenchmark) {
			if (!currentBenchmark.DOMContentLoaded
				|| !currentBenchmark.WindowLoad
			) {
				benchmarks.pop();
			}
		}

		tries--;
	}

	page.onLoadStarted = function () {
		addBenchmark(getTime());
	};

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
		updateCurrentBenchmark('DOMContentLoaded', getTime());
	};

	function updateCurrentBenchmark(attr, value) {
		currentBenchmark[attr] = value;
	}

	page.onWindowLoad = function() {
		updateCurrentBenchmark('WindowLoad', getTime());
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