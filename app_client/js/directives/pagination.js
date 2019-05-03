/**
 * Example:
 <pagination
    page="1"
    page-size="10"
    total="100"
    pagination-action="changePage(page)"
    ul-class="customClass">
 * ul-class could be either an object or a string
 *
 * Based on https://github.com/brantwills/Angular-Paging
 */
ONEmSimModule.directive('pagination', ["$sce", function ($sce) {

    // Assign null-able scope values from settings
    function setScopeValues(scope, attrs) {
        scope.List = [];
        scope.Hide = false;
        scope.page = parseInt(scope.page) || 1;
        scope.total = parseInt(scope.total) || 0;
        scope.dots = scope.dots || '...';
        scope.ulClass = scope.ulClass || attrs.ulClass || 'pagination';
        scope.adjacent = parseInt(scope.adjacent) || 2;
        scope.activeClass = 'active';
        scope.disabledClass = 'disabled';

        scope.scrollTop = scope.$eval(attrs.scrollTop);
        scope.hideIfEmpty = scope.$eval(attrs.hideIfEmpty);
        scope.showPrevNext = scope.$eval(attrs.showPrevNext);
        scope.useSimplePrevNext = scope.$eval(attrs.useSimplePrevNext);
    }

    // Validate and clean up any scope values
    // This happens after we have set the
    // scope values
    function validateScopeValues(scope, pageCount) {
        // Block where the page is larger than the pageCount
        if (scope.page > pageCount) {
            scope.page = pageCount;
        }

        // Block where the page is less than 0
        if (scope.page <= 0) {
            scope.page = 1;
        }

        // Block where adjacent value is 0 or below
        if (scope.adjacent <= 0) {
            scope.adjacent = 2;
        }

        // Hide from page if we have 1 or less pages
        // if directed to hide empty
        if (pageCount <= 1) {
            scope.Hide = scope.hideIfEmpty;
        }
    }

    // Internal Pagination Click Action
    function internalAction(scope, page) {
        page = page.valueOf();
        // Block clicks we try to load the active page
        if (scope.page == page) {
            return;
        }

        // Update the page in scope and fire any paging actions
        scope.page = page;
        scope.paginationAction({
            page: page
        });

        // If allowed scroll up to the top of the page
        if (scope.scrollTop) {
            scrollTo(0, 0);
        }
    }

    // Add Range of Numbers
    function addRange(start, finish, scope) {
        console.log("addrange:"+ start + " " + finish);
        var i = 0;
        for (i = start; i <= finish; i++) {
            var item = {
                value: $sce.trustAsHtml(i.toString()),
                liClass: scope.page == i ? scope.activeClass : 'waves-effect',
                action: function () {
                    internalAction(scope, this.value);
                }
            };

            scope.List.push(item);
        }
    }

    // Add Dots ie: 1 2 [...] 10 11 12 [...] 56 57
    function addDots(scope) {
        scope.List.push({
            value: $sce.trustAsHtml(scope.dots)
        });
    }

    // Add First Pages
    function addFirst(scope, next) {
        addRange(1, 2, scope);

        // We ignore dots if the next value is 3
        // ie: 1 2 [...] 3 4 5 becomes just 1 2 3 4 5
        if (next != 3) {
            addDots(scope);
        }
    }

    /**
    * Add the first, previous, next, and last buttons if desired
    * The logic is defined by the mode of interest
    * This method will simply return if the scope.showPrevNext is false
    * This method will simply return if there are no pages to display
    *
    * @param {Object} scope - The local directive scope object
    * @param {int} pageCount - The last page number or total page count
    * @param {string} mode - The mode of interest either prev or last
    */
    function addPrevNext(scope, pageCount, mode) {

        // Ignore if we are not showing
        // or there are no pages to display
        if (!scope.showPrevNext || pageCount < 1) { return; }

        // Local variables to help determine logic
        var disabled, alpha, beta;


        // Determine logic based on the mode of interest
        // Calculate the previous / next page and if the click actions are allowed
        if (mode === 'prev') {

            disabled = scope.page - 1 <= 0;
            var prevPage = scope.page - 1 <= 0 ? 1 : scope.page - 1;

            if (scope.useSimplePrevNext) {
                alpha = { value: "<<", title: 'First Page', page: 1 };
                beta = { value: "<", title: 'Previous Page', page: prevPage };
            } else {
                alpha = { value: "<i class=\"material-icons\">first_page</i>", title: 'First Page', page: 1 };
                beta = { value: "<i class=\"material-icons\">chevron_left</i>", title: 'Previous Page', page: prevPage };
            }

        } else {

            disabled = scope.page + 1 > pageCount;
            var nextPage = scope.page + 1 >= pageCount ? pageCount : scope.page + 1;

            if (scope.useSimplePrevNext) {
                alpha = { value: ">", title: 'Next Page', page: nextPage };
                beta = { value: ">>", title: 'Last Page', page: pageCount };
            } else {
                alpha = { value: "<i class=\"material-icons\">chevron_right</i>", title: 'Next Page', page: nextPage };
                beta = { value: "<i class=\"material-icons\">last_page</i>", title: 'Last Page', page: pageCount };
            }

        }

        // Create the Add Item Function
        var addItem = function (item, disabled) {
            scope.List.push({
                value: $sce.trustAsHtml(item.value),
                title: item.title,
                liClass: disabled ? scope.disabledClass : '',
                action: function () {
                    if (!disabled) {
                        internalAction(scope, item.page);
                    }
                }
            });
        };

        // Add our items
        addItem(alpha, disabled);
        addItem(beta, disabled);
    }

    function addLast(pageCount, scope, prev) {
        // We ignore dots if the previous value is one less that our start range
        // ie: 1 2 3 4 [...] 5 6  becomes just 1 2 3 4 5 6
        if (prev != pageCount - 2) {
            addDots(scope);
        }

        addRange(pageCount - 1, pageCount, scope);
    }

    // Main build function
    function build(scope, attrs) {

        console.log("scope.pageSize:"+scope.pageSize);
        console.log("scope.total:"+scope.total);
        console.log("scope.page:"+scope.page);
//debugger;
        // Block divide by 0 and empty page size
        if (!scope.pageSize || scope.pageSize < 0) {
            return;
        }

        // Assign scope values
        setScopeValues(scope, attrs);

        // local variables
        var start,
            size = scope.adjacent * 2,
            pageCount = Math.ceil(scope.total / scope.pageSize);

        // Validation Scope
        validateScopeValues(scope, pageCount);

        // Add the Next and Previous buttons to our list
        addPrevNext(scope, pageCount, 'prev');

        if (pageCount < (5 + size)) {

            start = 1;
            addRange(start, pageCount, scope);

        } else {

            var finish;

            if (scope.page <= (1 + size)) {

                start = 1;
                finish = 2 + size + (scope.adjacent - 1);

                addRange(start, finish, scope);
                addLast(pageCount, scope, finish);

            } else if (pageCount - size > scope.page && scope.page > size) {

                start = scope.page - scope.adjacent;
                finish = scope.page + scope.adjacent;

                addFirst(scope, start);
                addRange(start, finish, scope);
                addLast(pageCount, scope, finish);

            } else {

                start = pageCount - (1 + size + (scope.adjacent - 1));
                finish = pageCount;

                addFirst(scope, start);
                addRange(start, finish, scope);

            }
        }
        addPrevNext(scope, pageCount, 'next');
    }

    return {
        restrict: 'AE',
        scope: {
            page: '@',
            pageSize: '=',
            total: '@',
            dots: '@',
            hideIfEmpty: '@',
            adjacent: '@',
            scrollTop: '@',
            showPrevNext: '@',
            useSimplePrevNext: '@',
            paginationAction: '&',
            ulClass: '=?'
        },
        template:
            '<ul ng-hide="Hide" ng-class="ulClass"> ' +
            '<li ' +
            'ng-class="Item.liClass" ' +
            'ng-click="Item.action()" ' +
            'ng-repeat="Item in List"> ' +
            '<a href> ' +
            '<span ng-bind-html="Item.value"></span> ' +
            '</a>' +
            '</ul>',
        link: function (scope, element, attrs) {

            console.log("page:"+scope.page);
            console.log("total:" +scope.total);

            // // Hook in our watched items
            scope.$watchCollection('[page, total, pageSize]', function () {
                build(scope, attrs);
            });
        }
    };
}]);