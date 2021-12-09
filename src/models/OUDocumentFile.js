module.exports = function (app) {
    app.factory('OUDocumentFile', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function OUDocumentFile(model) {
            var self = this;
            self.id = null;
            self.itemOrder = null;
            self.code = null;
            self.status = null;
            self.serial = null;
            self.ouid = null;
            self.file = null;

            if (model)
                angular.extend(this, model);

            OUDocumentFile.prototype.getTranslatedOUName = function () {
                return this.getOUTranslate(langService.current);
            };
            OUDocumentFile.prototype.getOUTranslate = function (lang) {
                return this.ouid.hasOwnProperty('id') ? this.ouid[lang + 'Name'] : null;
            };
            OUDocumentFile.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            OUDocumentFile.prototype.setOuId = function (ouId) {
                return this.ouid = ouId;
            };
            OUDocumentFile.prototype.setCode = function (code) {
                return this.code = code;
            };
            OUDocumentFile.prototype.setItemOrder = function (itemOrder) {
                return this.itemOrder = itemOrder;
            };
            OUDocumentFile.prototype.setSerial = function (serial) {
                return this.serial = serial;
            };
            OUDocumentFile.prototype.setDocumentFile = function (documentFile) {
                return this.file = documentFile;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('OUDocumentFile', 'init', this);
        }
    })
};
