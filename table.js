/**
 * Table utility object to build, generate, ouput tables in console or text
 * format.
 *
 * @param {array} columnsConfig An array of object representing column
 * 		{string} name The variable name for the column
 * 		{string} title The printed title for the column
 * 		{int} minWidth (optional) The minimum width for the column
 * 		{function} format (optional) The function to format values with
 * @return {object} Public methods
 */
function table(columnsConfig) {
		/** @constant The numebr of spaces for a tab. */
	const TAB_SIZE = 4;

		/** @type {object} The columns for the table. */
	var columns = {},
		/** @type {array} The order of the columns stored by column name. */
		columnOrder = [],
		/** @type {array} The original order of columns. */
		columnDefaultOrder = columnOrder,
		/** @type {array} The rows for the table. */
		rows = [];

	/**
	 * Adds columns to the table preserving order.
	 *
	 * @param {array} columnsConfig An array of object representing column
	 * @return {void}
	 */
	function init(columnsConfig) {
		for (i in columnsConfig) {
			addColumn(columnsConfig[i]);
		}
	}
	/**
	 * Adds a column. An index can be specified.
	 *
	 * @param {object} column An object representing column
	 * 		{string} name The variable name for the column
	 * 		{string} title The printed title for the column
	 * 		{int} minWidth (optional) The minimum width for the column
	 * 		{function} format (optional) The function to format values with
	 * @param {int} index The index to add the column at
	 * @return {object} Returns this for method chaining
	 */
	function addColumn(column, index) {
		updateColumnOrder(column.name, index);

		columns[column.name] = {
			title: column.title,
			maxLength: getColumnMaxLength(column),
			format: column.format
		};

		return this;
	}
	/**
	 * Updates the columns order by adding the column name to end or the index
	 * if specified.
	 *
	 * @param {string} columnName An array of object representing column
	 * @param {int} index The index to add the column at
	 * @return {void}
	 */
	function updateColumnOrder(columnName, index) {
		if (indexIsValid(index)) {
			columnOrder.splice(index, 0, columnName);
		} else {
			columnOrder.push(columnName);
		}

		columnDefaultOrder = columnOrder;
	}
	/**
	 * Makes sure the index is valid.
	 *
	 * @param {int} index The index to check
	 * @return {bool} The index is valid
	 */
	function indexIsValid(index) {
		return index > -1;
	}
	/**
	 * Sets the max length to the title length or the min width if provided.
	 *
	 * @param {object} column The column object
	 * @return {int} The max length for the column
	 */
	function getColumnMaxLength(column) {
		return Math.max(
			(column.minWidth || 0),
			column.title.length
		);
	}
	function addRow(row) {
		var newRow = {
				index: rows.length
			};

		for (columnName in columns) {
			newRow[columnName] = getRowValue(columnName, row);
		}

		rows.push(newRow);

		return newRow.index;
	}
	function getRowValue(columnName, row) {
		var column = columns[columnName],
			columnValue = (column.format)
				? column.format(row, columnName)
				: row[columnName];

		updateColumnMaxLength(column, columnValue);

		return columnValue;
	}
	function updateColumnMaxLength(column, columnValue) {
		var columnValueLength = String(columnValue).length;

		if (column.maxLength < columnValueLength) {
			column.maxLength = columnValueLength;
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
			reset: resetColumnOrder,
			asc: sortColumnsAsc,
			desc: sortColumnsDesc
		};
	}
	function resetColumnOrder() {
		columnOrder = columnDefaultOrder;
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
			reset: function() {
				return sortRowsAsc('index');
			},
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
	function printRow(row, suppressOutput) {
		return consoleLog(getRow(row), suppressOutput);
	}
	function consoleLog(output, suppressOutput) {
		if (!suppressOutput) {
			console.log(output);
		}

		return output + '\n';
	}
	function getRow(row) {
		var rowOutput = '';

		for (i in columnOrder) {
			rowOutput += getFormatedColumn(row, columnOrder[i]);
		}

		return rowOutput;
	}
	function getFormatedColumn(row, columnName) {
		var columnValue = row[columnName];

		return columnValue + getSpaces(
			getColumnWidth(columnName) - String(columnValue).length
		);
	}
	function getColumnWidth(columnName) {
		var columnMaxLength = columns[columnName].maxLength;

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
		return consoleLog('', suppressOutput);
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

	/**
	 * Init ourself.
	 */
	init(columnsConfig);

	return {
		/**
		 * Adds a column. An index can be specified.
		 *
		 * @param {object} column An object representing column
		 * 		{string} name The variable name for the column
		 * 		{string} title The printed title for the column
		 * 		{int} minWidth (optional) The minimum width for the column
		 * 		{function} format (optional) The function to format values with
		 * @param {int} index The index to add the column at
		 * @return {object} Returns this for method chaining
		 */
		addColumn: addColumn,
		addRow: addRow,
		sort: sort,
		print: printTable,
		live: live,
		get: getTable
	}
}

/**
 * Exports a new table object for NodeJs or PhantomJs.
 *
 * @export {object} New table object
 */
exports.create = function(columnsConfig) {
	return new table(columnsConfig);
}