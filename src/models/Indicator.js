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

            if (model)
                angular.extend(this, model);

            /**
             * @description Contains the icons for the indicators
             * @type {{}}
             */
            var icons = {};
            icons[lookupService.securityLevel] = 'security';
            icons[lookupService.priorityLevel + '_prior0'] = '';//arrow-down // Normal Priority
            icons[lookupService.priorityLevel + '_prior1'] = 'arrow-up'; // Urgent Priority
            icons[lookupService.priorityLevel + '_prior2'] = 'exclamation';// Top Urgent Priority
            icons['followupStatus'] = 'reply';
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
                var icon = icons[lookupService.securityLevel];
                var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
                var securityLevelMap = _.find(_.map(securityLevels, function (lookup, index) {
                    return {
                        key: lookup.lookupKey,
                        //class: 'indicator secure' + (index + 1),
                        class: 'indicator secure' + (lookup.lookupKey),
                        text: 'indicator_security_level',
                        icon: icon,
                        tooltip: 'indicator_security_level'
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
                var icon = icons[lookupService.priorityLevel + '_prior' + priorityLevel.lookupKey];
                var priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
                var priorityLevelMap = _.find(_.map(priorityLevels, function (lookup, index) {
                    return {
                        key: lookup.lookupKey,
                        class: 'indicator prior' + (lookup.lookupKey),
                        text: 'indicator_priority_level',
                        icon: icon,
                        tooltip: 'indicator_priority_level'
                    }
                }), ['key', priorityLevel.lookupKey]);
                return new Indicator(priorityLevelMap);
            };

            /**
             * @description Returns the has-attachment indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getAttachmentsIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_doc_has_attachment',
                    icon: icons['attachment'],
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
                    icon: icons['linkedDocs'],
                    tooltip: 'indicator_doc_has_linked_doc'
                });
            };

            /**
             * @description Returns the followup status indicator and description
             * @param followupStatus
             * @returns {Indicator}
             */
            Indicator.prototype.getFollowUpStatusIndicator = function (followupStatus) {
                //var icon = icons[lookupService.priorityLevel + '_prior' + priorityLevel.lookupKey];
                var icon = icons['followupStatus'];
                var followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

                var followupStatusMap = _.find(_.map(followUpStatuses, function (lookup, index) {
                    return {
                        key: lookup.lookupKey,
                        class: 'indicator f-status' + (lookup.lookupKey),
                        text: 'indicator_followup_status',
                        icon: icon,
                        tooltip: 'indicator_followup_status'
                    }
                }), ['key', followupStatus.lookupKey]);
                return new Indicator(followupStatusMap);
            };

            /**
             * @description Returns the due date indicator and description
             * @param docClass
             * @param dueDate
             * @returns {Indicator}
             */
            Indicator.prototype.getDueDateStatusIndicator = function (docClass, dueDate) {
                docClass = docClass.toLowerCase();
                var today = moment(new Date()).startOf('day');
                var recordDueDate = moment(dueDate).startOf('day');
                var diff = recordDueDate.diff(today, 'days');
                //var diff = recordDueDate.isBefore(today);
                var dueDateStatus = (diff < 0) ? 'past' : (diff === 0 ? 'today' : 'future');
                return new Indicator({
                    class: 'indicator date-' + dueDateStatus,
                    text: diff < 0 ? 'indicator_date_passed' : (diff === 0 ? 'indicator_date_today' : 'indicator_date_coming'),
                    icon: 'calendar',
                    tooltip: 'indicator_due_date'
                });
            };

            /**
             * @description Returns the tags count indicator and description
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
             * @description Returns the document type indicator and description
             * @param docType
             * @returns {Indicator}
             */
            Indicator.prototype.getDocTypeIndicator = function (docType) {
                docType = docType.toLowerCase();
                var docClass = 'indicator ' + (docType === 'incoming' ? 'inc' : (docType === 'outgoing' ? 'out' : 'int'));
                var text = (docType === 'incoming' ? 'indicator_incoming' : (docType === 'outgoing' ? 'indicator_outgoing' : 'indicator_internal'));
                var icon = (docType === 'incoming' ? icons['incoming'] : (docType === 'outgoing' ? icons['outgoing'] : icons['internal']));
                return new Indicator({
                    class: docClass,
                    text: text,
                    icon: icon,
                    tooltip: text
                });
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
                    icon: icons['reassigned'],
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
                    icon: (opened ? icons['email_opened'] : icons['email_close']),
                    tooltip: (opened ? 'indicator_opened' : 'indicator_not_opened')
                });
            };

            /**
             * @description Returns the comments indicator and description
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
                    class: 'indicator', //(isPaper ? 'indicator' : 'indicator'),
                    text: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document'),
                    icon: (isPaper ? icons['paper_document'] : icons['electronic_document']),
                    tooltip: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document')
                });
            };


            Indicator.prototype.getExportViaCentralArchiveIndicator = function (exportViaCentralArchive) {
                return exportViaCentralArchive ? new Indicator({
                    class: 'indicator',
                    text: 'export_via_central_archive',
                    icon: icons['export_via_central_archive'],
                    tooltip: 'export_via_central_archive'
                }) : false;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Indicator', 'init', this);
        }
    })
};