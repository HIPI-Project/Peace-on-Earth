"use strict";

var Contradictions = {};

// The target (identified by the arguments) must already be contradicted or else this method will throw an error.
// A target can have at most Contradiction invalidating it... don't gang up on the defeated.
// This method will only return the "contradiction position chain" as a string of comma separated integers.
// The domain and dialogPositionChain will be the same for the returned Contradiction as what is given in the arguments.
Contradictions.getContradictionPositionChainWhichHasInvalidatedTheTarget = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.getContradictionPositionChainWhichHasInvalidatedTheTarget. It is not possible to get a contradicted status at the domain root.");

	if(!HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain))
		throw new Error("Cannot call Contradictions.getContradictionPositionChainWhichHasInvalidatedTheTarget on a Target which has not already been contradicted.");

	var startingTargetRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);

	var positionChainWichContradicts = "";

	// The call to Contradictions.isTargetContradicted() above ensures that this array exists.
	for(var i=0; i<startingTargetRef.contradictions.length; i++){

		var loopPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(contradictionPositionChain, i);

		// If an underlying Contradiction is not Contradicted itself then it is the culprit.
		if(!HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, loopPositionChain)){

			// Don't gang up on the defeated.
			if(positionChainWichContradicts)
				throw new Error("Error in Contradictions.getContradictionPositionChainWhichHasInvalidatedTheTarget. There are multiple contradictions against a single target.");

			positionChainWichContradicts = loopPositionChain;
		}
	}

	return positionChainWichContradicts;
};

// If contradictionPositionChain is empty then it means that a dialog is being targeted rather than one of its underlying contradictions.
Contradictions.isTargetContradicted = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.isTargetContradicted. It is not possible to get a contradicted status at the domain root.");

	var startingTargetRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);

	// Kick start the recursion with a reference to the "dialog" object.
	// It has the same relevant shape as contradiction objects.
	return checkIfContradictedRecursive(startingTargetRef);

	function checkIfContradictedRecursive(contradictionRef){

		// The "contradicted" property does not persist to the server but it may exist within the global state for caching purposes.
		if(typeof contradictionRef.contradicted !== "undefined"){

			if(typeof contradictionRef.contradicted !== "boolean")
				throw new Error("Error in Contradictions.isTargetContradicted. If the 'contradicted' property exists it must be of type boolean.");

			return contradictionRef.contradicted;
		}

		// Truth by default.
		if(!contradictionRef.contradictions)
			return false;

		for(var i=0; i<contradictionRef.contradictions.length; i++){

			// It only takes 1 voice to stop a rocket launch.
			if(!checkIfContradictedRecursive(contradictionRef.contradictions[i]))
				return true;
		}

		// This method cannot return FALSE until after verifying that all children are free of contradictions.
		return false;
	}
};

// Pass in a reference to the global state object and this method will return a pointer to the contradiction-sub-array defined by the combination of dialogPositionChain and contradictionPositionChain strings.
// The arguments dialogPositionChain and  contradictionPositionChain cannot be empty.  
Contradictions.getContradictionPositionReference = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.getContradictionPositionReference. The dialogPositionChain cannot point to the domain root within this method call.");

	if(!contradictionPositionChain)
		throw new Error("Error in Contradictions.getContradictionPositionReference. The contradictionPositionChain cannot be empty within this method call.");

	var contradictionPositionArr = contradictionPositionChain.split(",");

	var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	var loopPosition;
	while(loopPosition = contradictionPositionArr.shift()){

		if(!subArrayRef.contradictions || !Array.isArray(subArrayRef.contradictions))
			throw new Error("Error in Contradictions.getContradictionPositionReference. There was not a contradictions array at this level: " + positionArr.join(','));

		if(!subArrayRef.contradictions[loopPosition])
			throw new Error("Error in Contradictions.getContradictionPositionReference. The position is invalid: " + positionArr.join(','));

		subArrayRef = subArrayRef.contradictions[loopPosition];
	}

	if(typeof subArrayRef.cant !== 'string')
		throw new Error("Error in Contradictions.getContradictionPositionReference. Could not find a 'cant' property (in string format) at the at the given position.");

	if(typeof subArrayRef.because !== 'string')
		throw new Error("Error in Contradictions.getContradictionPositionReference. Could not find a 'because' property (in string format) at the at the given position.");

	return subArrayRef;
};

