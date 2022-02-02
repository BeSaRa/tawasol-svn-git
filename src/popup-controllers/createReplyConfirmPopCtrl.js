module.exports = function (app) {
    app.controller('createReplyPopCtrl', function ($q,
                                                   langService,
                                                   dialog,
                                                   $state,
                                                   employeeService,
                                                   generator,
                                                   _,
                                                   rootEntity,
                                                   configurationService,
                                                   gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'createReplyPopCtrl';
        self.employee = employeeService.getEmployee();

        self.replyType = 0;
        self.replyForm = 0;
        self.addMethod = null;
        self.createAsAttachment = false;

        self.showGrid = false;
        self.selectedVersions = [];
        self.allowDuplicateAction = false;
        self.isInternalOutgoingEnabled = rootEntity.isInternalOutgoingEnabled();

        var permissions = {
            outgoingPaper: 'OUTGOING_PAPER',
            internalPaper: 'INTERNAL_PAPER'
        };

        self.addMethodOptions = [
            {
                id: 0,
                key: 'electronic',
                disabled: function () {
                    return self.employee.isBacklogMode();
                }
            },
            {
                id: 1,
                key: 'paper',
                disabled: function () {
                    return !self.employee.hasPermissionTo(_getPaperPermissionKey());
                }
            }
        ];
        _setAddMethod();

        self.replyFormOptions = [
            {id: 0, key: 'simple'},
            {id: 1, key: 'advanced'}
        ];
        self.replyTypeOptions = [
            {id: 0, key: 'reply_outgoing', show: true},
            {id: 1, key: 'reply_internal', show: true},
            {
                id: 2,
                key: 'reply_outgoing_internal',
                show: self.isInternalOutgoingEnabled && self.record.checkIfInternalSiteTypeWhenCreateReply()
            }
        ];
        self.createAsOptions = [
            {
                id: 0,
                value: true,
                key: 'attachments',
                disabled: function () {
                    return false;
                }
            },
            {
                id: 1,
                value: false,
                key: 'linked_documents',
                disabled: function () {
                    return !!self.isSpecificVersion;
                }
            }
        ];

        self.validateLabels = {
            replyType: 'reply_type',
            addMethod: 'label_document_type',
            replyForm: 'reply_form',
            createAsAttachment: 'link_as'
        };

        /**
         * @description Handles the change of reply type
         * @param $event
         */
        self.onChangeReplyType = function ($event) {
            _setAddMethod();
        };

        /**
         * @description Checks if create reply button is disabled
         * @returns {boolean}
         */
        self.isCreateReplyDisabled = function () {
            var disabled = (self.addMethod === null);
            if (self.isSpecificVersion) {
                disabled = disabled || !self.selectedVersions || !self.selectedVersions.length || !self.selectedVersions[0].hasContent();
            }
            return disabled;
        };

        /**
         * @description Set the user selected values and open create reply screen
         * @param $event
         */
        self.setCreateReply = function ($event) {
            if (self.isCreateReplyDisabled()) {
                generator.generateErrorFields('check_this_fields', [self.validateLabels.addMethod]);
                return;
            }
            var info = self.record.getInfo(),
                page,
                pages = {
                    outgoingAdd: 'app.outgoing.add',
                    outgoingAddInternal: 'app.outgoing.add-internal',
                    outgoingSimpleAdd: 'app.outgoing.simple-add',
                    outgoingSimpleAddInternal: 'app.outgoing.simple-add-internal',
                    internalAdd: 'app.internal.add',
                    internalSimpleAdd: 'app.internal.simple-add'
                };
            if (self.replyForm === 0) {
                if (self.replyType === 0) {
                    page = pages.outgoingSimpleAdd;
                } else if (self.replyType === 1) {
                    page = pages.internalSimpleAdd;
                } else if (self.isInternalOutgoingEnabled && self.replyType === 2) {
                    page = pages.outgoingSimpleAddInternal
                }
            } else {
                if (self.replyType === 0) {
                    page = pages.outgoingAdd;
                } else if (self.replyType === 1) {
                    page = pages.internalAdd;
                } else if (self.isInternalOutgoingEnabled && self.replyType === 2) {
                    page = pages.outgoingAddInternal
                }
            }
            dialog.hide();
            $state.go(page, {
                wobNum: info.wobNumber,
                vsId: info.vsId,
                action: 'reply',
                createAsAttachment: self.createAsAttachment,
                sourceDocClass: info.documentClass,
                addMethod: self.addMethod,
                versionNumber: self.isSpecificVersion ? generator.getNormalizedValue(self.selectedVersions[0], 'majorVersionNumber') : null
            });
        };


        self.grid = {
            progress: null,
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.versions.length + 21);
                    }
                }
            ],
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.others.createReplyVersionSelect),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.others.createReplyVersionSelect, self.grid.truncateSubject);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.versions = $filter('orderBy')(self.versions, self.grid.order);
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        self.openVersion = function (version, $event) {
            return version.viewFromQueueById([], 'userInbox', $event);
        };

        /**
         * @description close broadcast popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        function _getPaperPermissionKey() {
            return self.replyType === 0 ? permissions.outgoingPaper : permissions.internalPaper;
        }

        function _setAddMethod() {
            self.addMethod = null;
            // if backlogMode, only paper is allowed but if no paper permission(OUTGOING_PAPER/INTERNAL_PAPER), addMethod will be null
            // else electronic
            if (self.employee.isBacklogMode()) {
                if (self.employee.hasPermissionTo(_getPaperPermissionKey())) {
                    self.addMethod = 1;
                }
            } else {
                self.addMethod = 0;
            }
        }

        function _setCreateAsAttachment(createAsAttachment) {
            self.createAsAttachment = createAsAttachment;
        }

        self.$onInit = function () {
            _setCreateAsAttachment(!!self.isSpecificVersion);
            self.showGrid = !!self.isSpecificVersion;
        };

    });
};
