module.exports = function (app) {
    require('./loginCtrl')(app);
    require('./documentTypeCtrl')(app);
    require('./documentStatusCtrl')(app);
    require('./organizationTypeCtrl')(app);
    require('./roleCtrl')(app);
    require('./themeCtrl')(app);
    require('./workflowGroupCtrl')(app);
    require('./jobTitleCtrl')(app);
    require('./entityTypeCtrl')(app);
    require('./smsTemplateCtrl')(app);
    require('./organizationsCtrl')(app);
    require('./correspondenceSiteTypeCtrl')(app);
    require('./entityCtrl')(app);
    require('./classificationCtrl')(app);
    require('./publicAnnouncementCtrl')(app);
    require('./globalSettingCtrl')(app);
    require('./privateAnnouncementCtrl')(app);
    require('./applicationUserCtrl')(app);
    require('./referencePlanNumberCtrl')(app);
    require('./distributionListCtrl')(app);
    require('./workflowActionCtrl')(app);
    require('./correspondenceSiteCtrl')(app);
    require('./localizationCtrl')(app);
    require('./outgoingCtrl')(app);
    require('./searchOutgoingCtrl')(app);
    require('./searchIncomingCtrl')(app);
    require('./searchInternalCtrl')(app);
    require('./draftOutgoingCtrl')(app);
    require('./reviewOutgoingCtrl')(app);
    require('./readyToSendOutgoingCtrl')(app);
    require('./rejectedOutgoingCtrl')(app);
    require('./prepareOutgoingCtrl')(app);
    require('./documentTemplateCtrl')(app);
    require('./attachmentTypeCtrl')(app);
    require('./userInboxCtrl')(app);
    require('./landingPageCtrl')(app);
    require('./incomingDepartmentInboxCtrl')(app);
    require('./readyToExportDepartmentInboxCtrl')(app);
    require('./returnedDepartmentInboxCtrl')(app);
    require('./quickSearchCorrespondenceCtrl')(app);
    require('./scanIncomingCtrl')(app);
    require('./readyToSendIncomingCtrl')(app);
    require('./prepareInternalCtrl')(app);
    require('./draftInternalCtrl')(app);
    require('./reviewInternalCtrl')(app);
    require('./rejectedInternalCtrl')(app);
    require('./readyToSendInternalCtrl')(app);
    require('./followupEmployeeInboxCtrl')(app);
    require('./proxyMailInboxCtrl')(app);
    require('./dragDropPopCtrl')(app);
    require('./userSentItemCtrl')(app);
    require('./reviewIncomingCtrl')(app);
    require('./rejectedIncomingCtrl')(app);
    require('./incomingCtrl')(app);
    require('./internalCtrl')(app);
    require('./sentItemDepartmentInboxCtrl')(app);
    require('./searchGeneralCtrl')(app);
    require('./approvedInternalCtrl')(app);
    require('./favoriteDocumentsCtrl')(app);
    require('./passwordEncryptCtrl')(app);
    require('./groupInboxCtrl')(app);
    require('./folderCtrl')(app);
    require('./readyToExportArchiveCtrl')(app);
    require('./rankCtrl')(app);
    require('./g2gIncomingCtrl')(app);
    require('./g2gReturnedCtrl')(app);
    require('./g2gSentItemsCtrl')(app);
    require('./simpleInternalCtrl')(app);
    require('./simpleOutgoingCtrl')(app);
    require('./simpleIncomingCtrl')(app);
    require('./searchOutgoingIncomingCtrl')(app);
    require('./documentFileCtrl')(app);
    require('./dynamicMenuItemCtrl')(app);
    require('./centralArchiveSentItemCtrl')(app);
    require('./viewersLogCtrl')(app);
    require('./taskCtrl')(app);
    require('./administratorsCtrl')(app);
    require('./g2gPendingCtrl')(app);
};
