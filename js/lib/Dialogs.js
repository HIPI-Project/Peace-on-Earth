"use strict";

var Dialogs = {};

// Pass in a reference to the global state object and this method will return a pointer to the dialog-sub-array defined by the dialogPositionChain string.
// The returned dialog reference will point to an internal location of the given globalStateObj allowing the calling code to modify the target directly (by reference).
// If a symbolic.link is encountered along the way this method will NOT jump to the remote location... the shadow links must be filled in before trying to address a dialog downstream of a symbolic link.
Dialogs.getDialogPositionReference = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	// An Empty dialogPositionChain means that the user has positioned the Dialogs container at the root.
	var positionArr = HIPI.framework.Utilities.getArrayOfIntegersFromCommaSeparatedChain(dialogPositionChain);

	var subArrayRef;

	for(var i=0; i<globalStateObj.domains.length; i++){

		if(globalStateObj.domains[i].domainName !== domainName)
			continue;

		// Protect against an empty database.
		// Most of the properties are the same at the domain root as in "dialogs" entries.
		// Those properties which do not exist at the domain root are 1) "message" and 2) "contradictions".
		fillInOptionalDialogProperties(globalStateObj.domains[i]);

		subArrayRef = globalStateObj.domains[i];

		var loopPosition;
		while(loopPosition = positionArr.shift()){

			if(!subArrayRef.dialogs[loopPosition])
				throw new Error("Error in Dialogs.getDialogPositionReference. The position is invalid from dialogPositionChain: " + dialogPositionChain + " Current position array: " + positionArr.join(',') + " Current position: " + loopPosition);

			// It is OK for a message to be defined at a certain level without its sibling, the "dialogs" array.
			// Many messages will exist without any children and there's no reason to fill up the database with boiler plate meta data which can be implicitly added with one line of code here.
			fillInOptionalDialogProperties(subArrayRef.dialogs[loopPosition]);

			if(!Array.isArray(subArrayRef.dialogs[loopPosition].dialogs))
				throw new Error("Error in Dialogs.getDialogPositionReference. The position does not have an array of dialogs: " + positionArr.join(','));

			subArrayRef = subArrayRef.dialogs[loopPosition];
		}
	}

	if(!subArrayRef)
		throw new Error("Error in Dialogs.getDialogPositionReference. Could not find a dialogs array at the given position.");

	if(dialogPositionChain && typeof subArrayRef.message !== 'string' && !subArrayRef.link)
		throw new Error("Error in Dialogs.getDialogPositionReference. Could not find a message property (in string format) or a link at the at the given position. These are required properties at every level in the dialog tree except for the domain root.");

	return subArrayRef;

	function fillInOptionalDialogProperties (objectRef) {

		if(typeof objectRef.showNewMessageDialog === "undefined")
			objectRef.showNewMessageDialog = false;

		if(typeof objectRef.showEditMessageDialog === "undefined")
			objectRef.showEditMessageDialog = false;

		if(typeof objectRef.dialogs === "undefined")
			objectRef.dialogs = [];
	}
};

// Call this method and it will return a copy of the given globalStateObj with all child pop-overs closed.
Dialogs.closePerpendicularDialogsAboveCurrent = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	// Close all of the properties except for the "selected" attribute.
	// These flags relate to windows sitting above the given position so this method should close those pop-overs without un-selecting the current message. 
	_Dialogs_closeDialogProperties(dialogSubRef);

	_Contradictions_closeWindowsRecursive(HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain))

	return HIPI.lib.Dialogs.closePerpendicularDescendantsDialogsAboveCurrent(globalStateObj, domainName, dialogPositionChain);
};

// A Private method shared between 2 public methods, literally.
function _Dialogs_closeDialogProperties(dialogSubRef){

	HIPI.framework.Utilities.ensureTypeObject(dialogSubRef);

	dialogSubRef.showPerpendicularLevel = false;
	dialogSubRef.showNewMessageDialog = false;
	dialogSubRef.showEditMessageDialog = false;
	dialogSubRef.showContradictWindow = false;
}

function _Contradictions_closeWindowsRecursive(contradictionSubRef){

	contradictionSubRef.showContradictWindow = false;

	if(contradictionSubRef.contradictions){

		for(var i=0; i<contradictionSubRef.contradictions.length; i++)
			_Contradictions_closeWindowsRecursive(contradictionSubRef.contradictions[i]);
	}
}

// Nearly the same as closePerpendicularDialogsAboveCurrent except the state at the given level remains untouched.
Dialogs.closePerpendicularDescendantsDialogsAboveCurrent = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	var intialDialogSubArr = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	if(intialDialogSubArr.dialogs){

		for(var i=0; i<intialDialogSubArr.dialogs.length; i++)
			closePerpendicularRecursive(intialDialogSubArr.dialogs[i]);
	}

	return globalStateObj;

	function closePerpendicularRecursive(dialogSubRef){

		_Dialogs_closeDialogProperties(dialogSubRef);

		// Everything above the target dialog should be deselected in addition to having the perpendicular U.I. components closed.
		dialogSubRef.selected = false;

		_Contradictions_closeWindowsRecursive(dialogSubRef);

		if(dialogSubRef.dialogs){

			for(var i=0; i<dialogSubRef.dialogs.length; i++)
				closePerpendicularRecursive(dialogSubRef.dialogs[i]);
		}
	}
};

