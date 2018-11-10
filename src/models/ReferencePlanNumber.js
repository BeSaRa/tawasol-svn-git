module.exports = function (app) {
    app.factory('ReferencePlanNumber', function (CMSModelInterceptor,
                                                 _,
                                                 langService) {
        'ngInject';
        return function ReferencePlanNumber(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.description = null;
            self.resetMonth = null;
            self.resetDay = null;
            self.isGlobal = true;
            self.referencePlanItems = [];
            self.referencePlanItemStartSerialList = [];


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'description',
                'isGlobal',
                'resetMonth',
                'resetDay'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ReferencePlanNumber.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for reference plan number. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ReferencePlanNumber.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for reference plan number. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             */
            ReferencePlanNumber.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of reference plan number as Active or Inactive instead of true or false.
             * @returns {string}
             */
            ReferencePlanNumber.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of reference plan number as Yes or No instead of true or false.
             * @returns {string}
             */
            ReferencePlanNumber.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('yes') : langService.get('no');
            };

            /**
             * @description Get the has reset date of reference plan number as Yes or No instead of true or false.
             * @returns {string}
             */
            ReferencePlanNumber.prototype.getTranslatedHasResetDate = function (value) {
                return (value === 1 || value === true) ? langService.get('yes') : langService.get('no');
            };
            /**
             * @description to get the serial Item from reference plan.
             * @param item
             * @return ReferencePlanItemStartSerial
             */
            ReferencePlanNumber.prototype.getItemSerial = function (item) {
                var found = _.find(this.referencePlanItemStartSerialList, function (serial) {
                    var itemId = serial.referencePlanItemId.hasOwnProperty('id') ? serial.referencePlanItemId.id : serial.referencePlanItemId;
                    return itemId === item.id;
                });
                return found ? found.setReferencePlanItemId(item) : false;
            };
            /**
             * @description check if the reference plan is valid or not to add or edit.
             * @returns {number}
             */
            ReferencePlanNumber.prototype.isValidReferencePlan = function () {
                return this.referencePlanItems.length && this.hasAtLeastItemForAll();
            };
            /**
             * @description to check if the reference plan has Item for all correspondence.
             * @returns {ReferencePlanItem|undefined}
             */
            ReferencePlanNumber.prototype.hasAtLeastItemForAll = function () {
                return !!(_.find(this.referencePlanItems, function (item) {
                    return item.isItemForAll();
                }));

            };

            /**
             * @description to check if the reference plan has an duplicated referencePlanItem.
             * @param referencePlanItem
             * @param editMode
             */
            ReferencePlanNumber.prototype.hasDuplicatedItem = function (referencePlanItem, editMode) {
                return _.find(this.referencePlanItems, function (item) {
                    return editMode ? (item.refernceExpression === referencePlanItem.refernceExpression && item.id !== referencePlanItem.id) : (item.refernceExpression === referencePlanItem.refernceExpression);
                });
            };
            /**
             * @description get reference PlanItem by Id from reference Plan.
             * @param item
             */
            ReferencePlanNumber.prototype.getReferencePlanItemById = function (item) {
                var id = item.hasOwnProperty('id') ? item.id : item;
                return _.find(this.referencePlanItems, function (referencePlanItem) {
                    return Number(referencePlanItem.id) === id;
                });
            };

            ReferencePlanNumber.prototype.getID = function () {
                return this.id;
            };
            ReferencePlanNumber.prototype.getStartSerialByCriteria = function (regOUId, itemId) {
                return _.find(this.referencePlanItemStartSerialList, function (itemStartSerial) {
                    return itemStartSerial.regOUID === regOUId && itemId === itemStartSerial.referencePlanItemId
                });
            };
            ReferencePlanNumber.prototype.findReferenceItemStartSerial = function (organizationId, itemId) {
                var found = this.getStartSerialByCriteria(organizationId, itemId);
                return found ? found.startSerial : 1;
            };

            ReferencePlanNumber.prototype.getStartSerialByOU = function (organizationId, itemId) {
                return organizationId ? this.findReferenceItemStartSerial(organizationId, itemId) : 1;
            };

            ReferencePlanNumber.prototype.getStartSerialByCriteriaORNull = function (regOUId, itemId) {
                var startSerial = this.getStartSerialByCriteria(regOUId, itemId);
                console.log('startSerial ', startSerial);
                return startSerial ? startSerial.id : null;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReferencePlanNumber', 'init', this);
        }
    })
};