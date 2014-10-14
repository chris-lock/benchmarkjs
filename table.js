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
	/**
	 * Adds a row to the table. The row object for have attributes that match
	 * the column names not titles.
	 *
	 * @param {object} row The row to add
	 * @return {int} The index of the row added
	 */
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
	/**
	 * Gets the column value for the row. Formats it if the column has a format,
	 * and updates the column max.
	 *
	 * @param {string} columnName The name of the column to get the value for
	 * @param {object} row The row being added
	 * @return {string} The column value
	 */
	function getRowValue(columnName, row) {
		var column = columns[columnName],
			columnValue = (column.format)
				? column.format(row, columnName)
				: row[columnName];

		updateColumnMaxLength(column, columnValue);

		return columnValue;
	}
	/**
	 * Updates the column max length for the value being added if it's longer.
	 *
	 * @param {object} column The column object
	 * @param {string} columnValue The value being added
	 * @return {void}
	 */
	function updateColumnMaxLength(column, columnValue) {
		var columnValueLength = String(columnValue).length;

		if (column.maxLength < columnValueLength) {
			column.maxLength = columnValueLength;
		}
	}
	/**
	 * Returns the sort options for the table. All sub functions return this
	 * for method chaining.
	 *
	 * @return {object} The sort options
	 * 		{object} columns The column sort options
	 * 			{function} reset Reset the columns to their original order
	 * 				@return {object} Returns this for method chaining
	 * 			{function} asc Sorts the columns ascending
	 * 				@return {object} Returns this for method chaining
	 * 			{function} desc Sorts the columns descending
	 * 				@return {object} Returns this for method chaining
	 * 		{object} rows The row sort options
	 * 			{function} reset Reset the rows to their original order
	 * 				@param {string} columnName The name of column to sort by
	 * 				@return {object} Returns this for method chaining
	 * 			{function} asc Sorts the rows ascending
	 * 				@param {string} columnName The name of column to sort by
	 * 				@return {object} Returns this for method chaining
	 * 			{function} desc Sorts the rows descending
	 * 				@param {string} columnName The name of column to sort by
	 * 				@return {object} Returns this for method chaining
	 */
	function sort() {
		return {
			columns: sortColumns,
			rows: sortRows
		};
	}
	/**
	 * Returns the sort options for columns.
	 *
	 * @return {object} The column sort options
	 * 		{function} reset Reset the columns to their original order
	 * 			@return {object} Returns this for method chaining
	 * 		{function} asc Sorts the columns ascending
	 * 			@return {object} Returns this for method chaining
	 * 		{function} desc Sorts the columns descending
	 * 			@return {object} Returns this for method chaining
	 */
	function sortColumns() {
		return {
			reset: resetColumnOrder,
			asc: sortColumnsAsc,
			desc: sortColumnsDesc
		};
	}
	/**
	 * Resets the column order to the original order.
	 *
	 * @return {object} Returns this for method chaining
	 */
	function resetColumnOrder() {
		columnOrder = columnDefaultOrder;

		return this;
	}
	/**
	 * Sorts the columns in ascending order.
	 *
	 * @return {object} Returns this for method chaining
	 */
	function sortColumnsAsc() {
		sortColumnsCaseInsensitive();

		return this;
	}
	/**
	 * Sorts the columns in ascending order case insensitive.
	 *
	 * @return {array} The columns order array sorted ascending
	 */
	function sortColumnsCaseInsensitive() {
		return columnOrder.sort(sortCaseInsensitive);
	}
	/**
	 * Checks is items are numbers to use numeric sort instead. Otherwise sorts
	 * them alphabetically. This will prevent numbers being order 1, 10, 2, 3.
	 *
	 * @param {mixed} a Item a to sort
	 * @param {mixed} b Item b to sort
	 * @return {int} a was greater than b or before b
	 */
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
	/**
	 * Sorts two items numerically.
	 *
	 * @param {mixed} a Item a to sort
	 * @param {mixed} b Item b to sort
	 * @return {int} a was greater than b
	 */
	function sortNumeric(a, b) {
		return a - b;
	}
	/**
	 * Gets the columns in ascending order case insensitive and reverses it.
	 *
	 * @return {array} The columns order array sorted descending
	 */
	function sortColumnsDesc() {
		sortColumnsCaseInsensitive().reverse();

		return this;
	}
	/**
	 * Returns the sort options for rows.
	 *
	 * @param {string} columnName The column name to sort by.
	 * @return {object} The sort options for rows
	 * 		{function} reset Reset the rows to their original order
	 * 			@param {string} columnName The name of column to sort by
	 * 			@return {object} Returns this for method chaining
	 * 		{function} asc Sorts the rows ascending
	 * 			@param {string} columnName The name of column to sort by
	 * 			@return {object} Returns this for method chaining
	 * 		{function} desc Sorts the rows descending
	 * 			@param {string} columnName The name of column to sort by
	 * 			@return {object} Returns this for method chaining
	 */
	function sortRows(columnName) {
		return {
			reset: function() {
				return sortRowsAsc('index');
			},
			asc: function() {
				return sortRowsAsc(columnName);
			},
			desc: function() {
				return sortRowsDesc(columnName);
			}
		};
	}
	/**
	 * Sorts the rows in ascending order case insensitive based on a given
	 * column.
	 *
	 * @param {string} columnName The name of column to sort by
	 * @return {object} Returns this for method chaining
	 */
	function sortRowsAsc(columnName) {
		sortRowsByAttrCaseInsensitive(columnName);

		return this;
	}
	/**
	 * Sorts the rows array in ascending order case insensitive based on a given
	 * column.
	 *
	 * @param {string} columnName The name of column to sort by
	 * @param {mixed} a Item a to sort
	 * @param {mixed} b Item b to sort
	 * @return {array} The sorted row array
	 */
	function sortRowsByAttrCaseInsensitive(columnName) {
		return rows.sort(function(a, b) {
			return sortByAttr(columnName, a, b);
		});
	}
	/**
	 * Sorts two items by a given attribute.
	 *
	 * @param {string} attr The attribute to sort by
	 * @param {a} [varname] [description]
	 * @return {array} The sorted row array
	 */
	function sortByAttr(attr, a, b) {
		var aAttr = a[attr];

		if (!aAttr) {
			return 0;
		}

		return sortCaseInsensitive(aAttr, b[attr]);
	}
	/**
	 * Gets the rows in sorted by the given column in ascending order case
	 * insensitive and reverses it.
	 *
	 * @param {string} columnName The name of column to sort by
	 * @return {object} Returns this for method chaining
	 */
	function sortRowsDesc(columnName) {
		sortRowsByAttrCaseInsensitive(columnName).reverse();

		return this;
	}
	/**
	 * Prints the entire table.
	 *
	 * @return {object} Returns this for method chaining
	 */
	function printTable() {
		printHeader();
		printRows();
		printFooter();

		return this;
	}
	/**
	 * Prints the table header.
	 *
	 * @param {bool} suppressOutput Should we suppress the console.log of the header
	 * @return {string} The header as a string
	 */
	function printHeader(suppressOutput) {
		return printRow(getHeaderRow(), suppressOutput);
	}
	/**
	 * Gets the header as a row object.
	 *
	 * @return {object} The header as a row object
	 */
	function getHeaderRow() {
		var header = {};

		for (column in columns) {
			header[column] = columns[column].title;
		}

		return header;
	}
	/**
	 * Prints the row if we're not suppressing output and returns the value.
	 *
	 * @param {bool} suppressOutput Should we suppress the console.log of the row
	 * @return {object} The row as a string
	 */
	function printRow(row, suppressOutput) {
		return consoleLog(getRow(row), suppressOutput);
	}
	/**
	 * Prints the output if we're not suppressing output and returns the value.
	 *
	 * @param {string} output The output to print
	 * @param {bool} suppressOutput Should we suppress the console.log of the output
	 * @return {object} The output as a string with a new line return
	 */
	function consoleLog(output, suppressOutput) {
		if (!suppressOutput) {
			console.log(output);
		}

		return output + '\n';
	}
	/**
	 * Gets the row as a string formated for the table.
	 *
	 * @param {object} row The raw row object
	 * @return {string} The row formated for the table
	 */
	function getRow(row) {
		var rowOutput = '';

		for (i in columnOrder) {
			rowOutput += getFormatedColumn(row, columnOrder[i]);
		}

		return rowOutput;
	}
	/**
	 * Gets a column with the right number of spaces to accommodate for the for
	 * the longest value in that column.
	 *
	 * @param {object} row The row object
	 * @param {string} columnName The column name
	 * @return {string} The column with the right number of spaces
	 */
	function getFormatedColumn(row, columnName) {
		var columnValue = row[columnName];

		if (columnValue === undefined) {
			columnValue = '';
		}

		return columnValue + getSpaces(
			getColumnWidth(columnName) - String(columnValue).length
		);
	}
	/**
	 * Gets the column width in spaces.
	 *
	 * @param {string} columnName The column name
	 * @return {string} The column width in spaces
	 */
	function getColumnWidth(columnName) {
		var columnMaxLength = columns[columnName].maxLength;

		return (Math.ceil(columnMaxLength / TAB_SIZE) * TAB_SIZE) + TAB_SIZE;
	}
	/**
	 * Gets a given number of spaces.
	 *
	 * @param {int} total The number of spaces
	 * @return {string} The spaces
	 */
	function getSpaces(total) {
		var spaces = '';

		while (total--) {
			spaces += ' ';
		}

		return spaces;
	}
	/**
	 * Prints the table rows.
	 *
	 * @param {bool} suppressOutput Should we suppress the console.log of the rows
	 * @return {string} The rows as a string
	 */
	function printRows(suppressOutput) {
		var allRows = '';

		for (i in rows) {
			allRows += printRow(rows[i], suppressOutput);
		}

		return allRows;
	}
	/**
	 * Prints the table footer.
	 *
	 * @param {bool} suppressOutput Should we suppress the console.log of the footer
	 * @return {string} The footer as a string
	 */
	function printFooter(suppressOutput) {
		return consoleLog('', suppressOutput);
	}
	/**
	 * Returns the options for live printing. Should be called start(), print(),
	 * end().
	 *
	 * @return {object} options for live printing
	 * 		{function} start Prints the header
	 * 			@return {string} The header as a string
	 * 		{function} print Prints the current row
	 * 			@return {string} The row as a string
	 * 		{function} end Prints the footer
	 * 			@return {string} The footer as a string
	 */
	function live() {
		return {
			start: printHeader,
			print: printCurrentRow,
			end: printFooter
		};
	}
	/**
	 * Prints the current row.
	 *
	 * @return {string} The current row as a string
	 */
	function printCurrentRow() {
		return printRow(rows[rows.length - 1]);
	}
	/**
	 * Gets the entire table as a string while suppressing output.
	 *
	 * @return {string} The entire table as a string
	 */
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
		/**
		 * Adds a row to the table. The row object for have attributes that match
		 * the column names not titles.
		 *
		 * @param {object} row The row to add
		 * @return {int} The index of the row added
		 */
		addRow: addRow,
		/**
		 * Returns the sort options for the table. All sub functions return this
		 * for method chaining.
		 *
		 * @return {object} The sort options
		 * 		{object} columns The column sort options
		 * 			{function} reset Reset the columns to their original order
		 * 				@return {object} Returns this for method chaining
		 * 			{function} asc Sorts the columns ascending
		 * 				@return {object} Returns this for method chaining
		 * 			{function} desc Sorts the columns descending
		 * 				@return {object} Returns this for method chaining
		 * 		{object} rows The row sort options
		 * 			{function} reset Reset the rows to their original order
		 * 				@param {string} columnName The name of column to sort by
		 * 				@return {object} Returns this for method chaining
		 * 			{function} asc Sorts the rows ascending
		 * 				@param {string} columnName The name of column to sort by
		 * 				@return {object} Returns this for method chaining
		 * 			{function} desc Sorts the rows descending
		 * 				@param {string} columnName The name of column to sort by
		 * 				@return {object} Returns this for method chaining
		 */
		sort: sort,
		/**
		 * Prints the entire table.
		 *
		 * @return {object} Returns this for method chaining
		 */
		print: printTable,
		/**
		 * Returns the options for live printing. Should be called start(), print(),
		 * end().
		 *
		 * @return {object} options for live printing
		 * 		{function} start Prints the header
		 * 			@return {string} The header as a string
		 * 		{function} print Prints the current row
		 * 			@return {string} The row as a string
		 * 		{function} end Prints the footer
		 * 			@return {string} The footer as a string
		 */
		live: live,
		/**
		 * Gets the entire table as a string while suppressing output.
		 *
		 * @return {string} The entire table as a string
		 */
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