// This method will stop at any Dialog level which has already been cached, even if un-cached descendants exist, unless forceRecalculateFlag is set to TRUE.
// Pass in a blank string to the 3rd parameter to cache all Dialogs within the given domain.
Dialogs.cacheDialogDepths = function (globalStateObj, domainName, dialogPositionChain, forceRecalculateFlag) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeBoolean(forceRecalculateFlag);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	cacheDialogDepthRecursive(dialogPositionChain);

	return globalStateObj;

	function cacheDialogDepthRecursive(recurseDialogPositionChain){

		var recurseDialogSubArr = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		// End the recursion if the Depth has already been cached.
		if(recurseDialogSubArr.depth && !forceRecalculateFlag)
			return;

		recurseDialogSubArr.depth = HIPI.lib.Dialogs.getDialogDepthAtPosition(globalStateObj, domainName, recurseDialogPositionChain, forceRecalculateFlag, false);

		var recurseChildPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, false, false);

		for(var i=0; i<recurseChildPositionChainsArr.length; i++)
			cacheDialogDepthRecursive(recurseChildPositionChainsArr[i]);
	}
};

// This method will stop at any Dialog level which has already been cached, even if un-cached descendants exist, unless forceRecalculateFlag is set to TRUE.
// Pass in a blank string to the 3rd parameter to cache all Dialogs within the given domain.
Dialogs.cacheAnsweredStatus = function (globalStateObj, domainName, dialogPositionChain, forceRecalculateFlag) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeBoolean(forceRecalculateFlag);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	cacheAnsweredStatusRecursive(dialogPositionChain);

	return globalStateObj;

	function cacheAnsweredStatusRecursive(recurseDialogPositionChain){

		var recurseDialogSubArr = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		// End the recursion if the status has already been cached.
		if(recurseDialogSubArr.isAnswered && !forceRecalculateFlag)
			return;

		// Don't try setting the Answered Status on the Domain Root.
		if(recurseDialogPositionChain)
			recurseDialogSubArr.isAnswered = HIPI.lib.Dialogs.isDialogLevelAnswered(globalStateObj, domainName, recurseDialogPositionChain, false);

		var recurseChildPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, false, false);

		for(var i=0; i<recurseChildPositionChainsArr.length; i++)
			cacheAnsweredStatusRecursive(recurseChildPositionChainsArr[i]);
	}
};

// Returns TRUE if the dialog position is EVEN.
// Dialogs begin as True-By-Default which means that the believers (non-skeptics) add messages to the first level (a single integer in the dialogPositionChain) and ODD thereafter.
Dialogs.isDialogLevelSkeptical = function (dialogPositionChain) {

	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	// For the root level.
	if(!dialogPositionChain)
		throw new Error("Error in method Dialogs.isDialogLevelSkeptical. The dialogPositionChain cannot be empty because it implies the domain root where a message is not selected.");

	var positionChainArr = dialogPositionChain.split(',');

	if(positionChainArr.length % 2 === 0)
		return true;
	else
		return false;
};

// This method will return a copy of the Global State object but with depth properties adjusted.
Dialogs.recalculateDepthProperiesOnParentChain = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	var globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	var loopPositionChain = dialogPositionChain;
	while(true){

		var loopDialogReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopPositionChain);

		// This method is being called because something changed at the given position.
		// Therefore if there is a depth property set it should not be trusted.
		// Deleting this property (if exists) will let the subsequent method call utilize "depth" caching throughout the children (for performance).
		delete loopDialogReference.depth;

		// Set the "depth" property at each level in the hierarchy.
		loopDialogReference.depth = HIPI.lib.Dialogs.getDialogDepthAtPosition(globalStateObj, domainName, loopPositionChain, false, false);

		// Once the domain root has been reached the position chain will be empty.
		if(!loopPositionChain)
			break;

		// Keep walking back in the hierarchy by stripping off trailing integer positions.
		loopPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(loopPositionChain);
	}

	return globalStateObj;
};

// This method will return a copy of the Global State object but with isAnswered statuses adjusted.
Dialogs.recalculateAnsweredStatusOnParentChain = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	var globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	var loopPositionChain = dialogPositionChain;
	while(true){

		var loopDialogReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopPositionChain);

		// This method is being called because something changed at the given position.
		// Therefore if there is an isAnswered property set it should not be trusted.
		// Deleting this property (if exists) will let the subsequent method call utilize "isAnswered" caching throughout the children (for performance).
		delete loopDialogReference.isAnswered;

		// Set the "isAnswered" property at each level in the hierarchy, going towards the Domain Root.
		loopDialogReference.isAnswered = HIPI.lib.Dialogs.isDialogLevelAnswered(globalStateObj, domainName, loopPositionChain, false);

		// Keep walking back in the hierarchy by stripping off trailing integer positions.
		loopPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(loopPositionChain);

		// Once the domain root has been reached the position chain will be empty.
		if(!loopPositionChain)
			break;
	}

	return globalStateObj;
};

