module.exports = function (app) {
    app.controller('taskParticipantSettingPopCtrl', function (task, dialog, editMode, lookupService, taskParticipant, moment, generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskParticipantSettingPopCtrl';

        self.taskParticipantStates = lookupService.returnLookups('taskState');

        self.calenderHours = generator.calenderHours;

        self.task = angular.copy(task);

        self.model = angular.copy(taskParticipant);

        self.editMode = editMode;

        self.taskParticipant = angular.copy(taskParticipant);

        self.taskStartDate = moment(self.task.startDate).format('Y-MM-DD');
        self.taskEndDate = moment(self.task.dueDate).format('Y-MM-DD');

        self.taskStartTime = _getSelectTime(self.task.startTime);
        self.taskEndTime = _getSelectTime(self.task.endTime);

        self.startTime = null;
        self.endTime = null;

        self.startDate = null;
        self.endDate = null;


        if (!self.editMode) {
            _prepareTaskParticipant();
        }

        /**
         * @description get selected time from calender hours array by passing time as string eg. '10:30'
         * @param time
         * @private
         */
        function _getSelectTime(time) {
            return _.find(self.calenderHours, function (hour) {
                return hour.value === time;
            });
        }

        /**
         * @description return selected start/end dates from task
         * @return {{endDate: *, startDate: *}}
         */
        function _getSelectedDates() {
            self.startDate = moment(self.taskParticipant.startDate).format('Y-MM-DD') !== 'Invalid date' ? moment(self.taskParticipant.startDate).format('Y-MM-DD') : null;
            self.endDate = moment(self.taskParticipant.dueDate).format('Y-MM-DD') !== 'Invalid date' ? moment(self.taskParticipant.startDate).format('Y-MM-DD') : null;
        }

        _getSelectedDates();

        function _prepareTaskParticipant() {
            self.taskParticipant.startDate = self.task.startDate;
            self.taskParticipant.dueDate = self.task.dueDate;
            self.taskParticipant.startTime = self.task.startTime;
            self.taskParticipant.endTime = self.task.endTime;
            self.taskParticipant.taskState = self.task.taskState;
            self.taskParticipant.allDay = self.task.allDay;
        }

        self.participantTimeChange = function (field) {

        };

        self.disableTimeOutOfRange = function (hour) {
            if (self.taskParticipant.allDay)
                return false;
            (self.startDate && self.startDate === self.taskStartDate && self.startTime && hour.compareValue < self.startTime.compareValue) || (self.startDate === self.taskEndDate && hour.compareValue > self.taskEndTime.compareValue)
        };

        self.addTaskParticipantFromCtrl = function () {
            dialog.hide(self.taskParticipant);
        };

        self.editTaskParticipantFromCtrl = function () {
            dialog.hide(self.taskParticipant);
        };

        self.closeTaskParticipantPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};
