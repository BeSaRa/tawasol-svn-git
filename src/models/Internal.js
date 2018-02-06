module.exports = function (app) {
    app.factory('Internal', function (CMSModelInterceptor,
                                      langService,
                                      generator,
                                      Correspondence) {
        'ngInject';
            return function Internal(model) {
                var self = this;
                Correspondence.call(this);
                self.docClassName = 'Internal';
                self.classDescription = 'Internal';
                self.internalDocType = null;
                self.docStatus = 2; // by default

                /*These fields come from common correspondence model. The below fields are not in Internal model*/
                delete self.exportInfo;

                // every model has required fields
                // if you don't need to make any required fields leave it as an empty array
                var requiredFields = [];

                if (model)
                    angular.extend(this, model);

                // don't remove CMSModelInterceptor from last line
                // should be always at last thing after all methods and properties.
                CMSModelInterceptor.runEvent('Internal', 'init', this);
            }
        }
    )
}
;