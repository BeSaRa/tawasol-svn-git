module.exports = function (app) {
    app.factory('ReassignFollowup', function (CMSModelInterceptor) {
        'ngInject';
        return function ReassignFollowup(model) {
            var self = this;
            self.vsId = null;
            self.comments = null;
            self.docClassId = null;
            self.oldDynamicRuleId = null;
            self.newDynamicRuleId = null;

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ActionLog', 'init', this);
        }
    });
};
