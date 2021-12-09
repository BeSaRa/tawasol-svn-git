module.exports = function (app) {
    app.factory('LinkedAttachment', function (CMSModelInterceptor,
                                              langService,
                                              _) {
        'ngInject';
        return function LinkedAttachment(model) {
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
            self.actionByInfo = null;
            self.eventTypeInfo = null;
            self.mainDocClassInfo = null;
            self.linkedDocClassInfo = null;
            self.linkedItemTypeInfo = null;
            self.itemTypeInfo = null;
            self.ouInfo = null;
            self.mainDocClassID = null;
            self.linkedDocClassID = null;

            if (model)
                angular.extend(this, model);

            LinkedAttachment.prototype.getTranslatedActionBy = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.actionByInfo.enName : this.actionByInfo.arName ) : (reverse ? this.actionByInfo.arName : this.actionByInfo.enName);
            };

            LinkedAttachment.prototype.allActions = function () {
                return [
                    {id: 0, enName: 'Add', arName: 'Add'},
                    {id: 1, enName: 'Edit', arName: 'Edit'},
                    {id: 2, enName: 'Remove', arName: 'Remove'}
                ]
            };

            LinkedAttachment.prototype.getTranslatedAction = function (reverse) {
                var allActions = this.allActions();
                var operation = this.operation;
                var objAction = _.find(allActions, function (action) {
                    return action.id === operation;
                });
                return langService.current === 'ar' ? (reverse ? objAction.enName : objAction.arName ) : (reverse ? objAction.arName : objAction.enName);
            };


            CMSModelInterceptor.runEvent('LinkedAttachment', 'init', this);
        }
    })
};