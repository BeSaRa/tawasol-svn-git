module.exports = function (app) {
    app.factory('InkSignature', function (CMSModelInterceptor,
                                          PSPDFKit,
                                          $q,
                                          $http,
                                          langService) {
        'ngInject';
        return function InkSignature(model) {
            var self = this;

            self.documentTitle = 'dummy doc title';
            self.docSubject = 'dummy doc subject';
            self.appUserId = null;
            self.id = null;
            self.vsId = null;
            self.annotationContent = null;
            self.contentElementUrl = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'docSubject',
                'documentTitle',
                'annotationContent'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            InkSignature.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            InkSignature.prototype.getNames = function (separator) {
                // return this.subject + ' ' + (separator ? separator : '-') + ' ' + this.subject;
                return this.docSubject;
            };

            InkSignature.prototype.setDocumentTitle = function (documentTitle) {
                this.documentTitle = documentTitle;
                return this;
            };
            InkSignature.prototype.setDocSubject = function (docSubject) {
                this.docSubject = docSubject;
                return this;
            };
            InkSignature.prototype.setAppUserId = function (appUserId) {
                this.appUserId = appUserId;
                return this;
            };
            InkSignature.prototype.setId = function (id) {
                this.id = id;
                return this;
            };
            InkSignature.prototype.setVsId = function (vsId) {
                this.vsId = vsId;
                return this;
            };

            InkSignature.prototype.setAnnotationContent = function (annotationContent) {
                this.annotationContent = annotationContent;
                return this;
            };

            InkSignature.prototype.fetchPSPDFKitSignature = function () {
                var self = this;
                return $http
                    .get(this.contentElementUrl, {responseType: 'blob'})
                    .then(function (result) {
                        var fileReader = new FileReader();
                        return $q(function (resolve) {
                            fileReader.onloadend = function () {
                                var annotation = angular.fromJson(fileReader.result);
                                annotation.customData.additionalData.vsId = self.vsId;
                                resolve(PSPDFKit.Annotations.fromSerializableObject(annotation));
                            };
                            fileReader.readAsText(result.data);
                        });
                    });
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('InkSignature', 'init', this);
        }
    })
};