// If a new contradiction is added this method can be called to recalculate the "contradiction status" of the target and all of its ancestors.
// If contradictionPositionChain is empty then this method will only calculate the "contradiction status" of the given dialog position.
// This method returns a copy of the given global state.
Contradictions.reCacheContradictionStatusesOfAncestorChain = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.cacheContradictionStatusesOfAncestorChain. The dialogPositionChain cannot point to the domain root within this method call.");

	var globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	var loopContradictionPositionChain = contradictionPositionChain;

	// Start looping backwards from the target position back to the dialog because the deepest position has an effect on the ancestors.
	while(true){

		var loopTargetRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, domainName, dialogPositionChain, loopContradictionPositionChain);

		// Delete the existing property so that the following method call does not return its value.
		if(typeof loopTargetRef.contradicted !== "undefined")
			delete loopTargetRef.contradicted;

		loopTargetRef.contradicted = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, loopContradictionPositionChain);

		if(!loopContradictionPositionChain)
			break;

		loopContradictionPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(loopContradictionPositionChain);
	}

	return globalStateObj;
};

// This goes further than Contradictions.cacheContradictionStatusesOfTargetAndContradictionDecendantsByReference().
// It also spiders the "dialogs" recursively and caches their "contradiction statues".
Contradictions.cacheContradictionStatusesOfDialogDecendantsAndContradictions = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	var globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	cacheDialogsContradictionStatusesRecursive(dialogPositionChain);

	return globalStateObj;

	function cacheDialogsContradictionStatusesRecursive(recurseDialogPositionChain){

		HIPI.lib.Contradictions.cacheContradictionStatusesOfTargetAndContradictionDecendantsByReference(globalStateObj, domainName, recurseDialogPositionChain, "");

		var childDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, true, false);

		for(var i=0; i<childDialogPositionChainsArr.length; i++)
			cacheDialogsContradictionStatusesRecursive(childDialogPositionChainsArr[i]);
	}
};

// Takes a reference/pointer to the global state.  
// Because this is called with recursion over all messages and symbolic links in the database it would be too much work to return a copy of the Global State. 
// This method sets  the "contradiction status" on the target and all Contradiction descendants (i.e. it can start from either a Dialog or a Contradiction). 
// This will not calculate a "contradicted status" on nodes which already have the "contradicted" attribute defined.
// If the target itself or any descendant has its "contradiction status" cached the method will not dig any deeper because it is assumed that they are also cached.
// This will not recursively spider "dialogs" because they have no effect on the "contradicted" value.
Contradictions.cacheContradictionStatusesOfTargetAndContradictionDecendantsByReference = function (globalStateObjRef, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObjRef);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.cacheContradictionStatusesOfTargetAndContradictionDecendantsByReference. The dialogPositionChain cannot point to the domain root within this method call.");

	var startingTargetRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObjRef, domainName, dialogPositionChain, contradictionPositionChain);

	// Kick start the recursion with a reference to the "dialog" object.
	// It has the same relevant shape as contradiction objects.
	setContradictedStatusRecursive(startingTargetRef);

	// This sets properties by reference and returns a Boolean value.
	function setContradictedStatusRecursive(contradictionRef){

		if(typeof contradictionRef.contradicted !== "undefined"){

			if(typeof contradictionRef.contradicted !== "boolean")
				throw new Error("Error in Contradictions.cacheContradictionStatusesOfTargetAndContradictionDecendantsByReference. If the 'contradicted' property exists it must be of type boolean.");

			return contradictionRef.contradicted;
		}

		// Truth by default.
		if(!contradictionRef.contradictions){

			contradictionRef.contradicted = false;

			return false;
		}

		for(var i=0; i<contradictionRef.contradictions.length; i++){

			// It only takes 1 contradiction (in a state of TRUE or "NOT contradicted") to invalidate its target, but thankfully as powerful as a contradiction might be it is equally vulnerable.
			if(!setContradictedStatusRecursive(contradictionRef.contradictions[i])){

				contradictionRef.contradicted = true;

				return true;
			}
		}

		// It's only TRUE if all child contradictions are FALSE.
		contradictionRef.contradicted = false;

		return false;
	}
};