// This method will return a depth value at the given dialogPositionChain by traversing the "general tree" made out of "dialog" arrays.
// It is called DEPTH and not HEIGHT because the trunk of the tree is analogous to the domain root and the deepest "message"s represent leaves at the highest point.
// If the dialogPositionChain is empty then it will calculate the maximum dialog length from the domain root. 
// For example, if there is only one message in the database and the dialogPositionChain is empty then this method would return a value of 1.
// Continuing with this example, if a dialogPositionChain of "1" is given then this method would return 0 because the deepest message in the tree has a zero-based depth.
// This method prefers retrieving cached depth values if the forth argument is TRUE but will recalculate if the depth property is missing.
// If the 5th argument is true then this method will include contradicted messages in the depth calculation.
Dialogs.getDialogDepthAtPosition = function (globalStateObj, domainName, dialogPositionChain, forceRecalculateFlag, includeContradictedMessages) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeBoolean(forceRecalculateFlag);
	HIPI.framework.Utilities.ensureTypeBoolean(includeContradictedMessages);

	if(includeContradictedMessages && !forceRecalculateFlag)
		throw new Error("Error in method Dialogs.getDialogDepthAtPosition. If this method is going to include contradicted messages in the result then it is not possible to retrieve cached results.");

	// As long as the domain root isn't given, check to see if the targeted dialog is itself contradicted.
	if(dialogPositionChain){
		if(HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, ""))
			return 0;
	}

	return getDepthRecursive(dialogPositionChain);

	function getDepthRecursive(recurseDialogPositionChain){

		var recurseDialogReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		if(!forceRecalculateFlag && typeof recurseDialogReference.depth !== "undefined")
			return recurseDialogReference.depth;

		if(!recurseDialogReference.dialogs || !recurseDialogReference.dialogs.length)
			return 0;

		if(!Array.isArray(recurseDialogReference.dialogs))
			throw new Error("Error in method getDialogDepthAtPosition. The dialogs property is not of type Array.");

		var childDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, includeContradictedMessages, false);

		var level = 0;

		for(var i=0; i<childDialogPositionChainsArr.length; i++) {

			// Add one to the result for the transition between hierarchical levels.
			var loopDepth = getDepthRecursive(childDialogPositionChainsArr[i]) + 1;

			level = Math.max(loopDepth, level);
		}

		return level;
	}
};

// If the given dialogPositionChain points to a dialog with a link...
// a) If returnSymLinkAddresses is TRUE this method will return the child addresses of the remote link.
// b) If returnSymLinkAddresses is FALSE this method will only check for children immediately attached (which may include "shadow links").
Dialogs.getArrayOfChildDialogPositionChains = function(globalStateObj, domainName, dialogPositionChain, includeContradictedMessages, returnSymLinkAddresses){

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeBoolean(includeContradictedMessages);
	HIPI.framework.Utilities.ensureTypeBoolean(returnSymLinkAddresses);

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	if(dialogSubRef.link && returnSymLinkAddresses){

		dialogPositionChain = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, domainName, dialogSubRef.link);

		dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);
	}

	var retArr = [];

	if(dialogSubRef.dialogs && !Array.isArray(dialogSubRef.dialogs))
		throw new Error("Error in method Dialogs.getArrayOfChildDialogPositionChains. The dialogs property must be of type array.");

	if(!dialogSubRef.dialogs || !dialogSubRef.dialogs.length)
		return retArr;

	for(var i=0; i<dialogSubRef.dialogs.length; i++){

		var loopChildDialogPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(dialogPositionChain, i);

		if(!includeContradictedMessages){
			if(HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, loopChildDialogPositionChain, ""))
				continue;
		}

		retArr.push(loopChildDialogPositionChain);
	}

	return retArr;
};

// An "answered" dialog is analogous to a "contradicted" dialog. 
// In other words, a believer who starts out adding a horizontal entry does not want to see their dialog terminate on a vertical message.
// If the target is "horizontal" (believer) this will return FALSE if there is one-or-more "vertical" (skeptic) dialogs which do not terminate on a "horizontal" dialog.
// If the target is "vertical" the same rules hold true, just offset by 1/2 step.
// Contradicted dialogs terminate as if it doesn't exist, including any descendants, unless the 4th parameter is TRUE.
// However if the target is itself contradicted it will not affect the result of this method, only the state of its descendants. 
Dialogs.isDialogLevelAnswered = function (globalStateObj, domainName, dialogPositionChain, includeContradictedMessages) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeBoolean(includeContradictedMessages);

	if(!dialogPositionChain)
		throw new Error("Error in Dialogs.isAnswered. It is not possible to get a answered status at the domain root.");

	// Kick start the recursion with a reference to the "dialog" object.
	return checkIfAnsweredRecursive(dialogPositionChain);

	function checkIfAnsweredRecursive(recurseDialogPositionChain){

		var dialogSubRefRecurse = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		// The "isAnswered" property does not persist to the server but it may exist within the global state for caching purposes.
		if(typeof dialogSubRefRecurse.isAnswered !== "undefined"){

			if(typeof dialogSubRefRecurse.isAnswered !== "boolean")
				throw new Error("Error in Dialogs.isAnswered. If the 'isAnswered' property exists it must be of type boolean.");

			return dialogSubRefRecurse.isAnswered;
		}

		if(!dialogSubRefRecurse.dialogs || !dialogSubRefRecurse.dialogs.length)
			return false;

		var childDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, includeContradictedMessages, false);

		for(var i=0; i<childDialogPositionChainsArr.length; i++){

			if(!checkIfAnsweredRecursive(childDialogPositionChainsArr[i]))
				return true;
		}

		return false;
	}
};

