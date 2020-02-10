module.exports = function (app) {
    app.controller('taskPopupCtrl', function (_,
                                              task,
                                              validationService,
                                              configurationService,
                                              $q,
                                              langService,
                                              WorkItem,
                                              cmsTemplate,
                                              toast,
                                              availableUsers,
                                              $timeout,
                                              taskService,
                                              lookupService,
                                              employeeService,
                                              correspondenceService,
                                              editMode,
                                              dialog,
                                              managerService,
                                              moment,
                                              $scope,
                                              generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskPopupCtrl';

        self.task = task;
        self.model = angular.copy(task);
        self.editMode = editMode;
        self.priorityLevels = lookupService.returnLookups('priorityLevel');
        self.taskStates = lookupService.returnLookups('taskState');

        self.taskStatesMap = _generateTaskStatesMap();

        self.availableUsers = _prepareAvailableUsers(availableUsers);
        self.calenderHours = generator.calenderHours;

        self.selectedStartTime = _getSelectTime(self.task.startTime);
        self.selectedEndTime = _getSelectTime(self.task.endTime);

        self.startDate = null;
        self.endDate = null;

        self.minDate = _getMinDueDate();

        self.selectedParticipant = null;

        self.taskParticipantsIds = [];

        self.searchText = '';

        self.validateLabels = {
            taskTitle: 'task_title',
            creationDate: 'task_start_date',
            taskState: 'task_state',
            priorityLevel: 'priority_level'
        };

        function _generateTaskStatesMap() {
            var map = {};
            _.map(self.taskStates, function (state) {
                map[state.lookupKey] = state;
            });
            return map;
        }

        function _excludeSelect() {
            return _.filter(self.availableUsers, function (user) {
                return self.taskParticipantsIds.indexOf(user.participantId) === -1;
            });
        }

        // if in edit mode the due date should be less than the start date
        // if in add mode the due date should be greater than or equal today
        function _getMinDueDate() {
            return self.minDate = self.editMode ? self.task.startDate : (self.task.startDate.valueOf() < Date.now() ? new Date() : self.task.startDate);
        }

        function _getParticipantIds() {
            self.taskParticipantsIds = _.map(self.task.taskParticipants, function (participant) {
                return participant.participantId;
            });
            if (self.taskParticipantsIds.indexOf(employeeService.getEmployee().getCombinedEmployeeId()) === -1)
                self.taskParticipantsIds.push(employeeService.getEmployee().getCombinedEmployeeId());
        }

        _getParticipantIds();

        // to exclude selected user
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
         * @description add display property for all users to display name and ou as concatenated.
         * @param users - Array of TaskParticipant
         * @return {Array}
         * @private
         */
        function _prepareAvailableUsers(users) {
            return _.map(users, function (user) {
                user.display = user.userId.getTranslatedName() + ' - ' + user.ouId.getTranslatedName();
                return user;
            });
        }

        /**
         * @description return selected start/end dates from task
         * @return {{endDate: *, startDate: *}}
         */
        function _getSelectedDates() {
            self.startDate = moment(self.task.startDate).format('Y-MM-DD') !== 'Invalid date' ? moment(self.task.startDate).format('Y-MM-DD') : null;
            self.endDate = moment(self.task.dueDate).format('Y-MM-DD') !== 'Invalid date' ? moment(self.task.dueDate).format('Y-MM-DD') : null;
        }

        /**
         * @description return true if due date less than start date.
         * @return {boolean}
         * @private
         */
        function _dueDateLessThanStartDate() {
            return self.startDate && self.endDate && self.startDate === self.endDate && self.selectedStartTime && self.selectedEndTime && self.selectedEndTime.compareValue <= self.selectedStartTime.compareValue
        }

        /**
         * @description to disable specific state while add task.
         * @param state
         * @returns {boolean}
         */
        self.disableStateWhileAdd = function (state) {
            return !self.editMode && configurationService.STATES_DISABLED_WHILE_ADD_TASK.indexOf(state.lookupKey) !== -1;
        };

        self.addTaskFromCtrl = function () {
            return validationService
                .createValidation('ADD_TASK')
                .addStep('check_required', true, generator.checkRequiredFields, self.task, function (result) {
                    return !result.length;
                })
                .notifyFailure(function () {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function (result) {
                    return taskService
                        .addTask(self.task)
                        .then(function (task) {
                            self.editMode = true;
                            self.model = angular.copy(task);
                            self.task = angular.copy(task);
                            toast.success(langService.get('add_success').change({name: task.taskTitle}));
                            self.closeTaskPopupFromCtrl();
                        });
                });
        };

        self.editTaskFromCtrl = function () {
            return validationService
                .createValidation('EDIT_TASK')
                .addStep('check_required', true, generator.checkRequiredFields, self.task, function (result) {
                    return !result.length;
                })
                .notifyFailure(function () {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function (result) {
                    return taskService
                        .updateTask(self.task)
                        .then(function (task) {
                            self.model = angular.copy(task);
                            self.task = angular.copy(task);
                            toast.success(langService.get('edit_success').change({name: task.taskTitle}));
                            self.closeTaskPopupFromCtrl();
                        });
                });
        };
        /**
         * @description to get selected start time and store it to use it later for disable time if the start/end date is the same day.
         */
        self.timeChange = function (field, property) {
            self['selected' + property] = _getSelectTime(self.task[field]);
            _getSelectedDates();
            if (field === 'startTime' && _dueDateLessThanStartDate()) {
                self.task.endTime = null;
            }
        };


        self.startDateChange = function () {
            _getSelectedDates();
            _getMinDueDate();
            // if you have start date greater than due date reset due date
            if (self.startDate && self.endDate && self.startDate > self.endDate) {
                self.task.dueDate = null;
            }

            if (_dueDateLessThanStartDate()) {
                self.task.endTime = null;
            }
        };
        /**
         * @description to disable all time that less than selected start time if the task will be in the same day.
         * @param hour
         * @return {boolean}
         */
        self.lessThanStartTime = function (hour) {
            _getSelectedDates();
            return (self.startDate && self.endDate && self.startDate === self.endDate) && hour.compareValue <= self.selectedStartTime.compareValue;
        };

        self.personQuerySearch = function (query) {
            _getParticipantIds();
            return _excludeSelect().filter(function (item) {
                return item.display.toLowerCase().trim().indexOf(query) !== -1;
            });
        };


        self.selectedItemChange = function (autoCompleteId) {
            if (self.selectedParticipant) {
                taskService
                    .openSettingForParticipant(self.selectedParticipant, self.task)
                    .then(function (participant) {
                        self.task
                            .addParticipant(participant)
                            .then(function () {
                                _getParticipantIds();
                                if (self.task.hasId()) {
                                    toast.success(langService.get('task_participant_added_successfully'));
                                }
                                self.selectedParticipant = null;
                            });
                    })
            }

        };

        self.editTaskParticipantFromCtrl = function (participant) {
            taskService
                .openSettingForParticipant(participant, self.task, true)
                .then(function (participant) {
                    self.task
                        .editTaskParticipant(participant)
                        .then(function () {
                            _getParticipantIds();
                            if (self.task.hasId()) {
                                toast.success(langService.get('task_participant_updated_successfully'));
                            }
                        });

                });
        };

        self.canDeleteTaskParticipant = function () {
            return self.task.taskParticipants && self.task.taskParticipants.length > 1;
        };

        self.removeTaskParticipant = function (participant) {
            self.task
                .deleteParticipant(participant)
                .then(function () {
                    _getParticipantIds();
                    toast.success(langService.get('delete_success'));
                });
        };

        self.closeTaskPopupFromCtrl = function () {
            dialog.hide(self.task);
        };

        self.getAvailableDate = function () {
            return self.task.startDate.valueOf() > Date.now() ? self.task.startDate : new Date();
        };

        self.viewCorrespondence = function (correspondence, $event) {
            var info = correspondence.getInfo();
            var workItem = null;
            var ctrl;
            if (self.task.isCompletedTask() || !self.task.wobNum) {
                ctrl = taskService.getQueueController(info.documentClass);
                ctrl.viewDocument(correspondence, $event);
            } else {
                ctrl = taskService.getQueueController('userInbox');
                if (self.task.wobNum) {
                    workItem = new WorkItem({
                        generalStepElm: {
                            workObjectNumber: self.task.wobNum,
                            docType: info.docClassId
                        }
                    });
                    ctrl.viewDocument(workItem, $event);
                }
            }
        };

        self.linkDocumentTask = function ($event) {
            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('search-linked-document'),
                    controller: 'searchLinkedDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        linkedDocs: [],
                        viewCallback: self.viewCorrespondence,
                        excludeVsId: null,
                        isAdminSearch: false,
                        multiSelect: false
                    },
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getAllOrganizationsStructure()
                                .then(function (organizations) {
                                    return _.filter(organizations, function (organization) {
                                        return organization.hasRegistry;
                                    })
                                });
                        }
                    }
                })
                .then(function (correspondences) {
                    self.task.documentVSID = correspondences[0];
                    self.task.correspondence = correspondences[0];
                });
        };

        self.removeCorrespondence = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_remove').change({name: self.task.correspondence.docSubject}))
                .then(function () {
                    self.task.correspondence = null;
                    self.task.documentVSID = null;
                    self.task.docClassId = null;
                });
        };

        self.canSaveTask = function () {
            return self.hasMinimumValues() && (self.task.withoutParticipant || (!self.task.withoutParticipant && self.task.taskParticipants.length))
        };

        self.hasMinimumValues = function () {
            return !!(self.task.taskTitle && self.task.taskTitle.length > 3 && self.task.startDate && self.task.dueDate);
        }

    });
};
