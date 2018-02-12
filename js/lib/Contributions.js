"use strict";

var Contributions = {};

// Returns a copy of the Global State and ensures that an entry exists for the given domainName.
// If not, this method will add a new object to the "domains" array on the "Private State".
// The shape of the object contains a Domain Name identifier next to 2 other sub-arrays, one containing an array of Dialog Message Linking Arrays, and the other containing an array of Contradiction Linking Arrays.
Contributions.ensureDomainIsInitializedOnPrivateState = function (globalStateObj, domainName) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);

	globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

	if(!globalStateObj.privateState)
		throw new Error("Error in method Contributions.ensureDomainIsInitializedOnPrivateState. Cannot find a privateState property on the global state.");

	if(!globalStateObj.privateState.domains)
		globalStateObj.privateState.domains = [];

	var matchingDomainArr = globalStateObj.privateState.domains.filter(
			function(loopDomainObj){ 
				return loopDomainObj.domainName === domainName;
			}
		);

	if(!matchingDomainArr.length)
		globalStateObj.privateState.domains.push({"domainName":domainName, "myMessages": [], "myContradictions": [] });

	return globalStateObj;
};

Contributions.addMessageRecord = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	globalStateObj = HIPI.lib.Contributions.ensureDomainIsInitializedOnPrivateState(globalStateObj, domainName);

	for(var i=0; i<globalStateObj.privateState.domains.length; i++){

		if(globalStateObj.privateState.domains[i].domainName !== domainName)
			continue;

		var newMessageRecord = {};
		newMessageRecord.date = Date.now();
		newMessageRecord.link = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(globalStateObj, domainName, dialogPositionChain);

		globalStateObj.privateState.domains[i].myMessages.push(newMessageRecord);
	}

	return globalStateObj;
};

Contributions.addContradictionRecord = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	globalStateObj = HIPI.lib.Contributions.ensureDomainIsInitializedOnPrivateState(globalStateObj, domainName);

	for(var i=0; i<globalStateObj.privateState.domains.length; i++){

		if(globalStateObj.privateState.domains[i].domainName !== domainName)
			continue;

		var newContradictionRecord = {};
		newContradictionRecord.date = Date.now();
		newContradictionRecord.link = HIPI.lib.Contradictions.getLinkingArrayFromContradictionPositionChain(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);

		globalStateObj.privateState.domains[i].myContradictions.push(newContradictionRecord);
	}

	return globalStateObj;
};

// Returns TRUE if the current user owns the given dialog message (meaning that the Linking Array is found inside of the user's Contributions). 
Contributions.didCurrentUserCreateDialogMesssage = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	// The user cannot own the a message if there is nothing in the private state.
	if(!globalStateObj.privateState.domains)
		return false;

	var matchingDomainArr = globalStateObj.privateState.domains.filter(
			function(loopDomainObj){ 
				return loopDomainObj.domainName === domainName;
			}
		);

	// If there aren't any Contributions for the user on the given domain then there's no way that they would have created the given Dialog message.
	if(!matchingDomainArr.length)
		return false;

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	// If the given Dialog position comes from a Link then ownership has to be checked on message source.
	if(dialogSubRef.link)
		dialogPositionChain = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, domainName, dialogSubRef.link);

	var targetDialogLinkingArr = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(globalStateObj, domainName, dialogPositionChain);

	var messageFoundInContributions = false;

	for(var i=0; i<globalStateObj.privateState.domains.length; i++){

		if(globalStateObj.privateState.domains[i].domainName !== domainName)
			continue;

		globalStateObj.privateState.domains[i].myMessages.forEach(function(loopContributedMessage){

			if(messageFoundInContributions)
				return;

			if(HIPI.lib.General.areLinkingArraysEqual(loopContributedMessage.link, targetDialogLinkingArr))
				messageFoundInContributions = true;
		});
	}

	return messageFoundInContributions;
};

// Returns TRUE if the current user owns the given Dialog Message and all of its tentacles.
// If someone else has contributed downstream (on a link or not) it signals that someone else has already read the given message.
// It isn't a good idea to be swapping information after an exchange with others because it could have affected their response(s).
// In such a case the user should just contradict the given message add something else in its place.
// Some other reasons that this method could return false.
//  1) If there are any contradictions attached to the given dialog message then this method will return FALSE because if a CANT string is removed it could lead to problems with data integrity.
//  2) If the given Dialog Position has been linked (or linked to) then the user must own all related descendants.
//  3) If any of the linked derivatives of the message contains one or more contradictions.  However, it is OK if a contradiction is attached downstream.
Contributions.canUserEditDialogMesssage = function (globalStateObj, domainName, dialogPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	globalStateObj = HIPI.lib.Contributions.ensureDomainIsInitializedOnPrivateState(globalStateObj, domainName);

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	if(dialogSubRef.contradictions && dialogSubRef.contradictions.length)
		return false;

	var foundNonOwnerDownstream = false;

	checkDialogPositionForNonOwnershipRecursive(dialogPositionChain);

	// If this Dialog is a link then go to the source message and get an array of every Dialog Position which has linked to it (shadow link or not). 
	// Otherwise, find out if it is the source for other links.
	if(dialogSubRef.link){

		var dialogPositionOfLinkSource = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, domainName, dialogSubRef.link);

		var allDialogsPositionsLinkingToSourceArr = HIPI.lib.Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition(globalStateObj, domainName, dialogPositionOfLinkSource);
	}
	else{

		var allDialogsPositionsLinkingToSourceArr = HIPI.lib.Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition(globalStateObj, domainName, dialogPositionChain);
	}

	// Make sure that nobody else has contradicted one of the symbolic-copied-messages (but it is OK is a Contradiction is attached on a child Dialog position).
	// Finally, make sure that the user owns all of the messages beneath the link source.
	for(var i=0; i<allDialogsPositionsLinkingToSourceArr.length; i++){

		var dialogSubRefOfLinkSource = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, allDialogsPositionsLinkingToSourceArr[i]);

		if(dialogSubRefOfLinkSource.contradictions && dialogSubRefOfLinkSource.contradictions.length)
			return false;

		checkDialogPositionForNonOwnershipRecursive(allDialogsPositionsLinkingToSourceArr[i]);
	}

	// If a non-owned Dialog Message is found then it means that the user may NOT edit.
	return !foundNonOwnerDownstream;

	function checkDialogPositionForNonOwnershipRecursive(recurseDialogPositionChain){

		HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(recurseDialogPositionChain);

		if(foundNonOwnerDownstream)
			return;

		if(!HIPI.lib.Contributions.didCurrentUserCreateDialogMesssage(globalStateObj, domainName, recurseDialogPositionChain)){

			var recurseDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, recurseDialogPositionChain);

			// Shadow Links won't show up in the User's Contributions, only Link Heads.
			if(recurseDialogSubRef.link){

				if(HIPI.lib.Dialogs.isDialogPositionTheLinkHead(globalStateObj, domainName, recurseDialogPositionChain))
					foundNonOwnerDownstream = true;
			}
			else{
				foundNonOwnerDownstream = true;
			}
		}
		else{

			// Include contradicted messages in the ownership search.
			var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, domainName, recurseDialogPositionChain, true, false);

			childDialogPositionsArr.forEach(function(loopChildDialogPositionChain){
				checkDialogPositionForNonOwnershipRecursive(loopChildDialogPositionChain);
			});
		}
	}
};
