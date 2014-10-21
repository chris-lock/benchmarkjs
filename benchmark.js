/**
 * Checks the DOMContentLoaded and window.load for a url or set of urls.
 *
 * @param {string} Coma delimited string of urls
 * @param {int} Number of page loads to run.
 * @return {void}
 */
var benchmark = function() {
		/** @constant The name of the module. */
	const NAME = 'benchmarkjs',
		/** @constant The flags with the respective methods they run and their descriptions. */
		FLAGS = {
			'-c': {
				callback: turnOnCaching,
				option: 'Run with caching.'
			},
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
		/** @constant The columns of the output table. */
		TABLE_COLUMNS = [
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
		/** @constant The sections breaks in the output file. */
		SECTION_BREAK = '\n\n';

		/** @type {object} PhantomJS page object. */
	var page = require('webpage').create(),
		/** @type {object} System arguments from PhantomJS system object. */
		systemArgs = require('system').args,
		/** @type {object} Table object used for output. */
		tableObj = require('./table'),
		/** @type {object} Stats object used for time stats. */
		statsObj = require('./stats'),
		/** @type {array} The arguments for benchmark.js only. */
		args = [],
		/** @type {array} The urls to test. */
		urls = [],
		/** @type {int} Pointer for the current index in the url array. */
		urlIndex = 0,
		/** @type {int} Unique string used for ouput files and img folders. */
		runTime = 0,
		/** @type {string} The current url being tested. */
		url = '',
		/** @type {int} The current try for the url. */
		tries = 1,
		/** @type {int} The total tries. */
		triesTotal = tries,
		/** @type {array} All the benchmarks.. */
		benchmarks = [],
		/** @type {object} The current benchmark. */
		currentBenchmark = null,
		/** @type {object} The tables for the current url. */
		tables = {},
		/** @type {object} The stats for the current url. */
		stats = {},
		/** @type {bool} Check used when updating tries since page load sometimes fails silently. */
		pagDidLoad = true,
		/** @type {bool} Should we render the pages we load. */
		shouldRender = false,
		/** @type {bool} Should we limit the renders to only the first load. */
		limitRenders = false,
		/** @type {bool} Should we generate a txt for the output. */
		shouldOutput = false,
		/** @type {string} The header of the output txt. */
		outputHeader = '',
		/** @type {string} The body of the output txt. */
		outputBody = '',
		/** @type {string} The footer of the output txt. */
		outputFooter = '';

	/**
	 * Runs benchmarks.
	 *
	 * @return {void}
	 */
	function run() {
		runTime = getTime();

		setPageSettings();
		checkArgs();
		loadUrls();
	}
	/**
	 * Turns off caching. Turns of web security for ads and sets the browser
	 * size.
	 *
	 * @return {void}
	 */
	function setPageSettings() {
		page.settings.clearMemoryCaches = true;
		page.settings.webSecurityEnabled = false;
		page.viewportSize = {
			width: 1200,
			height: 800
		};
	}
	/**
	 * Gets the current unix time.
	 *
	 * @return {int} The current time.
	 */
	function getTime() {
		return (new Date()).getTime();
	}
	/**
	 * Cleans the arguments. Sets any provided flags before checking the number
	 * of arguments since we need to remove flags before we can check. Then sets
	 * the arguments.
	 *
	 * @return {void}
	 */
	function checkArgs() {
		cleanArgs();
		setFlags();

		if (args.length !== 2) {
			showUsage();
		}

		setArgs();
	}
	/**
	 * Removes the benchmark.js argument and any spaces in the coma delimited
	 * string of urls.
	 *
	 * @return {void}
	 */
	function cleanArgs() {
		args = systemArgs
			.filter(isNotSelfArg)
			.join(' ')
			.replace(/,\s*/g, ',')
			.split(' ')
			.filter(isNotEmptyArg);
	}
	/**
	 * Filters out the benchmark.js argument.
	 *
	 * @return {bool} Is the argument the benchmark.js argument
	 */
	function isNotSelfArg(arg) {
		return arg.indexOf('benchmark.js') === -1;
	}
	/**
	 * Filters out any empty array items that might have been left by double
	 * spaces.
	 *
	 * @return {bool} Is the argument empty
	 */
	function isNotEmptyArg(arg) {
		return arg !== '';
	}
	/**
	 * Removes all flags from the arguments array and checks them against the
	 * available flags, firing the callback where applicable.
	 *
	 * @return {void}
	 */
	function setFlags() {
		var flag = {};

		for (requestedFlag in getFlags()) {
			flag = FLAGS[requestedFlag];

			if (flag) {
				flag.callback();
			}
		}
	}
	/**
	 * Gets and removes all the flags in the arguments array.
	 *
	 * @return {object} Object containing keys of the flags
	 */
	function getFlags() {
		var flags = [];

		args = args.filter(function(arg) {
			if (arg[0] !== '-') {
				return true;
			}

			flags.push(arg);
		});

		return getUniqueFlags(flags);
	}
	/**
	 * Gets the unique flags with each prefaced with a -.
	 *
	 * @param {array} flags All flags passed in
	 * @return {object} Object containing keys of the flags
	 */
	function getUniqueFlags(flags) {
		var uniqueFlags = {},
			flagString = '';

		for (i in flags) {
			flagString = flags[i].replace('-', '');

			for (j in flagString) {
				uniqueFlags['-' + flagString[j]] = true;
			}
		}

		return uniqueFlags;
	}
	/**
	 * Turns caching on for subsequent loads.
	 *
	 * @return {void}
	 */
	function turnOnCaching() {
		page.settings.clearMemoryCaches = false;
	}
	/**
	 * Sets the flag to generates a .txt of the output.
	 *
	 * @return {void}
	 */
	function runWithOutput() {
		shouldOutput = true;
	}
	/**
	 * Sets the flag to render a .png for each load.
	 *
	 * @return {void}
	 */
	function runWithRender() {
		shouldRender = true;
	}
	/**
	 * Sets the flag to render a .png for the first load of each url.
	 *
	 * @return {void}
	 */
	function runWithRenderLimited() {
		shouldRender = true;
		limitRenders = true;
	}
	/**
	 * Shows usage if the right number of parameters weren't passed.
	 *
	 * @return {void}
	 */
	function showUsage() {
		console.log('Usage:');
		console.log('benchmark.js <url> <tries>');

		for (flag in FLAGS) {
			console.log('  ' + flag + '\t' + FLAGS[flag].option);
		}

		phantom.exit(1);
	}
	/**
	 * Sets all variables affected by the arguments.
	 *
	 * @return {void}
	 */
	function setArgs() {
		setUrls(
			args[0].split(','),
			parseInt(args[1]) + 1
		);
	}
	/**
	 * Adds url objects to the urls array.
	 *
	 * @return {void}
	 */
	function setUrls(urlArray, tries) {
		for (i in urlArray) {
			urls.push(getUrlObj(urlArray[i], tries));
		}
	}
	/**
	 * Gets a url object containing the url, number of tries, total number of
	 * tries, benchmarks array, benchmarks and stats tables, and stats object.
	 *
	 * @param {string} url The url for the object
	 * @param {int} tries The number tries to load the url
	 * @return {object} Url object
	 */
	function getUrlObj(url, tries) {
		return {
			url: getSafeUrl(url),
			tries: tries,
			triesTotal: tries,
			benchmarks: [],
			tables: {
				benchmarks: tableObj.create(TABLE_COLUMNS),
				stats: tableObj.create(TABLE_COLUMNS)
			},
			stats: statsObj.create().setPrecision(4)
		};
	}
	/**
	 * Makes sure every url starts with http:// or https:// since PhantomJS
	 * loses it's mind if you don't provide that.
	 *
	 * @param {string} url The url
	 * @return {string} The safe url
	 */
	function getSafeUrl(url) {
		return (!/^https?:\/\//i.test(url))
			? 'http://' + url
			: url;
	}
	/**
	 * If we haven't loaded all the urls, set the page vars and load the url. If
	 * we have, generate output if applicable and exit. This is called by finish
	 * at the end of each url pass. generateOutput is called in a conditional
	 * since variable hoisting will require the fs module regardless of
	 * conditionals.
	 *
	 * @return {void}
	 */
	function loadUrls() {
		var urlObj = urls[urlIndex++];

		if (urlObj) {
			setPageVars(urlObj);
			loadUrl();
		} else {
			if (shouldOutput) {
				generateOutput();
			}

			phantom.exit();
		}
	}
	/**
	 * Sets all variables for the current url.
	 *
	 * @param {object} urlObj The url object for the current set of passes.
	 * @return {void}
	 */
	function setPageVars(urlObj) {
		url = urlObj.url;
		tries = urlObj.tries;
		triesTotal = urlObj.triesTotal;
		benchmarks = urlObj.benchmarks;
		tables = urlObj.tables;
		stats = urlObj.stats;

		currentBenchmark = null;
	}
	/**
	 * Calls start on the first pass, updates tries, adds the current benchmark
	 * to the table, and opens the page. If there are no more tries left, it
	 * calls finish.
	 *
	 * @return {void}
	 */
	function loadUrl() {
		if (tries) {
			if (tries === triesTotal) {
				start();
			}

			updateTries();
			addBenchmarkToTable(currentBenchmark);
			page.open(url);
		} else {
			finish();
		}
	}
	/**
	 * Output the current url and starts the live printing of the benchmarks
	 * table.
	 *
	 * @return {void}
	 */
	function start() {
		console.log(url);
		tables.benchmarks.live().start();
	}
	/**
	 * Before we update the try count we need to make sure the page loaded. We
	 * also need to make sure the previous pass didn't fail.
	 *
	 * @return {void}
	 */
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
	/**
	 * We need to check if there even is a benchmark before we can check if it's
	 * complete. Sometimes DOMContentLoaded and WindowLoad don't fire so we need
	 * to retry.
	 *
	 * @return {bool} Is the current benchmark incomplete
	 */
	function currentBenchmarkIsIncomplete() {
		return (currentBenchmark
			&& (
				!currentBenchmark.DOMContentLoaded
				|| !currentBenchmark.WindowLoad
			)
		);
	}
	/**
	 * Adds a benchmark to the benchmarks table, adds it's values to the stats
	 * table, and live prints it's row in the benchmark table.
	 *
	 * @param {object} benchmark The benchmark to add
	 * @return {void}
	 */
	function addBenchmarkToTable(benchmark) {
		if (!benchmark) {
			return;
		}

		var DOMContentLoadedTime = getBenchmarkEventTime(
				benchmark,
				'DOMContentLoaded'
			),
			WindowLoadTime = getBenchmarkEventTime(
				benchmark,
				'WindowLoad'
			);

		addRowToTable(
			'benchmarks',
			triesTotal - benchmark.tries,
			DOMContentLoadedTime,
			WindowLoadTime
		);
		stats.add('DOMContentLoaded', [DOMContentLoadedTime]);
		stats.add('WindowLoad', [WindowLoadTime]);

		tables.benchmarks.live().print();
	}
	/**
	 * Gets the amount of time it took the event to fire for the given event.
	 *
	 * @param {object} benchmark The benchmark object
	 * @param {string} event The event to get the time for
	 * @return {int} The time is took the event to fire
	 */
	function getBenchmarkEventTime(benchmark, event) {
		return (benchmark[event] - benchmark.time) / 1000;
	}
	/**
	 * Adds a row to a given table.
	 *
	 * @param {string} table The name of the table to add the row to
	 * @param {string} rowLabel The value for the row label column
	 * @param {string} DOMContentLoaded The value for the DOMContentLoaded column
	 * @param {string} WindowLoad The value for the WindowLoad column
	 * @return {void}
	 */
	function addRowToTable(table, rowLabel, DOMContentLoaded, WindowLoad) {
		tables[table].addRow({
			rowLabel: rowLabel,
			DOMContentLoaded: DOMContentLoaded,
			WindowLoad: WindowLoad
		});
	}
	/**
	 * Adds a benchmark when the page starts loading. We have to check if it's a
	 * new try since it sometimes fires twice. Maybe AJAX?
	 *
	 * @return {void}
	 */
	page.onLoadStarted = function () {
		if (isNewTry()) {
			addBenchmark(getTime());
		}
	};
	/**
	 * If it's the first try, we have no benchmark. Otherwise, the current
	 * benchmark tries should be different than the tries variable.
	 *
	 * @return {bool} It is a new try
	 */
	function isNewTry() {
		return !currentBenchmark || currentBenchmark.tries !== tries;
	}
	/**
	 * Adds a new benchmark and sets it as the current benchmark.
	 *
	 * @param {int} time The start time the benchmark started
	 * @return {void}
	 */
	function addBenchmark(time) {
		benchmarks.push({
			tries: tries,
			time: time
		});
		currentBenchmark = benchmarks[benchmarks.length - 1];
	}
	/**
	 * Prevents error from being logged during benchmarking.
	 *
	 * @return {void}
	 */
	page.onError = function() {
		// SHUT IT.
	}
	/**
	 * Adds listeners for the document.DOMContentLoaded and window.load events
	 * to get the time they fired.
	 *
	 * @return {void}
	 */
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
	/**
	 * Fired by window.callPhantom to handle callbacks when
	 * document.DOMContentLoaded and window.load fire.
	 *
	 * @param {string} callback The method to fire off the page object.
	 * @return {void}
	 */
	page.onCallback = function(callback) {
		page[callback]();
	};
	/**
	 * Adds the time DOMContentLoaded fired to the benchmark.
	 *
	 * @return {void}
	 */
	page.onDOMContentLoaded = function() {
		updateCurrentBenchmark('DOMContentLoaded');
	};
	/**
	 * Adds the time a event fired to the current benchmark.
	 *
	 * @param {string} event The event to add to the benchmark
	 * @return {void}
	 */
	function updateCurrentBenchmark(event) {
		currentBenchmark[event] = getTime();
	}
	/**
	 * Adds the time WindowLoad fired to the benchmark, renders the page if
	 * applicable, and loads the next url.
	 *
	 * @return {void}
	 */
	page.onWindowLoad = function() {
		updateCurrentBenchmark('WindowLoad');

		renderPage();
		loadUrl();
	};
	/**
	 * Checks to see if we should render and if there are still tries left. Then
	 * checks if we're limiting renders to the first time. If we are, we need to
	 * make sure it's the first pass. Then renders the page.
	 *
	 * @return {void}
	 */
	function renderPage() {
		if (shouldRender && tries) {
			if (!limitRenders || tries === triesTotal - 1) {
				page.render(getRunName() + '-img/' + getSafeFilename(url));
			}
		}
	}
	/**
	 * Gets the unique name for this run.
	 *
	 * @return {string} The run name
	 */
	function getRunName() {
		return NAME + '-' + runTime;
	}
	/**
	 * Converts a url into a safe file name with the try number.
	 *
	 * @param {string} url The url to convert to a file name
	 * @return {string} The safe file name
	 */
	function getSafeFilename(url) {
		return (url + '-' + (triesTotal - tries))
			.replace(/https?:\/\//, '')
			.replace(/[^a-z0-9]/gi, '-')
			.replace(/--*/g, '-') + '.png';
	}
	/**
	 * Prints the end of the live benchmark table. Adds all the stats to the
	 * stat table. Prints that and the output if applicable. Then loads the
	 * next url. addTablesToOutput is called in a conditional because variable
	 * hoisting will cause get to fire on both tables, which is a pretty
	 * expensive process.
	 *
	 * @return {void}
	 */
	function finish() {
		tables.benchmarks.live().end();

		addStatsToTable();
		tables.stats.print();

		if (shouldOutput) {
			addTablesToOutput();
		}

		loadUrls();
	}
	/**
	 * Adds all the applicable stats to the stat table.
	 *
	 * @return {void}
	 */
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
	/**
	 * Adds the given stat for DOMContentLoaded and WindowLoad to the stats
	 * table.
	 *
	 * @param {string} stat The name of the stat to appear in the table
	 * @param {string} method The name of the stat method to fire for the stat
	 * @return {void}
	 */
	function addStatToTable(stat, method) {
		addRowToTable(
			'stats',
			stat,
			stats[method]('DOMContentLoaded'),
			stats[method]('WindowLoad')
		);
	}
	/**
	 * Adds the tables to the output file. The stats for each url are added to
	 * the head, and the entire set of runs is added to the body.
	 *
	 * @return {void}
	 */
	function addTablesToOutput() {
		var urlLine = url + '\n',
			benchmarksTable = tables.benchmarks.get(),
			statsTable = tables.stats.get();

		outputHeader += urlLine + statsTable;
		outputBody += urlLine + benchmarksTable + statsTable + SECTION_BREAK;
	}
	/**
	 * Generates a .txt of the output with the same unique name used for the img
	 * directory.
	 *
	 * @return {void}
	 */
	function generateOutput() {
		var fs = require('fs'),
			name = getRunName() + '.txt',
			content = [
				outputHeader,
				outputBody,
				outputFooter
			].join(SECTION_BREAK);

		fs.write(name, cleanContent(content), 'w');

		console.log('Output generated.')
		console.log(fs.workingDirectory + '/' + name);
	}
	/**
	 * Converts Σ to S since browsers hate Σ.
	 *
	 * @param {string} content The content of the file
	 * @return {string} The clean content
	 */
	function cleanContent(content) {
		return content.split('Σ').join('S');
	}

	return {
		/**
		 * Runs benchmarks.
		 *
		 * @return {void}
		 */
		run: run
	}
}();

// Who run it?
benchmark.run();