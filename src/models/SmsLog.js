module.exports = function (app) {
    app.factory('SmsLog', function (CMSModelInterceptor,
                                    langService) {
        'ngInject';
        return function SmsLog(model) {
            var self = this;
            self.id = null;
            self.vsId = null;
            self.message = null;
            self.encodedMessage = null;
            self.mobileNo = null;
            self.destinationName = null;
            self.destinationId = null;
            self.destinationType = null;
            self.smsTemplateId = null;
            self.actionDate = null;
            self.actionBy = null;
            self.ouId = null;
            self.status = null;
            self.errorMessage = null;

            if (model)
                angular.extend(this, model);

            CMSModelInterceptor.runEvent('SmsLog', 'init', this);
        }
    })
};