// This application does not use unique identifiers for locating dialogs.
// The Dialog Position Chains are only calculated at runtime and make no assumption that dialogs will exist within the same position after the browser reloads.
// This approach will let multiple users safely merge their cortex.json files together using version control software without fear of conflicts since this database is "add only".
// In order save a link to another dialog entry to disk it is necessary to identify the entry by means of verbatim string matches on the Dialog entries.
// This method will return an array of strings representing the X-number character excerpts from the Dialog entries, starting from the domain root.
Dialogs.getLinkingArrayFromDialogPositionChain = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Dialogs.getLinkingArrayFromDialogPositionChain. Cannot create a link to the domain root.");

	var retArr = [];

	// Walk forward from the domain root until reaching the given dialogPositionChain. 
	var dialogAncestorArr = HIPI.framework.Utilities.getAncestorArrayFromCommaSeparatedIntegers(dialogPositionChain);

	dialogAncestorArr.forEach(function(loopDialogPositionChain){

		var loopDialogReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopDialogPositionChain);

		// If the linking array encounters a '.message' property, an excerpt from the first X characters will be added for the dialog position.
		// If another link is encountered then a copy of its '.link' array will be added to the array.
		// There should never be a case where a '.link' array on a dialog entry contains multiple dimensions.
		// The only time that a 2nd-dimensional linking array would be encountered is for a ".reverseLinks" dialog property.
		if(loopDialogReference.message){

			var messageExcerpt = loopDialogReference.message.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());

			retArr.push(messageExcerpt);
		}
		else if(loopDialogReference.link){

			if(!Array.isArray(loopDialogReference.link))
				throw new Error("Error in Dialogs.getLinkingArrayFromDialogPositionChain. There is a link at the given position but it is not of type Array: " + loopDialogPositionChain);

			loopDialogReference.link.forEach(function(linkEntry){

				if(Array.isArray(linkEntry))
					throw new Error("Error in Dialogs.getLinkingArrayFromDialogPositionChain. This application should never encounter more than 2 dimensions within a linking array: " + loopDialogPositionChain);

				if(typeof linkEntry !== "string" || !linkEntry.length)
					throw new Error("Error in Dialogs.getLinkingArrayFromDialogPositionChain. The second dimension in a linking array contains an invalid data type or an invalid string: " + loopDialogPositionChain);
			});

			retArr.push(loopDialogReference.link);
		}
		else{
			throw new Error("Error in Dialogs.getLinkingArrayFromDialogPositionChain. There should never be a case where there is not a link or a message at a given dialog position: " + loopDialogPositionChain);
		}
	});

	return retArr;
};

Dialogs.getDialogPositionReferenceFromLinkingArr = function (globalStateObj, domainName, linkingArr) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeArray(linkingArr);

	var linkDialogPositionChain = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, domainName, linkingArr);

	return HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, linkDialogPositionChain);
};

// This method is inverse to Dialogs.getLinkingArrayFromDialogPositionChain.
// Given an array of message excepts (i.e. ["Hello", "Hi", "How are you?", "Just fine, thanks!"]) this method will walk forward from the domain root looking for verbatim matches on the dialog.message entries.
// This method returns a dialogPositionChain (comma separated integers) which correlates to the given linkingArr.
// In case of a verbatim collision at a certain level this method will continue to spider the hierarchy looking for an unambiguous match.
// If it so happens that the linkingArr is ambiguous (multiple matching paths) or in case the linking array cannot be found in totality, this method will report an error, requiring a user to perform surgery on cortex.json.
// Experiencing a conflict with this method is unlikely and can only be triggered by an unlucky file merge of cortex.json.
Dialogs.getDialogPositionChainFromLinkingArr = function (globalStateObj, domainName, linkingArr) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeArray(linkingArr);

	if(!linkingArr.length)
		throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. Links cannot be made to the domain root.");

	var linkingArrCopy = HIPI.framework.Utilities.copyArray(linkingArr);

	// Create a multi-dim-hash with the Dialog Position Chains as the keys and each value is another object of the same type.
	// The final level of the hash will have keys with an empty object for the value.
	// EX: This ends up finding a eventual path of "1,5,3"... the path starting with "0,.." turned out to be a dead-end.
	// {'0': {}, '1': {'5': {'3': {}}}}
	var multiDimHashOfMatchingPaths = {};

	// Kick start the recursion from the domain root.
	spiderForMatchingLinksRecursive(linkingArrCopy, "", multiDimHashOfMatchingPaths);

	// Flatten the multi-dim-hash into an array of dialogPositionChains.
	// Continuing with the above example the array would contain the following entries.
	// ['0', '1', '1,5', '1,5,3']
	var flatArrOfDialogPositionChains = [];

	// Kick start the recursion from an empty Dialog Position Chain.
	flattenMultiDimHash("", multiDimHashOfMatchingPaths);

	// Finally, ensure that the linkingArr is unambiguous and that it found an exact match.
	var matchingPathwaysArr = [];

	flatArrOfDialogPositionChains.forEach(function(loopDialogPositionChain){

		// It can be said that an exact match has been found if there is a 1-to-1 correspondence between the entries in linkingArr and the number of integers found within the given comma separated address.
		if(loopDialogPositionChain.split(',').length === linkingArr.length)
			matchingPathwaysArr.push(loopDialogPositionChain);
	});

	if(matchingPathwaysArr.length === 0)
		throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. Could not find a matching pathway.");

	if(matchingPathwaysArr.length > 1)
		throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. The linking array is unambiguous, multiple exact match pathways were found.", matchingPathwaysArr);

	return matchingPathwaysArr[0];

	function flattenMultiDimHash(recurseBaseCommaSeparatedAddress, recruseMultiDimHash){

		for(var key in recruseMultiDimHash){

			var loopAddress = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(recurseBaseCommaSeparatedAddress, key);

			flatArrOfDialogPositionChains.push(loopAddress);

			flattenMultiDimHash(loopAddress, recruseMultiDimHash[key]);
		}
	}

	function spiderForMatchingLinksRecursive(recurseLinkArr, recurseDialogPositionChain, recurseMultiDimHashPosition){

		// The recursion ends once all message excerpts have been shifted off of the front of this array.
		if(!recurseLinkArr.length)
			return;

		var recurseDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		var recurseLinkingElement = recurseLinkArr.shift();

		if(typeof recurseLinkingElement !== 'string' && !Array.isArray(recurseLinkingElement))
			throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. One of the linkingArr entries encountered is neither a string or an array at dialog position: " + recurseDialogPositionChain + " var type: " + typeof recurseLinkingElement);

		if(!recurseLinkingElement.length)
			throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. One of the linkingArr entries (either an array or a string) is empty: " + recurseDialogPositionChain);

		// Validate the array entries if a link type is encountered.
		if(Array.isArray(recurseLinkingElement))
			recurseLinkingElement.forEach(validateLinkEntry);

		for(var i=0; i<recurseDialogRef.dialogs.length; i++){

			var loopHashKey = (i + "");

			if(recurseDialogRef.dialogs[i].message){

				// There is no point in comparing disparate data elements.
				if(Array.isArray(recurseLinkingElement))
					continue;

				// Validate the database structure which is about to be searched on.
				if(typeof recurseDialogRef.dialogs[i].message !== "string" || !recurseDialogRef.dialogs[i].message.length)
					throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. The message property being checked is not a valid string at position: " + i + " for Dialog: " + recurseDialogPositionChain);

				// It's possible that the likingElement is shorter than than the full index size... so before performing a strict-equality check make sure to normalize.
				var recurseDialogMessageExcerpt = recurseDialogRef.dialogs[i].message.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());

				if(recurseLinkingElement !== recurseDialogMessageExcerpt)
					continue;
			}
			else if(recurseDialogRef.dialogs[i].link){

				// There is no way that the dialog entry at this position (which contains a link array) will match up to a link element that points to a ".message" property (having a type of string).
				if(typeof recurseLinkingElement === "string")
					continue;

				// The application should try to validate resources whenever an opportunity arises which lessens the need for unit testing.
				if(!Array.isArray(recurseDialogRef.dialogs[i].link) || !recurseDialogRef.dialogs[i].link.length)
					throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. The message property being checked is not a valid string at position: " + i + " for Dialog: " + recurseDialogPositionChain);

				// Validation won't cause a noticeable performance impact based on the way that this method is currently being used.
				recurseDialogRef.dialogs[i].link.forEach(validateLinkEntry);

				// Determines if 2 arrays, comprised of strings, are equal.
				if(recurseDialogRef.dialogs[i].link.join('^') !== recurseLinkingElement.join('^'))
					continue;
			}
			else{
				throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. Could not find a 'link' or a 'message' property at the given position: " + i);
			}

			// Rely on the "continue" statements above to deflect non-matches.
			recurseMultiDimHashPosition[loopHashKey] = {};

			spiderForMatchingLinksRecursive(recurseLinkArr, HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(recurseDialogPositionChain, i), recurseMultiDimHashPosition[loopHashKey]);
		}
	}

	function validateLinkEntry(linkEntry){

		if(Array.isArray(linkEntry))
			throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. This application should never encounter more than 2 dimensions within a linking array.");

		if(typeof linkEntry !== "string" || !linkEntry.length)
			throw new Error("Error in Dialogs.getDialogPositionChainFromLinkingArr. The second dimension in a linking array contains an invalid data type or an invalid string.");
	}
};

