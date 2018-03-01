module.exports = function (app) {
    app.provider('CMSAction', function () {
        'ngInject';
        var provider = this, actionGroups = [], lastGroup;

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

        function Action(model) {
            this.actionName = null;
            this.type = 'action';
            this.icon = null;
            this.shortcut = null;
            this.text = null;
            this.subMenu = [];
            this.class = null;
            this.checkShow = null;
            this.hide = null;
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

        provider.addActionGroup = function (groupName) {
            if (_findGroupName(groupName)) {
                console.log('this group already exists: ', groupName);
                return this;
            }
            actionGroups.push(new GroupActions(groupName));
            lastGroup = actionGroups[actionGroups.length - 1];
            return lastGroup;
        };

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
        }
    })
};