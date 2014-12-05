'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.ProfileCtrl
 * @description
 */

angular.module('hearth.controllers').controller('ProfileCtrl', [
	'$scope', '$route', 'User', '$routeParams', 'UsersService', '$rootScope', '$timeout', 'Karma', '$location', 'UserRatings', 'Notify', 'UnauthReload',

	function($scope, $route, User, $routeParams, UsersService, $rootScope, $timeout, Karma, $location, UserRatings, Notify, UnauthReload) {
		$scope.initPage = function() {
			$scope.loaded = false;
			$scope.info = false;
			$scope.paramId = false;
			$scope.sendingRemoveFollower = false;
			$scope.sendingAddFollower = false;
			
			// ratings
			$scope.sendingRating = false;

			// ratings
			$scope.sendingRating = false;
			$scope.rating = {
				score: 1,
				text: ''
			};
			$scope.showError = {
				text: false
			};
		};

		$scope.isMine = function () {
			var _mineUser = ($rootScope.loggedUser) ? $rootScope.loggedUser._id === $routeParams.id: false;
			var _mineCommunity = ($rootScope.loggedCommunity) ? $rootScope.loggedCommunity._id == $routeParams.id: false;
			
			return _mineCommunity || _mineUser;
		};

		$scope.citiesToString = function(info) {
			var list = [];
			info.locations.forEach(function(item) {
				if(item.city) list.push(item.city);
			});

			return list.join(", ");
		};

		$scope.fetchUser = function (fetchSubpage) {
			// dont load user when there is no ID in params
			if(! $routeParams.id) return false;

			// if we are loading new user init
			if($scope.paramId && $scope.paramId != $routeParams.id) 
				$scope.initPage();
			
			if($scope.info._id !== $routeParams.id) {
				$scope.loaded = false;
			}

			console.log("nacitam: ",$routeParams.id);

			User.get({user_id: $routeParams.id}, function(res) {
				$scope.info = res;
				$scope.info.cities = $scope.citiesToString(res);

				$scope.info.karma = Karma.count(res.up_votes, res.down_votes);
				$scope.mine = $scope.isMine();
				// $scope.loaded = true;

				if(fetchSubpage)
					$scope.$broadcast("profileTopPanelLoaded");
			}, function (res) {

				$scope.loaded = true;
				$scope.info = false;
				$scope.mine = false;
			});
		};

		$scope.toggleFollowerSuccess = function() {
			$scope.info.is_followed = !$scope.info.is_followed;

			if($scope.info.is_followed)
				$scope.info.followers_count++;
			else
				$scope.info.followers_count--;
		};

		// remove follower - if I manage mine, set myFollowees to true
		$scope.removeFollower = function(user_id, myFollowees) {

			if($scope.sendingRemoveFollower) return false;
			$scope.sendingRemoveFollower = true;

			UsersService.removeFollower(user_id, $rootScope.loggedUser._id).then(function(res) {

				$scope.sendingRemoveFollower = false;

				// if my profile - refresh, else change basic stats only
				if(!myFollowees)
					$scope.toggleFollowerSuccess(res);
				else {
					$rootScope.closeModal('confirm-remove-following-'+user_id);
					$scope.$broadcast('profileRefreshUser');
				}
			});
		};
		
		$scope.addFollower = function(user_id) {

			if($scope.sendingAddFollower) return false;
			$scope.sendingAddFollower = true;

			UsersService.addFollower(user_id).then(function(res) {
				$scope.sendingAddFollower = false;

				$scope.toggleFollowerSuccess(res);
			});
		};

		$scope.toggleFollow = function(user_id) {
			
			if($scope.info.is_followed) {
				$scope.removeFollower(user_id);
			} else {
				$scope.addFollower(user_id);
			}
		};

		$scope.refreshDataFeed = function() {
			$rootScope.subPageLoaded = false;
    		$scope.pagePath = $route.current.originalPath;
    		if($route.current.$$route)
	    		$scope.pageSegment = $route.current.$$route.segment;
		};

		$scope.refreshUser = function(fetchSubpage) {

			if(fetchSubpage)
				$scope.refreshDataFeed();
			$scope.fetchUser(fetchSubpage);

		};
		
		$scope.scrollToUserRatingForm = function() {
			// scroll to form
			setTimeout(function() {
				$('html,body').animate({scrollTop: $("#received-rating-form").offset().top - 200}, 500);
			}, 300);
		};

		// will redirect user to user ratings and open rating form
		$scope.openUserRatingForm = function(score) {
			var ratingUrl = '/profile/'+$scope.info._id+'/received-ratings';
			var removeListener;

			// set default values
			$scope.showError.text = false;
			$scope.rating.score = score;
			$scope.rating.text = '';
			$scope.rating.post_id = null;
			
			// select first option in posts select - eg default value			
			// $("#ratingsPostsSelect").val($("#ratingsPostsSelect option:first").val());

			// show form
			$scope.showUserRatingForm = true;

			// if we are on rating URL just jump down
			if($location.url() == ratingUrl) {
				$scope.scrollToUserRatingForm();
			} else {
			// else jump to the righ address and there jump down
				removeListener = $scope.$on('$routeChangeSuccess', function() {
					removeListener();
					$scope.scrollToUserRatingForm();
				});
				$location.url(ratingUrl);
			}
		};

		// will close form and set to default state
		$scope.closeUserRatingForm = function() {
			$scope.showUserRatingForm = false;
		};

		$scope.sendRating = function(ratingOrig) {
			var rating;
			var ratings = {
				true: -1,
				false: 1
			};

			$scope.showError.text = false;

			if(!ratingOrig.text) {
				return $scope.showError.text = true;
			}

			// transform rating.score value from true/false to -1 and +1
			rating = angular.copy(ratingOrig);
			rating.score = ratings[rating.score];
			if(rating.post_id)
				rating.post_id = rating.post_id._id;

			console.log(rating);
			return;
			
			// lock
			if($scope.sendingRating)
				return false;
			$scope.sendingRating = true;

			// send rating to API
			UserRatings.add({id: $scope.info._id, rating: rating}, function(res) {

				// remove lock
				$scope.sendingRating = false;

				// close form
				$scope.closeUserRatingForm();

				// refresh user counters
				$scope.refreshUser(false);

				// broadcast new rating - this will add rating to list
				$scope.$broadcast('userRatingsAdded', res);
				// Notify.addSingleTranslate('NOTIFY.USER_RATING_SUCCESS', Notify.T_SUCCESS);

			}, function(err) {
				// remove lock
				$scope.sendingRating = false;

				// handle error
				Notify.addSingleTranslate('NOTIFY.USER_RATING_FAILED', Notify.T_ERROR, '.rating-notify-box');
			});
		};

		$scope.initPage();
		UnauthReload.check();
		$scope.$on('$routeChangeSuccess', $scope.refreshUser);
		$scope.$on('profileRefreshUser', $scope.refreshUser);
		$scope.$on('initFinished', $scope.refreshUser);
		$rootScope.initFinished && $scope.refreshUser(true);
	}
]);