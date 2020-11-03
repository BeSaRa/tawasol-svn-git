module.exports = function (app) {
    app.factory('SequentialWF', function (CMSModelInterceptor,
                                          langService,
                                          generator) {
        'ngInject';
        return function SequentialWF(model) {
            var self = this,
                documentClassMap = {
                    outgoing: 0,
                    incoming: 1,
                    internal: 2
                };
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.creatorId = null;
            self.creatorOUId = null;
            self.regOUId = null;
            self.docClassID = null;
            self.isAdhoc = null;
            self.steps = [];

            // temporary properties
            self.stepRows = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'docClassID',
                'regOUId'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SequentialWF.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for sequential workflow. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            SequentialWF.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for sequential workflow. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            SequentialWF.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            SequentialWF.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            /**
             * @description Get the translated true/false as yes/no
             * @param fieldName
             * * @returns {*}
             */
            SequentialWF.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the status of sequential workflow as active  or inactive instead of true or false.
             * @returns {string}
             */
            SequentialWF.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Checks if the sequential workflow is for outgoing document type
             * @returns {boolean}
             */
            SequentialWF.prototype.isOutgoingSeqWF = function () {
                return this.docClassID === documentClassMap.outgoing;
            };

            /**
             * @description Checks if the sequential workflow is for incoming document type
             * @returns {boolean}
             */
            SequentialWF.prototype.isIncomingSeqWF = function () {
                return this.docClassID === documentClassMap.incoming;
            };

            /**
             * @description Checks if the sequential workflow is for internal document type
             * @returns {boolean}
             */
            SequentialWF.prototype.isInternalSeqWF = function () {
                return this.docClassID === documentClassMap.internal;
            };

            SequentialWF.prototype.hasAnyDocumentType = function () {
                return typeof this.docClassID !== 'undefined' && this.docClassID !== null;
            };

            SequentialWF.prototype.getLastStepId = function () {
                return this.steps && this.steps[this.steps.length - 1].id;
            };
            SequentialWF.prototype.getFirstStepId = function () {
                return this.steps && this.steps[0].id;
            };

            SequentialWF.prototype.isAdhocSeqWF = function () {
                return this.isAdhoc;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SequentialWF', 'init', this);
        }
    })
};
