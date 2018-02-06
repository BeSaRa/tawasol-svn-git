module.exports = function (app) {
    app.factory('MailNotification', function (CMSModelInterceptor,
                                              correspondenceService) {
        'ngInject';
        return function MailNotification(model) {
            var self = this;
            self.workObjectNumber = null;
            self.docSubject = null;
            self.sender = null;
            self.receivedDate = null;
            self.bookFullSerial = null;
            self.docClassId = null;
            self.read = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            MailNotification.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            MailNotification.prototype.getNotificationSubject = function () {
                return this.docSubject;
            };

            MailNotification.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('MailNotification', 'init', this);
        }
    })
};