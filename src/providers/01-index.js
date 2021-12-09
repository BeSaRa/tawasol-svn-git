module.exports = function (app) {
    require('./CMSModelInterceptorProvider')(app);
    require('./templateProvider')(app);
    require('./urlServiceProvider')(app);
    require('./loginPageProvider')(app);
    require('./resolverProvider')(app);
    require('./rootEntityProvider')(app);
    require('./exceptionProvider')(app);
    require('./momentProvider')(app);
    require('./attachmentService')(app);
    require('./permissionProvider')(app);
    require('./headerProvider')(app);
    require('./themeServiceProvider')(app);
    require('./CMSActionServiceProvider')(app);
    require('./configurationServiceProvider')(app);
    require('./versionServiceProvider')(app);
};
