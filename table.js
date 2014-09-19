function table(columnsConfig) {
	const TAB_SIZE = 4;

	var self = this,
		columns = {},
		columnOrder = [],
		rows = [];

	function init(columnsConfig) {
		var column = {};

		for (i in columnsConfig) {
			column = columnsConfig[i];

			addColumn(column.name, column.title, column.format);
		}
	}

	function addColumn(name, title, format) {
		columns[name] = {
			title: title,
			maxLength: title.length,
			format: format
		};

		columnOrder.push(name);

		return this;
	}

	function addRow(obj) {
		var row = {};

		for (column in columns) {
			row[column] = getRow(column, obj);
		}

		rows.push(row);

		return this;
	}

	function getRow(column, obj) {
		var columnObj = columns[column],
			columnFormat = columnObj.format,
			columnValue = (columnFormat)
				? columnFormat(obj, column)
				: obj[column];

		updateColumnMaxLength(columnObj, columnValue);

		return columnValue;
	}

	function updateColumnMaxLength(columnObj, columnValue) {
		var columnValueLength = String(columnValue).length;

		if (columnObj.maxLength < columnValueLength) {
			columnObj.maxLength = columnValueLength;
		}
	}

	function sort() {
		return {
			columns: sortColumns,
			rows: sortRows
		};
	}

	function sortColumns() {
		return {
			asc: sortColumnsAsc,
			desc: sortColumnsDesc
		};
	}

	function sortColumnsAsc() {
		sortColumnsCaseInsensitive();

		return this;
	}

	function sortColumnsCaseInsensitive() {
		return columnOrder.sort(sortCaseInsensitive);
	}

	function sortCaseInsensitive(a, b) {
		if (!isNaN(a)) {
			return sortNumeric(a, b);
		}

		if (a.toLowerCase() < b.toLowerCase()) {
			return -1;
		}

		if (a.toLowerCase() > b.toLowerCase()) {
			return 1;
		}

		return 0;
	}

	function sortNumeric(a, b) {
		return a - b;
	}

	function sortColumnsDesc() {
		sortColumnsCaseInsensitive().reverse();

		return this;
	}

	function sortRows(column) {
		return {
			asc: function() {
				return sortRowsAsc(column);
			},
			desc: function() {
				return sortRowsDesc(column);
			}
		};
	}

	function sortRowsAsc(column) {
		sortRowsByAttrCaseInsensitive(column);

		return this;
	}

	function sortRowsByAttrCaseInsensitive(column) {
		return rows.sort(function(a, b) {
			return sortByAttr(column, a, b);
		});
	}

	function sortByAttr(attr, a, b) {
		var aAttr = a[attr];

		if (!aAttr) {
			return 0;
		}

		return sortCaseInsensitive(aAttr, b[attr]);
	}

	function sortRowsDesc(column) {
		sortRowsByAttrCaseInsensitive(column).reverse();

		return this;
	}

	function print() {
		printHeader();
		printRows();
		printFooter();

		return this;
	}

	function printHeader() {
		printRow(getHeaderRow());
	}

	function getHeaderRow() {
		var header = {};

		for (column in columns) {
			header[column] = columns[column].title;
		}

		return header;
	}

	function printRow(rowObj) {
		var row = '';

		for (i in columnOrder) {
			row += getFormatedColumn(rowObj, columnOrder[i]);
		}

		console.log(row);
	}

	function getFormatedColumn(rowObj, column) {
		var columnWidth = getColumnWidth(columns[column].maxLength),
			columnValue = rowObj[column],
			columnValueLength = String(columnValue).length;

		return columnValue + getSpaces(columnWidth - columnValueLength);
	}

	function getColumnWidth(columnMaxLength) {
		return (Math.ceil(columnMaxLength / TAB_SIZE) * TAB_SIZE) + TAB_SIZE;
	}

	function getSpaces(total) {
		var spaces = '';

		while (total--) {
			spaces += ' ';
		}

		return spaces;
	}

	function printRows() {
		var row = {};

		for (i in rows) {
			printRow(rows[i]);
		}
	}

	function printFooter() {
		console.log('');
	}

	init(columnsConfig);

	return {
		addColumn: addColumn,
		addRow: addRow,
		sort: sort,
		print: print
	}
}

exports.create = function(columnsConfig) {
	return new table(columnsConfig);
}