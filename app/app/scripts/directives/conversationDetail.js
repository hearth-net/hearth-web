'use strict';

/**
 * @ngdoc directive
 * @name hearth.directives.conversationDetail
 * @description
 * @restrict E
 */
angular.module('hearth.directives').directive('conversationDetail', [
    '$rootScope', 'Conversations', '$timeout', 'Notify',
    function($rootScope, Conversations, $timeout, Notify) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                info: '=',
            },
            templateUrl: 'templates/directives/conversationDetail.html',
            link: function($scope, element) {
                $scope.getProfileLinkByType = $rootScope.getProfileLinkByType;
                $scope.confirmBox = $rootScope.confirmBox;

                $scope.participants = false;
                $scope.showParticipants = false;
                $scope.sendingDeleteRequest = false;
                $scope.messages = false;
                var _messagesCount = 10; // how many messages will we load in each request except new messages
                var _loadTimeout = 10000; // pull requests interval in ms
                var _loadLock = false; // pull requests interval in ms
                var _loadTimeoutPromise = false;
                
                $scope.loadMessages = function(from) {
                    if(_loadLock) return false;
                    _loadLock = true;
                                        
                    Conversations.getMessages({id: $scope.info._id, from: from, count: _messagesCount}, function(res) {
                        $scope.messages = res.messages.slice().reverse();
                        _loadTimeoutPromise = $timeout($scope.loadNewMessages, _loadTimeout);
                        _loadLock = false;
                        $scope.resizeMessagesBox();

                    }, function() {
                        _loadLock = false;
                        _loadTimeoutPromise = $timeout($scope.loadNewMessages, _loadTimeout);
                    });
                };
                
                $scope.loadNewMessages = function() {
                    if(!$scope.messages.length)
                        return $scope.loadMessages();

                    if(_loadLock) return false;
                    _loadLock = true;

                    var config = {
                        id: $scope.info._id,
                        newer: $scope.messages[$scope.messages.length-1].created_at,
                    };

                    $timeout.cancel(_loadTimeoutPromise);
                    Conversations.getMessages(config, function(res) {
                        _loadTimeoutPromise = $timeout($scope.loadNewMessages, _loadTimeout);
                        _loadLock = false;
                        
                        $scope.messages = $scope.messages.concat(res.messages.reverse());
                    }, function() {
                        _loadLock = false;
                        _loadTimeoutPromise = $timeout($scope.loadNewMessages, _loadTimeout);
                    });
                };
                
                $scope.deleteConversation = function(id) {
                    $scope.sendingDeleteRequest = true;
                    Conversations.remove({id: id}, function(res) {
                        $scope.sendingDeleteRequest = false;
                        Notify.addSingleTranslate('NOTIFY.CONVERSATION_DELETE_SUCCESS', Notify.T_SUCCESS);
                    }, function(err) {
                        $scope.sendingDeleteRequest = false;
                        Notify.addSingleTranslate('NOTIFY.CONVERSATION_DELETE_FAILED', Notify.T_ERROR);
                    });
                };

                $scope.leaveConversation = function(id) {
                    $scope.sendingDeleteRequest = true;
                    Conversations.remove({id: id}, function(res) {
                        $scope.sendingDeleteRequest = false;
                        Notify.addSingleTranslate('NOTIFY.CONVERSATION_LEAVE_SUCCESS', Notify.T_SUCCESS);
                    }, function(err) {
                        $scope.sendingDeleteRequest = false;
                        Notify.addSingleTranslate('NOTIFY.CONVERSATION_LEAVE_FAILED', Notify.T_ERROR);
                    });
                };

                $scope.init = function(info) {
                    $timeout.cancel(_loadTimeoutPromise);

                    $scope.participants = false;
                    $scope.showParticipants = false;
                    $scope.conversation = false;
                    $scope.loadMessages();
                };

                $scope.toggleParticipants =  function() {
                    $scope.showParticipants = ! $scope.showParticipants;
                };

                $scope.loadParticipants = function(val, oldVal) {
                    if(!$scope.showParticipants || $scope.participants) return false;

                    Conversations.getParticipants({id: $scope.info._id}, function(res) {
                        $scope.participants = res.participants;
                    });
                };
                
                $scope.bindMessagesBoxResizeWatchers = function() {
                    if($scope.messagesBoxResizeWatchInited)
                        return false;
                    $scope.messagesBoxResizeWatchInited = true;

                    $('.conversation-detail-top', element).resize($scope.resizeMessagesBox);
                    $('.message-reply', element).resize($scope.resizeMessagesBox);
                };

                $scope.resizeMessagesBox = function() {

                    $timeout(function() {
                        // var boxHeight = element.find(".conversation-detail").height();
                        // var headHeight = element.find(".conversation-detail").height();
                        // var footHeight = element.find(".conversation-detail").height();
                        var boxHeight = element.height() - element.find(".conversation-detail-top").height() - element.find(".messages-reply").height();
                        var boxBottomPosition = element.find(".messages-reply").height();

                        $(".messages-container", element).css("max-height", boxHeight);
                        $(".messages-container", element).css("bottom", boxBottomPosition);
                        $(".messages-container", element).scrollTop($(".messages-container")[0].scrollHeight);
                        $(".messages-container", element).fadeIn();

                        console.log("Box height: ", boxHeight, " Position from bottom: ", boxBottomPosition);
                        
                        if(!$scope.inited){

                            $scope.inited = true;
                            $(".messages-reply", element).css("background-color", "blue");
                            $("textarea", element).resize($scope.resizeMessagesBox);
                            $(".conversation-detail-top", element).resize($scope.resizeMessagesBox);
                        }
                    });
                };

                $scope.inited = false;

                element.resize($scope.resizeMessagesBox);
                $scope.$on("messageReplyFormResized", $scope.resizeMessagesBox)

                $scope.$watch('info', $scope.init);
                $scope.$watch('showParticipants', $scope.loadParticipants);
                $scope.$on('conversationMessageAdded', $scope.loadNewMessages);
                $scope.$on('$destroy', function() {
                    // stop pulling new messages on directive destroy
                    $timeout.cancel(_loadTimeoutPromise);
                });
            }
        };
    }
]);