module.exports = function (app) {
    app.service('tableGeneratorService', function (_) {
        'ngInject';
        var self = this,
            templates = {
                table: angular.element('<table />'),
                tbody: angular.element('<tbody />'),
                thead: angular.element('<thead/>'),
                row: angular.element('<tr/>'),
                theadCell: angular.element('<th />'),
                cell: angular.element('<td />')
            };

        self.table = null;
        self.thead = null;
        self.throw = null;
        self.tbody = null;
        self.columnCount = 0;
        self.headers = [];
        self.classes = 'table';
        // step 1
        /**
         * create table functions
         * @param headers
         * @param classes
         */
        self.createTable = function (headers, classes) {
            if (!headers || !angular.isArray(headers) || !headers.length)
                return;


            self.columnCount = headers.length;
            self.classes = classes || self.classes;
            self.headers = headers;

            return self
                .initNewTable()
                .createTableHeader()
                .appendHeaderToTable();
        };
        // step 2
        self.initNewTable = function () {
            self.table = angular.copy(templates.table);
            self.thead = angular.copy(templates.thead);
            self.throw = angular.copy(templates.row);
            self.tbody = angular.copy(templates.tbody);

            self.thead.append(self.throw);
            self.table.append(self.thead);
            self.table.append(self.tbody);

            return self;
        };
        // step 3
        self.createTableHeader = function () {
            var th;
            for (var i = 0; i < self.headers.length; i++) {
                th = angular.copy(templates.theadCell);
                th.append(self.headers[i]);
                self.throw.append(th);
            }
            return self;
        };
        // step 4
        self.appendHeaderToTable = function () {
            self.thead.append(self.throw);
            self.table.append(self.thead);
            return self;
        };

        self.createTableRow = function (arrayOfData) {
            var row = angular.copy(templates.row);
            for (var i = 0; i < arrayOfData.length; i++) {
                row.append(angular.copy(templates.cell).append(arrayOfData[i]));
            }
            self.tbody.append(row);
            return self;
        };

        self.createTableRows = function (tableRow) {
            _.map(tableRow, function (row) {
                self.createTableRow(row);
            });
            return self;
        };

        self.removeOldTable = function () {
            self.table = null;
            self.thead = null;
            self.throw = null;
            self.tbody = null;
            self.columnCount = 0;
            self.headers = [];
            return self;
        };

        self.getTable = function (DOM) {
            self.table.addClass(self.classes);
            return DOM ? self.table : self.table[0].outerHTML;
        }

    });
};