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
	 * Sets the number of decimals to calculate to, and resets the precision
	 * calculations if any have been set.
	 *
	 * @param {int} newPrecision The number of decimals to calculate to
	 * @return {object} Returns this for method chaining
	 */
	function setPrecision(newPrecision) {
		precisionScalar = Math.pow(10, newPrecision);

		resetStatsPrecision();

		return this;
	}
	/**
	 * Resets the precision calculations for all stats.
	 *
	 * @return {void}
	 */
	function resetStatsPrecision() {
		for (stat in stats) {
			resetStatPrecision(stats[stat]);
		}
	}
	/**
	 * Resets the precision calculations for a given stat.
	 *
	 * @param {object} stat The stat object
	 * @return {void}
	 */
	function resetStatPrecision(stat) {
		delete stat.precision;
	}
	/**
	 * Adds a set of values to a given stat. If the stat doesn't exist, we
	 * create it.
	 *
	 * @param {string} name The name of the stat to add the values to
	 * @param {array} values The values to add
	 * @return {object} Returns this for method chaining
	 */
	function addValue(name, values) {
		var stat = stats[name] || addStat(name);

		stat.values = stat.values.concat(values);

		return this;
	}
	/**
	 * Creates a new stat object with the given name.
	 *
	 * @param {string} name The name of the stat to create
	 * @return {object} The added stat
	 */
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
	/**
	 * Gets the total for a given stat.
	 *
	 * @param {string} name The name of the stat to get the total for
	 * @return {int} The total for the stat
	 */
	function getTotal(name) {
		return getStatType(name, 'total');
	}
	/**
	 * Gets the given type value for a given stat if the stat exists.
	 *
	 * @param {string} name The name of the stat to get the type value for
	 * @param {string} type The type value to get
	 * @return {int} The value for the type for the stat
	 */
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
	/**
	 * Gets the min for a given stat.
	 *
	 * @param {string} name The name of the stat to get the min for
	 * @return {int} The min for the stat
	 */
	function getMin(name) {
		return getStatType(name, 'min');
	}
	/**
	 * Gets the max for a given stat.
	 *
	 * @param {string} name The name of the stat to get the max for
	 * @return {int} The max for the stat
	 */
	function getMax(name) {
		return getStatType(name, 'max');
	}
	/**
	 * Gets the average for a given stat.
	 *
	 * @param {string} name The name of the stat to get the average for
	 * @return {int} The average for the stat
	 */
	function getAverage(name) {
		return getStatType(name, 'average');
	}
	/**
	 * Gets the average within the first standard deviation for a given stat.
	 *
	 * @param {string} name The name of the stat to get the one sigma average for
	 * @return {int} The one sigma average for the stat
	 */
	function getAverageS1(name) {
		return getStatType(name, 'averageS1');
	}
	/**
	 * Gets the average within the second standard deviation for a given stat.
	 *
	 * @param {string} name The name of the stat to get the two sigma average for
	 * @return {int} The two sigma average for the stat
	 */
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
		/**
		 * Adds a set of values to a given stat. If the stat doesn't exist, we
		 * create it.
		 *
		 * @param {string} name The name of the stat to add the values to
		 * @param {array} values The values to add
		 * @return {object} Returns this for method chaining
		 */
		add: addValue,
		/**
		 * Gets the total for a given stat.
		 *
		 * @param {string} name The name of the stat to get the total for
		 * @return {int} The total for the total
		 */
		 total: getTotal,
		/**
		 * Gets the min for a given stat.
		 *
		 * @param {string} name The name of the stat to get the min for
		 * @return {int} The total for the min
		 */
		 min: getMin,
		/**
		 * Gets the max for a given stat.
		 *
		 * @param {string} name The name of the stat to get the max for
		 * @return {int} The total for the max
		 */
		 max: getMax,
		/**
		 * Gets the average for a given stat.
		 *
		 * @param {string} name The name of the stat to get the average for
		 * @return {int} The total for the average
		 */
		 average: getAverage,
		/**
		 * Gets the average within the first standard deviation for a given stat.
		 *
		 * @param {string} name The name of the stat to get the one sigma average for
		 * @return {int} The total for the one sigma average
		 */
		 averageS1: getAverageS1,
		/**
		 * Gets the average within the second standard deviation for a given stat.
		 *
		 * @param {string} name The name of the stat to get the two sigma average for
		 * @return {int} The total for the two sigma average
		 */
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