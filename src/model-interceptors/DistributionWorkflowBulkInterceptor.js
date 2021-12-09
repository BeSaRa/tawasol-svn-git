module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      _) {
        'ngInject';

        var modelName = 'DistributionWorkflowBulk';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.second.normalUsers = prepareUserDistributionWorkflow(model.second.normalUsers);
            model.second.managerUsers = prepareUserDistributionWorkflow(model.second.managerUsers);
            model.second.favouriteUsers = prepareUserDistributionWorkflow(model.second.favoriteUsers);
            //model.second.receivedOUs = prepareReceivedOUDistributionWorkflow(model.second.receivedOUs);
            //model.second.mainOUs = prepareMainOUDistributionWorkflow(model.second.mainOUs);

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @param userDistributionWorkflow
         * @returns {Array}
         */
        var prepareUserDistributionWorkflow = function (userDistributionWorkflow) {
            var distributionWorkflowUsersToSend = [];
            angular.forEach(userDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toUserDomain', 'appUserOUID', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.toUserId = val.id;
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;

                distributionWorkflowUsersToSend.push(tempArr);
            });
            return distributionWorkflowUsersToSend;
        };

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @returns {Array}
         * @param receivedOUDistributionWorkflow
         */
        var prepareReceivedOUDistributionWorkflow = function (receivedOUDistributionWorkflow) {
            var distributionWorkflowReceivedOUToSend = [];
            angular.forEach(receivedOUDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toOUId', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;
                //tempArr.toUserId = val.id;
                distributionWorkflowReceivedOUToSend.push(tempArr);
            });
            return distributionWorkflowReceivedOUToSend;
        };

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @returns {Array}
         * @param mainOUDistributionWorkflow
         */
        var prepareMainOUDistributionWorkflow = function (mainOUDistributionWorkflow) {
            var distributionWorkflowMainOUToSend = [];
            angular.forEach(mainOUDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toOUId', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;
                distributionWorkflowMainOUToSend.push(tempArr);
            });
            return distributionWorkflowMainOUToSend;
        };

    })
};