"use strict";

var General = {};

// This will either retrieve a pointer to a Contradiction or a Dialog depending on whether or not the contradictionPositionChain is empty.
General.getDialogOrContradictionReference = function (globalStateObj, domainName, dialogPositionChain, contradictionPositionChain) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(!dialogPositionChain)
		throw new Error("Error in General.getDialogOrContradictionReference. The dialogPositionChain cannot point to the domain root within this method call.");

	if(contradictionPositionChain)
		var targetReference = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, domainName, dialogPositionChain, contradictionPositionChain);
	else
		var targetReference = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

	return targetReference;
};

General.getReferenceToDomainRoot = function(globalStateObj, domainName){

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);

	for(var i=0; i<globalStateObj.domains.length; i++){

		if(globalStateObj.domains[i].domainName === domainName)
			return globalStateObj.domains[i];
	}

	throw new Error("Error in General.getReferenceToDomainRoot. Cannot find a matching domain name: " + domainName);
};

General.getHumanReadableLinkingArrayDescription = function(linkingArr){

	HIPI.framework.Utilities.ensureTypeArray(linkingArr);

	// Copy the array because the call to .pop() below can modify the calling code by reference.
	linkingArr = HIPI.framework.Utilities.copyArray(linkingArr);

	var retStr = "";

	var contradictionSeparatorEncountered = false;
	var isLoopOnCantVersusCuz = true;

	linkingArr.forEach(function(loopLinkEntry){

		if(loopLinkEntry === HIPI.framework.Constants.getDialogAndContradictionPositionChainArraySeparator()){

			contradictionSeparatorEncountered = true;

			return;
		}

		// In case a 2D array is encountered it means that the current entry is itself a linking array.
		// For the purpose of creating anchor text only the last entry is interesting, it contains an excerpt of the Dialog Message.
		if(Array.isArray(loopLinkEntry))
			var loopDesc = loopLinkEntry.pop();
		else
			var loopDesc = loopLinkEntry;

		// A way to add commas between array elements without having to do a "chop" routine after looping.
		if(retStr){

			// Don't separate the CANT from the CUZ.
			if(!contradictionSeparatorEncountered || isLoopOnCantVersusCuz)
				retStr += "\n | ";
			else
				retStr += " ";
		}

		if(contradictionSeparatorEncountered)
			retStr += isLoopOnCantVersusCuz ? "(CANT) \n" : "\n(CUZ) \n";

		if(typeof loopDesc !== "string")
			throw new Error("Error in General.getHumanReadableLinkingArrayDescription. The link element is not of type string: ", linkingArr);

		// Don't add "..." or truncate unless the link has occupied the full width.
		// The CANT or CUZ strings can exceed the Max Index length because they are identified verbatim by the Linking Arrays.
		if(loopDesc.length >= HIPI.framework.Constants.getMaxCharacterExcerptForLinking())
			loopDesc = HIPI.framework.Utilities.truncateBackToFirstSpace(loopDesc, HIPI.framework.Constants.getMaxCharacterExcerptForLinking(), 12) + "...";

		retStr += loopDesc;

		// Every entry after the Contradiction separator alternates between a CANT and CUZ.
		if(contradictionSeparatorEncountered)
			isLoopOnCantVersusCuz = !isLoopOnCantVersusCuz;
	}); 

	return retStr;
};

General.ensureValidMainTabName = function(mainTabName){

	HIPI.framework.Utilities.ensureTypeString(mainTabName);

	if(["dialogs", "map", "contributions"].indexOf(mainTabName) === -1)
		throw new Error("Error in General.ensureValidMainTabName. The tabName is invalid: " + mainTabName);
};

General.areLinkingArraysEqual = function(linkingArr1, linkingArr2){

	HIPI.framework.Utilities.ensureTypeArray(linkingArr1);
	HIPI.framework.Utilities.ensureTypeArray(linkingArr2);

	if(linkingArr1.length !== linkingArr2.length)
		return false;

	for(var i=0; i<linkingArr1.length; i++){

		if(typeof linkingArr1[i] === "string"){

			if(typeof linkingArr2[i] !== "string" && !Array.isArray(linkingArr2[i]))
				throw new Error("Error in General.areLinkingArraysEqual. One of the elements in the first dimension is neither a string or an array. (second linking array)");

			if(linkingArr1[i] !== linkingArr2[i])
				return false;
		}
		else if(Array.isArray(linkingArr1[i])){

			if(typeof linkingArr2[i] === "string")
				return false;

			HIPI.framework.Utilities.ensureTypeArray(linkingArr2[i]);

			if(linkingArr1[i].length !== linkingArr2[i].length)
				return false;

			for(var x=0; x<linkingArr1[i].length; x++){

				if(typeof linkingArr1[i][x] !== "string" || typeof linkingArr2[i][x] !== "string")
					throw new Error("Error in General.areLinkingArraysEqual. One of the elements in the second dimension is not of type string. There cannot be more than 2 dimensions in a linking array.")

				if(linkingArr1[i][x] !== linkingArr2[i][x])
					return false;
			}
		}
		else{
			throw new Error("Error in General.areLinkingArraysEqual. One of the elements in the first dimension is neither a string or an array. (first linking array)");
		}
	}

	if(JSON.stringify(linkingArr1) !== JSON.stringify(linkingArr2))
		throw new Error("The 2 linking arrays should be equal but their JSON representations do not match.");

	return true;
};

