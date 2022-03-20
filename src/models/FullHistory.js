module.exports = function (app) {
    app.factory('FullHistory', function (CMSModelInterceptor,
                                         langService,
                                         gridService) {
        'ngInject';
        return function FullHistory(model) {
            var self = this,
                actionTypes = {
                    0: {
                        key: 'user',
                        langKey: 'user',
                        icon: gridService.gridIcons.indicators.user
                    },
                    1: {
                        key: 'ou',
                        langKey: 'group_mail',
                        icon: gridService.gridIcons.indicators.groupMail
                    },
                    2: {
                        key: 'regOu',
                        langKey: 'organization',
                        icon: gridService.gridIcons.indicators.regOu
                    },
                    3: {
                        key: 'broadcast',
                        langKey: 'broadcast',
                        icon: gridService.gridIcons.indicators.broadcast
                    },
                    8: {
                        key: 'userInDifferentDepartment',
                        langKey: 'user_in_different_dept',
                        icon: gridService.gridIcons.indicators.userInDifferentDepartment
                    },
                    14: {
                        key: 'comment',
                        langKey: 'comment',
                        icon: gridService.gridIcons.indicators.comments
                    }
                },
                trackingSheetTypes = {
                    0: {
                        key: 'VIEW_CONTENT',
                        langKey: 'view_content',
                        icon: gridService.gridIcons.indicators.trackingSheet
                    },
                    1: {
                        key: 'EVENT_LOG',
                        langKey: 'event_log',
                        icon: gridService.gridIcons.indicators.date
                    },
                    2: {
                        key: 'SMS_LOG',
                        langKey: 'sms_log',
                        icon: gridService.gridIcons.indicators.sms
                    },
                    3: {
                        key: 'ACTION_LOG',
                        langKey: 'action_log',
                        icon: gridService.gridIcons.indicators.user
                    },
                    4: {
                        key: 'MESSAGING_LOG',
                        langKey: 'messaging_log',
                        icon: gridService.gridIcons.indicators.message
                    },
                    5: {
                        key: 'EMAIL_LOG',
                        langKey: 'email_log',
                        icon: gridService.gridIcons.indicators.email
                    },
                    6: {
                        key: 'USER_SUBSCRIPTION',
                        langKey: 'user_subscription',
                        icon: gridService.gridIcons.indicators.user
                    },
                    7: {
                        key: 'VIEWER_LOG',
                        langKey: 'viewer_log',
                        icon: gridService.gridIcons.indicators.trackingSheet
                    },
                    /*8: {
                        key: 'SESSION_AUDIT',
                        langKey: 'session_audit',
                        icon: gridService.gridIcons.indicators.user
                    },*/
                    9: {
                        key: 'USER_BOOK_FOLLOWUP',
                        langKey: 'user_book_followup',
                        icon: gridService.gridIcons.indicators.bookFollowupDate
                    },
                    10: {
                        key: 'PUBLIC_COMMENT',
                        langKey: 'public_comment',
                        icon: gridService.gridIcons.indicators.comments
                    }
                }
            self.id = null;
            self.vsId = null;
            self.docSubject = null;
            self.actionDate = null;
            self.actionBy = null;
            self.actionType = null;
            self.updatedBy = null;
            self.updatedOn = null;
            self.clientData = null;
            self.type = null;
            self.actionByInfo = null;
            self.actionByOUInfo = null;
            self.actionTypeInfo = null;
            self.actionToInfo = null;
            self.actionTypeInfo = null;
            self.trackingSheetType = null;

            if (model)
                angular.extend(this, model);

            FullHistory.prototype.getTranslatedActionBy = function (reverse) {
                return (!this.actionByInfo) ? '' : langService.current === 'ar' ? (reverse ? this.actionByInfo.enName : this.actionByInfo.arName) : (reverse ? this.actionByInfo.arName : this.actionByInfo.enName);
            };
            FullHistory.prototype.getTranslatedUpdatedBy = function (reverse) {
                return (!this.updateByInfo) ? '' : langService.current === 'ar' ? (reverse ? this.updateByInfo.enName : this.updateByInfo.arName) : (reverse ? this.updateByInfo.arName : this.updateByInfo.enName);
            };

            FullHistory.prototype.mapActionType = function () {
                if (this.actionType !== null && typeof this.actionType !== 'undefined') {
                    return actionTypes[this.actionType];
                }
                return null;
            };
            FullHistory.prototype.mapTrackingSheetTypes = function () {
                if (this.trackingSheetType !== null && typeof this.trackingSheetType !== 'undefined') {
                    return trackingSheetTypes[this.trackingSheetType];
                }
                return null;
            }

            CMSModelInterceptor.runEvent('FullHistory', 'init', this);
        }
    })
};
