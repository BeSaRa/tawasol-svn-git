module.exports = function (app) {
    app.factory('Indicator', function (CMSModelInterceptor,
                                       lookupService,
                                       Lookup,
                                       moment,
                                       langService,
                                       gridService,
                                       _) {
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
             * @description Returns the icons to be shown as indicators
             * @param type
             * @returns {*}
             */
            Indicator.prototype.getIndicatorIcons = function (type) {
                if (type)
                    return gridService.gridIcons.indicators[type];
                return gridService.gridIcons.indicators;
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
                        class: 'indicator secure' + (lookup.lookupKey),
                        text: 'indicator_security_level',
                        icon: icon,
                        tooltip: 'indicator_security_level',
                        value: lookup,
                        legendText: function (indicator) {
                            return langService.get('security_level') + ' : ' + lookup.getTranslatedName();
                        }
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
                            icon: self.getIndicatorIcons(lookupService.priorityLevel + '_' + priorityLevel.lookupKey),
                            tooltip: 'indicator_priority_level',
                            value: lookup,
                            legendText: function (indicator) {
                                return langService.get('priority_level') + ' : ' + lookup.getTranslatedName();
                            }
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
                    tooltip: 'indicator_doc_has_attachment',
                    legendText: function (indicator) {
                        return langService.get('attachments')
                    }
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
                    tooltip: 'indicator_doc_has_linked_doc',
                    legendText: function (indicator) {
                        return langService.get('linked_documents');
                    }
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
                            value: lookup,
                            legendText: function (indicator) {
                                return langService.get('follow_up_status') + ' : ' + lookup.getTranslatedName();
                            }
                        }
                    }), ['key', followupStatus.lookupKey]);
                    return new Indicator(followupStatusMap);
                }
                return null;
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
                    tooltip: 'indicator_tags',
                    legendText: function (indicator) {
                        return '';
                    }
                });
            };

            /**
             * @description Returns the document class(Outgoing/Incoming/Internal) indicator and description
             * @param docClass
             * @returns {Indicator}
             */
            Indicator.prototype.getDocClassIndicator = function (docClass) {
                var docClassCopy = docClass;
                docClass = docClass.toLowerCase();
                return new Indicator({
                    class: 'indicator ' + docClass,
                    text: 'indicator_' + docClass,
                    icon: self.getIndicatorIcons(docClass),
                    tooltip: 'indicator_' + docClass,
                    value: docClassCopy,
                    legendText: function (indicator) {
                        return langService.get(docClass);
                    }
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
                    icon: self.getIndicatorIcons('reassigned'),
                    tooltip: (reassigned ? 'indicator_reassigned' : 'indicator_not_reassigned'),
                    legendText: function (indicator) {
                        return langService.get('reassigned');
                    }
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
                    icon: (opened ? self.getIndicatorIcons('bookOpened') : self.getIndicatorIcons('bookNotOpened')),
                    tooltip: (opened ? 'indicator_opened' : 'indicator_not_opened'),
                    legendText: function (indicator) {
                        return '';
                    }
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
                    icon: self.getIndicatorIcons('comments'),
                    tooltip: 'indicator_comments',
                    legendText: function (indicator) {
                        return '';
                    }
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
                    icon: (isPaper ? self.getIndicatorIcons('paperDocument') : self.getIndicatorIcons('electronicDocument')),
                    tooltip: (isPaper ? 'indicator_paper_document' : 'indicator_electronic_document'),
                    legendText: function (indicator) {
                        return isPaper ? langService.get('paper') : langService.get('electronic');
                    }
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
                    icon: self.getIndicatorIcons('exportViaCentralArchive'),
                    tooltip: 'export_via_central_archive',
                    legendText: function (indicator) {
                        return '';
                    }
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
                    icon: self.getIndicatorIcons('linkedExportedDoc'),
                    tooltip: 'indicator_linked_exported_doc',
                    legendText: function (indicator) {
                        return '';
                    }
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
                    tooltip: 'indicator_copy',
                    legendText: function (indicator) {
                        return '';
                    }
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
                    icon: self.getIndicatorIcons('lockedG2g'),
                    tooltip: 'indicator_locked_by',
                    legendText: function (indicator) {
                        return '';
                    }
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
                    icon: self.getIndicatorIcons('versionHasContent'),
                    tooltip: 'indicator_version_has_content',
                    legendText: function (indicator) {
                        return '';
                    }
                }) : false;
            };

            /**
             * @description Returns the is internal g2g record indicator and description
             * @returns {Indicator}
             * @param isInternalG2G
             */
            Indicator.prototype.getIsInternalG2GIndicator = function (isInternalG2G) {
                return isInternalG2G ? new Indicator({
                    class: 'indicator',
                    text: 'indicator_internal_g2g',
                    icon: self.getIndicatorIcons('internalG2g'),
                    tooltip: 'indicator_internal_g2g',
                    legendText: function (indicator) {
                        return '';
                    }
                }) : false;
            };

            /**
             * @description Returns the is locked record indicator and description
             * @returns {Indicator}
             * @param record
             */
            Indicator.prototype.getLockedWorkItemIndicator = function (record) {
                return (record.isLocked() && !record.isLockedByCurrentUser())
                    ? new Indicator({
                        class: 'indicator',
                        text: 'indicator_locked_item_by',
                        icon: self.getIndicatorIcons('lockedWorkItem'),
                        tooltip: 'indicator_locked_item_by',
                        value: record.getLockingUserInfo(),
                        legendText: function (indicator) {
                            return '';
                        }
                    }) : false;
            };

            /**
             * @description Returns the sent to regOU(Transferred) record indicator and description
             * @returns {Indicator}
             * @param isTransferred
             */
            Indicator.prototype.getIsTransferredDocumentIndicator = function (isTransferred) {
                return isTransferred
                    ? new Indicator({
                        class: 'indicator',
                        text: 'indicator_transferred_document',
                        icon: self.getIndicatorIcons('transferredDocument'),
                        tooltip: 'indicator_transferred_document',
                        legendText: function (indicator) {
                            return '';
                        }
                    }) : false;
            };

            /**
             * @description Returns the isBroadcasted record indicator and description
             * @returns {Indicator}
             * @param isBroadcasted
             */
            Indicator.prototype.getIsBroadcastedIndicator = function (isBroadcasted) {
                return isBroadcasted
                    ? new Indicator({
                        class: 'indicator',
                        text: 'broadcasted',
                        icon: self.getIndicatorIcons('broadcast'),
                        tooltip: 'broadcasted',
                        legendText: function (indicator) {
                            return langService.get('broadcasted');
                        }
                    }) : false;
            };

            /**
             * @description Returns the due date status(passed/today/coming) indicator and description
             * @param dueDate
             * @returns {Indicator}
             */
            Indicator.prototype.getDueDateStatusIndicator = function (dueDate) {
                if (!dueDate) {
                    return false;
                }
                var indicatorData = _getDateIndicator(dueDate);
                return new Indicator({
                    class: 'indicator date-' + indicatorData.status,
                    text: indicatorData.diff < 0 ? 'indicator_date_passed' : (indicatorData.diff === 0 ? 'indicator_date_today' : 'indicator_date_coming'),
                    icon: self.getIndicatorIcons('dueDate'),
                    tooltip: 'indicator_due_date',
                    legendText: function (indicator) {
                        return '';
                    }
                });
            };

            /**
             * @description Returns the site followup status due(passed/today/coming) indicator and description
             * @param siteMaxFollowupDate
             * @returns {Indicator}
             */
            Indicator.prototype.getSiteFollowUpDueDateIndicator = function (siteMaxFollowupDate) {
                if (!siteMaxFollowupDate) {
                    return false;
                }
                var indicatorData = _getDateIndicator(siteMaxFollowupDate);
                return new Indicator({
                    class: 'indicator date-' + indicatorData.status,
                    text: indicatorData.diff < 0 ? 'indicator_date_passed' : (indicatorData.diff === 0 ? 'indicator_date_today' : 'indicator_date_coming'),
                    icon: self.getIndicatorIcons('siteFollowupDueDate'),
                    tooltip: 'indicator_site_followup_due_date',
                    legendText: function (indicator) {
                        return langService.get('indicator_site_followup_due_date').change({due_date_status: langService.get(this.text)});
                    }
                });
            };

            /**
             * @description Returns the followup date(passed/today/coming) indicator and description
             * @param bookFollowupDate
             * @returns {Indicator}
             */
            Indicator.prototype.getFollowUpDateIndicator = function (bookFollowupDate) {
                if (!bookFollowupDate) {
                    return false;
                }
                var indicatorData = _getDateIndicator(bookFollowupDate);
                return new Indicator({
                    class: 'indicator date-' + indicatorData.status,
                    text: indicatorData.diff < 0 ? 'indicator_date_passed' : (indicatorData.diff === 0 ? 'indicator_date_today' : 'indicator_date_coming'),
                    icon: self.getIndicatorIcons('bookFollowupDate'),
                    tooltip: 'indicator_followup_date',
                    legendText: function (indicator) {
                        return langService.get('indicator_followup_date').change({date_status: langService.get(this.text)});
                    }
                });
            };

            /**
             * @description Returns the site followup ended indicator and description
             * @param isEnded
             * @param userBookFollowup
             * @returns {Indicator}
             */
            Indicator.prototype.getSiteFollowUpEndedIndicator = function (isEnded, userBookFollowup) {
                if (!isEnded) {
                    return false;
                }
                var text = !!userBookFollowup ? 'grid_indicator_followup_terminated' : 'indicator_followup_ended';
                return new Indicator({
                    class: 'indicator' + (!!userBookFollowup ? '' : 'date-followup-end'),
                    text: text,
                    icon: self.getIndicatorIcons('siteFollowupEnded'),
                    tooltip: text,
                    legendText: function (indicator) {
                        return langService.get(text);
                    }
                });
            };

            /**
             * @description Returns the has registry ou indicator and description
             * @param hasRegistry
             * @returns {Indicator}
             */
            Indicator.prototype.getRegistryOuIndicator = function (hasRegistry) {
                if (!hasRegistry) {
                    return false;
                }

                return new Indicator({
                    class: 'indicator',
                    text: 'has_registry',
                    icon: self.getIndicatorIcons('registryOU'),
                    tooltip: 'has_registry',
                    legendText: function (indicator) {
                        return langService.get('has_registry');
                    }
                });
            };

            /**
             * @description Returns the has central archive ou indicator and description
             * @param hasCentralArchive
             * @returns {Indicator}
             */
            Indicator.prototype.getCentralArchiveIndicator = function (hasCentralArchive) {
                if (!hasCentralArchive) {
                    return false;
                }

                return new Indicator({
                    class: 'indicator',
                    text: 'has_archive',
                    icon: self.getIndicatorIcons('centralArchiveOu'),
                    tooltip: 'has_archive',
                    legendText: function (indicator) {
                        return langService.get('has_archive');
                    }
                });
            };

            /**
             * @description Returns the isPrivate registry ou indicator and description
             * @param isPrivateRegistry
             * @returns {Indicator}
             */
            Indicator.prototype.getPrivateRegOuIndicator = function (isPrivateRegistry) {
                if (!isPrivateRegistry) {
                    return false;
                }

                return new Indicator({
                    class: 'indicator private-reg-ou',
                    text: 'private_registry',
                    icon: self.getIndicatorIcons('registryOU'),
                    tooltip: 'private_registry',
                    legendText: function (indicator) {
                        return langService.get('private_registry');
                    }
                });
            };

            /**
             * @description Returns the not sync ou indicator and description
             * @param notSync
             * @returns {Indicator}
             */
            Indicator.prototype.getNotSyncOuIndicator = function (notSync) {
                if (!notSync) {
                    return false;
                }

                return new Indicator({
                    class: 'indicator',
                    text: 'organization_not_synced',
                    icon: self.getIndicatorIcons('notSyncOu'),
                    tooltip: 'organization_not_synced',
                    legendText: function (indicator) {
                        return langService.get('organization_not_synced');
                    }
                });
            };

            /**
             * @description Returns the conditional approved indicator and description
             * @param isConditionalApproved
             * @returns {Indicator}
             */
            Indicator.prototype.getConditionalApproveIndicator = function (isConditionalApproved) {
                if (!isConditionalApproved) {
                    return false;
                }

                return new Indicator({
                    class: 'indicator',
                    text: 'conditional_approve',
                    icon: self.getIndicatorIcons('conditionalApprove'),
                    tooltip: 'conditional_approve',
                    legendText: function (indicator) {
                        return langService.get('conditional_approve');
                    }
                });
            };

            /**
             * @description Returns the sequential workflow indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getSequentialWFIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'sequential_workflow',
                    icon: self.getIndicatorIcons('sequentialWF'),
                    tooltip: 'sequential_workflow',
                    legendText: function (indicator) {
                        return langService.get('sequential_workflow');
                    }
                });
            };

            /**
             * @description returns is official of attachment indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getIsOfficialIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'official_document',
                    icon: self.getIndicatorIcons('isOfficial'),
                    tooltip: 'official_document',
                    legendText: function (indicator) {
                        return langService.get('official_document');
                    }
                });
            };

            /**
             * @description returns external site indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getExternalSiteIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_external_site',
                    icon: self.getIndicatorIcons('externalSite'),
                    tooltip: 'indicator_external_site',
                    legendText: function (indicator) {
                        return langService.get('indicator_external_site');
                    }
                });
            };

            /**
             * @description returns internal site indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getInternalSiteIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_internal_site',
                    icon: self.getIndicatorIcons('internalSite'),
                    tooltip: 'indicator_internal_site',
                    legendText: function (indicator) {
                        return langService.get('indicator_internal_site');
                    }
                });
            };

            /**
             * @description returns g2g site indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getG2GSiteIndicator = function () {
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_g2g_site',
                    icon: self.getIndicatorIcons('g2gSite'),
                    tooltip: 'indicator_g2g_site',
                    legendText: function (indicator) {
                        return langService.get('indicator_g2g_site');
                    }
                });
            };

            /**
             * @description returns shared followup indicator and description
             * @returns {Indicator}
             */
            Indicator.prototype.getSharedFollowupIndicator = function (isShared) {
                if (!isShared) {
                    return null;
                }
                return new Indicator({
                    class: 'indicator',
                    text: 'indicator_shared_followup',
                    icon: self.getIndicatorIcons('sharedFollowup'),
                    tooltip: 'indicator_shared_followup',
                    legendText: function (indicator) {
                        return langService.get('indicator_shared_followup');
                    }
                });
            };

            /**
             * @description Returns the difference in days and date status(passed/today/coming)
             * @param dateToCheck
             * @param iconType
             * @param tooltip
             * @returns {{diff: number, status: (string)}}
             * @private
             */
            function _getDateIndicator(dateToCheck, iconType, tooltip) {
                dateToCheck = moment(dateToCheck).startOf('day');
                var today = moment(new Date()).startOf('day');
                var diff = dateToCheck.diff(today, 'days');
                var dateStatus = (diff < 0) ? 'past' : (diff === 0 ? 'today' : 'future');

                return {
                    status: dateStatus,
                    diff: diff
                };
            }


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Indicator', 'init', this);
        }
    })
};
