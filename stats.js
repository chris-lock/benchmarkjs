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

		stat.values.push(value);

		return this;
	}

	function addStat(name) {
		stats[name] = {
			values: [],
			pointer: 0,
			total: null,
			min: null,
			max: null,
			average: null
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

		return updateStat(stat).precision[type];
	}

	function updateStat(stat) {
		var statSize = stat.values.length,
			statValue = null;

		if (stat.pointer < statSize) {
			while (stat.pointer < statSize) {
				statValue = stat.values[stat.pointer];

				stat.total += statValue;
				stat.min = getValueMin(stat.min, statValue);
				stat.max = getValueMax(stat.max, statValue);

				stat.pointer++;
			}

			stat.average = stat.total / statSize;

			setStatPrecision(stat);
		}

		return stat;
	}

	function getValueMin(statCurrent, statValue) {
		return getValueBound('min', statCurrent, statValue);
	}

	function getValueBound(method, statCurrent, statValue) {
		if (statCurrent === null) {
			return statValue;
		}

		return Math[method](statCurrent, statValue);
	}

	function getValueMax(statCurrent, statValue) {
		return getValueBound('max', statCurrent, statValue);
	}

	function setStatPrecision(stat) {
		stat.precision = {
			total: calculateForPrecision(stat.total),
			min: calculateForPrecision(stat.min),
			max: calculateForPrecision(stat.max),
			average: calculateForPrecision(stat.average)
		};
	}

	function calculateForPrecision(value) {
		if (precisionScalar === null) {
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

	return {
		setPrecision: setPrecision,
		add: addValue,
		total: getTotal,
		min: getMin,
		max: getMax,
		average: getAverage
	}
}

exports.create = function() {
	return new stats();
}