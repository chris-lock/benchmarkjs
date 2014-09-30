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

			addColumn(column.name, column.title, column.format, column.minWidth);
		}
	}

	function addColumn(name, title, format, minWidth) {
		var minWidthInt = minWidth || 0,
			maxLength = Math.max(title.length, minWidthInt);

		columns[name] = {
			title: title,
			maxLength: maxLength,
			format: format
		};

		columnOrder.push(name);

		return this;
	}

	function addRow(obj) {
		var rowIndex = rows.length,
			row = {
				index: rowIndex
			};

		for (column in columns) {
			row[column] = getRowValue(column, obj);
		}

		rows.push(row);

		return rowIndex;
	}

	function getRowValue(column, obj) {
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

	function printTable() {
		printHeader();
		printRows();
		printFooter();

		return this;
	}

	function printHeader(suppressOutput) {
		return printRow(getHeaderRow(), suppressOutput);
	}

	function getHeaderRow() {
		var header = {};

		for (column in columns) {
			header[column] = columns[column].title;
		}

		return header;
	}

	function printRow(rowObj, suppressOutput) {
		var row = getRow(rowObj);

		consoleLog(row, suppressOutput)

		return row + '\n';
	}

	function consoleLog(output, suppressOutput) {
		if (!suppressOutput) {
			console.log(output);
		}
	}

	function getRow(rowObj) {
		var row = '';

		for (i in columnOrder) {
			row += getFormatedColumn(rowObj, columnOrder[i]);
		}

		return row;
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

	function printRows(suppressOutput) {
		var allRows = '';

		for (i in rows) {
			allRows += printRow(rows[i], suppressOutput);
		}

		return allRows;
	}

	function printFooter(suppressOutput) {
		consoleLog('', suppressOutput);

		return '\n';
	}

	function live() {
		return {
			start: printHeader,
			print: printCurrentRow,
			end: printFooter
		};
	}

	function printCurrentRow() {
		printRow(rows[rows.length - 1]);
	}

	function getTable() {
		return printHeader(true) + printRows(true) + printFooter(true);
	}

	function getHeader() {

	}

	init(columnsConfig);

	return {
		addColumn: addColumn,
		addRow: addRow,
		sort: sort,
		print: printTable,
		live: live,
		get: getTable
	}
}

exports.create = function(columnsConfig) {
	return new table(columnsConfig);
}