Contradictions.hideSiblingContradictionWindows = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.hideSiblingContradictionWindows. The dialogPositionChain cannot point to the domain root within this method call.");

	if(!contradictionPositionChain)
		throw new Error("Error in Contradictions.hideSiblingContradictionWindows. The contradictionPositionChain must point to a specific contradiction within this method call.");

	var parentContradictionPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(contradictionPositionChain);

	var parentArrayRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, domainName, dialogPositionChain, parentContradictionPositionChain);

	if(!parentArrayRef.contradictions || !parentArrayRef.contradictions.length)
		throw new Error("Error in Contradictions.hideSiblingContradictionWindows. The parent reference doesn't have a contradictions array.");

	for(var i=0; i<parentArrayRef.contradictions.length; i++){

		var loopContradictionPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(parentContradictionPositionChain, i);

		// Only hide the siblings.
		if(loopContradictionPositionChain === contradictionPositionChain)
			continue;

		var loopContradictionRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, domainName, dialogPositionChain, loopContradictionPositionChain);

		loopContradictionRef.showContradictWindow = false;
	}

	return globalStateObj;
};

// This will return an array of Objects which start from the Dialog itself and work up to the given Contradiction representing the Contradiction statuses of each level.
// For example, if the contradictionPositionChain is given as "28,14,7" this method would return an array such as ...
// [
//    { domain:"My Domain", dialogPositionChain:"1,2,3,4", contradictionPositionChain:"", isContradicted:true },
//    { domain:"My Domain", dialogPositionChain:"1,2,3,4", contradictionPositionChain:"28", isContradicted:false },
//    { domain:"My Domain", dialogPositionChain:"1,2,3,4", contradictionPositionChain:"28,14", isContradicted:true },
//    { domain:"My Domain", dialogPositionChain:"1,2,3,4", contradictionPositionChain:"28,14,7", isContradicted:false }
// ]
Contradictions.getContradictionStatusesOfAncestors = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.getContradictionStatusesOfAncestors. The dialogPositionChain cannot point to the domain root within this method call.");

	var retArr = [];

	// Start out with the contradiction status on the underlying Dialog.
	retArr.push({
					domain: domainName, 
					dialogPositionChain: dialogPositionChain,
					contradictionPositionChain: "",
					isContradicted: HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, "")
				});

	// Walk forward from the Dialog on each Contradiction level until reaching the given contradictionPositionChain. 
	var contradictionAncestorArr = HIPI.framework.Utilities.getAncestorArrayFromCommaSeparatedIntegers(contradictionPositionChain);

	contradictionAncestorArr.forEach(function(loopContradictionPositionChain){

		retArr.push({
						domain: domainName, 
						dialogPositionChain: dialogPositionChain,
						contradictionPositionChain: loopContradictionPositionChain,
						isContradicted: HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, loopContradictionPositionChain)
					});
	});

	return retArr;
};

