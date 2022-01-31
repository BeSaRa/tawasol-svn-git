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
                };
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

            CMSModelInterceptor.runEvent('FullHistory', 'init', this);
        }
    })
};
