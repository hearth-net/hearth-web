'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.BaseCtrl
 * @description
 */

angular.module('hearth.controllers').controller('BaseCtrl', [
    '$scope', '$locale', '$rootScope', '$location', '$route', 'Auth', 'ngDialog', '$timeout', '$interval', '$element', 'CommunityMemberships', '$window', 'Post', 'Tutorial', 'Notify',

    function($scope, $locale, $rootScope, $location, $route, Auth, ngDialog, $timeout, $interval, $element, CommunityMemberships, $window, Post, Tutorial, Notify) {
        var timeout;
        $rootScope.myCommunities = false;
        $rootScope.searchText = '';
        $rootScope.appUrl = '';
        $rootScope.addressOld = '';
        $rootScope.addressNew = '';
        $scope.segment = false;
        $scope.addresses = {
            "Community": "community",
            "User": "profile",
            "Post": "ad",
        };
        $rootScope.socialLinks = {
            facebook: 'https://www.facebook.com/sharer/sharer.php?u=',
            gplus: 'https://plus.google.com/share?url=',
            twitter: 'https://twitter.com/share?url='
        };

        $rootScope.missingPost = false;
        $rootScope.cacheInfoBox = {};

        // init globalLoading 
        $rootScope.globalLoading = false;
        $rootScope.topArrowText = {};
        $scope.isScrolled = false;

        /**
         * This will set fixed height of document for current height
         */
        $scope.resfreshWithResize = function() {
            $(".main-container").css("min-height", $(".main-container").height()+"px");
            $timeout($scope.removePageMinHeight, 5000);
        };

        $scope.removePageMinHeight = function() {
            $(".main-container").css("min-height", "unset");
        };

        /**
         * This will unset fixed height of document
         */
        $rootScope.$on("subPageLoaded", $scope.removePageMinHeight);

        /**
         * When started routing to another page, compare routes and if they differ
         * scroll to top of the page, if not, refresh page with fixed height
         */
        $rootScope.$on("$routeChangeStart", function(event, next) {
            if(!$rootScope.addressNew)
                return $rootScope.top(0, 1);;
            
            $rootScope.addressOld = $rootScope.addressNew;
            $rootScope.addressNew = next.originalPath;

            var r1 = $rootScope.addressOld.split("/");
            var r2 = $rootScope.addressNew.split("/");

            // if first element in URL of old page is not same as first element in URL of new page
            // scroll to top - (alias scroll when we come to new URL)
            if(r1.length < 2 || r2.length < 2 || r1[1] != r2[1])
                $rootScope.top(0, 1);
            else
                // dont 
                $scope.resfreshWithResize();
        });

        /**
         * After routing finished, set current page segment to variable - used somewhere else
         * and add class of given controller to wrapping div container
         */
        $rootScope.$on("$routeChangeSuccess", function(next, current) {
            $scope.segment = $route.current.segment;

            $("#all").removeClass();
            $("#all").addClass(current.controller);
        });

        $scope.showUI = function(ui) {
            $scope.$broadcast('showUI', ui);
        };
        
        /**
         * When clicked on logout button
         */
        $scope.logout = function() {
            Auth.logout(function() {
                window.location.hash = '#!/';
                location.reload();
            });
        };
        
        /**
         * When subbmitet fulltext search
         */
        $scope.search = function(text) {
            if (!text) return false;
            $rootScope.top(0, 1);

            $location.path('/search');
            $location.search('q=' + (text || ""));
            
            // first reload scope to new location, then start searching
            $timeout(function() {
                $scope.$broadcast("fulltextSearch");
            });
        };

        /**
         * Set value of fulltext search
         */
        $rootScope.setFulltextSearch = function(val) {
            $timeout(function() {
                $("#searchBox").val(val);
            });
        };

        /**
         * This will scroll up on page
         */
        $rootScope.top = function(offset, delay) {
            $('html, body').animate({
                scrollTop: offset || 0
            }, delay || 1000);
        };

        /**
         * Return profile of item based on its type (community, user, post)
         */
        $rootScope.getProfileLinkByType = function(type) {
            return $scope.addresses[type];
        };

        /**
         * Refresh user to given path
         */
        $scope.refreshToPath = function(path) {
            window.location.hash = '#!/' + path;
            location.reload();
        };

        $rootScope.isMine = function (author) {
            if($scope.loggedCommunity)
                return $scope.loggedCommunity._id === author._id;
            return $scope.loggedUser && author._id === $scope.loggedUser._id;
        };

        angular.element(window).bind('scroll', function() {
            if ($(window).scrollTop() > 0 !== $scope.isScrolled) {
                $('html').toggleClass('scrolled');
                $scope.isScrolled = !$scope.isScrolled;
            }
        });

        $scope.loadMyCommunities = function() {

            CommunityMemberships.get({user_id: $rootScope.loggedUser._id},function(res) {
                $rootScope.myCommunities = res;
                $rootScope.myAdminCommunities = [];
                res.forEach(function(item) {

                    // create list of communities I'm admin in
                    if(item.admin == $rootScope.loggedUser._id)
                        $rootScope.myAdminCommunities.push(item);
                });
            });
        };

        $rootScope.switchIdentity = function(id) {
            Auth.switchIdentity(id).then(function() {
                window.location.hash = '#!/community/'+id;
                location.reload();
            });
        };

        $rootScope.leaveIdentity = function(id) {
            Auth.switchIdentityBack(id).then(function() {
                window.location.hash = '#!/profile/' + id
                location.reload();
            });
        };

        // try to load tutorial pages - if there is any, show tutorial
        $scope.checkTutorial = function() {
            // check only after login
            if($.cookie('tutorial') === '1') {

                $.removeCookie('tutorial');
                Tutorial.get({user_id: $rootScope.loggedUser._id}, function(res) {
                    if(res.length) $rootScope.showTutorial(res);
                });
            }
        };

        $scope.initHearthbeat = function() {
            $rootScope.pluralCat = $locale.pluralCat;
            
            $rootScope.DATETIME_FORMATS = $locale.DATETIME_FORMATS;
            $rootScope.appUrl = window.location.href.replace(window.location.hash, '');

            if($rootScope.loggedUser._id) {
                $scope.loadMyCommunities();
                $scope.checkTutorial();
            } else {
                // set to check tutorial after next login
                $.cookie('tutorial', 1);
            }
            Notify.checkRefreshMessage();
        };

        $scope.$on('reloadCommunities', $scope.loadMyCommunities);
        $scope.$on('initFinished', $scope.initHearthbeat);
        $rootScope.initFinished && $scope.initHearthbeat();

        // ======================================== PUBLIC METHODS =====================================
        $rootScope.showLoginBox = function(showMsgOnlyLogged) {
            
            $scope.showMsgOnlyLogged = showMsgOnlyLogged;
            ngDialog.open({
                template: $$config.templates + 'userForms/login.html',
                controller: 'LoginCtrl',
                scope: $scope,
                closeByEscape: false,
                showClose: false
            });
        };

        /**
         * Open report modal window for given item
         */
        $rootScope.openReportBox = function(item) {
            if(item.spam_reported)
                return false;

            if (!Auth.isLoggedIn())
                return $rootScope.showLoginBox(true);
            
            var scope = $scope.$new();
            scope.post = item;
            ngDialog.open({
                template: $$config.templates + 'modal/itemReport.html',
                controller: 'ItemReport',
                scope: scope,
                closeByEscape: false,
                showClose: false
            });
        };

        // insert post if it was inserted/updated and insert him to marketplace if missing
        // as temporary fix of #1010
        $rootScope.insertPostIfMissing = function (data) {
            $rootScope.missingPost = data;
        };

        // get last post if it was updated/inserted and delete it from cache
        $rootScope.getPostIfMissing = function () {
            var ret = $rootScope.missingPost;
            $rootScope.missingPost = false;
            return ret;
        };

        // send report to API and close modal.. maybe fire some notification too?
        // $rootScope.reportItem = function(item) {
        //     if (!Auth.isLoggedIn())
        //         return $rootScope.showLoginBox(true);

        //     $rootScope.globalLoading = true;
        //     Post.spam({id: item._id}, function(res) {
        //         $rootScope.$broadcast('reportItem', item);

        //         $rootScope.globalLoading = false;
        //         Notify.addSingleTranslate('NOTIFY.POST_SPAM_REPORT_SUCCESS', Notify.T_SUCCESS);
        //     }, function(err) {
                
        //         $rootScope.globalLoading = false;
        //         Notify.addSingleTranslate('NOTIFY.POST_SPAM_REPORT_FAILED', Notify.T_ERROR);
        //     });
        // };

        // open modal window for item edit
        $rootScope.editItem = function(post, isInvalid) {
            if (!Auth.isLoggedIn())
                return $rootScope.showLoginBox(true);

            var scope = $scope.$new();
            scope.post = angular.copy(post);
            scope.postOrig = post;
            scope.isInvalid = isInvalid;

            var dialog = ngDialog.open({
                template: $$config.modalTemplates + 'itemEdit.html',
                controller: 'ItemEdit',
                scope: scope,
                closeByDocument: false,
                closeByEscape: false,
                showClose: false
            });
            dialog.closePromise.then(function(data) {});
        };

        $rootScope.removeItemFromList = function(id, list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i]._id === id) {
                    list.splice(i, 1);
                    break;
                }
            }
            return list;
        };

        // delete item
        $rootScope.deleteItem = function(post, cb) {
            if (!Auth.isLoggedIn())
                return $rootScope.showLoginBox(true);
            
            $rootScope.globalLoading = true;
            Post.remove({postId:post._id}, function(res) {
                $rootScope.$broadcast("itemDeleted", post); // broadcast event to hearth

                Notify.addSingleTranslate('NOTIFY.POST_DELETED_SUCCESFULLY', Notify.T_SUCCESS);
                $rootScope.globalLoading = false;

                cb && cb(post); // if callback given, call it
            }, function() {
                $rootScope.globalLoading = false;
                Notify.addSingleTranslate('NOTIFY.POST_DELETED_FAILED', Notify.T_ERROR);
            });
        };
        
        /**
         * Function will show modal window with reply form to given post
         */
        $rootScope.replyItem = function(post) {
            if (!Auth.isLoggedIn())
                return $rootScope.showLoginBox(true);
            
            var scope = $scope.$new();
            scope.post = post;
            
            var dialog = ngDialog.open({
                template: $$config.modalTemplates + 'itemReply.html',
                controller: 'ItemReply',
                scope: scope,
                closeByDocument: false,
                closeByEscape: false,
                showClose: false
            });

            dialog.closePromise.then(function(data) {});
        };

        // show modal window with invite options
        $rootScope.openInviteBox = function() {
            if (!Auth.isLoggedIn())
                return $rootScope.showLoginBox(true);
            
            var dialog = ngDialog.open({
                template: $$config.modalTemplates + 'inviteBox.html',
                controller: 'InviteBox',
                scope: $scope.$new(),
                className: 'ngdialog-invite-box',
                closeByDocument: false,
                closeByEscape: false,
                // showClose: false
            });

            dialog.closePromise.then(function(data) {});
        };

        /**
         * Function will open modal window and show tutorial
         * - accepts param with array of slide items
         */
        $rootScope.showTutorial = function(slides) {

            var scope = $scope.$new();
            scope.tutorials = slides || [];

            var dialog = ngDialog.open({
                template: $$config.modalTemplates + 'tutorial.html',
                controller: 'Tutorial',
                scope: scope,
                className: 'ngdialog-tutorial ngdialog-theme-default',
                closeByDocument: false,
                closeByEscape: false,
                showClose: false
            });

            dialog.closePromise.then(function(data) {});
        };

        /**
         * ConfirmBox reveal function has this params:
         * title: $translate code for box head title
         * text: $translate code for box text
         * callback: function to call when confirmed
         * params: array of params to pass into callback when confirmed
         * callbackScope: if callback should be called with some scope
         */
        $rootScope.confirmBox = function(title, text, callback, params, callbackScope) {

            // create new scope of confirmBox
            var scope = $scope.$new();
            scope.title = title;
            scope.text = text;
            scope.callback = callback;
            scope.params = angular.isArray(params) ? params : [params];

            if(callbackScope)
                scope.callbackScope = callbackScope;

            // open dialog window and inject new scope
            var dialog = ngDialog.open({
                template: $$config.modalTemplates + 'confirmBox.html',
                controller: 'ConfirmBox',
                scope: scope,
                className: 'ngdialog-confirm-box',
                closeByDocument: false,
                showClose: false
                // closeByEscape: false,
            });
        };

        // this will flash post box with some background color
        $rootScope.blinkPost = function(item) {
            var delayIn = 200;
            var delayOut = 2000;
            var color = "#FFB697";
            // select elements which we will be changing (item, item arrow, etc..)
            var elements = $("#post_"+item._id+" .item, #post_"+item._id+" .item .overlap, #post_"+item._id+" .item .arrowbox");

            elements.animate({backgroundColor: color}, delayIn, function() {
                elements.animate({backgroundColor: "#FFF"}, delayOut );
            });
        };

        // == deactivate / prolong / activate post item
        // and close modal or call given callback
        $rootScope.pauseToggle = function(item, cb) {
            var Action, actionType;

            // suspend or play based on post active state
            if($rootScope.isPostActive(item)) {

                Action = Post.suspend;
                actionType = 'suspend';
            } else {

                // if item is expired, then prolong him, or just resume
                Action = (item.state == "expired") ? Post.prolong : Post.resume;
                actionType = 'activate';
            }
            
            $rootScope.globalLoading = true;
            // call service
            Action({
                    id: item._id
                },
                function(res) {

                    if(angular.isFunction(cb))
                        cb(item);

                    $rootScope.$broadcast('updatedItem', res);
                    Notify.addSingleTranslate('NOTIFY.POST_UPDATED_SUCCESFULLY', Notify.T_SUCCESS);
                    $rootScope.globalLoading = false;

                }, function(err) {
                    $rootScope.globalLoading = false;

                    if( err.status == 422) {

                        // somethings went wrong - post is not valid
                        // open edit box and show errors
                        $rootScope.editItem(item, true);
                    } else {

                        Notify.addSingleTranslate('NOTIFY.POST_UPDAT_FAILED', Notify.T_ERROR);
                    }
            });
        };

        // this will scroll to given element in given container (if not setted take body as default)
        $rootScope.scrollToElement = function(el, cont, off) {
            var offset = off || 200;
            var container = cont || 'html, body';
            var elementPos;

            if(! $(el).first().length)
                return false;

            elementPos = Math.max($(el).first().offset().top - offset, 0);
            $(container).animate({scrollTop: elementPos}, 'slow');
        };

        // this will scroll to given element or first error message on page
        $rootScope.scrollToError = function(el, cont) {
            setTimeout(function() {
                $rootScope.scrollToElement(el || $('.error').not('.alert-box'), cont);
            });
        };

        // return false if post is inactive
        $rootScope.isPostActive = function(item) {
            return item.state === 'active';
            // return item.is_active && !item.is_expired;
        };
    }
]);