// With a target having a Contradicted status of isContradicted=FALSE it means that all dialog lines are in play, this method simply returns the count of the longest/deepest contradiction path.
// If the given target has a Contradicted status of isContradicted=TRUE it means that there is only one valid Contradiction affecting it because the system does not permit "ganging up" on a target.
// Every pathway on the other side of the single child Contradiction must necessarily be "in play" because the underlying child Contradiction has itself a status of isContradicted=FALSE. 
// In such a case this method will return the count of the longest/deepest contradiction path which exists on the other side of the child Contradiction (+ 1 for counting the child Contradiction).
// The target itself is not included in the count so if it has a Contradiction status of isContradicted=FALSE without any contradictions beneath it (truth by default), this method would return a count of 0.
Contradictions.getDeepestContradictionExchangeCount = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in Contradictions.getDeepestContradictionExchangeCount. The dialogPositionChain cannot point to the domain root within this method call.");

	var isTargetContradicted = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);

	if(isTargetContradicted){

		var childContradictionPositionChain = HIPI.lib.Contradictions.getContradictionPositionChainWhichHasInvalidatedTheTarget(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);

		// Add one for the child Contradiction sitting in front of the tree.
		return getDeepestExchange(childContradictionPositionChain) + 1;
	}
	else{
		return getDeepestExchange(contradictionPositionChain);
	}

	function getDeepestExchange(recurseContradictionPositionChain){

		var recurseTargetRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, domainName, dialogPositionChain, recurseContradictionPositionChain);

		if(!recurseTargetRef.contradictions)
			return 0;

		var maxDepth = 0;

		for(var i=0; i<recurseTargetRef.contradictions.length; i++){

			var loopRecurseContradictionPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(recurseContradictionPositionChain, i);

			// Add 1 for the transition of hierarchy.
			var loopRecurseDepth = getDeepestExchange(loopRecurseContradictionPositionChain) + 1;

			if(loopRecurseDepth > maxDepth)
				maxDepth = loopRecurseDepth;
		}

		return maxDepth;
	}
};

// This method doesn't take a domainName because the auto-completions are derived from CANT's and Contradictions are global in nature.
// Returns an array of all CANT strings in the database sorted by the priority established in Contradictions.getFlatArrayOfAllContradictions.
// Should CANTS from "contradicted" statuses be used?  The system should help users auto-complete things which CAN be said.
// However, just because something is currently contradicted doesn't mean that it is "right".
// Establishing an auto-complete (index) in the body, from a CANT, may provide help to someone who needs it (in reverse) or there may be a valuable underlying "suggested contradiction".
Contradictions.getCantStringsForAutoComplete = function (globalStateObj) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);

	// Make sure to avoid duplicate strings (in lowercase), but return the array in original case.
	var allCantStringsArr = [];
	var allCantStringsLowerCase = [];

	var flatContradictionsArr = HIPI.lib.Contradictions.getFlatArrayOfAllContradictions(globalStateObj);

	flatContradictionsArr.forEach(function(loopContradictionObj){

		var cantLowerCase = loopContradictionObj.cant.toLowerCase();

		if(allCantStringsLowerCase.indexOf(cantLowerCase) === -1){

			allCantStringsArr.push(loopContradictionObj.cant);

			allCantStringsLowerCase.push(cantLowerCase);
		}
	});

	return allCantStringsArr;
};

// Returns TRUE if the dialog position is ODD (opposite to a Dialog).
// Contradictions begin as offensive and alternate thereafter.
Contradictions.isContradictionLevelSkeptical = function (contradictionPositionChain) {

	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	var positionChainArr = HIPI.framework.Utilities.getArrayOfIntegersFromCommaSeparatedChain(contradictionPositionChain);

	return (positionChainArr.length % 2 === 0) ? true : false;
};

