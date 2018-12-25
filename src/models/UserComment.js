module.exports = function (app) {
    app.factory('UserComment', function (CMSModelInterceptor,
                                         langService) {
        'ngInject';
        return function UserComment(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.ouId = null;
            self.comment = null;
            self.shortComment = null;
            self.itemOrder = null;
            self.status = true;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'ouId',
                'itemOrder',
                'shortComment',
                'comment',
                'status'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserComment.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the status of user comment as Active or Inactive instead of true or false.
             * @returns {string}
             */
            UserComment.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            /**
             * @description get shortComment
             * @return {null|String}
             */
            UserComment.prototype.getCommentTitle = function () {
                return this.shortComment;
            };

            UserComment.prototype.getComment = function () {
                return this.comment;
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            UserComment.prototype.getNameByLanguage = function (language) {
                return this.getCommentTitle();
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserComment', 'init', this);
        }
    })
};