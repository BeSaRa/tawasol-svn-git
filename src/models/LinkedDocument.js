module.exports = function (app) {
    app.factory('LinkedDocument', function (CMSModelInterceptor,
                                            langService,
                                            _) {
        'ngInject';
        return function LinkedDocument(model) {
            var self = this;
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
            self.ouId = null;
            self.mainDocClassID = null;
            self.linkedDocClassID = null;

            if (model)
                angular.extend(this, model);

            LinkedDocument.prototype.getTranslatedActionBy = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.actionByInfo.enName : this.actionByInfo.arName ) : (reverse ? this.actionByInfo.arName : this.actionByInfo.enName);
            };

            CMSModelInterceptor.runEvent('LinkedDocument', 'init', this);
        }
    })
};