// Returns a Boolean flag indicating if the user has chosen to view Contradicted messages.
General.userSettingsShowContradictedEntries = function(globalStateObj){

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);

	if(!globalStateObj.privateState)
		throw new Error("Error in General.userSettingsShowContradictedEntries. Could not find a 'privateState' key on the globalStateObj. This object contains user settings.");

	if(!globalStateObj.privateState.userSettings)
		globalStateObj.privateState.userSettings = {};

	return globalStateObj.privateState.userSettings.showContradictedEntries ? true : false;
};

// Returns a Boolean flag indicating if the user has chosen to display Edit Buttons on messages.
General.userSettingsShowEditButtons = function(globalStateObj){

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);

	if(!globalStateObj.privateState)
		throw new Error("Error in General.userSettingsShowEditButtons. Could not find a 'privateState' key on the globalStateObj. This object contains user settings.");

	if(!globalStateObj.privateState.userSettings)
		globalStateObj.privateState.userSettings = {};

	return globalStateObj.privateState.userSettings.showEditButtons ? true : false;
};

General.filterDialogPositionChainsByUserSettings = function(globalStateObj, domainName, dialogPositionChainArr){

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeArray(dialogPositionChainArr);

	// Possibly filter out the Contradicted entries depending on the user's settings.
	if(!HIPI.lib.General.userSettingsShowContradictedEntries(globalStateObj)){

		dialogPositionChainArr = dialogPositionChainArr.filter(function(loopDialogPositionChain, loopIndex){

			var loopDialogSubArr = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, loopDialogPositionChain);

			// Never hide a Contradicted message if it is "selected".
			// If a user clicks on a "dialog link" (such as from My Contributions) they should be able to view the target, even if it is contradicted and their settings say to hide. 
			if(loopDialogSubArr.selected)
				return true;

			return !HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, domainName, loopDialogPositionChain, "");
		});
	}

	return dialogPositionChainArr;
};

General.animateRemovalOfDialogStackFromDom = function(componentInstanceElementIdOfLowestDialogWindow){

	// This says when a window should start animating, which may be quicker than the animation itself.
	var millisecondDelayBetweenWindows = 100;

	// Keep the animation duration defined in JavaScript instead of the style-sheet to avoid hooking into CSS3 events like "TransitionEnd";
	var cssAnimationDuration = 500;

	return new Promise(function(resolve, reject){

		var childDialogWindowsArr = document.getElementById(componentInstanceElementIdOfLowestDialogWindow).querySelectorAll(".dialog-window");

		// Don't wait for the final animation if there aren't any child windows to close. 
		if(!childDialogWindowsArr.length){
			resolve();
			return;
		}

		var childDialogWindowObjects = [];

		for(var i=0; i<childDialogWindowsArr.length; i++){

			var childWindowObj = [];

			childWindowObj.height = parseInt(childDialogWindowsArr[i].getAttribute("dialog-height"));
			childWindowObj.element = childDialogWindowsArr[i];

			childDialogWindowObjects.push(childWindowObj);
		}

		childDialogWindowObjects.sort(function(a, b){
			return b.height - a.height;
		});

		childDialogWindowObjects.forEach(function(childWindowObj, index){

			setTimeout(function(){

				childWindowObj.element.className += " dialog-window-animate-close";
				childWindowObj.element.style.animationDuration = cssAnimationDuration + "ms";
			}, 
			(index * millisecondDelayBetweenWindows));

			// When the CSS animation completes make sure to hide the DIV.
			// Otherwise there is a cascading effect of "height offsets" on a large stack of hierarchically arranged windows which can cause unnecessary vertical scrollbars.
			setTimeout(function(){

				childWindowObj.element.style.display = "none";

			}, ((index +1) * cssAnimationDuration));
		});

		setTimeout(function(){

			resolve();
		}, 
		(childDialogWindowObjects.length * millisecondDelayBetweenWindows + cssAnimationDuration));
	});
};