// This method will return all Contradictions in the database (across all domains) in a single dimensional array.
// The array will be sorted with the following priority.
//   1) Un-contradicted statuses
//   2) Longest CANT string length (un-contradicted).
//   3) Contradicted statuses
//   4) Longest CANT string length (contradicted).
// Each element in the array has a shape of...
// {
//    cant: "The can't string",
//    because: "The because string",
//    cantStrLen: 16,
//    domain: "DomainName",
//    dialogPositionChain: "1,2,3,4",
//    contradictionPositionChain: "5,4,3,2",
//    isContradicted: TRUE/FALSE
// }
Contradictions.getFlatArrayOfAllContradictions = function (globalStateObj) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);

	// A "closure" variable available to all inner functions.
	var globalContradictionArr = [];

	globalStateObj.domains.forEach(function(loopDomainObj){
		collectDialogDataRecursive(loopDomainObj.domainName, "");
	});

	// Un-contradicted statuses have a higher priority over string length.
	// The JavaScript sort algorithm is not "stable" so calling Array.sort() twice (once for the contradicted and the other for string length) won't work.
	// First separate the "contradicted" entries from the "un-contradicted" and sort them by string length separately.
	var contradictionArrUnContradicted = globalContradictionArr.filter(function(testObj){
		return !testObj.isContradicted
	});

	var contradictionArrContradicted = globalContradictionArr.filter(function(testObj){
		return testObj.isContradicted
	});

	contradictionArrUnContradicted.sort(function(a, b){
		return b.cantStrLen - a.cantStrLen;
	});

	contradictionArrContradicted.sort(function(a, b){
		return b.cantStrLen - a.cantStrLen;
	});

	// Glue the Contradicted and Un-contradicted collections back together.
	var retArr = [];

	contradictionArrUnContradicted.forEach(function(loopContradictionObj){
		retArr.push(loopContradictionObj);
	});

	contradictionArrContradicted.forEach(function(loopContradictionObj){
		retArr.push(loopContradictionObj);
	});

	return retArr;

	function collectDialogDataRecursive(domainName, dialogPositionChain){

		// Get all Dialogs (even contradicted ones), but don't follow Symbolic Links.
		var childDialogPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, dialogPositionChain, true, false);

		childDialogPositionChainsArr.forEach(function(loopChildDialogPositionChain){
			collectDialogDataRecursive(domainName, loopChildDialogPositionChain);
		});

		// There's no point in checking for contradictions on the domain root.
		if(dialogPositionChain)
			collectContradictionDataRecursive(domainName, dialogPositionChain, "");
	}

	function collectContradictionDataRecursive(domainName, dialogPositionChain, contradictionPositionChain){

		var contradictionRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);

		// If this inner function is called without a contradictionPositionChain then the reference above will point to a dialog, not a contradiction.
		if(contradictionPositionChain){

			var recurseCantEntryObj = {};

			recurseCantEntryObj.cant = contradictionRef.cant;
			recurseCantEntryObj.because = contradictionRef.because;
			recurseCantEntryObj.cantStrLen = contradictionRef.cant.length;
			recurseCantEntryObj.isContradicted = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);
			recurseCantEntryObj.domain = domainName;
			recurseCantEntryObj.dialogPositionChain = dialogPositionChain;
			recurseCantEntryObj.contradictionPositionChain = contradictionPositionChain;

			globalContradictionArr.push(recurseCantEntryObj);
		}

		// The .contradictions property is optional.
		if(!contradictionRef.contradictions)
			return;

		if(!Array.isArray(contradictionRef.contradictions))
			throw new Error("Error in Contradictions.getFlatArrayOfAllContradictions. This level contains a contradictions property which is not an array. domain: " + domainName + " dialogPositionChain: " + dialogPositionChain + " contradictionPositionChain: " + contradictionPositionChain);

		for(var i=0; i<contradictionRef.contradictions.length; i++){

			var loopContradictionPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(contradictionPositionChain, i);

			collectContradictionDataRecursive(domainName, dialogPositionChain, loopContradictionPositionChain);
		}
	}
};

