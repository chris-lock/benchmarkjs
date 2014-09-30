function stats() {
	var stats = {},
		precisionScalar = null;

	function setPrecision(newPrecision) {
		precisionScalar = Math.pow(10, newPrecision);

		resetStats();

		return this;
	}

	function resetStats() {
		for (stat in stats) {
			stats[stat].pointer = 0;
		}
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
		var size = stat.values.length,
			value = null,
			standardDeviation = null;

		if (stat.pointer < size) {
			while (stat.pointer < size) {
				value = stat.values[stat.pointer];

				stat.total += value;
				stat.min = getValueMin(stat.min, value);
				stat.max = getValueMax(stat.max, value);

				stat.pointer++;
			}

			stat.average = stat.total / size;
			standardDeviation = getStandardDeviation(stat.values, stat.average);

			stat.averageS1 = getAverageInStandardDeviation(
				stat.values,
				stat.average,
				standardDeviation
			);
			stat.averageS2 = getAverageInStandardDeviation(
				stat.values,
				stat.average,
				standardDeviation * 2
			);
		}

		return setStatPrecision(stat);
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

	function getStandardDeviation(values, average) {
		var totalVariance = 0,
			difference = null;

			for (i in values) {
				difference = average - values[i];
				totalVariance += difference * difference;
			}

			return Math.sqrt(totalVariance / values.length);
	}

	function getAverageInStandardDeviation(values, average, standardDeviation) {
		var valuesInInStandardDeviation = values.filter(function(value) {
				if (value <= average + standardDeviation
					&& value >= average - standardDeviation
				) {
					return true;
				}

				return false;
			});

		return getArrayAverage(valuesInInStandardDeviation);
	}

	function getArrayAverage(array) {
		var total = 0;

		for (i in array) {
			total += array[i];
		}

		return total / array.length;
	}

	function setStatPrecision(stat) {
		stat.precision = {
			total: calculateForPrecision(stat.total),
			min: calculateForPrecision(stat.min),
			max: calculateForPrecision(stat.max),
			average: calculateForPrecision(stat.average),
			averageS1: calculateForPrecision(stat.averageS1),
			averageS2: calculateForPrecision(stat.averageS2)
		};

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

exports.create = function() {
	return new stats();
}