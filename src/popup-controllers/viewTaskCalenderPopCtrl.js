module.exports = function (app) {
    app.controller('viewTaskCalenderPopCtrl', function (taskItem,
                                                        langService,
                                                        _,
                                                        toast,
                                                        WorkItem,
                                                        employeeService,
                                                        lookupService,
                                                        viewDocumentService,
                                                        taskService,
                                                        $scope,
                                                        task,
                                                        gridService) {
            'ngInject';
            var self = this;

            self.controllerName = 'viewTaskCalenderPopCtrl';

            self.task = task;

            self.taskStates = lookupService.returnLookups('taskState');

            self.taskStatesMap = _generateTaskStatesMap();

            self.taskItem = taskItem;

            self.employee = employeeService.getEmployee();

            self.currentParticipantId = Number(self.employee.id + '' + self.employee.getOUID());

            self.task.taskParticipants = _.map(self.task.taskParticipants, function (part, index) {
                part.index = index;
                return part;
            });

            self.grid = {
                limit: 5, // default limit
                page: 1, // first page
                order: 'userId.arName', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.task.taskParticipants.length + 21);
                        }
                    }
                ]
            };

            self.participant = _.find(self.task.taskParticipants, function (participant) {
                return participant.participantId === self.currentParticipantId;
            });


            function _generateTaskStatesMap() {
                var map = {};
                _.map(self.taskStates, function (state) {
                    map[state.lookupKey] = state;
                });
                return map;
            }

            self.viewDocument = function (correspondence, $event) {
                var info = correspondence.getInfo();
                var workItem = null;
                var ctrl = !self.task.wobNum ? taskService.getQueueController(info.documentClass) : taskService.getQueueController('userInbox');

                if (self.task.wobNum) {
                    workItem = new WorkItem({
                        generalStepElm: {
                            workObjectNumber: self.task.wobNum,
                            docType: info.docClassId
                        }
                    });
                    ctrl.viewDocument(workItem, $event);
                    return;
                }

                ctrl.viewDocument(correspondence, $event);
            };

            self.truncateSubject = gridService.getGridSubjectTruncateByGridName(gridService.grids.others.viewTask);
            self.setTruncateSubject = function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.others.viewTask, self.truncateSubject);
            };

            self.orderByName = function (propertyName) {
                return propertyName + '.' + langService.current + 'Name';
            };

            self.openTaskParticipantFromView = function (participant, $event) {
                $event.preventDefault();

                taskService
                    .openSettingForParticipant(participant, self.task, true, true)
                    .then(function (participant) {
                        self.task
                            .editTaskParticipant(participant)
                            .then(function () {
                                toast.success(langService.get('task_participant_updated_successfully'));
                            });
                    });
            };

            self.isCurrentParticipant = function (participant) {
                return participant.participantId === self.employee.getCombinedEmployeeId();
            }
        }
    );
};
