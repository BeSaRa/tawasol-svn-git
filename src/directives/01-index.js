module.exports = function (app) {
    require('./title-directive/01-index')(app);
    require('./body-directive/01-index')(app);
    require('./sidebar-left-directive/01-index')(app);
    require('./sidebar-right-directive/01-index')(app);
    require('./toolbar-directive/01-index')(app);
    require('./toolbar-search-directive/01-index')(app);
    require('./language-switcher-directive/01-index')(app);
    require('./user-menu-directive/01-index')(app);
    require('./scroll-directive/scroll-directive')(app);
    require('./close-dialog-directive/close-dialog-directive')(app);
    require('./tasks-notify-directive/01-index')(app);
    require('./documents-notify-directive/01-index')(app);
    require('./sidebar-menu-directive/01-index')(app);
    require('./background-directive/background-directive')(app);
    require('./login-announcement-directive/login-announcement-directive')(app);
    require('./organization-chart-directive/01-index')(app);
    require('./organization-menu-directive/01-index')(app);
    require('./input-limit-directive/input-limit-directive')(app);
    require('./search-filter-directive/01-index')(app);
    require('./table-status-directive/01-index')(app);
    require('./nospace-directive/nospace-directive')(app);
    require('./custom-validate-directive/custom-validate-directive')(app);
    require('./upload-file-directive/upload-file-directive')(app);
    require('./organization-hierarchy-view-directive/01-index')(app);
    require('./mention-directive/mention-directive')(app);
    require('./reference-plan-element-directive/01-index')(app);
    require('./element-draggable-directive/element-draggable-directive')(app);
    require('./element-sortable-directive/element-sortable-directive')(app);
    require('./min-max-number-directive/min-max-number-directive')(app);
    require('./drag-drop-file-directive/01-index')(app);
    require('./catch-upload-file-directive/catch-upload-file-directive')(app);
    require('./grid-actions-directive/01-index')(app);
    require('./vertical-divider-directive/vertical-divider-directive')(app);
    require('./grid-right-click-directive/grid-right-click-directive')(app);
    require('./manage-tags-directive/01-index')(app);
    require('./manage-attachments-directive/01-index')(app);
    require('./browse-file-directive/browse-file-directive')(app);
    require('./manage-comments-directive/01-index')(app);
    require('./manage-entities-directive/01-index')(app);
    require('./manage-properties-directive/01-index')(app);
    require('./counter-directive/counter-directive')(app);
    //require('./upload-attachment-directive/upload-attachment-directive')(app);
    //require('./user-folders-treeview-directive/01-index')(app);
    require('./user-folders-tree-view-directive/01-index')(app);
    require('./view-document-queue-directive/01-index')(app);
    require('./view-document-inbox-directive/01-index')(app);
    require('./manage-content-directive/01-index')(app);
    require('./manage-correspondence-directive/01-index')(app);
    require('./private-announcement-directive/01-index')(app);
    require('./move-to-folders-tree-view-directive/01-index')(app);
    require('./draggable-work-item-directive/01-index')(app);
    require('./theme-preview-directive/01-index')(app);
    require('./cms-theme-directive/01-index')(app);
    require('./enter-submit-directive/01-index')(app);
    require('./manage-linked-document-directive/01-index')(app);
    require('./organization-without-reg-tree-view-directive/01-index')(app);
    require('./barcode-settings-directive/01-index')(app);
    require('./correspondence-view-action-directive/01-index')(app);
    require('./manage-correspondence-site-incoming-directive/01-index')(app);
    require('./main-site-sub-site-directive/01-index')(app);
    require('./localization-module-converter-directive/01-index')(app);
    require('./current-tab-label-directive/01-index')(app);
    require('./vertical-menu-workflow-item-directive/01-index')(app);
    require('./selected-workflow-items-directive/01-index')(app);
    require('./workflow-users-directive/01-index')(app);
    require('./organization-node-directive/01-index')(app);
    require('./workflow-items-directive/01-index')(app);
    require('./bulk-correspondence-status-directive/01-index')(app);
    require('./folders-tree-structure-directive/01-index')(app);
    require('./grid-indicator-directive/01-index')(app);
    require('./wrapper-directive/wrapper-directive')(app);
    require('./workitem-inbox-directive/01-index')(app);
};