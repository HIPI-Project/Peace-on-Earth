"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("editMessageWindow");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(HIPI.framework.Utilities.getArrayOfIntegersFromCommaSeparatedChain(componentPropertiesObj.dialogPositionChain).length === 1)
			var isBaseMessage = true;
		else
			var isBaseMessage = false;
		
		if(isBaseMessage){

			var perpendicularOrientationClassName = "trusting-dialog";
			var dialogTitleStr = "Edit Base Message";
			var addMessageButtnStr = "Update Base Message";
		}
		else if(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain)){

			var perpendicularOrientationClassName = "skeptical-dialog";
			var dialogTitleStr = "Edit Skeptical Message / Question";
			var addMessageButtnStr = "Update Skeptical Response";
		}
		else{

			var perpendicularOrientationClassName = "trusting-dialog";
			var dialogTitleStr = "Edit Supportive Message / Answer";
			var addMessageButtnStr = "Update Supportive Response";
		}

		var retHtml = "<div class='edit-message-dialog "+perpendicularOrientationClassName+"'>" +
						"<h2>"+dialogTitleStr+"</h2>" +
						"<form id='form-edit-message"+elementIdOfComponentInstanceWrapper+"'>" +
							"<textarea class='textarea-edit-message' id='textarea-edit-message"+elementIdOfComponentInstanceWrapper+"'>"+HIPI.framework.Utilities.escapeHtml(stateSlicesObj.messageStr)+"</textarea>"+
							"<autoComplete elementIdOfInput='textarea-edit-message"+elementIdOfComponentInstanceWrapper+"'></autoComplete>"+
							"<p>"+
								"<button type='submit'>"+addMessageButtnStr+"</button> "+
								"<button type='button' id='btn-cancel-edit-message"+elementIdOfComponentInstanceWrapper+"'>Cancel</button>"+
							"</p>"+
						"</form>";

						// This matches up with a routine found in the <newMessageTabs> component.
						if(stateSlicesObj.respondToMessage)
							retHtml += "<h2 class='respond-to-title'>In Response To ...</h2><div class='new-message-responding-to-message'>" + HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.respondToMessage) + "</div>";
						else
							retHtml += "<h2 class='respond-to-title'>About Base Messages</h2><div class='new-message-responding-to-message'>"+HIPI.framework.Utilities.escapeHtml(HIPI.lib.Language.byKey.baseMessageDescription)+"</div>";

					retHtml += "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		// Make sure that the first X characters of this message are unique at this level in the Dialog (relative to its siblings)... assuming that the old message will be replaced.
		// A similar routine can be found when adding new messages.
		retStateObj.allMessagePrefixesAtThisDialogLevel = [];

		// Go up a level in hierarchy in order to discover the sibling's messages. 
		var parentDialogPosition = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(componentPropertiesObj.dialogPositionChain);

		var siblingDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, parentDialogPosition, true, false);

		// Knock out the dialog position being edited so it doesn't look like the new message is conflicting with the old one.
		siblingDialogPositionsArr = siblingDialogPositionsArr.filter(function(loopDialogPositionChain){
			return loopDialogPositionChain === componentPropertiesObj.dialogPositionChain ? false : true;
		});

		// Return an array of message strings, truncated at the max index size.
		retStateObj.allMessagePrefixesAtThisDialogLevel = siblingDialogPositionsArr.map(function(loopDialogPositionChain){

			var loopMessage = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain);

			return loopMessage.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());
		});

		retStateObj.messageStr = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		if(parentDialogPosition)
			retStateObj.respondToMessage = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, parentDialogPosition);

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		document.getElementById("form-edit-message"+elementIdOfComponentInstanceWrapper).addEventListener("submit", function(evt){

			evt.preventDefault();

			var textStr = document.getElementById('textarea-edit-message'+elementIdOfComponentInstanceWrapper).value;

			textStr = HIPI.framework.Utilities.trimText(textStr);

			var newMessagePrefix = textStr.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());

			if(textStr.length < 3){

				alert("You must add at least 3 characters of text before submitting the form.");
			}
			else if(stateSlicesObj.allMessagePrefixesAtThisDialogLevel.indexOf(newMessagePrefix) > -1){

				alert("The first " + HIPI.framework.Constants.getMaxCharacterExcerptForLinking() + " characters of a message must be unique at each Dialog level (relative to it's siblings).");
			}
			else{

				HIPI.state.ActionMethods.updateMessage(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, textStr);

				HIPI.framework.AppState.saveStore()
				.then(function(){
					console.log("Store was saved successfully after updating an existing message.");
				});
			}
		});

		document.getElementById("btn-cancel-edit-message"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			var textStr = document.getElementById('textarea-edit-message'+elementIdOfComponentInstanceWrapper).value;

			if(textStr !== stateSlicesObj.messageStr){

				if(confirm("Discard the changes that you've made?"))
					HIPI.state.ActionMethods.hideEditMessage(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
			}
			else{

				HIPI.state.ActionMethods.hideEditMessage(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
			}
		});

		document.getElementById('textarea-edit-message'+elementIdOfComponentInstanceWrapper).focus();
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.UPDATE_MESSAGE :

				if(!HIPI.lib.Contributions.canUserEditDialogMesssage(stateObj, actionObj.domain, actionObj.dialogPositionChain))
					throw new Error("Error in <editMessageWindow> reducer. The user cannot update this message.");

				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// Close the Edit Window upon save.
				subArrayRef.showEditMessageDialog = false;

				// If the user has edited a link, instead of the original, then update the message at its source.
				// This is important because linking arrays will always be single dimensional when they point at a source message (needed for search/replace).
				if(subArrayRef.link){

					var dialogPositionChainOfLinkSource = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(stateObj, actionObj.domain, subArrayRef.link);

					var linkArrayPointingToMessageSource_OLD = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(stateObj, actionObj.domain, dialogPositionChainOfLinkSource);

					var linkSourceSubArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, dialogPositionChainOfLinkSource);

					linkSourceSubArrayRef.message = actionObj.message;
				}
				else{
					// Otherwise, this must be the message source.
					var linkArrayPointingToMessageSource_OLD = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(stateObj, actionObj.domain, actionObj.dialogPositionChain);

					subArrayRef.message = actionObj.message;
				}

				// Calculate the new Linking Array by replacing the final Link element with the proper index size (possible truncation).
				var linkArrayPointingToMessageSource_NEW = HIPI.framework.Utilities.copyArray(linkArrayPointingToMessageSource_OLD);

				linkArrayPointingToMessageSource_NEW[linkArrayPointingToMessageSource_NEW.length -1] = actionObj.message.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());

				// This will make all of the .link and .reverseLink properties point to the new Linking Array (after the message was updated).
				stateObj = searchReplaceLinkingArraysThroughoutDialogsInDomain(stateObj, actionObj.domain, linkArrayPointingToMessageSource_OLD, linkArrayPointingToMessageSource_NEW);
				
				// After updating the message it could break ownership so the list of Contributions will need their links analyzed as well.
				stateObj = searchReplaceLinkingArraysThroughoutContributions(stateObj, actionObj.domain, linkArrayPointingToMessageSource_OLD, linkArrayPointingToMessageSource_NEW);

				break;
		}

		return stateObj;

		// The purpose of the following 2 replacement functions is to sweep over every spot in the domain where a "linking array" might be used.
		// The OLD and NEW linking arrays are single-dimensional because they both point to the message source of what was just updated.
		// The search/replace is reliable because HIPI.lib.General.replaceLinkingArrayPrefix() will find the source even if there is a link of a link (withing the second dimension).
		function searchReplaceLinkingArraysThroughoutContributions(globalStateObj, domain, oldLinkingArray, newLinkingArray){

			var globalStateObjForSearchReplace = HIPI.framework.Utilities.copyObject(globalStateObj);

			globalStateObjForSearchReplace = HIPI.lib.Contributions.ensureDomainIsInitializedOnPrivateState(globalStateObjForSearchReplace, domain);

			var messageFoundInContributions = false;

			for(var i=0; i<globalStateObjForSearchReplace.privateState.domains.length; i++){

				if(globalStateObjForSearchReplace.privateState.domains[i].domainName !== domain)
					continue;

				// It's possible that there are sub-messages (below the oldLinkingArr) which share the everything up until the length of the old LinkingArr. 
				for(var j=0; j<globalStateObjForSearchReplace.privateState.domains[i].myMessages.length; j++)
					globalStateObjForSearchReplace.privateState.domains[i].myMessages[j].link = HIPI.lib.General.replaceLinkingArrayPrefix(globalStateObjForSearchReplace.privateState.domains[i].myMessages[j].link, oldLinkingArray, newLinkingArray, true);

				// Linking is not permitted when the message as a Contradiction attached.
				// However it is possible that there is a Contradiction attached to Message downstream in the hierarchy (which is OK).
				// It is possible that the old linking array matches up to the point where the contradiction linking array continues.
				for(var j=0; j<globalStateObjForSearchReplace.privateState.domains[i].myContradictions.length; j++)
					globalStateObjForSearchReplace.privateState.domains[i].myContradictions[j].link = HIPI.lib.General.replaceLinkingArrayPrefix(globalStateObjForSearchReplace.privateState.domains[i].myContradictions[j].link, oldLinkingArray, newLinkingArray, true);
			}

			return globalStateObjForSearchReplace;
		}

		function searchReplaceLinkingArraysThroughoutDialogsInDomain(globalStateObj, domain, oldLinkingArray, newLinkingArray){

			var globalStateObjForSearchReplace = HIPI.framework.Utilities.copyObject(globalStateObj);

			var domainRootRef = HIPI.lib.General.getReferenceToDomainRoot(globalStateObjForSearchReplace, domain);

			searchReplaceLinkingArraysRecursive(domainRootRef);

			return globalStateObjForSearchReplace;

			function searchReplaceLinkingArraysRecursive(recurseDialogSubRef){

				if(recurseDialogSubRef.link)
					recurseDialogSubRef.link = HIPI.lib.General.replaceLinkingArrayPrefix(recurseDialogSubRef.link, oldLinkingArray, newLinkingArray, true);

				if(recurseDialogSubRef.reverseLinks){

					for(var i=0; i<recurseDialogSubRef.reverseLinks.length; i++)
						recurseDialogSubRef.reverseLinks[i] = HIPI.lib.General.replaceLinkingArrayPrefix(recurseDialogSubRef.reverseLinks[i], oldLinkingArray, newLinkingArray, true);
				}

				if(!recurseDialogSubRef.dialogs)
					return;

				recurseDialogSubRef.dialogs.forEach(function(loopDialogRef){
					searchReplaceLinkingArraysRecursive(loopDialogRef);
				});
			}
		}
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