// Returns TRUE if the second argument is a descendant of the first.
// This indicates that an infinite loop would ensue if the targetDialogPosition was allowed to be symbolically linked as a descendant, anywhere beneath the source.
// The source and targets cannot point entries having a link. However, this method will traverse all Shadow Links under the source to make sure that the target does not exist as a child indirectly.
// EX:
// * Home-1
// 	  * Home-2
// 	     * Home-3
// * Linking-Test
//    @ Link (Home-2)
// 	     @ Shadow (Home-3)

// Now, what if someone is on "Home-3" (either on the Shadow Link or the original) they should not be able to link to "Linking-Test".
// In this case, this method should be called with "Source=Link-Test" and "Target=Home-3"
// Checking for an infinite loop works a little counterintuitive to what a developer might assume from the source & target arguments.
// Imagine that someone in the U.I. has navigated to the targetDialogPositionChain and they are trying to add a symbolic link by a "keyword search".
// This method should be called so that the current position is the "target" and the link-in-question is the "source".
// If the sourceDialogPositionChain is matched by keyword (and this method returns TRUE) it should remain off-limits for linking because if one were added the user would be able to navigate to a descendant which is also an ancestor.
// The contradiction statuses don't matter... infinite loops must be prevented at all times to prevent odd circumstances in the U.I.
// For example, there should never be a case where a user is prevented from contradicting a contradiction for fear that it would expose an infinite loop.
Dialogs.isTargetDialogPositionChainDownstreamOfSource = function (globalStateObj, domainName, sourceDialogPositionChain, targetDialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(sourceDialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(targetDialogPositionChain);

	if(sourceDialogPositionChain === targetDialogPositionChain)
		throw new Error("Error in Dialogs.isTargetDialogPositionChainDownstreamOfSource. The source cannot equal the target.");

	var sourceDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, sourceDialogPositionChain);

	if(sourceDialogSubRef.link)
		throw new Error("Error in Dialogs.isTargetDialogPositionChainDownstreamOfSource. The source cannot refer to a link.");

	var targetDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, targetDialogPositionChain);

	if(targetDialogSubRef.link)
		throw new Error("Error in Dialogs.isTargetDialogPositionChainDownstreamOfSource. The target cannot refer to a link.");

	var isDownstreamFlag = false;

	checkForDownstreamPositionRecursive(sourceDialogPositionChain);

	return isDownstreamFlag;

	function checkForDownstreamPositionRecursive(recurseDialogPositionChain){

		// Save cycles
		if(isDownstreamFlag)
			return;

		var recurseDialogSubArr = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		// The last argument is TRUE so that this method will translate any Shadow Links into their source Dialog Positions.
		// This is important because the following routine only looks for matches on the message-sources of Dialog Position chains.
		var childDialogPositionChainsOfMessageSourcesArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, true, true);

		if(childDialogPositionChainsOfMessageSourcesArr.indexOf(targetDialogPositionChain) > -1){
			isDownstreamFlag = true;
			return;
		}

		// Spider the children recursively... notice the last argument is FALSE meaning that Shadow Links will be traversed if necessary.
		var childDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, true, false);

		for(var i=0; i<childDialogPositionChainsArr.length; i++)
			checkForDownstreamPositionRecursive(childDialogPositionChainsArr[i]);
	}
};

