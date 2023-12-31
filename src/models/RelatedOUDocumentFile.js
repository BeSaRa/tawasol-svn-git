module.exports = function (app) {
    app.factory('RelatedOUDocumentFile', function (CMSModelInterceptor) {
        'ngInject';
        return function RelatedOUDocumentFile(model) {
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

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('RelatedOUDocumentFile', 'init', this);
        }
    })
};