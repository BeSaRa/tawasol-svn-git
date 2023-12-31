module.exports = function (app) {
    app.service('manageLaunchWorkflowService', function ($q, _) {
        'ngInject';
        var self = this;
        self.serviceName = 'manageLaunchWorkflowService';

        self.workflowType = {
            forward: 'forward',
            launch: 'launch',
            quickSend: 'quickSend',
            reply: 'reply',
            simpleReply: 'simpleReply'
        };

        function _initLaunchData() {
            self.launchData = {
                record: null,
                selectedItems: [],
                selectedDistWFItem: null,
                defaultTab: null,
                isDeptIncoming: false,
                isDeptSent: false,
                wfType: null,
                selectedReplyTo: null,
                selectedManagers: [],
                selectedPredefinedAction: null
            };
        }

        _initLaunchData();

        /**
         * @description Set the record and selectedItems in service
         * @param data
         * @returns {Promise<Promise>}
         */
        self.setLaunchData = function (data) {
            if (!data) {
                return $q.reject('MISSING_DATA');
            }
            return self.clearLaunchData()
                .then(function () {
                    self.launchData.record = data.record;
                    self.launchData.selectedItems = data.selectedItems;
                    self.launchData.selectedDistWFItem = data.selectedDistWFItem || null;
                    self.launchData.defaultTab = data.defaultTab || null;
                    self.launchData.isDeptIncoming = data.isDeptIncoming || false;
                    self.launchData.isDeptSent = data.isDeptSent || false;
                    self.launchData.wfType = data.wfType;
                    self.launchData.selectedReplyTo = data.selectedReplyTo || null;
                    self.launchData.selectedManagers = data.selectedManagers || [];
                    self.launchData.selectedPredefinedAction = data.selectedPredefinedAction || null;
                    return $q.resolve(true);
                })
        };

        /**
         * @description Checks if record, selected items, default tab exist
         * @returns {*|boolean}
         */
        self.isValidLaunchData = function () {
            return self.launchData.record && self.getLaunchSelectedItems().length > 0 && self.launchData.wfType;
        };

        /**
         * @description Get the record and selected items as object
         * @returns {{record: *, selectedItems: []}|null}
         */
        self.getLaunchData = function () {
            if (self.isValidLaunchData()) {
                return self.launchData;
            }
            return null;
        };

        /**
         * @description Get the selected items in launch popup
         * @returns {[]|*[]}
         */
        self.getLaunchSelectedItems = function () {
            if (!self.launchData.selectedItems || self.launchData.selectedItems.length === 0) {
                return [];
            }
            return self.launchData.selectedItems;
        };

        /**
         * @description Clears the record and selected items
         * @returns {Promise}
         */
        self.clearLaunchData = function () {
            _initLaunchData();
            return $q.resolve(true);
        };
    });
};