// This method will select all messages throughout the hierarchy of the Dialog position chain, making sure to un-select any siblings along the way.
Dialogs.selectDialogPositionChain = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	// First un-select all other Dialog chains in the domain.
	globalStateObj = HIPI.lib.Dialogs.closePerpendicularDescendantsDialogsAboveCurrent(globalStateObj, domainName, "");

	var dialogAncestorArr = HIPI.framework.Utilities.getAncestorArrayFromCommaSeparatedIntegers(dialogPositionChain);

	dialogAncestorArr.forEach(function(loopDialogPositionChain){

		// Select the current dialog position at this level of hierarchy.
		var loopDialogReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopDialogPositionChain);

		loopDialogReference.selected = true;

		// In order to select a message in the U.I. it is necessary to set the perpendicular attributes or else a message will be selected, but hidden.
		// However, don't set the perpendicular level on the final level or else it will obscure the destination message which this method is ultimately supposed to reveal.
		if(dialogPositionChain !== loopDialogPositionChain)
			loopDialogReference.showPerpendicularLevel = true;
	});

	return globalStateObj;
};

// After adding a new message, symbolic link, or editing, this method will have to be called which will recursively find every Dialog entry which sits at the head of a linking tree.
// Trying to pinpoint the affected Dialog entries after adding a new message can be very tricky and brittle due to the possibility of links from links.
// While it would be more efficient to pinpoint the method calls for Dialogs.fillInShadowLinks(), it is safer and easier to just call the method upon every link head.
// This method will also recalculate the depths whenever a LinkHead is encountered because it is just assuming that there will be a change to the hierarchy.
Dialogs.updateShadowLinksInDomainAndRecalculateDepths = function(globalStateObj, domainName) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	// This array is filled up by means of a closure during the recursion.
	var allDialogPositionChainsWhichAreLinkHeadsArr = [];

	var baseDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, "", true, false);

	baseDialogPositionsArr.forEach(function(loopBaseDialogPositionChain){
		lookForLinkHeadsRecursive(loopBaseDialogPositionChain);
	});

	allDialogPositionChainsWhichAreLinkHeadsArr.forEach(function(loopDialogPositionChainAtLinkHead){
		
		globalStateObj = HIPI.lib.Dialogs.fillInShadowLinks(globalStateObj, domainName, loopDialogPositionChainAtLinkHead);

		// Force a recalculation of depths now that there could be more shadow links added within the hierarchy.
		globalStateObj = HIPI.lib.Dialogs.cacheDialogDepths(globalStateObj, domainName, loopDialogPositionChainAtLinkHead, true);

		// Walk backwards and do the same for each of the parents now that the hierarchy could have changed.
		globalStateObj = HIPI.lib.Dialogs.recalculateDepthProperiesOnParentChain(globalStateObj, domainName, loopDialogPositionChainAtLinkHead);
	});

	return globalStateObj;

	function lookForLinkHeadsRecursive(recurseDialogPositionChain){

		var recurseDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		// This way recursion will stop once the first descendants is found with a link attribute (meaning that it is a link head).
		if(recurseDialogSubRef.link){

			allDialogPositionChainsWhichAreLinkHeadsArr.push(recurseDialogPositionChain);
		}
		else{

			var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, true, false);

			childDialogPositionsArr.forEach(function(childDialogPositionChain){
				lookForLinkHeadsRecursive(childDialogPositionChain);
			});
		}
	}
};

