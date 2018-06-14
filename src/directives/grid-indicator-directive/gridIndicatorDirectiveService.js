module.exports = function (app) {
    app.service('gridIndicatorDirectiveService', function (generator,
                                                           Indicator,
                                                           lookupService,
                                                           Correspondence,
                                                           Outgoing,
                                                           Incoming,
                                                           Internal,
                                                           General,
                                                           WorkItem,
                                                           EventHistory,
                                                           SentItemDepartmentInbox,
                                                           G2G,
                                                           Attachment,
                                                           moment,
                                                           Lookup,
                                                           $timeout,
                                                           //IncomingG2G
    ) {
        'ngInject';
        var self = this;
        self.serviceName = 'gridIndicatorDirectiveService';
        $timeout(function () {
            self.recordCopy = angular.copy(self.record);
        });

        /**
         * @description Contains the icons for the indicators
         * @type {{}}
         */
        self.icons = {};
        self.icons[lookupService.securityLevel] = 'security';
        self.icons[lookupService.priorityLevel + '_prior0'] = '';//(not showing any icon for normal priority) //arrow-down // Normal Priority
        self.icons[lookupService.priorityLevel + '_prior1'] = 'arrow-up'; // Urgent Priority
        self.icons[lookupService.priorityLevel + '_prior2'] = 'exclamation';// Top Urgent Priority
        self.icons['followupStatus0'] = 'reply';
        self.icons['attachment'] = 'paperclip';
        self.icons['linkedDocs'] = 'link-variant';
        self.icons['reassigned'] = 'transfer';
        self.icons['email_opened'] = 'email-open';
        self.icons['email_close'] = 'email';
        self.icons['outgoing'] = 'arrow-up-bold-box';
        self.icons['incoming'] = 'arrow-down-bold-box';
        self.icons['internal'] = 'recycle';
        self.icons['paper_document'] = 'file-document';
        self.icons['electronic_document'] = 'tablet';//cellphone-dock';
        self.icons['export_via_central_archive'] = 'archive';
        self.icons['linked_exported_doc'] = 'link';
        self.icons['due_date'] = 'calendar';
        self.icons['copy'] = 'content-copy';
        self.icons['locked_g2g'] = 'lock';


        /**
         * @description Returns the icons to be shown as indicators
         * @param type
         * @returns {*}
         */
        self.getIndicatorIcons = function (type) {
            if (type)
                return self.icons[type];
            return icons;
        };

        /**
         * @description Returns the security level indicator and description
         * @param record
         * @returns {Indicator|*}
         */
        self.getSecurityLevelIndicator = function (record) {
            var securityLevel = null;
            if (record instanceof Outgoing || record instanceof Incoming
                || record instanceof Internal || record instanceof General
                || record instanceof Correspondence || record instanceof SentItemDepartmentInbox
                || record instanceof EventHistory //|| record instanceof IncomingG2G
            ) {
                securityLevel = record.securityLevel;
            }
            else if (record instanceof WorkItem) {
                securityLevel = record.generalStepElm.securityLevel;
            }

            if (securityLevel) {
                var allSecurityLevels = lookupService.returnLookups(lookupService.securityLevel);

                /*Get security level lookup if security level from record comes as lookupKey(value)*/
                if (!(securityLevel instanceof Lookup))
                    securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, securityLevel);

                var securityLevelMap = _.find(_.map(allSecurityLevels, function (lookup, index) {
                    return {
                        key: lookup.lookupKey,
                        //class: 'indicator secure' + (index + 1),
                        class: 'indicator secure' + (lookup.lookupKey),
                        text: 'indicator_security_level',
                        icon: self.getIndicatorIcons(lookupService.securityLevel),
                        tooltip: 'indicator_security_level',
                        value: lookup
                    }
                }), ['key', securityLevel.lookupKey]);
            }
            return new Indicator(securityLevelMap);

        };

        /**
         * @description Returns the priority level indicator and description
         * @param record
         * @returns {Indicator|*}
         */
        self.getPriorityLevelIndicator = function (record) {
            var priorityLevel = null;
            if (record instanceof Outgoing || record instanceof Incoming
                || record instanceof Internal || record instanceof General
                || record instanceof Correspondence || record instanceof SentItemDepartmentInbox
                || record instanceof EventHistory //|| record instanceof IncomingG2G
            ) {
                priorityLevel = record.priorityLevel;
            }
            else if (record instanceof WorkItem) {
                priorityLevel = record.generalStepElm.priorityLevel;
            }

            if (priorityLevel) {
                /*Get priority level lookup if priority level from record comes as lookupKey(value)*/
                if (!(priorityLevel instanceof Lookup))
                    priorityLevel = lookupService.getLookupByLookupKey(lookupService.priorityLevel, priorityLevel);

                /* Don't show indicator for normal priority level*/
                if (priorityLevel.lookupKey !== 0) {
                    var allPriorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                    var priorityLevelMap = _.find(_.map(allPriorityLevels, function (lookup, index) {
                        return {
                            key: lookup.lookupKey,
                            class: 'indicator prior' + (lookup.lookupKey),
                            text: 'indicator_priority_level',
                            icon: self.getIndicatorIcons(lookupService.priorityLevel + '_prior' + priorityLevel.lookupKey),
                            tooltip: 'indicator_priority_level',
                            value: lookup
                        }
                    }), ['key', priorityLevel.lookupKey]);
                    return new Indicator(priorityLevelMap);
                }
                return null;
            }
            return null;

        };

        /**
         * @description Returns the document class(Outgoing/Incoming/Internal) indicator and description
         * @param record
         * @returns {Indicator|*}
         */
        self.getDocClassIndicator = function (record) {
            /*var docClass = null;
            if (record instanceof Outgoing || record instanceof Incoming
                || record instanceof Internal || record instanceof General
                || record instanceof EventHistory //|| record instanceof IncomingG2G
            ){
                docClass = record.docClassName;
            }
            else if (record instanceof WorkItem) {
                docClass = record.generalStepElm.workFlowName;
            }*/
            var docClass = record.getInfo().documentClass.toLowerCase();

            return new Indicator({
                class: 'indicator ' + docClass,
                text: 'indicator_' + docClass,
                icon: self.getIndicatorIcons(docClass),
                tooltip: 'indicator_' + docClass
            });
        };

        /**
         * @description Returns the paper/electronic document indicator and description
         * @param record
         * @returns {Indicator|*}
         */
        self.getPaperElectronicIndicator = function (record) {
            /*var isPaper = false;
            if (record instanceof Outgoing || record instanceof Incoming || record instanceof Internal) {
                isPaper = record.hasOwnProperty('addMethod') ? record.addMethod : 1;
            }
            else if (record instanceof WorkItem) {
                isPaper = record.generalStepElm.hasOwnProperty('addMethod')? record.generalStepElm.addMethod : 1;
            }*/
            var isPaper = record.getInfo().isPaper;

            return new Indicator({
                class: 'indicator',
                text: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document'),
                icon: (isPaper ? self.getIndicatorIcons('paper_document') : self.getIndicatorIcons('electronic_document')),
                tooltip: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document')
            });
        };

        /**
         * @description Returns the is-reassigned indicator and description
         * @param record
         */
        self.getIsReassignedIndicator = function (record) {
            var isReassigned = false;
            if (record instanceof WorkItem) {
                isReassigned = record.generalStepElm.isReassigned;
            }
            return isReassigned ? new Indicator({
                class: 'indicator ' + (isReassigned ? 'reassigned' : 'no-reassigned'),
                text: (isReassigned ? 'indicator_reassigned' : 'indicator_not_reassigned'),
                icon: self.getIndicatorIcons('reassigned'),
                tooltip: (isReassigned ? 'indicator_reassigned' : 'indicator_not_reassigned')
            }) : false;
        };

        /**
         * @description Returns the has-linked-documents indicator and description
         * @param record
         */
        self.getHasLinkedDocumentsIndicator = function (record) {
            var hasLinkedDocs = false;
            if (record instanceof WorkItem) {
                hasLinkedDocs = record.generalStepElm.linkedDocsNO;
            }
            else if (record instanceof General || record instanceof Correspondence) {
                record.linkedDocs = (record.linkedDocs && record.linkedDocs.length) ? angular.fromJson(record.linkedDocs) : record.linkedDocs;
                var linkedDocs = angular.copy(record.linkedDocs) || [];
                if (record.linkedDocs && record.linkedDocs.length && !angular.isArray(record.linkedDocs))
                    linkedDocs = Array.prototype.slice.call(JSON.parse(record.linkedDocs));
                hasLinkedDocs = linkedDocs.length;
            }
            return hasLinkedDocs ? new Indicator({
                class: 'indicator',
                text: 'indicator_doc_has_linked_doc',
                icon: self.getIndicatorIcons('linkedDocs'),
                tooltip: 'indicator_doc_has_linked_doc'
            }) : null;
        };

        /**
         * @description Returns the tags count indicator(badge) and description
         * @param record
         */
        self.getTagsIndicator = function (record) {
            var tagsCount = 0;
            if (record instanceof WorkItem) {
                tagsCount = record.generalStepElm.tagsNO;
            }
            if (record instanceof General || record instanceof Correspondence) {
                if (record.tags && !angular.isArray(record.tags)) {
                    record.tags = angular.fromJson(record.tags);
                }
                tagsCount = record.tags.length;
            }

            return new Indicator({
                class: 'indicator badge',
                text: tagsCount,
                icon: '',
                tooltip: 'indicator_tags'
            });
        };

        /**
         * @description Returns the followup status indicator and description
         * @param record
         */
        self.getFollowUpStatusIndicator = function (record) {
            var followupStatus = null;
            if (record instanceof WorkItem) {
                followupStatus = record.generalStepElm.followupStatus;
            }
            else if (record instanceof SentItemDepartmentInbox) {
                followupStatus = record.followupStatus;
            }
            /*Get Followup status lookup if followup status from record comes as lookupKey(value)*/
            if (!(followupStatus instanceof Lookup))
                followupStatus = lookupService.getLookupByLookupKey(lookupService.followupStatus, followupStatus);

            if (followupStatus && followupStatus.lookupKey === 0) {
                var followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
                var followupStatusMap = _.find(_.map(followUpStatuses, function (lookup, index) {
                    return {
                        key: lookup.lookupKey,
                        class: 'indicator f-status' + (lookup.lookupKey),
                        text: 'indicator_followup_status',
                        icon: self.getIndicatorIcons('followupStatus' + lookup.lookupKey),
                        tooltip: 'indicator_followup_status',
                        value: lookup
                    }
                }), ['key', followupStatus.lookupKey]);
                return new Indicator(followupStatusMap);
            }
            return null;

        };

        /**
         * @description Returns the has-attachment indicator and description
         * @param record
         */
        self.getHasAttachmentIndicator = function (record) {
            var hasAttachment = false;
            if (record instanceof General || record instanceof Correspondence) {
                if (!angular.isArray(record.attachments))
                    record.attachments = (record.attachments && record.attachments.length) ? Array.prototype.slice.call(JSON.parse(record.attachments)) : [];

                hasAttachment = record.attachments && record.attachments.length;
            }
            else if (record instanceof WorkItem) {
                hasAttachment = record.generalStepElm.attachementsNO;
            }

            return hasAttachment ? new Indicator({
                class: 'indicator',
                text: 'indicator_doc_has_attachment',
                icon: self.getIndicatorIcons('attachment'),
                tooltip: 'indicator_doc_has_attachment'
            }) : null;
        };

        /**
         * @description Returns the export via central archive indicator and description
         * @param record
         */
        self.getDueDateIndicator = function (record) {
            var dueDate = '';
            if (record instanceof EventHistory) {
                dueDate = generator.getDateFromTimeStamp(record.dueDate);
            }
            else if (record instanceof WorkItem) {
                dueDate = angular.copy(record.generalStepElm.dueDate);
                if (dueDate && dueDate > 0 && dueDate >= moment().unix())
                    dueDate = generator.getDateFromTimeStamp(dueDate);
            }
            if (dueDate) {
                var today = moment(new Date()).startOf('day');
                var recordDueDate = moment(dueDate).startOf('day');
                var diff = recordDueDate.diff(today, 'days');
                var dueDateStatus = (diff < 0) ? 'past' : (diff === 0 ? 'today' : 'future');
                return new Indicator({
                    class: 'indicator date-' + dueDateStatus,
                    text: dueDate,
                    icon: self.getIndicatorIcons('due_date'),
                    tooltip: 'indicator_due_date',
                    value: diff < 0 ? 'indicator_date_passed' : (diff === 0 ? 'indicator_date_today' : 'indicator_date_coming')
                });
            }
            return null;
        };

        /**
         * @description Returns the is linked exported document(linked document as attachment) indicator and description
         * @param record
         */
        self.getIsLinkedExportedDocIndicator = function (record) {
            var isLinkedExportedDoc = false;

            if (record instanceof Attachment) {
                if (!record.attachmentType && record.refVSID) {
                    //record.attachmentType = new AttachmentType();
                    isLinkedExportedDoc = record.refVSID;
                }
            }

            return isLinkedExportedDoc ? new Indicator({
                class: 'indicator',
                text: 'indicator_linked_exported_doc',
                icon: self.getIndicatorIcons('linked_exported_doc'),
                tooltip: 'indicator_linked_exported_doc'
            }) : null;
        };

        /**
         * @description Returns the type(Original/Copy) indicator and description
         * @param record
         */
        self.getOriginalCopyIndicator = function (record) {
            var originalOrCopy = 0;
            if (record instanceof SentItemDepartmentInbox) {
                originalOrCopy = record.type;
            }
            else if (record instanceof WorkItem) {
                originalOrCopy = record.generalStepElm.orginality;
            }
            return originalOrCopy !== 0 ? new Indicator({
                class: 'indicator',
                text: 'indicator_copy',
                icon: self.getIndicatorIcons('copy'),
                tooltip: 'indicator_copy'
            }) : null;
        };

        /**
         * @description Returns the is locked g2g record indicator and description
         * @param record
         * @returns {*}
         */
        self.getIsLockedG2GIndicator = function (record) {
            var isLocked = false, value = null;
            if (record instanceof G2G) {
                isLocked = record.stepElm.lockedStatus;
                value = record.stepElm.lockingInfo ? record.stepElm.lockingInfo.displayName : value;
            }

            return isLocked ? new Indicator({
                class: 'indicator',
                text: 'indicator_locked_by',
                icon: self.getIndicatorIcons('locked_g2g'),
                tooltip: 'indicator_locked_by',
                value: value
            }) : null;
        };

        /**
         * @description Returns the export via central archive indicator and description
         * @param record
         */
        self.getExportViaCentralArchiveIndicator = function (record) {
            var isExportViaCentralArchive = false;
            if (record instanceof WorkItem) {
                isExportViaCentralArchive = record.generalStepElm.hasOwnProperty('exportViaCentralArchive') ? record.generalStepElm.exportViaCentralArchive : false;
            }
            return isExportViaCentralArchive ? new Indicator({
                class: 'indicator',
                text: 'export_via_central_archive',
                icon: self.getIndicatorIcons('export_via_central_archive'),
                tooltip: 'export_via_central_archive'
            }) : null;
        }
    });
};