// This method will return the "linkingArrSource" if a match cannot be found.
// The "linkingArrToReplace" will only be replaced if a match is found with "linkingArrToSearch" at the start of the "linkingArrSource".
// EX:
// 	 linkingArrSource:     ["hello", "there", "how", "are", "you"]
// 	 linkingArrToSearch:   ["hello", "there"]
// 	 linkingArrToReplace:  ["hello", "everyone"]
//   returns:              ["hello", "everyone", "how", "are", "you"]
//
// This example does not produce a match because the search array must be found at the beginning.
// 	 linkingArrSource:     ["hello", "there", "how", "are", "you"]
// 	 linkingArrToSearch:   ["there", "how"]
//
// If "includeSecondDimensionFlag" is set to TRUE this method will also search every single link array element for a second dimension and perform replacements there as well.
// EX:
// 	 linkingArrSource:     ["first", "dimension", ["second", "dimension", "array"]]
// 	 linkingArrToSearch:   ["second", "dimension"]
// 	 linkingArrToReplace:  ["second", "link"]
//   returns:              ["first", "dimension", ["second", "link", "array"]]
General.replaceLinkingArrayPrefix = function(linkingArrSource, linkingArrToSearch, linkingArrToReplace, includeSecondDimensionFlag){

	HIPI.framework.Utilities.ensureTypeArray(linkingArrSource);
	HIPI.framework.Utilities.ensureTypeArray(linkingArrToSearch);
	HIPI.framework.Utilities.ensureTypeArray(linkingArrToReplace);
	HIPI.framework.Utilities.ensureTypeBoolean(includeSecondDimensionFlag);

	linkingArrSource = HIPI.framework.Utilities.copyArray(linkingArrSource);

	linkingArrToSearch.forEach(function(searchElement){

		if(typeof searchElement !== "string")
			throw new Error("Error in General.replaceLinkingArrayPrefix: The search array may not contain multiple dimensions.");
	});

	linkingArrToReplace.forEach(function(searchElement){

		if(typeof searchElement !== "string")
			throw new Error("Error in General.replaceLinkingArrayPrefix: The replace array may not contain multiple dimensions.");
	});

	if(!linkingArrToReplace.length || !linkingArrToSearch.length)
		throw new Error("Error in General.replaceLinkingArrayPrefix: The search and replace array may not be empty.");

	linkingArrSource = replaceLinkArrayOneDimension(linkingArrSource, linkingArrToSearch, linkingArrToReplace);

	// If this flag is set to TRUE then perform a search/replace whenever a link element contains a second dimensional linking array.
	if(includeSecondDimensionFlag){

		for(var i=0; i<linkingArrSource.length; i++){

			if(Array.isArray(linkingArrSource[i]))
				linkingArrSource[i] = replaceLinkArrayOneDimension(linkingArrSource[i], linkingArrToSearch, linkingArrToReplace);
		}
	}

	return linkingArrSource;

	function replaceLinkArrayOneDimension(lnkArrSrc, lnkArrSearch, lnkArrRepl){

		lnkArrSrc = HIPI.framework.Utilities.copyArray(lnkArrSrc);

		var isFound = true;

		lnkArrSearch.forEach(function(searchElement, searchIndex){

			// Save cycles
			if(!isFound)
				return;

			if(searchIndex > lnkArrSrc.length -1){

				isFound = false;
				
				return;
			}

			if(lnkArrSrc[searchIndex] !== searchElement)
				isFound = false;
		});

		if(!isFound)
			return lnkArrSrc;

		// Delete the number of matching elements out of the source.
		lnkArrSrc.splice(0, lnkArrSearch.length);

		// Glue the rest of the source linking array onto the end of the replacement linking array.
		return lnkArrRepl.concat(lnkArrSrc);
	}
};

// Returns TRUE if the second linking array is found at the start of the first.
// Pass in a 3rd argument of TRUE to widen the search into the second dimension.
General.doesLinkingArrayContainSearchLinkingArrayInPrefix = function(linkingArrSource, linkingArrToSearch, includeSecondDimensionFlag){

	HIPI.framework.Utilities.ensureTypeArray(linkingArrSource);
	HIPI.framework.Utilities.ensureTypeArray(linkingArrToSearch);
	HIPI.framework.Utilities.ensureTypeBoolean(includeSecondDimensionFlag);

	linkingArrSource = HIPI.framework.Utilities.copyArray(linkingArrSource);

	// Make up some gibberish for a "replacement array" as a way to piggyback off of the replacement method General.replaceLinkingArrayPrefix().
	var junkReplacementArray = ["just", "a", "bunch", "of", "nonsense", "here"];

	var sourceLinkingArrayAfterReplacment = HIPI.lib.General.replaceLinkingArrayPrefix(linkingArrSource, linkingArrToSearch, junkReplacementArray, includeSecondDimensionFlag);

	// This performs quicker than stringify, but is not guaranteed.
	if(linkingArrSource.length !== sourceLinkingArrayAfterReplacment.length)
		return false;

	return JSON.stringify(linkingArrSource) === JSON.stringify(sourceLinkingArrayAfterReplacment);
};
