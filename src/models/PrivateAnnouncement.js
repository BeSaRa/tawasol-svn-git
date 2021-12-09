module.exports = function (app) {
    app.factory('PrivateAnnouncement', function (CMSModelInterceptor,
                                                 langService,
                                                 _,
                                                 moment,
                                                 employeeService) {
        'ngInject';
        return function PrivateAnnouncement(model) {
            var self = this;

            //region Private Announcement properties
            self.id = null;
            self.creator = null;
            self.startDate = null;
            self.endDate = null;
            self.status = true;
            self.arSubject = "";
            self.enSubject = "";
            self.arBody = "";
            self.enBody = "";
            self.itemOrder = 1;
            self.creationDate = moment($.now()).valueOf();
            self.subscribers = [];
            //endregion

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arSubject',
                'enSubject',
                'status',
                'itemOrder',
                'arBody',
                'enBody'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            PrivateAnnouncement.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic subject name and english subject name with separator passed for private announcement. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            PrivateAnnouncement.prototype.getNames = function (separator) {
                return this.arSubject + ' ' + (separator ? separator : '-') + ' ' + this.enSubject;
            };

            /**
             * @description Get the translated arabic or english name according to current language for private announcement. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            PrivateAnnouncement.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enSubject : this.arSubject ) : (reverse ? this.arSubject : this.enSubject);
            };

            /**
             * @description Get the status of private announcement as Active or Inactive instead of true or false.
             * @returns {string}
             */
            PrivateAnnouncement.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get always active of private Announcement as Yes or No instead of true or false.
             * @returns {string}
             */
            PrivateAnnouncement.prototype.getTranslatedAlwaysActive = function (selectedValue) {
                return selectedValue ? langService.get('yes') : langService.get('no');
            };
            PrivateAnnouncement.prototype.isValidDate = function (data) {
                var d = null;
                try {
                    d = moment(data);
                } catch (e) {

                }
                return d.isValid();
            };
            /**
             * compare start date with current date
             * @returns {boolean}
             */
            PrivateAnnouncement.prototype.startDateGreaterThanCurrentDate = function () {
                var today = new Date();
                var currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                currentDate = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
                return (this.startDate ? moment(this.startDate, "YYYY-MM-DD").valueOf() : null) > (moment(currentDate, "YYYY-MM-DD").valueOf());
            };
            /**
             * compare start date greater than end date
             * @returns {boolean}
             */
            PrivateAnnouncement.prototype.endDateGreaterThanStartDate = function () {
                var startDate = this.startDate ? new moment(this.startDate) : null;
                var endDate = this.endDate ? new moment(this.endDate) : null;
                if (!startDate || !endDate)
                    return false;

                return moment(startDate, "YYYY-MM-DD").valueOf() <= moment(endDate, "YYYY-MM-DD").valueOf();
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PrivateAnnouncement', 'init', this);
        }
    })
};
