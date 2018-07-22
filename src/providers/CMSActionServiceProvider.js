module.exports = function (app) {
    app.provider('CMSActionService', function () {
        'ngInject';
        var provider = this, actionGroups = [], lastGroup, employeeServiceProvider;

        /**
         * @description GroupActions Model
         * @name GroupActions
         * @param groupName
         * @constructor
         */
        function GroupActions(groupName) {
            this.actions = [];
            this.groupName = groupName;
            this.addAction = function (actionName, action) {
                return provider.addAction(this.groupName, actionName, action)
            };

            this.addActionGroup = function (groupName) {
                return provider.addActionGroup(groupName);
            }
        }

        /**
         * @description the private check to show actions.
         * @param action
         * @param model
         * @return {boolean}
         * @private
         */
        function _checkToShow(action, model) {
            var hasPermission = true;
            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    hasPermission = employeeServiceProvider.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeServiceProvider.getEmployee().hasAnyPermissions(action.permissionKey);
                    }
                    else {
                        hasPermission = employeeServiceProvider.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
        }

        /**
         * @description action
         * @param model
         * @constructor
         */
        function Action(model) {
            this.actionName = null;
            this.type = 'action';
            this.permissionKey = null;
            this.icon = null;
            this.shortcut = null;
            this.text = null;
            this.textCallback = null;
            this.subMenu = [];
            this.class = null;
            this.checkShow = null;
            this.hide = null;
            this.params = [];
            this.showInView = true;
            // to check it the document has already checkToShow Method or not if not add the default method.
            if (!model.hasOwnProperty('checkShow')) {
                model.checkShow = _checkToShow;
            }

            if (model)
                angular.extend(this, model);
        }

        /**
         * to check if the group name exists.
         * @param groupName
         * @returns {boolean}
         * @private
         */
        function _findGroupName(groupName) {
            var result = false;
            groupName = groupName.toLowerCase();
            for (var i = 0; i < actionGroups.length; i++) {
                if (groupName === actionGroups[i].groupName.toLowerCase()) {
                    result = actionGroups[i];
                    break;
                }
            }
            return result;
        }

        /**
         * @description check if the group has this action name or not to a void duplicate action names.
         * @param groupName
         * @param actionName
         * @returns {boolean}
         * @private
         */
        function _findActionInsideGroup(groupName, actionName) {
            var group = _findGroupName(groupName), result = false;
            for (var i = 0; i < group.actions.length; i++) {
                if (group.actions[i].actionName.toLowerCase() === actionName.toLowerCase()) {
                    result = group.actions[i];
                    break;
                }
            }
            return result;
        }

        /**
         * @description add group of action.
         * @param groupName
         * @return {*}
         */
        provider.addActionGroup = function (groupName) {
            if (_findGroupName(groupName)) {
                console.log('this group already exists: ', groupName);
                return this;
            }
            actionGroups.push(new GroupActions(groupName));
            lastGroup = actionGroups[actionGroups.length - 1];
            return lastGroup;
        };
        /**
         * @description add action for group
         * @param groupName
         * @param actionName
         * @param action
         * @return {*}
         */
        provider.addAction = function (groupName, actionName, action) {
            var length = arguments.length;
            var group = _findGroupName(groupName);
            if (!_findGroupName(groupName)) {
                console.log("NO Group Found with this Name: ", groupName);
                return this;
            }

            if (length === 2) {
                action = actionName;
                actionName = action.actionName;
            }

            if (_findActionInsideGroup(groupName, actionName)) {
                console.log("This action exists ( " + actionName + " )in this group before : " + groupName);
                return this;
            }

            action.actionName = actionName;
            group.actions.push(new Action(action));
            return group;
        };

        provider.$get = function (langService, employeeService) {
            'ngInject';
            employeeServiceProvider = employeeService;
            return provider;
        }
    })
};