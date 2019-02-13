module.exports = function (app) {
    app.service('referencePlanNumberService', function (urlService,
                                                        $http,
                                                        $q,
                                                        generator,
                                                        ReferencePlanNumber,
                                                        _,
                                                        dialog,
                                                        langService,
                                                        toast,
                                                        cmsTemplate,
                                                        errorCode,
                                                        Organization) {
        'ngInject';
        var self = this;
        self.serviceName = 'referencePlanNumberService';

        self.referencePlanNumbers = [];
        self.referencePlanItemsScopes = {};
        self.referencePlanNumberRelatedOUs = [];
        self.pushScope = function (scope) {
            self.referencePlanItemsScopes[scope.elementItem.id] = scope;
        };

        /**
         * @description Load the reference plan numbers from server.
         * @returns {Promise|referencePlanNumbers}
         */
        self.loadReferencePlanNumbers = function () {
            return $http.get(urlService.referencePlanNumbers).then(function (result) {
                self.referencePlanNumbers = generator.generateCollection(result.data.rs, ReferencePlanNumber, self._sharedMethods);
                self.referencePlanNumbers = generator.interceptReceivedCollection('ReferencePlanNumber', self.referencePlanNumbers);
                return self.referencePlanNumbers;
            });
        };

        /**
         * @description Get reference plan numbers from self.referencePlanNumbers if found and if not load it from server again.
         * @returns {Promise|referencePlanNumbers}
         */
        self.getReferencePlanNumbers = function () {
            return self.referencePlanNumbers.length ? $q.when(self.referencePlanNumbers) : self.loadReferencePlanNumbers();
        };

        /**
         * @description Contains methods for CRUD operations for reference plan numbers
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to show related organizations
             * @param $event
             */
            relatedOrganizationUnits: function (referencePlanNumber, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('reference-plan-number-related-ou'),
                        controller: 'referencePlanNumberRelatedOUsPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            referencePlanNumber: referencePlanNumber,
                            referencePlanNumbers: self.referencePlanNumbers,
                            organizations: self.loadRelatedOrganizations(referencePlanNumber)
                        }
                    });
            },
            /**
             * @description Opens popup to add new reference plan number
             * @param $event
             */
            referencePlanNumberAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('reference-plan-number'),
                        controller: 'referencePlanNumberPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            referencePlanNumber: new ReferencePlanNumber(),
                            referencePlanNumbers: self.referencePlanNumbers
                        }
                    });
            },
            /**
             * @description Opens popup to edit reference plan number
             * @param referencePlanNumber
             * @param $event
             */
            referencePlanNumberEdit: function (referencePlanNumber, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('reference-plan-number'),
                        controller: 'referencePlanNumberPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            referencePlanNumber: referencePlanNumber,
                            referencePlanNumbers: self.referencePlanNumbers
                        }
                    });
            },
            /**
             * @description Show confirm box and delete reference plan number
             * @param referencePlanNumber
             * @param $event
             */
            referencePlanNumberDelete: function (referencePlanNumber, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: referencePlanNumber.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteReferencePlanNumber(referencePlanNumber).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: referencePlanNumber.getNames()}));
                            return true;
                        })
                    })
                    .catch(function(error){
                        errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function(){
                            dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                                lookup: langService.get('reference_number_plan'),
                                used: langService.get('other_organizations')
                            }), null, null, $event);
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk reference plan numbers
             * @param referencePlanNumbers
             * @param $event
             */
            referencePlanNumberDeleteBulk: function (referencePlanNumbers, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkReferencePlanNumbers(referencePlanNumbers)
                            .then(function (result) {
                                var response = false;
                                if (result.length === referencePlanNumbers.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (referencePlanNumber) {
                                        return referencePlanNumber.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Add new reference plan number
         * @param referencePlanNumber
         * @return {Promise|ReferencePlanNumber}
         */
        self.addReferencePlanNumber = function (referencePlanNumber) {
            return $http
                .post(urlService.referencePlanNumbers,
                    generator.interceptSendInstance('ReferencePlanNumber', referencePlanNumber))
                .then(function () {
                    return referencePlanNumber;
                });
        };

        /**
         * @description Update the given reference plan number.
         * @param referencePlanNumber
         * @return {Promise|ReferencePlanNumber}
         */
        self.updateReferencePlanNumber = function (referencePlanNumber) {
            return $http
                .put(urlService.referencePlanNumbers,
                    generator.interceptSendInstance('ReferencePlanNumber', referencePlanNumber))
                .then(function () {
                    return referencePlanNumber;
                });
        };

        /**
         * @description Delete given reference plan number.
         * @param referencePlanNumber
         * @return {Promise|null}
         */
        self.deleteReferencePlanNumber = function (referencePlanNumber) {
            var id = referencePlanNumber.hasOwnProperty('id') ? referencePlanNumber.id : referencePlanNumber;
            return $http.delete((urlService.referencePlanNumbers + '/' + id));
        };

        /**
         * @description Delete bulk reference plan numbers.
         * @param referencePlanNumbers
         * @return {Promise|null}
         */
        self.deleteBulkReferencePlanNumbers = function (referencePlanNumbers) {
            var bulkIds = referencePlanNumbers[0].hasOwnProperty('id') ? _.map(referencePlanNumbers, 'id') : referencePlanNumbers;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.referencePlanNumbers + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedReferencePlanNumbers = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedReferencePlanNumbers.push(key);
                });
                return _.filter(referencePlanNumbers, function (referencePlanNumber) {
                    return (failedReferencePlanNumbers.indexOf(referencePlanNumber.id) > -1);
                });
            });
        };

        /**
         * @description Get reference plan number by referencePlanNumberId
         * @param referencePlanNumberId
         * @returns {ReferencePlanNumber|undefined} return ReferencePlanNumber Model or undefined if not found.
         */
        self.getReferencePlanNumberById = function (referencePlanNumberId) {
            referencePlanNumberId = referencePlanNumberId instanceof ReferencePlanNumber ? referencePlanNumberId.id : referencePlanNumberId;
            return _.find(self.referencePlanNumbers, function (referencePlanNumber) {
                return Number(referencePlanNumber.id) === Number(referencePlanNumberId);
            });
        };

        /**
         * @description Activate reference plan number
         * @param referencePlanNumber
         */
        self.activateReferencePlanNumber = function (referencePlanNumber) {
            return $http
                .put((urlService.referencePlanNumbers + '/activate/' + referencePlanNumber.id))
                .then(function () {
                    return referencePlanNumber;
                });
        };

        /**
         * @description Deactivate reference plan number
         * @param referencePlanNumber
         */
        self.deactivateReferencePlanNumber = function (referencePlanNumber) {
            return $http
                .put((urlService.referencePlanNumbers + '/deactivate/' + referencePlanNumber.id))
                .then(function () {
                    return referencePlanNumber;
                });
        };

        /**
         * @description Activate bulk of reference plan numbers
         * @param referencePlanNumbers
         */
        self.activateBulkReferencePlanNumbers = function (referencePlanNumbers) {
            var bulkIds = referencePlanNumbers[0].hasOwnProperty('id') ? _.map(referencePlanNumbers, 'id') : referencePlanNumbers;
            return $http
                .put((urlService.referencePlanNumbers + '/activate/bulk'), bulkIds)
                .then(function () {
                    return referencePlanNumbers;
                });
        };

        /**
         * @description Deactivate bulk of reference plan numbers
         * @param referencePlanNumbers
         */
        self.deactivateBulkReferencePlanNumbers = function (referencePlanNumbers) {
            var bulkIds = referencePlanNumbers[0].hasOwnProperty('id') ? _.map(referencePlanNumbers, 'id') : referencePlanNumbers;
            return $http
                .put((urlService.referencePlanNumbers + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return referencePlanNumbers;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param referencePlanNumber
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReferencePlanNumber = function (referencePlanNumber, editMode) {
            var referencePlanNumbersToFilter = self.referencePlanNumbers;
            if (editMode) {
                referencePlanNumbersToFilter = _.filter(referencePlanNumbersToFilter, function (referencePlanNumberToFilter) {
                    return referencePlanNumberToFilter.id !== referencePlanNumber.id;
                });
            }
            return _.some(_.map(referencePlanNumbersToFilter, function (existingReferencePlanNumber) {
                return existingReferencePlanNumber.arName === referencePlanNumber.arName
                    || existingReferencePlanNumber.enName.toLowerCase() === referencePlanNumber.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReferencePlanNumber, self.updateReferencePlanNumber);

        self.createElementComponent = function (elementItem, ctrl, $compile, $rootScope) {
            var scope = $rootScope.$new();
            scope.elementItem = elementItem;
            scope.ctrl = ctrl;
            return $compile(angular.element('<div class="reference-element-item component-element {{!elementItem.id ? \'element-separator\' : \'\'}}">\n    <div ng-dblclick="ctrl.editStaticTextOn(elementItem)" class="padding-input" ng-if="!elementItem.id">\n        <span layout="row" layout-align="start center">\n            <span tooltip="{{elementItem.getTranslatedName()}}" flex ng-if="!elementItem.editMode">{{elementItem.id ? elementItem.getTranslatedName() : elementItem.hasValueOrSpace() ? elementItem.lookupStrKey : elementItem.getTranslatedName()}}</span>\n            <span flex ng-if="elementItem.editMode">\n                <input ng-keypress="ctrl.editStaticTextOffWhenEnter(elementItem,$event)"\n                       ng-trim="false"\n                       ng-blur="ctrl.editStaticTextOff(elementItem)" class="element-edit"\n                       ng-model="elementItem.lookupStrKey"/>\n            </span>\n            <span>\n                <md-button class="md-icon-button" ng-click="ctrl.removeReferenceElement(elementItem , $event)">\n                    <md-icon md-svg-icon="close-circle-outline"></md-icon>\n                </md-button>\n            </span>\n        </span>\n    </div>\n    <span layout="row" layout-align="start center" ng-if="elementItem.id">\n        <span flex>{{elementItem.id ? elementItem.getTranslatedName() : elementItem.lookupStrKey ? elementItem.lookupStrKey : elementItem.getTranslatedName()}}</span>\n        <span>\n        <md-button class="md-icon-button" ng-click="ctrl.removeReferenceElement(elementItem, $event)">\n            <md-icon md-svg-icon="close-circle-outline"></md-icon>\n        </md-button>\n        </span>\n    </span>\n</div>').data('elementItem', elementItem))(scope);
        };
        /**
         * @description load reference plan related organizations
         */
        self.loadRelatedOrganizations = function (referencePlanNumber) {
            return $http
                .get((urlService.referencePlanNumbers + '/' + referencePlanNumber.id + '/' + 'ou'))
                .then(function (result) {
                    self.referencePlanNumberRelatedOUs = generator.generateCollection(result.data.rs, Organization);
                    self.referencePlanNumberRelatedOUs = generator.interceptReceivedCollection('Organization', self.referencePlanNumberRelatedOUs);
                    return self.referencePlanNumberRelatedOUs;
                });
        }
    });
};

