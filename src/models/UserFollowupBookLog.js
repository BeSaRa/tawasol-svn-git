module.exports = function (app) {
    app.factory('UserFollowupBookLog', function (CMSModelInterceptor,
                                                 langService) {
        'ngInject';
        return function UserFollowupBookLog(model) {
            var self = this,
                actionStatusMap = {
                    added: 0,
                    transferred: 1,
                    terminated: 2
                },
                reverseActionStatusMap = {
                    0: 'added',
                    1: 'transferred',
                    2: 'terminated',
                };
            self.id = null;
            self.docSubject = null;
            self.userId = null;
            self.userOUID = null;
            self.actionStatus = null;
            self.vsId = null;
            self.actionDate = null;
            self.userComment = null;
            self.userInfo = null;
            self.ouInfo = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserFollowupBookLog.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            UserFollowupBookLog.prototype.getActionStatus = function (needStringValue) {
                return (needStringValue ? _mapReverseActionStatus(this.actionStatus) : this.actionStatus);
            };

            UserFollowupBookLog.prototype.isAdded = function () {
                return this.actionStatus === actionStatusMap.added;
            };

            UserFollowupBookLog.prototype.isTerminated = function () {
                return this.actionStatus === actionStatusMap.terminated;
            };

            UserFollowupBookLog.prototype.isTransferred = function () {
                return this.actionStatus === actionStatusMap.transferred;
            };


            function _mapActionStatus(actionStatus) {
                return actionStatusMap[actionStatus];
            }

            function _mapReverseActionStatus(actionStatus) {
                return reverseActionStatusMap[actionStatus];
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFollowupBookLog', 'init', this);
        }
    })
};
