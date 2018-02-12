"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("newMessageSymbolicLink");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!componentPropertiesObj.dialogPositionChain)
			throw new Error("Error in the <newMessageSymbolicLink> component. Symbolic links can't be made at the Domain Root.");

		if(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain))
			var addMessageButtnStr = "Search for a Supportive Response";
		else
			var addMessageButtnStr = "Search for a Skeptical Response";

		var retHtml = "<form id='form-link-search"+elementIdOfComponentInstanceWrapper+"'>" +
							"<input type='text' class='new-message-symbolic-link-search' id='new-message-symbolic-link-search"+elementIdOfComponentInstanceWrapper+"'></input> "+
								"<button type='submit'>"+addMessageButtnStr+"</button> "+
								"<button type='button' id='btn-cancel-symbolic-link"+elementIdOfComponentInstanceWrapper+"'>Cancel</button>"+
						"</form>" +
						"<div class='symbolic-link-search-results' id='symbolic-link-search-results"+elementIdOfComponentInstanceWrapper+"'>" + 
						"</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		retStateObj.messageObjArr = [];

		// If the given Dialog Position is a link then convert its address to the source message.
		var dialogSubRefFromComponentProps = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		// Link properties always point to the source message.
		if(dialogSubRefFromComponentProps.link)
			var dialogPositionChainOfSourceMessage = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, componentPropertiesObj.domain, dialogSubRefFromComponentProps.link);
		else
			var dialogPositionChainOfSourceMessage = componentPropertiesObj.dialogPositionChain;

		var rootDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, "");

		addDialogsToReturnObjRecursive(rootDialogRef, "");

		return retStateObj;

		function addDialogsToReturnObjRecursive(dialogRef, dialogPos){

			if(dialogRef.dialogs){

				for(var i=0; i<dialogRef.dialogs.length; i++){

					// Skip over messages which have links.
					// Once a link is made there is no way to add a ".message" property beneath it within the hierarchy.
					if(dialogRef.dialogs[i].link)
						continue;

					var loopDialogPosChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(dialogPos, i);

					// Prevent matches on oneself, but continue looking for descendants.
					if(loopDialogPosChain === dialogPositionChainOfSourceMessage){
						addDialogsToReturnObjRecursive(dialogRef.dialogs[i], loopDialogPosChain);
						continue;
					}

					var loopObj = {};
					loopObj.message = dialogRef.dialogs[i].message;
					loopObj.dialogPosChain = loopDialogPosChain;
					loopObj.depth = HIPI.lib.Dialogs.getDialogDepthAtPosition(globalStateObj, componentPropertiesObj.domain, loopDialogPosChain, false, false);
					loopObj.wouldCauseInfiniteLoop = HIPI.lib.Dialogs.isTargetDialogPositionChainDownstreamOfSource(globalStateObj, componentPropertiesObj.domain, loopDialogPosChain, dialogPositionChainOfSourceMessage);

					// There's no point in creating a link to a message which already exists at the same level.
					// The Symbolic Link hasn't been created yet so the Dialog Position represents the parent and therefore this must be one of the children.
					if(dialogPos === dialogPositionChainOfSourceMessage)
						loopObj.isMatchOnSibling = true;
					else
						loopObj.isMatchOnSibling = false;

					// Find out if a link has already been added at this level.
					var parentDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, dialogPositionChainOfSourceMessage);

					var potentialLinkArr = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(globalStateObj, componentPropertiesObj.domain, loopDialogPosChain);

					loopObj.isLinkAlreadyCreated = false;

					parentDialogRef.dialogs.forEach(function(loopChildDialogRef){

						if(loopChildDialogRef.link){

							if(HIPI.lib.General.areLinkingArraysEqual(loopChildDialogRef.link, potentialLinkArr))
								loopObj.isLinkAlreadyCreated = true;
						}
					});

					retStateObj.messageObjArr.push(loopObj);

					addDialogsToReturnObjRecursive(dialogRef.dialogs[i], loopDialogPosChain);
				}
			}
		}
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		document.getElementById("form-link-search"+elementIdOfComponentInstanceWrapper).addEventListener("submit", function(evt){

			evt.preventDefault();

			var searchStr = document.getElementById('new-message-symbolic-link-search'+elementIdOfComponentInstanceWrapper).value;

			searchStr = HIPI.framework.Utilities.trimText(searchStr).toLowerCase();

			if(!searchStr){
				document.getElementById('symbolic-link-search-results'+elementIdOfComponentInstanceWrapper).innerHTML = "";
				return;
			}

			var searchResultsHtml = "";
			var matchingPositionCounter = 0;

			for(var i=0; i<stateSlicesObj.messageObjArr.length; i++){

				if(stateSlicesObj.messageObjArr[i].message.toLowerCase().indexOf(searchStr) > -1){

					var linkWarningClassName = "";
					var buttonDisabled = "";
					var buttonText = "Link Response";

					if(stateSlicesObj.messageObjArr[i].wouldCauseInfiniteLoop){
						linkWarningClassName = " link-warning-infinite-loop";
						buttonDisabled = "disabled='disabled'";
						buttonText = "Linking Would Cause an Infinite Loop";
					}
					else if(stateSlicesObj.messageObjArr[i].isMatchOnSibling){
						linkWarningClassName = " link-warning-sibling";
						buttonDisabled = "disabled='disabled'";
						buttonText = "Linking to Siblings is Pointless";
					}
					else if(stateSlicesObj.messageObjArr[i].isLinkAlreadyCreated){
						linkWarningClassName = " link-warning-exists";
						buttonDisabled = "disabled='disabled'";
						buttonText = "Link Already Established";
					}

					searchResultsHtml += "<div link-row-position='"+matchingPositionCounter+"' link-dialog-position-chain='"+stateSlicesObj.messageObjArr[i].dialogPosChain+"' class='link-search-result-row"+linkWarningClassName+"'>"+
												"<div class='link-search-result-row-message-preview'>" +
													HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.messageObjArr[i].message)+
												"</div>" +
												"<div class='link-search-result-row-commands' id='link-search-result-command-row-"+matchingPositionCounter+"-"+elementIdOfComponentInstanceWrapper+"'>" + 
													"<button "+buttonDisabled+" link-dialog-position-chain='"+stateSlicesObj.messageObjArr[i].dialogPosChain+"' id='link-search-result-button-"+matchingPositionCounter+"-"+elementIdOfComponentInstanceWrapper+"'>"+buttonText+"</button>" + 
												"</div>" + 
											"</div>";
					matchingPositionCounter++;
				}
			}

			if(matchingPositionCounter === 0)
				document.getElementById('symbolic-link-search-results'+elementIdOfComponentInstanceWrapper).innerHTML = "No matches found."
			else
				document.getElementById('symbolic-link-search-results'+elementIdOfComponentInstanceWrapper).innerHTML = "<h2>Search Results</h2>" + searchResultsHtml;

			var linkSearchResultsCollection = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('link-search-result-row');

			for(var i=0; i<linkSearchResultsCollection.length; i++){

				// Clicking on a search result should expand the row and provide access to additional UI components.
				linkSearchResultsCollection[i].addEventListener("click", function(){

					// Collapse all rows before expanding the current.
					for(var j=0; j<linkSearchResultsCollection.length; j++)
						document.getElementById("link-search-result-command-row-" + j + "-" + elementIdOfComponentInstanceWrapper).style.display = "none";

					var linkRowPosition = this.getAttribute("link-row-position");

					var commandRowElem = document.getElementById("link-search-result-command-row-" + linkRowPosition + "-" + elementIdOfComponentInstanceWrapper);

					commandRowElem.style.display = "block";

					// Every time the row is clicked, remove any existing event listeners on the command button(s) and re-apply.
					var linkButtonElem = document.getElementById("link-search-result-button-" + linkRowPosition + "-" + elementIdOfComponentInstanceWrapper);
					linkButtonElem.removeEventListener("click", clickHandlerForLinkButton);
					linkButtonElem.addEventListener("click", clickHandlerForLinkButton);

					return false;
				});
			}

			function clickHandlerForLinkButton(evt){

				evt.stopPropagation();

				var linkDialogPositionChain = this.getAttribute("link-dialog-position-chain");

				console.log("Clicked on the button for position chain: ", linkDialogPositionChain);

				HIPI.state.ActionMethods.createSymbolicLink(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, linkDialogPositionChain);

				HIPI.framework.AppState.saveStore()
				.then(function(){
					console.log("Store was saved successfully after creating a symbolic link.");
				});
			}
		});

		document.getElementById("btn-cancel-symbolic-link"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			HIPI.state.ActionMethods.hideNewMessageDialog(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
		});

		document.getElementById('new-message-symbolic-link-search'+elementIdOfComponentInstanceWrapper).focus();
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			// There can be many symbolic links of a dialog and each one of them can have different contradictions attached throughout the hierarchy.
			// There are only 2 viable options... 
			//   1) Consolidate all contradictions from all symbolic links under the new copy.
			//   2) Leave behind all contradictions and let the symbolic link start off with a clean slate.
			// The second option is preferable because contradictions made under one context are not supposed to apply to other contexts.
			// Also leaving behind contradictions is only temporary, the "suggestion engine" will make them available in case someone wants to contradict the same message again.
			case HIPI.state.ActionNames.CREATE_SYMBOLIC_LINK :

				if(!actionObj.dialogPositionChain)
					throw new Error("Error in <newMessageSymbolicLink> Reducer. Cannot create a symbolic link on the domain root.");

				// Get a reference to the dialog array where a link should be added.
				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// Calculate what the new address will be for the Symbolic when attached as the next child.
				var nextChildArrayPosition = subArrayRef.dialogs.length;

				// This represents the Dialog Position where the user will be redirected to after saving a new symbolic link to the given parent.
				var dialogPositionChainForRedirect = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(actionObj.dialogPositionChain, nextChildArrayPosition);

				// If the user is adding a link to a link, find out where the source is and add it there instead.
				if(subArrayRef.link){

					var dialogPositionChainToAttachLinkOn = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(stateObj, actionObj.domain, subArrayRef.link);

					subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, dialogPositionChainToAttachLinkOn);
				}
				else{

					var dialogPositionChainToAttachLinkOn = actionObj.dialogPositionChain;
				}

				// Get a unique address to the link source which can be persisted to disk.
				// Dialog positions chains are only valid during runtime and may change if the browser is reloaded.
				var linkArr = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(stateObj, actionObj.domain, actionObj.linkPositionChain);

				// Add a ".link" property to the new dialog position instead of a ".message" property... it must be one or the other.
				subArrayRef.dialogs.push({"link": linkArr});

				// Close the "add message window" now that a link has been created.
				subArrayRef.showNewMessageDialog = false;

				var dialogPositionChainOfNewLink = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(dialogPositionChainToAttachLinkOn, (subArrayRef.dialogs.length -1));

				// Ensure that the hierarchy of dialogs entries match up to link source.
				// This has to be done from the Domain Root because there could be links of links.
				stateObj = HIPI.lib.Dialogs.updateShadowLinksInDomainAndRecalculateDepths(stateObj, actionObj.domain);

				// Adding a message will have to increment the depth properties of the parents in the dialogPositionChain.
				stateObj = HIPI.lib.Dialogs.recalculateDepthProperiesOnParentChain(stateObj, actionObj.domain, dialogPositionChainOfNewLink);
				
				stateObj = HIPI.lib.Dialogs.recalculateAnsweredStatusOnParentChain(stateObj, actionObj.domain, dialogPositionChainOfNewLink);

				// Let the link source know who has established incoming links to it.
				// This way if a message is added to the link source it will be possible to fill in the shadow links across all link recipients and change their depth properties accordingly.
				var linkTargetDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.linkPositionChain);

				if(!linkTargetDialogRef.reverseLinks)
					linkTargetDialogRef.reverseLinks = [];

				if(!Array.isArray(linkTargetDialogRef.reverseLinks))
					throw new Error("Error in <newMessageSymbolicLink> Reducer the link target has a '.reverseLinks' property but it is not of type array: " + dialogPositionChainToAttachLinkOn);

				linkTargetDialogRef.reverseLinks.push(HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(stateObj, actionObj.domain, dialogPositionChainOfNewLink));

				// Let the user see the link which they just added.
				// If a message was added under an existing link then it the data would have been saved to the source position, not a Shadow Link.
				// This will addresses either or so that the user keeps their spot in the Dialog.
				stateObj = HIPI.lib.Dialogs.selectDialogPositionChain(stateObj, actionObj.domain, dialogPositionChainForRedirect);

				// Keep a record of the link which was created by the current user.
				stateObj = HIPI.lib.Contributions.addMessageRecord(stateObj, actionObj.domain, dialogPositionChainOfNewLink);

				console.log("Linked New Message:", stateObj);

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