// This method returns a mutated copy of the global state.
// The given dialog position should contain a link... this method will follow the link to its source and ensure that shadow links are created in parallel throughout the hierarchy.
// When a Symbolic link is created there is no need to create "message" copies because the system can always refer to the source.
// The only reason for calling this method (to fill in the "link arrays" between descendants) is because users must have the ability to contradict dialog entries local to the link-hierarchy without affecting the source (or other copies).
// There are other dialog properties which must be saved local to the symbolic links (or the link target(s)) as well.  
// For example, "dialog navigation", and because contradictions are attached locally it means that "dialog depths" may be differ between link/tree copies as well.
Dialogs.fillInShadowLinks = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	fillShadowLinksRecursive(dialogPositionChain);

	return globalStateObj;

	function fillShadowLinksRecursive(targetDialogPosition){

		var targetDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, targetDialogPosition);

		if(!targetDialogRef.link)
			throw new Error("Error in Dialogs.fillInShadowLinks. This method cannot be called on dialog positions which do not contain a link property: " + targetDialogPosition);

		// Loop over all of the dialog entries on the link source and ensure that all of them exist on the local target reference.
		// Notice that the 5th argument is true, meaning that this method will follow the ".link" property on the dialog position to its source and then return an array of child addresses from there.
		var childDialogPositionsOfLinkSourceArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, targetDialogPosition, true, true);

		childDialogPositionsOfLinkSourceArr.forEach(function(loopChildDialogPositionChain){

			var loopDialogReferenceToLinkSource = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopChildDialogPositionChain);

			// It is possible that the Link Source contains a link itself for one of the dialog entries.
			// Any links (including shadow links) should always link to the dialog source where a '.message' property exists.
			// If a '.link' property exists on a child dialog reference then it should be trusted as linking to the source.
			// If the attribute is not found then the dialog position must be the original source, so create a linking array which points at it.
			if(loopDialogReferenceToLinkSource.link)
				var linkingArr = loopDialogReferenceToLinkSource.link;
			else
				var linkingArr = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(globalStateObj, domainName, loopChildDialogPositionChain);

			// Check to see if the linking array already exists as a child on the target Dialog.
			// If not then create a new dialog entry, or a shadow link.
			// There is not any expectation that the dialog entries will be in the same positions between links and their sources.
			var foundLinkArrayMatch = false;

			for(var i=0; i<targetDialogRef.dialogs.length; i++){

				if(!targetDialogRef.dialogs[i].link)
					throw new Error("Error in Dialogs.fillInShadowLinks. There should never be a case where a dialog entry descendant of a link does not contain a link property: " + loopChildDialogPositionChain);

				if(!Array.isArray(targetDialogRef.dialogs[i].link))
					throw new Error("Error in Dialogs.fillInShadowLinks. Found a link property which is not of type array: " + loopChildDialogPositionChain);

				if(HIPI.lib.General.areLinkingArraysEqual(targetDialogRef.dialogs[i].link, linkingArr)){
					foundLinkArrayMatch = true;
					break;
				}
			}

			if(!foundLinkArrayMatch)
				targetDialogRef.dialogs.push({"link": linkingArr});
		});

		if(targetDialogRef.dialogs.length !== childDialogPositionsOfLinkSourceArr.length)
			throw new Error("Error in Dialogs.fillInShadowLinks. The Dialog array length does not match the number of link children at position: " + targetDialogPosition);

		// Now that all of shadow links have been filled in for the current level, make sure the rest of the hierarchy matches the same.
		// Notice that the last parameter is FALSE, the child dialog positions being returned here are local... does not follow the addresses of the symbolic link.
		var childDialogPositionsOfLocalTargetArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, targetDialogPosition, true, false);

		childDialogPositionsOfLocalTargetArr.forEach(function(loopChildDialogPositionChain){
			fillShadowLinksRecursive(loopChildDialogPositionChain);
		});
	}
};

// If the Dialog position contains a link this method will follow it and extract the intended message.
Dialogs.getMessageFromDialogPosition = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	if(!dialogPositionChain)
		throw new Error("Cannot call Dialogs.getMessageFromDialogPosition on the domain root.")

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	if(dialogSubRef.message){

		var retMessage = dialogSubRef.message;
	}
	else if(dialogSubRef.link){

		var linkDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReferenceFromLinkingArr(globalStateObj, domainName, dialogSubRef.link);

		var retMessage = linkDialogSubRef.message;
	}
	else{
		throw new Error("Error in Dialogs.getMessageFromDialogPosition. Could not find a message or link property on the dialog target: " + dialogPositionChain);
	}

	if(typeof retMessage !== 'string')
		throw new Error("Error in Dialogs.getMessageFromDialogPosition. The message property must be of type string: " + dialogPositionChain);

	return retMessage;
};

// Returns an array of dialog positions chains sorted so that entries with the deepest dialog tree are found in front.
// If a dialog depths are truncated in the hierarchy whenever a contradicted entry is encountered.
Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	var messageDepthArr = [];

	var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, dialogPositionChain, true, false);

	// Build an array of objects to keep the depth properties in parallel with the dialogPositionsChains which is needed for the sorting routine.
	childDialogPositionsArr.forEach(function(loopMessageDialogPositionChain){

		messageDepthArr.push({
								"dialogPositionChain":loopMessageDialogPositionChain, 
								"depth":HIPI.lib.Dialogs.getDialogDepthAtPosition(globalStateObj, domainName, loopMessageDialogPositionChain, false, false)
								});
	});

	// Deepest dialogs rise to the top.
	messageDepthArr.sort(function(a, b){
		return b.depth - a.depth;
	});

	// Only return the dialogPostionChains, leaving behind the depth properties.
	return messageDepthArr.map(function(loopMessageDepthObj){
		return loopMessageDepthObj.dialogPositionChain;
	});
};

// The default message to be selected, if needed, will be the first one in the collection which the deepest dialog descendant tree.
// This method will not select a message if one has already been selected, or if there aren't any children.
Dialogs.selectDefaultChildDialogIfNeeded = function (globalStateObj, domainName, parentDialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(parentDialogPositionChain);

	var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(globalStateObj, domainName, parentDialogPositionChain);

	childDialogPositionsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(globalStateObj, domainName, childDialogPositionsArr);

	// If a message has already been selected out of the collection then leave it, otherwise select the first one (sorted at the front).
	var foundSelectedMessage = false;

	childDialogPositionsArr.forEach(function(loopChildDialogPosition){

		var loopDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopChildDialogPosition);

		if(foundSelectedMessage && loopDialogRef.selected)
			throw new Error("Error in Dialogs.selectDefaultChildDialogIfNeeded. Multiple children have been selected: " + parentDialogPositionChain);

		if(loopDialogRef.selected)
			foundSelectedMessage = true;
	});

	if(childDialogPositionsArr.length && !foundSelectedMessage){

		var firstChildDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, childDialogPositionsArr[0]);

		firstChildDialogRef.selected = true;
	}

	return globalStateObj;
};

