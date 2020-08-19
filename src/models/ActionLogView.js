module.exports = function (app) {
    app.factory('ActionLogView', function (CMSModelInterceptor, ActionLog) {
        'ngInject';
        return function ActionLogView(model) {
            var self = this;
            ActionLog.call(this);
            self.id = null;
            self.vsId = null;
            self.linkedItemVSID = null;
            self.linkedItemType = null;
            self.operation = null;
            self.actionDate = null;
            self.actionBy = null;
            self.itemName = null;
            self.itemId = null;
            self.itemType = null;
            self.itemFullSerial = null;
            self.comments = null;
            self.mainDocClassId = null;
            self.linkedDocClassId = null;
            self.ouId = null;

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ActionLogView', 'init', this);
        }
    });
};