// This method will return a Dialog Linking Array, concatenated with a separator (Constants.getDialogAndContradictionPositionChainArraySeparator()), followed by alternating "CANT", "CUZ" entries until the destination is reached.
// EX: ["Base Belief", "Question", "Answer", "«»", "Answer", "That's not an answer"]
// This can be used to identify records in a "relative database" free of unique ID's. 
Contradictions.getLinkingArrayFromContradictionPositionChain = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!contradictionPositionChain)
		throw new Error("Error in Contradictions.getLinkingArrayFromContradictionPositionChain. If there isn't a contradictionPositionChain then call the method Dialogs.getLinkingArrayFromDialogPositionChain instead.");

	var contradictionLinkingArr = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(globalStateObj, domainName, dialogPositionChain);

	if(!contradictionLinkingArr.length)
		throw new Error("Error in Contradictions.getLinkingArrayFromContradictionPositionChain. The Dialog Linking Array cannot be empty.");

	// Add a separator between the Dialog and Contradictions.
	contradictionLinkingArr.push(HIPI.framework.Constants.getDialogAndContradictionPositionChainArraySeparator());

	// Walk forward from the Dialog on each Contradiction level until reaching the given contradictionPositionChain. 
	var contradictionAncestorArr = HIPI.framework.Utilities.getAncestorArrayFromCommaSeparatedIntegers(contradictionPositionChain);

	contradictionAncestorArr.forEach(function(loopContradictionPositionChain){

		var loopContradictionRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, domainName, dialogPositionChain, loopContradictionPositionChain);

		contradictionLinkingArr.push(loopContradictionRef.cant);
		contradictionLinkingArr.push(loopContradictionRef.because);

	});

	return contradictionLinkingArr;
};

// Returns an object with 2 keys since a Contradiction is doubly addressed.
// { dialogPositionChain: 1,2,3, contradictionPositionChain: 4,3,2 }
Contradictions.getDialogAndContradictionPositionChainsFromLinkingArray = function (globalStateObj, domainName, linkingArr) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeArray(linkingArr);

	// Split the linking array into 2 halves, before and after the separator.
	var dialogLinkingArr = [];
	var contradictionLinkingArr = [];

	var foundLinkingSeparator = false;

	linkingArr.forEach(function(loopLinkElement){

		if(loopLinkElement === HIPI.framework.Constants.getDialogAndContradictionPositionChainArraySeparator()){

			foundLinkingSeparator = true;

			return;
		}

		if(foundLinkingSeparator)
			contradictionLinkingArr.push(loopLinkElement);
		else
			dialogLinkingArr.push(loopLinkElement);
	});

	if(!contradictionLinkingArr.length % 2 !== 0)
		throw new Error("Error in Contradictions.getContradictionPositionChainFromLinkingArray. The Contradiction Linking Array must have an even number of elements.");

	var dialogPositionChainFromLinkingArr = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, domainName, dialogLinkingArr);

	var dialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChainFromLinkingArr);

	// Build up this string via a "closure" through the recursive function.
	var contradictionPositionChainFromLinkingArr = "";

	// The Dialog reference has a similar shape to a Contradiction, they may both have a "contradictions" key.
	recurseBuildContradictionPositionChain(dialogRef);

	return { "dialogPositionChain": dialogPositionChainFromLinkingArr, "contradictionPositionChain": contradictionPositionChainFromLinkingArr };

	function recurseBuildContradictionPositionChain(contradictionRef){

		if(!contradictionRef.contradictions)
			throw new Error("Error in Contradictions.getContradictionPositionChainFromLinkingArray. The Reference does not have a contradictions property.");

		var loopCant = contradictionLinkingArr.shift();
		var loopCuz = contradictionLinkingArr.shift();

		var foundMatch = false;

		for(var i=0; i<contradictionRef.contradictions.length; i++){

			if(contradictionRef.contradictions[i].cant === loopCant && contradictionRef.contradictions[i].because === loopCuz){

				foundMatch = true;

				contradictionPositionChainFromLinkingArr = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(contradictionPositionChainFromLinkingArr, i);

				if(contradictionLinkingArr.length)
					recurseBuildContradictionPositionChain(contradictionRef.contradictions[i]);

				break;
			}
		}

		if(!foundMatch)
			throw new Error("Error in Contradictions.getContradictionPositionChainFromLinkingArray. Could not find a match at the current level.");
	}
};
