module.exports = function (app) {
    app.factory('Indicator', function (CMSModelInterceptor,
                                       lookupService,
                                       Lookup,
                                       moment,
                                       langService) {
        'ngInject';
        return function Indicator(model) {
            var self = this;
            self.key = null;
            self.class = null;
            self.text = null;
            self.icon = null;
            self.tooltip = null;
            self.value = null;

            if (model)
                angular.extend(this, model);

            self.recordTypes = {
                Correspondence: 'Correspondence',
                Outgoing: 'Outgoing',
                Incoming: 'Incoming',
                Internal: 'Internal',
                WorkItem: 'WorkItem',
                EventHistory: 'EventHistory'
            };

            /**
             * @description Contains the icons for the indicators
             * @type {{}}
             */
            var icons = {};
            icons[lookupService.securityLevel] = 'security';
            icons[lookupService.priorityLevel + '_prior0'] = '';//(not showing any icon for normal priority) //arrow-down // Normal Priority
            icons[lookupService.priorityLevel + '_prior1'] = 'arrow-up'; // Urgent Priority
            icons[lookupService.priorityLevel + '_prior2'] = 'exclamation';// Top Urgent Priority
            icons['followupStatus0'] = 'reply';
            icons['attachment'] = 'paperclip';
            icons['linkedDocs'] = 'link-variant';
            icons['reassigned'] = 'transfer';
            icons['email_opened'] = 'email-open';
            icons['email_close'] = 'email';
            icons['outgoing'] = 'arrow-up-bold-box';
            icons['incoming'] = 'arrow-down-bold-box';
            icons['internal'] = 'recycle';
            icons['paper_document'] = 'file-document';
            icons['electronic_document'] = 'tablet';//cellphone-dock';
            icons['export_via_central_archive'] = 'archive';
            icons['linked_exported_doc'] = 'link';
            icons['due_date'] = 'calendar';
            icons['copy'] = 'content-copy';
            icons['locked_g2g'] = 'lock';
            icons['version_has_content'] = 'file-check';


            /**
             * @description Returns the icons to be shown as indicators
             * @param type
             * @returns {*}
             */
            Indicator.prototype.getIndicatorIcons = function (type) {
                if (type)
                    return icons[type];
                return icons;
            };

            /**
             * @description Returns the security level indicator and description
             * @param securityLevel
             * @returns {Indicator}
             */
            Indicator.prototype.getSecurityLevelIndicator = function (securityLevel) {
                var icon = self.getIndicatorIcons(lookupService.securityLevel);
                var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
                var securityLevelMap = _.find(_.map(securityLevels, function (lookup, index) {
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
                return new Indicator(securityLevelMap);
            };

            /**
             * @description Returns the priority level indicator and description
             * @param priorityLevel
             * @returns {Indicator}
             */
            Indicator.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                if (priorityLevel.lookupKey !== 0) {
                    var priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                    var priorityLevelMap = _.find(_.map(priorityLevels, function (lookup, index) {
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
            };

            /**
             * @description Returns the has-attachment indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getAttachmentsIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_doc_has_attachment',
                    icon: self.getIndicatorIcons('attachment'),
                    tooltip: 'indicator_doc_has_attachment'
                });
            };

            /**
             * @description Returns the has-linked-documents indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getLinkedDocumentsIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_doc_has_linked_doc',
                    icon: self.getIndicatorIcons('linkedDocs'),
                    tooltip: 'indicator_doc_has_linked_doc'
                });
            };

            /**
             * @description Returns the followup status indicator and description
             * @param followupStatus
             * @returns {Indicator}
             */
            Indicator.prototype.getFollowUpStatusIndicator = function (followupStatus) {
                if (followupStatus.lookupKey === 0) {
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
             * @description Returns the due date status(passed/today/coming) indicator and description
             * @param dueDate
             * @returns {Indicator}
             */
            Indicator.prototype.getDueDateStatusIndicator = function (dueDate) {
                var today = moment(new Date()).startOf('day');
                var recordDueDate = moment(dueDate).startOf('day');
                var diff = recordDueDate.diff(today, 'days');
                var dueDateStatus = (diff < 0) ? 'past' : (diff === 0 ? 'today' : 'future');
                return new Indicator({
                    class: 'indicator date-' + dueDateStatus,
                    text: diff < 0 ? 'indicator_date_passed' : (diff === 0 ? 'indicator_date_today' : 'indicator_date_coming'),
                    icon: self.getIndicatorIcons('due_date'),
                    tooltip: 'indicator_due_date'
                });
            };

            /**
             * @description Returns the tags count indicator(badge) and description
             * @param tagsCount
             * @returns {Indicator}
             */
            Indicator.prototype.getTagsIndicator = function (tagsCount) {
                return new Indicator({
                    class: 'indicator badge',
                    text: tagsCount,
                    icon: '',
                    tooltip: 'indicator_tags'
                });
            };

            /**
             * @description Returns the document class(Outgoing/Incoming/Internal) indicator and description
             * @param docClass
             * @returns {Indicator}
             */
            Indicator.prototype.getDocClassIndicator = function (docClass) {
                docClass = docClass.toLowerCase();
                return new Indicator({
                    class: 'indicator ' + docClass,
                    text: 'indicator_' + docClass,
                    icon: self.getIndicatorIcons(docClass),
                    tooltip: 'indicator_' + docClass
                });


                /*docClass = docClass.toLowerCase();
                var docClass = 'indicator ' + (docType === 'incoming' ? 'inc' : (docType === 'outgoing' ? 'out' : 'int'));
                var text = (docType === 'incoming' ? 'indicator_incoming' : (docType === 'outgoing' ? 'indicator_outgoing' : 'indicator_internal'));
                var icon = (docType === 'incoming' ? icons['incoming'] : (docType === 'outgoing' ? icons['outgoing'] : icons['internal']));
                return new Indicator({
                    class: docClass,
                    text: text,
                    icon: icon,
                    tooltip: text
                });*/
            };

            /**
             * @description Returns the is-reassigned indicator and description
             * @param reassigned
             * @returns {Indicator}
             */
            Indicator.prototype.getReassignedIndicator = function (reassigned) {
                return reassigned ? new Indicator({
                    class: 'indicator ' + (reassigned ? 'reassigned' : 'no-reassigned'),
                    text: (reassigned ? 'indicator_reassigned' : 'indicator_not_reassigned'),
                    icon: self.getIndicatorIcons('reassigned'),
                    tooltip: (reassigned ? 'indicator_reassigned' : 'indicator_not_reassigned')
                }) : false;
            };

            /**
             * @description Returns the is-opened indicator and description
             * @param opened
             * @returns {Indicator}
             */
            Indicator.prototype.getOpenedIndicator = function (opened) {
                return new Indicator({
                    class: 'indicator ' + (opened ? 'open' : 'close'),
                    text: (opened ? 'indicator_opened' : 'indicator_not_opened'),
                    icon: (opened ? self.getIndicatorIcons('email_opened') : self.getIndicatorIcons('email_close')),
                    tooltip: (opened ? 'indicator_opened' : 'indicator_not_opened')
                });
            };

            /**
             * @description Returns the comments count indicator(badge) and description
             * @param commentsCount
             * @returns {Indicator}
             */
            Indicator.prototype.getCommentsIndicator = function (commentsCount) {
                return new Indicator({
                    class: 'indicator badge',
                    text: commentsCount,
                    icon: '',
                    tooltip: 'indicator_comments'
                });
            };


            /**
             * @description Returns the is-paper indicator and description
             * @param isPaper
             * @returns {Indicator}
             */
            Indicator.prototype.getIsPaperIndicator = function (isPaper) {
                return new Indicator({
                    class: 'indicator',
                    text: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document'),
                    icon: (isPaper ? self.getIndicatorIcons('paper_document') : self.getIndicatorIcons('electronic_document')),
                    tooltip: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document')
                });
            };

            /**
             * @description Returns the export via central archive indicator and description
             * @returns {Indicator}
             * @param exportViaCentralArchive
             */
            Indicator.prototype.getExportViaCentralArchiveIndicator = function (exportViaCentralArchive) {
                return exportViaCentralArchive ? new Indicator({
                    class: 'indicator',
                    text: 'export_via_central_archive',
                    icon: self.getIndicatorIcons('export_via_central_archive'),
                    tooltip: 'export_via_central_archive'
                }) : false;
            };

            /**
             * @description Returns the is linked exported document(linked document as attachment) indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getIsLinkedExportedDocIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_linked_exported_doc',
                    icon: self.getIndicatorIcons('linked_exported_doc'),
                    tooltip: 'indicator_linked_exported_doc'
                });
            };

            /**
             * @description Returns the type(Original/Copy) indicator and description
             * @returns {Indicator}
             * @param originalOrCopy
             */
            Indicator.prototype.getOriginalCopyIndicator = function (originalOrCopy) {
                return originalOrCopy !== 0 ? new Indicator({
                    class: 'indicator',
                    text: 'indicator_copy',
                    icon: self.getIndicatorIcons('copy'),
                    tooltip: 'indicator_copy'
                }) : false;
            };

            /**
             * @description Returns the is locked g2g record indicator and description
             * @returns {Indicator}
             * @param isLockedG2G
             */
            Indicator.prototype.getIsLockedG2GIndicator = function (isLockedG2G) {
                return isLockedG2G ? new Indicator({
                    class: 'indicator',
                    text: 'indicator_locked_by',
                    icon: self.getIndicatorIcons('locked_g2g'),
                    tooltip: 'indicator_locked_by'
                }) : false;
            };

            /**
             * @description Returns the record has content indicator and description
             * @returns {Indicator}
             * @param hasContent
             */
            Indicator.prototype.getVersionHasContentIndicator = function (hasContent) {
                return hasContent ? new Indicator({
                    class: 'indicator',
                    text: 'indicator_version_has_content',
                    icon: self.getIndicatorIcons('version_has_content'),
                    tooltip: 'indicator_version_has_content'
                }) : false;
            };



            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Indicator', 'init', this);
        }
    })
};