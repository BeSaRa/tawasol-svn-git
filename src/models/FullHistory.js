module.exports = function (app) {
    app.factory('FullHistory', function (CMSModelInterceptor,
                                         langService) {
        'ngInject';
        return function FullHistory(model) {
            var self = this;
            self.id = null;
            self.vsId = null;
            self.docSubject = null;
            self.actionDate = null;
            self.actionBy = null;
            self.updatedBy = null;
            self.updatedOn = null;
            self.clientData = null;
            self.type = null;
            self.actionByInfo = null;
            self.actionByOUInfo = null;
            self.actionTypeInfo = null;

            if (model)
                angular.extend(this, model);

            FullHistory.prototype.getTranslatedActionBy = function (reverse) {
                return (!this.actionByInfo) ? '' : langService.current === 'ar' ? (reverse ? this.actionByInfo.enName : this.actionByInfo.arName ) : (reverse ? this.actionByInfo.arName : this.actionByInfo.enName);
            };
            FullHistory.prototype.getTranslatedUpdatedBy = function (reverse) {
                return (!this.updateByInfo) ? '' : langService.current === 'ar' ? (reverse ? this.updateByInfo.enName : this.updateByInfo.arName ) : (reverse ? this.updateByInfo.arName : this.updateByInfo.enName);
            };

            CMSModelInterceptor.runEvent('FullHistory', 'init', this);
        }
    })
};