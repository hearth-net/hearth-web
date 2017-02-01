'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.CommunityDataFeedCtrl
 * @description
 */

angular.module('hearth.controllers').controller('CommunityDataFeedCtrl', [
	'$scope', '$stateParams', '$rootScope', 'Community', 'Fulltext', 'CommunityMembers', 'CommunityApplicants', 'CommunityActivityLog', 'Post', 'Notify', '$timeout', 'UserRatings', 'CommunityRatings', 'UniqueFilter', 'Activities', 'ItemServices', 'ProfileUtils', '$log', 'UsersCommunitiesService', '$templateRequest', '$sce', '$compile', 'PostScope', 'MarketPostCount', '$q',
	function($scope, $stateParams, $rootScope, Community, Fulltext, CommunityMembers, CommunityApplicants, CommunityActivityLog, Post, Notify, $timeout, UserRatings, CommunityRatings, UniqueFilter, Activities, ItemServices, ProfileUtils, $log, UsersCommunitiesService, $templateRequest, $sce, $compile, PostScope, MarketPostCount, $q) {
		angular.extend($scope, ItemServices);
		$scope.activityShow = false;
		$scope.loadingData = false;
		var ItemFilter = new UniqueFilter();
		var selectedAuthor = false;
		var inited = false;
		var loadServices = {
			'home': loadCommunityHome,
			'posts': loadCommunityPosts,
			'members': loadCommunityMember,
			'about': loadCommunityAbout,
			'applications': loadCommunityApplications,
			'activity': loadCommunityActivityLog,
			'received-ratings': loadReceivedRatings,
			'given-ratings': loadGivenRatings,
		};
		var templatePath = 'assets/components/item/items/post.html';

		$scope.loadBottom = function() {
			$scope.loadingData = true;
			loadServices[$scope.pageSegment]($stateParams.id, processData, processDataErr);
		};

		$scope.openRatingReplyForm = function(rating) {
			if ($scope.data) $scope.data.forEach(function(item) {
				item.formOpened = false;
			});

			rating.formOpened = true;
		};

		function finishLoading(res) {
			$timeout(function() {
				$scope.subPageLoaded = true;

				if (!$scope.$parent)
					$scope.$parent = {};

				$scope.$parent.loaded = true;
				$rootScope.$emit("subPageLoaded");
			});

			if (res && res.length) {
				$scope.loadingData = false;
			}
		}

		function processData(res) {
			res = ItemFilter.filter(res);

			$scope.data = $scope.data.concat(res);
			finishLoading(res);
		}

		function processDataErr(res) {
			finishLoading([]);
		}

		function loadGivenRatings(id, done, doneErr) {
			var obj = {
				communityId: id,
				limit: 10,
				offset: $scope.data.length
			};

			CommunityRatings.given(obj, done, doneErr);
		}

		function loadReceivedRatings(id, done, doneErr) {
			var obj = {
				communityId: id,
				limit: 10,
				offset: $scope.data.length
			};

			$scope.loadedRatingPosts = false;
			$scope.ratingPosts = [];

			CommunityRatings.received(obj, function(res) {
				done(res);
				$rootScope.receivedRepliesAfterLoadHandler($scope.data, $scope);
			}, doneErr);

			$scope.$watch('rating.current_community_id', function(val) {
				if (val === selectedAuthor && $scope.loadedRatingPosts) return;
				selectedAuthor = val;

				$scope.rating.post_id = null;
				processRelevantPosts(id, val);
			});

			var removeListener = $scope.$on('$routeChangeStart', function() {
				$scope.closeUserRatingForm();
				removeListener();
			});
		}

		function processRelevantPosts(id, val) {
			var configCommunityPossible = {
				communityId: $stateParams.id,
				current_community_id: val,
				not_related: true
			};
			var configUser = {
				userId: $rootScope.loggedUser._id
			};
			var configCommunity = {
				communityId: val,
				not_related: true
			};
			var configCurrentCommunity = {
				communityId: $stateParams.id,
				not_related: true
			};

			$scope.loadingRatingPosts = true;

			CommunityRatings.possiblePosts(val ? configCommunityPossible : configCurrentCommunity, function(res, headers) {
				var posts = UsersCommunitiesService.alterPossiblePosts(res, headers);

				$scope.ratingPosts = posts;

				var ratingActivePosts = [];

				if (val) {
					CommunityRatings.activePosts(configCurrentCommunity, function(res) {
						angular.forEach(res.data, function(post) {
							ratingActivePosts.push(post);
						});
					});

					CommunityRatings.activePosts(configCommunity, function(res) {
						angular.forEach(res.data, function(post) {
							ratingActivePosts.push(post);
						});
					});
				} else {
					CommunityRatings.activePosts(configCurrentCommunity, function(res) {
						angular.forEach(res.data, function(post) {
							ratingActivePosts.push(post);
						});
					});

					UserRatings.activePosts(configUser, function(res) {
						angular.forEach(res.data, function(post) {
							ratingActivePosts.push(post);
						});
					});
				}

				$scope.ratingActivePosts = ratingActivePosts;
				$scope.loadedRatingPosts = true;
				$scope.loadingRatingPosts = false;
			}, function(res) {
				$scope.loadedRatingPosts = true;
				$scope.loadingRatingPosts = false;
			});
		}

		function loadCommunityAbout(id, done, doneErr) {
			finishLoading([]);
		}

		function loadCommunityMember(id, doneErr) {
			var obj = {
				communityId: id,
				limit: 12,
				offset: $scope.data.length
			};

			CommunityMembers.query(obj, processData, doneErr);
		}

		function loadCommunityApplications(id, doneErr) {
			var obj = {
				communityId: id,
				limit: 12,
				offset: $scope.data.length
			};

			CommunityApplicants.query(obj, processData, doneErr);
		}

		function pushPost(containerPath, post, compiledTemplate) {
			var scope = PostScope.getPostScope(post, $scope);
			compiledTemplate(scope, function(clone) {
				// doesnt work when not delayed
				$timeout(function() {
					$(containerPath).append(clone[0]);
					$timeout(function() {
						$('#post_' + post._id).show();
					});
				}, 100);
			});
		}

		// helper variables for getting post list
		var getPostsStatus = {
			running: false
		};
		$scope.getPostsFinished;
		var getPostsResult = {
			active: [],
			inactive: []
		};
		var getPostsQ = [];

		// load posts of community
		// render them same way as on marketplace, ie download & compile templates, make scope, inject it..
		function loadCommunityPosts(id, doneErr) {
			var templateUrl = $sce.getTrustedResourceUrl(templatePath);

			// counter for template
			$scope.communityPostCount = {
				'active': 0,
				'inactive': 0
			};
			// finishLoading();

			$scope.communityPostListActiveOptions = {
				getData: ProfileUtils.getPosts.bind(null, {
					params: {
						communityId: id
					},
					resource: Community.getPosts,
					getPostsStatus: getPostsStatus,
					getPostsFinished: $scope.getPostsFinished,
					getPostsResult: getPostsResult,
					getPostsQ: getPostsQ,
					postCount: $scope.communityPostCount,
					active: true
				}),
				templateUrl: templateUrl,
				cb: finishLoading,
			};

			$scope.communityPostListInactiveOptions = {
				getData: ProfileUtils.getPosts.bind(null, {
					params: {
						communityId: id
					},
					resource: Community.getPosts,
					getPostsStatus: getPostsStatus,
					getPostsFinished: $scope.getPostsFinished,
					getPostsResult: getPostsResult,
					getPostsQ: getPostsQ,
					postCount: $scope.communityPostCount
				}),
				disableLoading: true,
				templateUrl: templateUrl,
			};
		}


		$scope.refreshItemInfo = function($event, itemNew) {
			$scope.posts.data.forEach(function(item, key) {
				if (item._id === itemNew._id) {
					$scope.posts.data.splice(key, 1);
				}
			});
		};

		function loadCommunityHome(id) {
			async.parallel([
				function(done) {
					CommunityActivityLog.get({
						communityId: id,
						limit: 5
					}, function(res) {

						$scope.activityShow = false;
						$scope.activityLog = [];
						$timeout(function() {

							res.map(function(activity) {
								activity.text = Activities.getActivityTranslation(activity);
								return activity;
							});

							$scope.activityLog = res;
							$scope.activityShow = true;
						});

						done(null);
					}, done);
				},
				function(done) {
					CommunityApplicants.query({
						communityId: id
					}, function(res) {
						$scope.applications = res;
						done(null);
					}, done);
				},
				function(done) {
					CommunityRatings.received({
						communityId: id,
						limit: 5,
						offset: 0
					}, function(res) {
						$scope.receivedRatings = res;
						done(null);
					}, done);
				},
				function(done) {
					Community.getPosts({
						communityId: id,
						limit: 5,
						offset: 0,
						state: 'active'
					}, function(res) {
						$scope.posts = res;
						done(null);
					}, done);
				}
			], finishLoading);

			$scope.$on('postUpdated', $scope.refreshItemInfo);
		}

		function loadCommunityActivityLog(id) {
			CommunityActivityLog.get({
				communityId: id
			}, processData, processDataErr);
		}

		// =================================== Public Methods ====================================

		$scope.remove = function(item) {
			Post.remove({
				postId: item._id
			}, function(res) {

				$scope.$emit('postCreated', item._id); // refresh post list
				$scope.cancel(item);
			}, processDataErr);
		};

		$scope.removeMember = function(id) {
			if ($scope.sendingRemoveMember) return false;
			$scope.sendingRemoveMember = true;

			CommunityMembers.remove({
				communityId: $scope.info._id,
				memberId: id
			}, function(res) {
				$scope.sendingRemoveMember = false;
				Notify.addSingleTranslate('NOTIFY.USER_KICKED_FROM_COMMUNITY_SUCCESS', Notify.T_SUCCESS);
				$scope.init();
			}, function(res) {
				$scope.sendingRemoveMember = false;
			});
		};

		// only hide post .. may be used later for delete revert
		$scope.removeItemFromList = function($event, item) {
			$("#post_" + item._id).slideUp("slow", function() {});
			$scope.init();
		};

		function init() {
			ItemFilter.clear();
			$scope.loadingData = true;
			$scope.data = [];
			$scope.pageSegment = $stateParams.page || 'home';
			var loadService = loadServices[$scope.pageSegment];

			$scope.debug && $log.log("Calling load service for segment ", $scope.pageSegment);
			loadService($stateParams.id, processData, processDataErr);

			// refresh after new post created
			if ($scope.pageSegment == 'community' || $scope.pageSegment == 'community.posts') {
				$scope.$on('postCreated', function() {
					// refresh whole page - load new counters, activity feed, posts list
					$scope.init();
					// loadServices[$scope.pageSegment]($stateParams.id, processData, processDataErr);
				});
			}

			// refresh after new post created
			if (!inited && ($scope.pageSegment == 'community' || $scope.pageSegment == 'community.posts' || $scope.pageSegment == 'posts')) {
				$scope.$on('postCreated', function() {
					$scope.loadingData = false;
					$scope.subPageLoaded = false;

					$timeout(loadService($stateParams.id, processData, processDataErr), 800);
				});
				$scope.$on('postUpdated', function() {
					$scope.loadingData = false;
					$scope.subPageLoaded = false;

					$timeout(loadService($stateParams.id, processData, processDataErr), 800);
				});

				// added event listeners - dont add them again
				inited = true;
			}
		}

		// will add new rating to data array
		$scope.addCommunityRating = function($event, item) {
			$scope.data.unshift(item);
			$scope.flashRatingBackground(item);
		};

		$scope.$on('refreshSubpage', init);
		$scope.$on('communityRatingsAdded', $scope.addCommunityRating);
		$scope.$on('itemDeleted', $scope.removeItemFromList);
		init();
	}
]);