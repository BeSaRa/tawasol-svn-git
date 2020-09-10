module.exports = function (app) {
    app.service('PDFService', function (dialog, $q, cmsTemplate, AnnotationType, downloadService) {
        'ngInject';
        var self = this;
        self.serviceName = 'PDFService';

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
                    operations: operations
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

    });
};
