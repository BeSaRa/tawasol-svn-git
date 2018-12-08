module.exports = function (app) {
    require('./application')(app);
    require('./titleService')(app);
    require('./sidebarService')(app);
    require('./generator')(app);
    require('./authenticationService')(app);
    require('./tokenService')(app);
    require('./loginDialogService')(app);
    require('./employeeService')(app);
    require('./idleCounterService')(app);
    require('./organizationService')(app);
    require('./organizationChartService')(app);
    require('./organizationTypeService')(app);
    require('./applicationUserService')(app);
    require('./lookupService')(app);
    require('./referencePlanNumberService')(app);
    require('./validationService')(app);
    require('./tableGeneratorService')(app);
    require('./listGeneratorService')(app);
    require('./documentTypeService')(app);
    require('./documentStatusService')(app);
    require('./roleService')(app);
    require('./workflowGroupService')(app);
    require('./toast')(app);
    require('./jobTitleService')(app);
    require('./entityTypeService')(app);
    require('./correspondenceSiteTypeService')(app);
    require('./smsTemplateService')(app);
    require('./correspondenceSiteTypeService')(app);
    require('./entityService')(app);
    require('./publicAnnouncementService')(app);
    require('./classificationService')(app);
    require('./globalSettingService')(app);
    require('./privateAnnouncementService')(app);
    require('./documentFileService')(app);
    require('./relatedOUDocumentFileService')(app);
    require('./userClassificationViewPermissionService')(app);
    require('./customValidationService')(app);
    require('./distributionListService')(app);
    require('./workflowActionService')(app);
    require('./correspondenceSiteService')(app);
    require('./userCommentService')(app);
    require('./loadingIndicatorService')(app);
    require('./globalLocalizationService')(app);
    require('./draftOutgoingService')(app);
    require('./reviewOutgoingService')(app);
    require('./readyToSendOutgoingService')(app);
    require('./rejectedOutgoingService')(app);
    require('./prepareOutgoingService')(app);
    require('./viewDocumentService')(app);
    require('./queueStatusService')(app);
    require('./outgoingService')(app);
    require('./documentTemplateService')(app);
    require('./attachmentTypeService')(app);
    require('./documentTagService')(app);
    require('./applicationUserSignatureService')(app);
    require('./propertyConfigurationService')(app);
    require('./documentCommentService')(app);
    require('./searchOutgoingService')(app);
    require('./managerService')(app);
    // require('./distributionWorkflowService')(app);
    require('./viewTrackingSheetService')(app);
    require('./userInboxService')(app);
    require('./incomingDepartmentInboxService')(app);
    require('./userFolderService')(app);
    require('./counterService')(app);
    require('./officeWebAppService')(app);
    require('./readyToExportService')(app);
    require('./correspondenceViewService')(app);
    require('./returnedDepartmentInboxService')(app);
    require('./quickSearchCorrespondenceService')(app);
    require('./scanIncomingService')(app);
    require('./readyToSendIncomingService')(app);
    require('./contextHelpService')(app);
    require('./prepareInternalService')(app);
    require('./draftInternalService')(app);
    require('./reviewInternalService')(app);
    require('./readyToSendInternalService')(app);
    require('./rejectedInternalService')(app);
    require('./followupEmployeeInboxService')(app);
    require('./correspondenceService')(app);
    require('./proxyMailInboxService')(app);
    require('./userSentItemService')(app);
    require('./reviewIncomingService')(app);
    require('./rejectedIncomingService')(app);
    require('./broadcastService')(app);
    require('./moveToFolderService')(app);
    require('./incomingService')(app);
    require('./internalService')(app);
    require('./searchIncomingService')(app);
    require('./searchInternalService')(app);
    require('./sentItemDepartmentInboxService')(app);
    require('./downloadService')(app);
    require('./searchGeneralService')(app);
    require('./approvedInternalService')(app);
    require('./favoriteDocumentsService')(app);
    require('./mailNotificationService')(app);
    require('./fileTypeService')(app);
    require('./stateHelperService')(app);
    require('./distributionWFService')(app);
    require('./correspondenceStorageService')(app);
    require('./rankService')(app);
    require('./userFilterService')(app);
    require('./g2gIncomingService')(app);
    require('./g2gReturnedService')(app);
    require('./g2gSentItemsService')(app);
    require('./viewDeliveryReportService')(app);
	require('./userSubscriptionService')(app);
	require('./g2gLookupService')(app);
	require('./reportService')(app);
	require('./documentSecurityService')(app);
	require('./thumbnailService')(app);
	require('./gridService')(app);
	require('./searchOutgoingIncomingService')(app);
	require('./documentFileNewService')(app);
};