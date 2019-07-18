module.exports = function (app) {
    app.factory('DocumentLinkViewer', function (CMSModelInterceptor) {

        'ngInject';
        return function DocumentLinkViewer(model) {
            var self = this;
            self.sharedToFullName = null;
            self.sharedToMobileNum = null;
            self.sharedToEmail = null;
            self.viewTime = null;
            self.vlsKey = null;

            if (model)
                angular.extend(this, model);

            CMSModelInterceptor.runEvent('DocumentLinkViewer', 'init', this);
        }
    })
};