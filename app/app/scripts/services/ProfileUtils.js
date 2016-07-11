'use strict';

/**
 * @ngdoc service
 * @name hearth.services.ProfileUtils
 * @description Helper class for all Hearth profiles (user himself, other users, community profiles...)
 */

angular.module('hearth.services').factory('ProfileUtils', ['Karma', 'MottoLength', function(Karma, MottoLength) {

	var factory = {};

	var PROFILE_TYPES = {
		USER: 'user',
		COMMUNITY: 'community'
	}

	/**
	 *	Function that takes the profile and its type and processes all necessary transforms on it
	 *	so that it can be used without problem
	 *
	 *	@param {Object} paramObject	-	{Object}	profile [required] the object to be transformed
	 *								-	{String}	type [required] [one of PROFILE_TYPES]
	 *	@return {Object} paramObject.profile -	the transformed and ready for use profile object
	 */
	function transformDataForUsage(paramObject) {
		if (!(paramObject && paramObject.profile && paramObject.type && !!(PROFILE_TYPES[paramObject.type.toUpperCase()]))) throw new Error('Insufficient paramObject to transform input data correctly.');
		paramObject.type = paramObject.type.toUpperCase();

		// common for all types
		// copyMottoIfNecessary(paramObject.profile);
		fillWebs(paramObject.profile);
		// joinInterests(paramObject.profile);
		getLocationJson(paramObject.profile);

		// type-specific
		switch (paramObject.type) {
			case PROFILE_TYPES.USER:
				// nothing yet ..
				break;

			case PROFILE_TYPES.COMMUNITY:
				// nothing yet ..
				break;
		}

		return paramObject.profile;
	}

	/**
	 *	Function that takes the profile and its type and processes all necessary transforms on it
	 *	so that it can be successfully saved to server.
	 *
	 *	@param {Object} paramObject	-	{Object}	profile [required] the object to be transformed
	 *								-	{String}	type [required] [one of PROFILE_TYPES]
	 *	@return {Object} paramObject.profile -	the transformed and ready for saving profile object
	 */
	function transformDataForSaving(paramObject) {
		if (!(paramObject && paramObject.profile && paramObject.type && !!(PROFILE_TYPES[paramObject.type.toUpperCase()]))) throw new Error('Insufficient paramObject to transform input data correctly.');
		paramObject.type = paramObject.type.toUpperCase();

		return paramObject.profile;
	}

	// SETUP
	var MAX_MOTTO_LENGTH = MottoLength;

	// FUNCTIONS
	function copyMottoIfNecessary(profile) {
		if (!profile.motto) {
			profile.motto = profile.about || profile.description || '';
			if (profile.motto.length > (MAX_MOTTO_LENGTH)) profile.motto = profile.motto.slice(0, MAX_MOTTO_LENGTH - 3) + '...';
		}
		return profile;
	}

	function getLocationJson(profile) {
		if (profile.locations.length) {
			for (var i = profile.locations.length; i--;) {
				profile.locations[i] = profile.locations[i].json_data;
			}
		}
		return profile;
	}

	function fillWebs(profile) {
		if (!profile.webs || !profile.webs.length) profile.webs = [''];
		return profile;
	}

	function splitInterests(profile) {
		profile.interests = (profile.interests ? profile.interests.split(',') : []);
		return profile;
	}

	function joinInterests(profile) {
		// check the structure
		profile.interests = profile.interests || [];
		for (var i = profile.interests.length; i--;) {
			if (profile.interests[i].text) profile.interests[i] = profile.interests[i].text;
		}
		// profile.interests = profile.interests.join(',');
		return profile;
	}

	// FUNCTION EXPOSITION
	factory.transformDataForUsage = transformDataForUsage;
	factory.transformDataForSaving = transformDataForSaving;
	factory.single = {
		copyMottoIfNecessary: copyMottoIfNecessary,
		fillWebs: fillWebs,
		getLocationJson: getLocationJson,
		joinInterests: joinInterests,
		splitInterests: splitInterests
	};
	factory.params = {
		PROFILE_TYPES: PROFILE_TYPES,
		MAX_MOTTO_LENGTH: MAX_MOTTO_LENGTH
	};

	// RETURN
	return factory;
}]);