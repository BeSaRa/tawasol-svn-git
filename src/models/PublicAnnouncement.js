module.exports = function (app) {
    app.factory('PublicAnnouncement', function (CMSModelInterceptor,
                                                langService,
                                                _,
                                                moment,
                                                employeeService) {
        'ngInject';
        return function PublicAnnouncement(model) {
            var self = this;

            //region Public Announcement properties
            self.id = null;
            self.creator = employeeService.getEmployee().id; //"1";
            self.startDate = null;
            self.endDate = null;
            self.status = true;
            self.arSubject = "";
            self.enSubject = "";
            self.arBody = "";
            self.enBody = "";
            self.itemOrder = 1;
            self.creationDate = moment($.now()).valueOf();
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
            PublicAnnouncement.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic Subject name and english Subject name with separator passed for Public Announcement. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            PublicAnnouncement.prototype.getNames = function (separator) {
                return this.arSubject + ' ' + (separator ? separator : '-') + ' ' + this.enSubject;
            };

            /**
             * @description Get the translated arabic or english Subject name according to current language for Public Announcement. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            PublicAnnouncement.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enSubject : this.arSubject ) : (reverse ? this.arSubject : this.enSubject);
            };

            /**
             * @description Get the status of Public Announcement as Active or Inactive instead of true or false.
             * @returns {string}
             */
            PublicAnnouncement.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get always active of Public Announcement as Yes or No instead of true or false.
             * @returns {string}
             */
            PublicAnnouncement.prototype.getTranslatedAlwaysActive = function (selectedValue) {
                return selectedValue ? langService.get('yes') : langService.get('no');
            };

            /**
             * compare start date with current date
             * @returns {boolean}
             */
            PublicAnnouncement.prototype.startDateGreaterThanCurrentDate = function () {
                var today = new Date();
                var currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                currentDate = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
                return (this.startDate ? moment(this.startDate, "YYYY-MM-DD").valueOf() : null) > (moment(currentDate, "YYYY-MM-DD").valueOf());
            };
            /**
             * compare start date greater than end date
             * @returns {boolean}
             */
            PublicAnnouncement.prototype.endDateGreaterThanStartDate = function () {
                var startDate = this.startDate ? new moment(this.startDate) : null;
                var endDate = this.endDate ? new moment(this.endDate) : null;
                if (!startDate || !endDate)
                    return false;

                return moment(startDate, "YYYY-MM-DD").valueOf() <= moment(endDate, "YYYY-MM-DD").valueOf();
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PublicAnnouncement', 'init', this);
        }
    })
};