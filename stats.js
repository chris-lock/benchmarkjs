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
	/**
	 * Updates a given stat since we only want to run calculations on demand.
	 *
	 * @param {object} stat The stat to update
	 * @return {object} The precision values from the updated stat
	 */
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
	/**
	 * Updates the stat by reference rather than reassigning it. Updates it's
	 * total, max, and min.
	 *
	 * @param {object} stat The stat to update
	 * @param {int} value The value to add to the stat
	 * @return {void}
	 */
	function updateStatForValue(stat, value) {
		stat.total += value;
		stat.min = getValueMin(stat.min, value);
		stat.max = getValueMax(stat.max, value);
	}
	/**
	 * Checks if the value being added is a new min. If no min is set, the value
	 * is used.
	 *
	 * @param {int} min The current min
	 * @param {int} value The value being added
	 * @return {int} The minimum between the two values
	 */
	function getValueMin(min, value) {
		return getValueInBound('min', min, value);
	}
	/**
	 * Used for max and min. Checks if the bound is set, if not, the new value
	 * is used. Otherwise the value is compared to the current value.
	 *
	 * @param {string} method The math function that determines the bound
	 * @param {int} bound The current bound
	 * @param {int} value The value being added
	 * @return {int} The bound between the two values
	 */
	function getValueInBound(method, bound, value) {
		if (bound === null) {
			return value;
		}

		return Math[method](bound, value);
	}
	/**
	 * Checks if the value being added is a new max. If no max is set, the value
	 * is used.
	 *
	 * @param {int} max The current max
	 * @param {int} value The value being added
	 * @return {int} The maximum between the two values
	 */
	function getValueMax(max, value) {
		return getValueInBound('max', max, value);
	}
	/**
	 * Updates the averages for the entire range, and then the first two
	 * standard deviations. Again by reference.
	 *
	 * @return {void}
	 */
	function updateStatAverage(stat) {
		stat.average = stat.total / stat.values.length;
		stat.standardDeviation = getStandardDeviation(stat);
		stat.averageS1 = getAverageInStandardDeviation(stat, 1);
		stat.averageS2 = getAverageInStandardDeviation(stat, 2);
	}
	/**
	 * Gets the standard deviation for the stat.
	 *
	 * @param {object} stat The stat to get the standard deviation for
	 * @return {int} The standard deviation for the stat
	 */
	function getStandardDeviation(stat) {
		var average = stat.average,
			values = stat.values,
			totalVariance = 0;

		for (i in values) {
			totalVariance += Math.pow(average - values[i], 2);
		}

		return Math.sqrt(totalVariance / values.length);
	}
	/**
	 * Gets the average for a stat within a given number of standard deviations.
	 *
	 * @param {object} stat The stat to get the average for
	 * @param {int} standardDeviations The number of standard deviations to calculate within
	 * @return {int} The average for the stat within the given standard deviations
	 */
	function getAverageInStandardDeviation(stat, standardDeviations) {
		return getArrayAverage(
			getValuesInInStandardDeviation(stat, standardDeviations)
		);
	}
	/**
	 * Gets all the Values for a stat within a given number of standard
	 * deviations.
	 *
	 * @param {object} stat The stat to get the values from
	 * @param {int} standardDeviations The number of standard deviations to get values within
	 * @return {array} The stat values within the given standard deviations
	 */
	function getValuesInInStandardDeviation(stat, standardDeviations) {
		var average = stat.average,
			standardDeviation = stat.standardDeviation * standardDeviations,
			max = average + standardDeviation,
			min = average - standardDeviation;

		return stat.values.filter(function(value) {
			return (value <= max && value >= min);
		});
	}
	/**
	 * Gets the average for an array.
	 *
	 * @param {array} array The array to average
	 * @return {int} The average for the array
	 */
	function getArrayAverage(array) {
		var total = 0;

		for (i in array) {
			total += array[i];
		}

		return total / array.length;
	}
	/**
	 * Refines all the values in a stat to the current precision.
	 *
	 * @param {object} stat The stat to get the average for
	 * @return {object} The precision values for the stat
	 */
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
	/**
	 * Refines a value to the current precision.
	 *
	 * @param {int} value The refine to the current precision
	 * @return {int} The value at the precision
	 */
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