// This is an expensive method, likely in need of caching mechanisms when the DB grows large.
// Given a dialogPositionChain, this method will spider through every dialog in the given domain looking entries which have linked to it.
Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	var targetDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	if(targetDialogRef.link)
		throw new Error("Error in Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition. The given Dialog Position is itself a linked entry which means that there is no way for other entries to link to it.");

	var retLinkin2dArr = [];

	// Start off the recursion by cycling from the domain root.
	var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, "", true, false);

	childDialogPositionsArr.forEach(function(loopChildDialogPosition){
		buildDialogPositionChainsArraysRecursive(loopChildDialogPosition);
	});

	return retLinkin2dArr;

	function buildDialogPositionChainsArraysRecursive(recurseDialogPositionChain){

		var recurseDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

		if(recurseDialogRef.link){

			var linkToDialogPosition = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, domainName, recurseDialogRef.link);

			if(linkToDialogPosition === dialogPositionChain)
				retLinkin2dArr.push(recurseDialogPositionChain);
		}

		var rerurseChildDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, true, false);

		rerurseChildDialogPositionChainsArr.forEach(function(loopRecurseChildDialogPosition){
			buildDialogPositionChainsArraysRecursive(loopRecurseChildDialogPosition);
		});
	}
};

// Returns TRUE if one of the parents has a contradicted status, regardless of the given dialog position's contradicted state.
// If none of the parents have been contradicted but the given dialog position has, this message will return FALSE.
Dialogs.isDialogPositionDownstreamOfContradictedMessage = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	var dialogAncestorArr = HIPI.framework.Utilities.getAncestorArrayFromCommaSeparatedIntegers(dialogPositionChain);

	// Remove the last entry because it's contradiction status is irrelevant.
	dialogAncestorArr.pop();

	var isDownstreamOfContradiction = false;

	dialogAncestorArr.forEach(function(loopDialogPositionChain){

		if(isDownstreamOfContradiction)
			return;

		isDownstreamOfContradiction = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, loopDialogPositionChain, "");
	});

	return isDownstreamOfContradiction;
};

// This method returns FALSE if the given Dialog Position is itself selected.
// It will only return TRUE if there is a sibling selected with a greater "position index".
// Assumes that siblings are sorted by Dialog Depth.
Dialogs.isSiblingMessageSelectedToTheRight = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Dialogs.isSiblingMessageSelectedToTheRight. This method cannot be called at the domain root.");

	var parentDialogPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(dialogPositionChain);

	var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(globalStateObj, domainName, parentDialogPositionChain);

	// If the user hasn't chosen to display contradicted messages then they shouldn't count towards the result.
	childDialogPositionsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(globalStateObj, domainName, childDialogPositionsArr);

	var isSelectedMessageFound = false;
	var isSelectedMessageFoundToRight = false;
	var hasGivenDialogPositionBeenFound = false;

	childDialogPositionsArr.forEach(function(loopDialogPosition){

		if(loopDialogPosition === dialogPositionChain)
			hasGivenDialogPositionBeenFound = true;

		var loopDialogReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopDialogPosition);

		if(loopDialogReference.selected){

			if(isSelectedMessageFound)
				throw new Error("Error in Dialogs.isSiblingMessageSelectedToTheRight. There are multiple siblings selected at the same level.");

			isSelectedMessageFound = true;

			// Only return TRUE if the loop has passed over the given Dialog Position, it is selected, and the given Dialog Position is not the one which is selected.
			if(hasGivenDialogPositionBeenFound && loopDialogPosition !== dialogPositionChain)
				isSelectedMessageFoundToRight = true;
		}
	});

	if(!hasGivenDialogPositionBeenFound)
		throw new Error("Error in Dialogs.isSiblingMessageSelectedToTheRight. The given Dialog Position could not be found after cycling through the siblings.");

	return isSelectedMessageFoundToRight;
};

// If the given Dialog Position has a link then it means all of its descendants will also have links.
// This method will only return TRUE if there aren't any ancestors with a link property set.
Dialogs.isDialogPositionTheLinkHead = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Dialogs.isDialogPositionTheLinkHead. This method cannot be called at the domain root.");

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	// If it's a source message then it clearly won't be the Link Head.
	if(!dialogSubRef.link)
		return false;

	var parentDialogPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(dialogPositionChain);

	// If the Dialog Position was a Base message then it must be the source of the link.
	if(!parentDialogPositionChain)
		return true;

	var parentDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, parentDialogPositionChain);

	if(parentDialogSubRef.link)
		return false;
	else
		return true;
};

Dialogs.getDialogPositionOfLinkHead = function(globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Dialogs.getDialogPositionOfLinkHead. This method cannot be called at the domain root.");

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	if(!dialogSubRef.link)
		throw new Error("Error in Dialogs.getDialogPositionOfLinkHead. This method can only be called on Dialog Positions which contain a link.");

	while(dialogPositionChain){

		if(HIPI.lib.Dialogs.isDialogPositionTheLinkHead(globalStateObj, domainName, dialogPositionChain))
			return dialogPositionChain;

		dialogPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(dialogPositionChain);
	}

	throw new Error("Error in Dialogs.getDialogPositionOfLinkHead. Cannot find a link head for the given position:", dialogPositionChain);
};

