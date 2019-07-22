module.exports = function (app) {
    app.controller('tasksCalenderDirectiveCtrl', function ($element,
                                                           cmsTemplate,
                                                           dialog,
                                                           toast,
                                                           lookupService,
                                                           TaskParticipant,
                                                           $rootScope,
                                                           $compile,
                                                           $timeout,
                                                           $controller,
                                                           langService,
                                                           taskService) {
        'ngInject';
        var self = this,
            headers = {
                en: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                ar: {
                    left: 'timeGridDay,timeGridWeek,dayGridMonth',
                    center: 'title',
                    right: 'today prev,next'
                }
            };
        self.controllerName = 'tasksCalenderDirectiveCtrl';
        // calender DOM element
        self.calenderElement = $element.find('#tasks-calender')[0];
        // calender Object
        self.calender = null;

        self.taskStates = lookupService.returnLookups('taskState');

        self.classes = taskService.classes;


        // get controller of review outgoing
        taskService.hasGridActions('outgoing', function () {
            return $controller('searchOutgoingCtrl', {
                organizations: [],
                propertyConfigurations: [],
                centralArchives: false,
                approvers: [],
                reviewOutgoings: []
            }).gridActions;
        });
        // get controller of review incoming
        taskService.hasGridActions('incoming', function () {
            return $controller('searchIncomingCtrl', {
                organizations: [],
                propertyConfigurations: [],
                centralArchives: false,
                reviewIncomings: []
            }).gridActions;
        });
        // get controller of review internal
        taskService.hasGridActions('internal', function () {
            return $controller('searchInternalCtrl', {
                organizations: [],
                propertyConfigurations: [],
                centralArchives: false,
                approvers: [],
                reviewInternals: []
            }).gridActions;
        });

        taskService.hasGridActions('internal', function () {
            return $controller('searchInternalCtrl', {
                reviewInternals: []
            }).gridActions;
        });

        /**
         * @description callback for selected calender cells to add a new event.
         * @param selectInfo
         */
        self.openAddEventDialog = function (selectInfo) {
            taskService
                .controllerMethod
                .taskAdd(selectInfo.start, selectInfo.end, selectInfo.allDay)
                .then(function () {
                    taskService.reloadCalender();
                })
        };
        /**
         * @description init calender and start render events.
         */
        self.initCalender = function () {
            $timeout(function () {
                self.calender = new FullCalendar.Calendar(self.calenderElement, {
                    header: headers[langService.current],
                    locale: langService.current,
                    dir: 'ltr',
                    eventLimit: true,
                    selectable: true,
                    select: self.openAddEventDialog,
                    plugins: ['interaction', 'dayGrid', 'timeGrid'],
                    events: function (fetchInfo, successCallback, failCallback) {
                        taskService
                            .loadEvents(fetchInfo.start, fetchInfo.end)
                            .then(function (events) {
                                successCallback(events);
                            });
                    },
                    eventRender: function (info) {
                        var element = angular.element(info.el), content = angular.element(element).find('.fc-content');
                        var scope = $rootScope.$new(true);
                        var menu = angular.element('<md-menu />', {class: 'menu-calender'});

                        menu.append('<md-button ng-click="$mdMenu.open()" class="md-icon-button menu-button-calender" ><md-icon class="fc-task-icon" tooltip="{{lang.im_task_owner}}" md-svg-icon="dots-vertical"></md-icon></md-button>');
                        menu.append('<md-menu-content></md-menu-content>');
                        var menuContent = menu.find('md-menu-content');
                        // edit button
                        menuContent.append('<md-menu-item><md-button ng-click="ctrl.editTask(ctrl.task)">edit</md-button></md-menu-item>');
                        // complete button
                        menuContent.append('<md-menu-item><md-button>make task complete</md-button></md-menu-item>');

                        scope.lang = langService.getCurrentTranslate();

                        scope.ctrl = {
                            task: info.event.extendedProps,
                            viewTask: self.viewTask,
                            editTask: self.editTaskDialog
                        };
                        // ng-click="ctrl.editTask(ctrl.task,$event)"
                        content.find('.fc-title').attr('flex', '');
                        content.attr('layout', 'row');
                        content.attr('layout-align', 'start center');
                        content.find('.fc-title').attr('ng-click', 'ctrl.viewTask(ctrl.task , $event)');

                        if (scope.ctrl.task.creator) {
                            content.prepend('<md-icon class="fc-task-icon" tooltip="{{lang.im_task_owner}}" md-svg-icon="account"></md-icon>');
                            content.append(menu);
                        }
                        $compile(element)(scope);
                    },
                    eventDrop: function (info) {
                        var taskParticipant = new TaskParticipant();
                        taskParticipant
                            .setId(info.event.extendedProps.taskParticipantId)
                            .setTaskDetailsId(info.event.extendedProps.taskId)
                            .setStartDate(info.event.start)
                            .setDueDate(info.event.end)
                            .setOuId(info.event.extendedProps.participantOuInfo.id)
                            .setUserId(info.event.extendedProps.participantInfo.id)
                            .setAllDay(info.event.allDay);

                        taskService
                            .changeTaskParticipantDuration(info.event.extendedProps.taskId, taskParticipant)
                            .then(function () {
                                toast.success(langService.get('task_updated_successfully'));
                            });
                    },
                    eventResize: function (info) {
                        var taskParticipant = new TaskParticipant();
                        taskParticipant
                            .setId(info.event.extendedProps.taskParticipantId)
                            .setTaskDetailsId(info.event.extendedProps.taskId)
                            .setStartDate(info.event.start)
                            .setDueDate(info.event.end)
                            .setOuId(info.event.extendedProps.participantOuInfo.id)
                            .setUserId(info.event.extendedProps.participantInfo.id)
                            .setAllDay(info.event.allDay);

                        taskService
                            .changeTaskParticipantDuration(info.event.extendedProps.taskId, taskParticipant)
                            .then(function () {
                                toast.success(langService.get('task_updated_successfully'));
                            });
                    }
                });
                self.calender.render();

                taskService.setCalender(self.calender);

                langService.listeningToChange(function (lang) {
                    self.calender.setOption('locale', lang);
                    self.calender.setOption('dir', 'ltr');
                })
            });

        };


        self.viewTask = function (task, $event) {
            taskService.viewCalenderTask(task, $event)
        };

        self.openDialogOptions = function (task, $event) {
            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('task-options'),
                    controller: 'taskOptionPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        task: task
                    }
                })
                .then(function (callback) {
                    self[callback](task);
                });
        };
        /**
         * @description edit task
         * @param task
         */
        self.editTaskDialog = function (task) {
            taskService
                .controllerMethod
                .taskEdit(task.taskId)
                .then(function () {
                    taskService.reloadCalender();
                });
        };

        self.setTaskComplete = function (task) {
            taskService
                .completeTask(task.taskId)
                .then(function () {
                    toast.success(langService.get('task_completed_successfully'));
                    taskService.reloadCalender();
                });
        };

        self.setTaskParticipantComplete = function (task) {
            taskService
                .completeTaskParticipant(task.taskId, task.taskParticipantId)
                .then(function () {
                    toast.success(langService.get('task_completed_successfully'));
                    taskService.reloadCalender();
                })
        };

        self.sendReminderForAllParticipants = function (task) {
            taskService
                .sendReminderForAllTaskParticipants(task.taskId)
                .then(function () {
                    toast.success(langService.get('reminder_has_been_successfully_sent_to_all_participants'));
                    taskService.reloadCalender();
                });
        };


        // start render the calender
        self.initCalender();

    });
};
