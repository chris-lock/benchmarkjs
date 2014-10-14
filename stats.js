/**
 * Stats utility object to getting total, min, max, and average.
 *
 * @return {object} Public methods
 */
function stats() {
		/** @type {object} All the stats being tracked. */
	var stats = {},
		/** @type {int} The number of decimals to calculate to. */
		precisionScalar = null;

	/**
	 * Sets the number of decimals to calculate to.
	 *
	 * @param {int} newPrecision The number of decimals to calculate to
	 * @return {object} Returns this for method chaining
	 */
	function setPrecision(newPrecision) {
		precisionScalar = Math.pow(10, newPrecision);

		resetStatsPrecision();

		return this;
	}
	function resetStatsPrecision() {
		for (stat in stats) {
			resetStatPrecision(stats[stat]);
		}
	}
	function resetStatPrecision(stat) {
		delete stat.precision;
	}
	function addValue(name, value) {
		var stat = stats[name] || addStat(name);

		if (value instanceof Array) {
			stat.values = stat.values.concat(value);
		} else {
			stat.values.push(value);
		}

		return this;
	}
	function addStat(name) {
		stats[name] = {
			values: [],
			pointer: 0,
			total: null,
			min: null,
			max: null,
			average: null,
			standardDeviation: null,
			averageS1: null,
			averageS2: null
		}

		return stats[name];
	}
	function getTotal(name) {
		return getStatType(name, 'total');
	}
	function getStatType(name, type) {
		var stat = stats[name];

		if (!stat) {
			return;
		}

		return updateStat(stat)[type];
	}
	function updateStat(stat) {
		var size = stat.values.length;

		if (stat.pointer < size) {
			resetStatPrecision(stat);

			while (stat.pointer < size) {
				updateStatForValue(
					stat,
					stat.values[stat.pointer++]
				);
			}

			updateStatAverage(stat);
		}

		return getStatPrecision(stat);
	}
	function updateStatForValue(stat, value) {
		stat.total += value;
		stat.min = getValueMin(stat.min, value);
		stat.max = getValueMax(stat.max, value);
	}
	function getValueMin(min, value) {
		return getValueBound('min', min, value);
	}
	function getValueBound(method, bound, value) {
		if (bound === null) {
			return value;
		}

		return Math[method](bound, value);
	}
	function getValueMax(max, value) {
		return getValueBound('max', max, value);
	}
	function updateStatAverage(stat) {
		stat.average = stat.total / stat.values.length;
		stat.standardDeviation = getStandardDeviation(stat);
		stat.averageS1 = getAverageInStandardDeviation(stat, 1);
		stat.averageS2 = getAverageInStandardDeviation(stat, 2);
	}
	function getStandardDeviation(stat) {
		var average = stat.average,
			values = stat.values,
			totalVariance = 0;

		for (i in values) {
			totalVariance += Math.pow(average - values[i], 2);
		}

		return Math.sqrt(totalVariance / values.length);
	}
	function getAverageInStandardDeviation(stat, standardDeviations) {
		return getArrayAverage(
			getValuesInInStandardDeviation(stat, standardDeviations)
		);
	}
	function getValuesInInStandardDeviation(stat, standardDeviations) {
		var average = stat.average,
			standardDeviation = stat.standardDeviation * standardDeviations,
			max = average + standardDeviation,
			min = average - standardDeviation;

		return stat.values.filter(function(value) {
			return (value <= max && value >= min);
		});
	}
	function getArrayAverage(array) {
		var total = 0;

		for (i in array) {
			total += array[i];
		}

		return total / array.length;
	}
	function getStatPrecision(stat) {
		if (!stat.precision) {
			stat.precision = {
				total: calculateForPrecision(stat.total),
				min: calculateForPrecision(stat.min),
				max: calculateForPrecision(stat.max),
				average: calculateForPrecision(stat.average),
				averageS1: calculateForPrecision(stat.averageS1),
				averageS2: calculateForPrecision(stat.averageS2)
			};
		}

		return stat.precision;
	}
	function calculateForPrecision(value) {
		if (precisionScalar === null || value === null) {
			return value;
		}

		return Math.round(value * precisionScalar) / precisionScalar;
	}
	function getMin(name) {
		return getStatType(name, 'min');
	}
	function getMax(name) {
		return getStatType(name, 'max');
	}
	function getAverage(name) {
		return getStatType(name, 'average');
	}
	function getAverageS1(name) {
		return getStatType(name, 'averageS1');
	}
	function getAverageS2(name) {
		return getStatType(name, 'averageS2');
	}

	return {
		/**
		 * Sets the number of decimals to calculate to.
		 *
		 * @param {int} newPrecision The number of decimals to calculate to
		 * @return {object} Returns this for method chaining
		 */
		setPrecision: setPrecision,
		add: addValue,
		total: getTotal,
		min: getMin,
		max: getMax,
		average: getAverage,
		averageS1: getAverageS1,
		averageS2: getAverageS2
	}
}

/**
 * Exports a new stats object for NodeJs or PhantomJs.
 *
 * @export {object} New stats object
 */
exports.create = function() {
	return new stats();
}