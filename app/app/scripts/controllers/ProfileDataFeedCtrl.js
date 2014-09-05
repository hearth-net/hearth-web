'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.ProfileCtrl
 * @description
 */

angular.module('hearth.controllers').controller('ProfileDataFeedCtrl', [
    '$scope', '$timeout', '$rootScope', '$routeParams', 'Followers', 'Followees', 'UserPosts', 'UsersCommunitiesService', 'UserRatings', 'ActivityLog', 'Fulltext', 'Post',
    function($scope, $timeout, $rootScope, $routeParams, Followers, Followees, UserPosts, UsersCommunitiesService, UserRatings, ActivityLog, Fulltext, Post) {
        var loadServices = {
                'profile': loadUserHome,
                'profile.posts': UserPosts.get,
                'profile.communities': UsersCommunitiesService.query,
                'profile.given': UserRatings.given,
                'profile.received': UserRatings.received,
                'profile.following': Followees.query,
                'profile.followers': Followers.query
            },
            params = {
                user_id: $routeParams.id
            };

        function loadUserHome(params) {
            var fulltextParams;

            UserRatings.received(params, function(res) {
                $scope.receivedRatings = res;
            });
            ActivityLog.get(params, function(res) {
                $scope.activityLog = res;
            });

            console.log($scope.mine);
            fulltextParams = {
                type: 'post',
                include_not_active: $scope.mine,
                author_id: params.user_id
            }

            Fulltext.query(fulltextParams, function(res) {
                $scope.posts = res;
            });
        }

        $scope.cancelEdit = function() {
            init();
        };

        $scope.pauseToggle = function(item) {
            var Action = (item.is_active) ? Post.suspend : Post.resume;

            Action({
                    id: item._id
                },
                function(res) {
                    item.is_active = !item.is_active;
                    $scope.cancel(item);
                }
            );
        }

        $scope.cancel = function(item) {
            $('#confirm-delete-' + item._id).foundation('reveal', 'close');
        };

        $scope.remove = function(item) {
            console.log(item);

            Post.remove({postId: item._id}, function (res) {

                $scope.$emit('postCreated', item._id); // refresh post list
                $scope.cancel(item);
            }, function (err) {
                console.log("Error: ", err);
            });
        };

        function processData(res) {

            $scope.data = res;
        }

        function processDataErr(res) {

            console.log("Err", res);
        }

        function init() {

            console.log("Calling load service", $scope.pageSegment);
            console.log("Calling load service", loadServices[$scope.pageSegment]);
            loadServices[$scope.pageSegment](params, processData, processDataErr);

            // refresh after new post created
            if ($scope.pageSegment == 'profile' || $scope.pageSegment == 'profile.posts') {

                $scope.$on('postCreated', function() {
                    loadServices[$scope.pageSegment](params, processData, processDataErr);
                });
            }
        }

        $scope.$on('profileTopPanelLoaded', init);
        $scope.loaded && init();
    }
]);