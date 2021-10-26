module.exports = function (app) {
    app.service('printService', function (dialog,
                                          $q,
                                          $http,
                                          helper,
                                          langService,
                                          urlService,
                                          EventHistoryCriteria,
                                          generator,
                                          toast) {
        'ngInject';
        var self = this;
        self.serviceName = 'printService';

        self.printButtonTypes = {
            pdf: {
                id: 1,
                type: 'pdf',
                text: 'PDF',
                cssClass: ''
            },
            excel: {
                id: 2,
                type: 'excel',
                text: 'EXCEL',
                cssClass: ''
            },
            word: {
                id: 3,
                type: 'word',
                text: 'WORD',
                cssClass: ''
            },
            csv: {
                id: 4,
                type: 'csv',
                text: 'CSV',
                cssClass: ''
            }
        };

        var _prepareExportedData = function (records, tableHeaders, title) {
            var record = records[0],
                exportedData = record.getExportedData(),
                recordsCount = records.length,
                data = {
                    data: new Array(recordsCount),
                    headerNames: [],
                    headerText: title ? title : ''
                },
                headersCount = tableHeaders.length;

            for (var i = 0; i < headersCount; i++) {
                var exportedLabel = tableHeaders[i];
                if (!exportedData.hasOwnProperty(exportedLabel))
                    continue;
                // to put the column header
                data.headerNames.push(langService.get(exportedLabel));

                for (var x = 0; x < recordsCount; x++) {
                    if (!angular.isArray(data.data[x])) {
                        data.data[x] = [];
                    }
                    data.data[x].push(typeof exportedData[exportedLabel] === 'function' ? exportedData[exportedLabel].call(records[x]) : records[x][exportedData[exportedLabel]]);
                }
            }

            return data;
        };

        var _prepareExportedDataWithCriteria = function (table, title, exportType, criteria) {
            var data = {
                    //to check whether department/central or user sent items
                    criteria: (criteria && criteria instanceof EventHistoryCriteria) ?
                        generator.interceptSendInstance('EventHistoryCriteria', criteria) : //department/central
                        criteria, // user sent items
                    headerNames: [],
                    headerText: title ? title : '',
                    columnNames: table.columns,
                    exportType: exportType
                },
                headersCount = table.headers.length;

            for (var i = 0; i < headersCount; i++) {
                var exportedLabel = table.headers[i];

                // to put the column header
                data.headerNames.push(langService.get(exportedLabel));
            }

            return data;
        };

        /**
         *
         * @param records
         * @param table
         * @param title
         * @param criteria
         * @param selectedEmployee used in followup sent items
         * @param selectedOrganization used in followup sent items
         * @returns {*}
         */
        self.printData = function (records, table, title, criteria, selectedEmployee, selectedOrganization) {
            var headers = table.hasOwnProperty('headers') ? table.headers : table;
            var urlPdf, urlExel;

            if (table.hasOwnProperty('columns')) {
                //to check whether department/central or user sent items otherwise its normal print from existing records
                if (criteria && criteria instanceof EventHistoryCriteria) {
                    // used in followup sent items
                    if (selectedEmployee && selectedOrganization) {
                        var userId = selectedEmployee.hasOwnProperty('id') ? selectedEmployee.id : selectedEmployee;
                        var ouId = selectedOrganization.hasOwnProperty('id') ? selectedOrganization.id : selectedOrganization;

                        urlPdf = urlExel = urlService.userInboxSentItems + "/print/user-id/" + userId + "/ou/" + ouId
                    } else {
                        urlPdf = urlExel = urlService.userInboxSentItems + "/print";
                    }
                } else {
                    urlPdf = urlExel = urlService.departmentSentItems + "/print";
                }
            } else {
                urlPdf = urlService.exportToPdf;
                urlExel = urlService.exportToExcel;
            }

            var defer = $q.defer(),
                urlTypeMap = {
                    pdf: {
                        url: urlPdf,
                        type: 'pdf',
                        text: 'PDF',
                        id: 1
                    },
                    excel: {
                        url: urlExel,
                        type: 'excel',
                        text: 'EXCEL',
                        id: 2
                    }
                };

            dialog.confirmThreeButtonMessage(langService.get('select_file_type_to_print_download'), '', urlTypeMap.pdf.text, urlTypeMap.excel.text, null, null, false)
                .then(function (result) {
                    if (result.button === urlTypeMap.pdf.id) {
                        defer.resolve(urlTypeMap.pdf);
                    } else if (result.button === urlTypeMap.excel.id) {
                        defer.resolve(urlTypeMap.excel);
                    }
                });
            return defer.promise.then(function (exportOption) {

                var data = (table.hasOwnProperty('columns')) ?
                    _prepareExportedDataWithCriteria(table, title, exportOption.type, criteria) :
                    _prepareExportedData(records, headers, title);

                var errorMessage = langService.get('error_export_to_file').change({format: (exportOption.type === 'excel' ? 'EXCEL' : 'PDF')});
                return $http.post(exportOption.url, data)
                    .then(function (result) {
                        var physicalPath = result.data.rs;
                        if (!physicalPath) {
                            toast.error(errorMessage);
                            return $q.reject(errorMessage)
                        } else {
                            return $http.get(physicalPath, {
                                responseType: 'blob'
                            }).then(function (result) {
                                return {
                                    url: window.URL.createObjectURL(result.data),
                                    blob: result.data,
                                    physicalPath: physicalPath
                                };
                            });
                        }
                    })
                    .then(function (file) {
                        var oldIframe = document.getElementById('iframe-print');
                        oldIframe ? oldIframe.parentNode.removeChild(oldIframe) : null;

                        if (exportOption.type === 'excel') {
                            window.open(file.physicalPath, '_blank');
                            return;
                        }

                        if (helper.browser.isIE()) {
                            window.navigator.msSaveOrOpenBlob(file.blob);
                        } else if (helper.browser.isFirefox()) {
                            window.open(file.physicalPath, '_blank');
                        } else {
                            var iframe = document.createElement('iframe');
                            iframe.id = 'iframe-print';
                            iframe.onload = function (ev) {
                                iframe.contentWindow.focus();
                                iframe.contentWindow.print();

                            };
                            iframe.src = file.url;
                            document.body.appendChild(iframe);
                        }
                    })
                    .catch(function () {
                        toast.error(errorMessage);
                    });
            });
        };

    });
};
