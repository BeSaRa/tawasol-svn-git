module.exports = function (app) {
    app.run(function($templateCache){
        'ngInject';
        $templateCache.put('md-table-pagination.html',
            '<div class="page-select" ng-if="$pagination.showPageSelect()">\n' +
            '  <div class="label">{{$pagination.label.page}}</div>\n' +
            '\n' +
            '  <md-select virtual-page-select total="{{$pagination.pages()}}" class="md-table-select" ng-model="$pagination.page" md-container-class="md-pagination-select" ng-change="$pagination.onPaginationChange()" ng-disabled="$pagination.disabled" aria-label="Page">\n' +
            '    <md-content>\n' +
            '      <md-option ng-repeat="page in $pageSelect.pages" ng-value="page">{{page}}</md-option>\n' +
            '    </md-content>\n' +
            '  </md-select>\n' +
            '</div>\n' +
            '\n' +
            '<div class="limit-select" ng-if="$pagination.limitOptions">\n' +
            '  <div class="label">{{$pagination.label.rowsPerPage}}</div>\n' +
            '\n' +
            '  <md-select class="md-table-select" ng-model="$pagination.limit" md-container-class="md-pagination-select" ng-disabled="$pagination.disabled" aria-label="Rows" placeholder="{{ $pagination.limitOptions[0] }}">\n' +
            '    <md-option ng-repeat="option in $pagination.limitOptions" ng-value="option.value ? $pagination.eval(option.value) : option">{{option.label ?  $pagination.eval(option.label) : option}}</md-option>\n' +
            '  </md-select>\n' +
            '</div>\n' +
            '\n' +
            '<div class="buttons">\n' +
            '  <div class="label">{{$pagination.min()}} - {{$pagination.max()}} {{$pagination.label.of}} {{$pagination.total}}</div>\n' +
            '\n' +
            '  <md-button class="md-icon-button" type="button" ng-if="$pagination.showBoundaryLinks()" ng-click="$pagination.first()" ng-disabled="$pagination.disabled || !$pagination.hasPrevious()" aria-label="First">\n' +
            '    <md-icon md-svg-icon="navigate-first.svg"></md-icon>\n' +
            '  </md-button>\n' +
            '\n' +
            '  <md-button class="md-icon-button" type="button" ng-click="$pagination.previous()" ng-disabled="$pagination.disabled || !$pagination.hasPrevious()" aria-label="Previous">\n' +
            '    <md-icon md-svg-icon="navigate-before.svg"></md-icon>\n' +
            '  </md-button>\n' +
            '\n' +
            '  <md-button class="md-icon-button" type="button" ng-click="$pagination.next()" ng-disabled="$pagination.disabled || !$pagination.hasNext()" aria-label="Next">\n' +
            '    <md-icon md-svg-icon="navigate-next.svg"></md-icon>\n' +
            '  </md-button>\n' +
            '\n' +
            '  <md-button class="md-icon-button" type="button" ng-if="$pagination.showBoundaryLinks()" ng-click="$pagination.last()" ng-disabled="$pagination.disabled || !$pagination.hasNext()" aria-label="Last">\n' +
            '    <md-icon md-svg-icon="navigate-last.svg"></md-icon>\n' +
            '  </md-button>\n' +
            '</div>');
    });
};