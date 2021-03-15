module.exports = function (app) {
    app.service('PDFService', function (dialog, $q, cmsTemplate, AnnotationType, downloadService, employeeService, _,
                                        langService, moment, jobTitleService, configurationService, $cookies) {
        'ngInject';
        var self = this;
        self.serviceName = 'PDFService';
        self.cookieAttachedTypeKey = '';

        self.userInfoAnnotationTypes = [
            {
                id: configurationService.USER_INFO_ANNOTATION_IDS.date,
                langKey: 'date',
                selected: false,
                getValue: function () {
                    return moment().format('DD-MM-YYYY').toString();
                }
            },
            {
                id: configurationService.USER_INFO_ANNOTATION_IDS.jobTitle,
                langKey: 'job_title',
                selected: false,
                getValue: function () {
                    var jobTitle = _.find(jobTitleService.jobTitles, function (title) {
                        return title.lookupKey === employeeService.getEmployee().jobTitle;
                    });
                    return jobTitle ? jobTitle.getTranslatedName() : '';
                }
            },
            {
                id: configurationService.USER_INFO_ANNOTATION_IDS.username,
                langKey: 'username',
                selected: false,
                getValue: function () {
                    return employeeService.getEmployee().getTranslatedName();
                }
            }
        ];

        /**
         * @description open PDfViewer visible for the user to handel all annotation from UI
         * @param pdfData
         * @param correspondence
         * @param annotationType
         * @param attachedBook
         * @param sequentialWF
         * @param generalStepElementView
         * @returns {promise}
         */
        self.openPDFViewer = function (pdfData, correspondence, annotationType, attachedBook, sequentialWF, generalStepElementView) {
            if (!annotationType)
                annotationType = AnnotationType.ANNOTATION;

            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('pdf-viewer'),
                controller: 'pdfViewerPopCtrl',
                controllerAs: 'ctrl',
                locals: {
                    pdfData: pdfData,
                    correspondence: correspondence,
                    annotationType: annotationType,
                    instantJSON: false,
                    attachedBook: attachedBook,
                    flatten: false,
                    sequentialWF: sequentialWF,
                    operations: false,
                    generalStepElementView: generalStepElementView
                },
                resolve: {
                    jobTitle: function (jobTitleService, _, employeeService) {
                        'ngInject';
                        return jobTitleService.getJobTitles().then(function (titles) {
                            return _.find(titles, function (title) {
                                return title.lookupKey === employeeService.getEmployee().jobTitle;
                            })
                        });
                    }
                }
            })
        };
        /**
         * @description this method to open hidden pdfViewer to handel the internal process.
         * @param pdfData
         * @param correspondence
         * @param annotationType
         * @param instantJSON
         * @param operations
         * @param flatten
         * @returns {promise}
         */
        self.openHiddenPDFViewer = function (pdfData, correspondence, annotationType, instantJSON, operations, flatten) {
            if (!annotationType)
                annotationType = AnnotationType.ANNOTATION;
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('hidden-pdf-viewer'),
                controller: 'pdfViewerPopCtrl',
                controllerAs: 'ctrl',
                locals: {
                    pdfData: pdfData,
                    correspondence: correspondence,
                    annotationType: annotationType,
                    instantJSON: instantJSON ? instantJSON : false,
                    attachedBook: false,
                    flatten: flatten,
                    sequentialWF: false,
                    generalStepElementView: false,
                    operations: operations,
                    jobTitle: false
                }
            })
        };
        /**
         * @description apply Annotations to PDF document after get it without
         * @param correspondence
         * @param annotationType
         * @param instantJSON
         * @param operations
         * @param flatten
         * @returns {*}
         */
        self.applyAnnotationsOnPDFDocument = function (correspondence, annotationType, instantJSON, operations, flatten) {
            return downloadService.downloadContentWithOutWaterMark(correspondence, annotationType)
                .then(function (blob) {
                    var fr = new FileReader();
                    return $q(function (resolve) {
                        fr.onloadend = function () {
                            return self.openHiddenPDFViewer(fr.result, correspondence, annotationType, instantJSON, operations, flatten).then(resolve);
                        };
                        fr.readAsArrayBuffer(blob);
                    });
                });
        }

        /**
         * @description Gets the user user information annotation rows from employee;
         * @returns {*}
         */
        self.getRowsForResultUserInfoAnnotation = function () {
            var selectedTypes = employeeService.getEmployee().getSignAnnotationSettings();
            if (selectedTypes) {
                selectedTypes = JSON.parse(selectedTypes);
            } else {
                selectedTypes = _.map(self.userInfoAnnotationTypes, function (item) {
                    return {id: item.id, selected: item.selected};
                });
            }

            return _.map(selectedTypes, function (item, index) {
                var row = self.userInfoAnnotationTypes.find(x => x.id === item.id);
                if (row) {
                    row.selected = item.selected;
                    row.rowIndex = index;
                }
                return row;
            });
        };

        /**
         * @description Get the result from user information annotation rows
         * @param userInfoAnnotationRows
         * @returns {*}
         */
        self.getResultFromSelectedRowsUserInfoAnnotation = function (userInfoAnnotationRows) {
            return _.map(userInfoAnnotationRows, function (item) {
                return {id: item.id, selected: item.selected};
            });
        }
    });
};
