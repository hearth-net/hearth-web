'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.AdDetail
 * @description
 */

angular.module('hearth.controllers').controller('AdDetail', [
	'$scope', 'AdDetailResource', '$routeParams', 'PostsService', 'ResponseErrors', '$rootScope', 'UsersService', 'OpenGraph', '$translate', '$timeout',

	function($scope, AdDetailResource, $routeParams, PostsService, ResponseErrors, $rootScope, UsersService, OpenGraph, $translate, $timeout) {
		$scope.ad = {};
		$scope.replyDisplayed = false;
		$scope.reply = {
			agreed: true
		};
		$scope.isMine = false;
		$scope.hideCloseButton = true;
		
		function processAdDetail (data) {

			if(typeof $scope.loggedUser === 'undefined') {
				return $timeout(function() {
					processAdDetail (data);
				}, 100);
			}

			$scope.loaded = true;
			if(data.error) {
				return $scope.error = true;
			}

			data.profileUrl = data.author._type === 'Community' ? 'community' : 'profile';
			$scope.ad = data;
			$scope.profile = data.author;
			$scope.isMine = data.author._id === $scope.loggedUser._id;
			$scope.agreeTranslationData = {
				name: data.author.name
			};

			$scope.ad.og_title = data.author.name + " " + $translate((data.type === 'need' ? 'DOES_WISH' : 'DOES_GIVE' )).toLowerCase();
			if(data.title)
				$scope.ad.og_title += " " + data.title;
			OpenGraph.set( $scope.ad.og_title, data.name || "");
		}

		AdDetailResource.get({
			id: $routeParams.id
		}, processAdDetail, function(err) {
			$scope.loaded = true;
			$scope.ad = {
				error: true
			}
		});

		$scope.follow = function(userId, unfollow) {
			var promise;
			if (userId === $scope.loggedUser._id) {
				return;
			}
			promise = null;
			if (unfollow) {
				promise = UsersService.removeFollower(userId, $scope.loggedUser._id);
			} else {
				promise = UsersService.addFollower(userId, $scope.loggedUser._id);
			}
			return promise.then(function() {
				return $scope.fetchFollows();
			});
		};

		$scope.fetchFollows = function() {
			$scope.showFollow = false;
			$scope.profile.relation = '';
			$scope.relations = {
				followees: [],
				followers: [],
				friends: [],
				communities: []
			};
			if ($scope.loggedUser._id != null) {
				UsersService.isFollower($scope.profile._id, $scope.loggedUser._id).then(function(res) {
					if (res.isFollower) {
						$scope.profile.relation = 'followee';
					}
					return UsersService.isFriend($scope.profile._id, $scope.loggedUser._id).then(function(res) {
						if (res.getFriend) {
							$scope.profile.relation = 'friend';
							return $scope.profile.relation;
						}
					});
				});
				if ($scope.loggedUser._id === $scope.profile._id) {
					UsersService.queryFollowees($scope.profile._id).then(function(result) {
						$scope.relations.followees = result || [];
						return $scope.unifyFollowers();
					});
					UsersService.queryFollowers($scope.profile._id).then(function(result) {
						$scope.relations.followers = result || [];
						return $scope.unifyFollowers();
					});
				}
			}
			return UsersService.queryFriends($scope.profile._id).then(function(result) {
				$scope.relations.friends = result.filter(function(item) {
					return item.userType !== 'Community';
				}) || [];
				$scope.relations.memberOfCommunities = result.filter(function(item) {
					return item.userType === 'Community';
				}) || [];
				$scope.relations.adminOfCommunities = $scope.relations.memberOfCommunities.filter(function(item) {
					return item.admin === $scope.profile._id;
				}) || [];
				return $scope.unifyFollowers();
			});
		};
		$scope.unifyFollowers = function() {
			var followee, follower, friends;

			if ($scope.relations) {
				friends = (function() {
					var i, len,
						persons = $scope.relations.friends,
						results = [];

					for (i = 0, len = persons.length; i < len; i++) {
						results.push(persons[i].userId);
					}
					return results;
				})();
				$scope.relations.followees = (function() {
					var i, len, id,
						followees = $scope.relations.followees,
						results = [];

					for (i = 0, len = followees.length; i < len; i++) {
						followee = followees[i];
						id = followee.userId;
						if (__indexOf.call(friends, id) < 0 && followee.userType !== 'Community') {
							results.push(followee);
						}
					}
					return results;
				})();
				$scope.relations.followers = (function() {
					var i, len, id,
						followers = $scope.relations.followers,
						results = [];

					for (i = 0, len = followers.length; i < len; i++) {
						follower = followers[i];
						id = follower.userId;
						if (__indexOf.call(friends, id) < 0 && follower.userType !== 'Community') {
							results.push(follower);
						}
					}
					return results;
				})();
				$scope.showFollow = true;
				return $scope.showFollow;
			}
		};

		$scope.replyToAd = function(ad) {
			$scope.reply = {
				id: ad._id,
				message: $scope.reply.message,
				agreed: $scope.reply.agreed
			};
			if (!$scope.reply.message || $scope.reply.message.length < 3) {
				this.errors = new ResponseErrors({
					status: 400,
					data: {
						name: 'ValidationError',
						message: 'ERR_REPLY_EMPTY_MESSAGE'
					}
				});
				return;
			}
			if (($scope.reply.agreed != null) && $scope.reply.agreed === false) {
				this.errors = new ResponseErrors({
					status: 400,
					data: {
						name: 'ValidationError',
						message: 'ERR_REPLY_PLEASE_AGREE'
					}
				});
			}
			if (!this.replyForm.$valid) {
				return;
			}
			$scope.replyToAdSubmitting = true;
			return PostsService.reply($scope.reply).then(function() {
				$scope.replyToAdSubmitting = false;
				$scope.replyToAdSubmitted = true;
				$scope.replyDisplayed = false;
				$scope.reply = {
					id: undefined,
					message: '',
					agreed: false
				};

			}).then(null, function() {
				delete this.errors;
				$scope.replyToAdSubmitting = false;
			});
		};
	}

]);