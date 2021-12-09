module.exports = function (app) {
    app.service('PDFService', function (dialog, $q, cmsTemplate, AnnotationType, downloadService, PSPDFKit, $http) {
        'ngInject';
        var self = this;
        self.serviceName = 'PDFService';

        var fonts = ['Helvetica.ttf', 'arial.ttf', 'CALIBRI.ttf', 'GOTHIC.TTF', 'Consolas.ttf', 'Courier.ttf',
            'Georgia.ttf', 'impact.ttf', 'Lucida_Sans.ttf', 'OpenSans.ttf', 'Tahoma.ttf',
            'times_new_roman.ttf', 'verdana.ttf', 'NotoSansArabicUI-Regular.ttf'];
        self.customFonts = fonts.map(
            font => new PSPDFKit.Font({name: font, callback: loadCustomFontPSPDF})
        );

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

        function loadCustomFontPSPDF(fontFileName) {
            var url = 'assets/pspdf_fonts/' + fontFileName;
            return $http.get(url, {
                responseType: 'blob'
            })
                .then(result => {
                    if (result.status === 200) {
                        return result.data;
                    } else {
                        throw new Error();
                    }
                })
        }

    });
};
