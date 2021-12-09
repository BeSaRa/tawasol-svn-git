module.exports = function (app) {
    app.factory('ContentViewHistory', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function ContentViewHistory(model) {
            var self = this;
            /*self.id = null;
            self.vsId = null;
            self.docSubject = null;
            self.actionDate = null;
            self.actionBy = null;
            self.ouId = null;
            self.actionByInfo = null;
            self.ouInfo = null;*/
            self.mainDoc = null;
            self.docSubject = null;
            self.events = null;

            if (model)
                angular.extend(this, model);

            /*ContentViewHistory.prototype.getTranslatedActionBy = function (reverse) {
                return this.actionByInfo ? (langService.current === 'ar'
                    ? (reverse ? this.actionByInfo.enName : this.actionByInfo.arName)
                    : (reverse ? this.actionByInfo.arName : this.actionByInfo.enName)) : "";
            };
            ContentViewHistory.prototype.getTranslatedOUInfo = function (reverse) {
                return this.ouInfo ? (langService.current === 'ar'
                    ? (reverse ? this.ouInfo.enName : this.ouInfo.arName)
                    : (reverse ? this.ouInfo.arName : this.ouInfo.enName)) : "";
            };*/

            CMSModelInterceptor.runEvent('ContentViewHistory', 'init', this);
        }
    })
};