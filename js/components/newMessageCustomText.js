"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("newMessageCustomText");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!componentPropertiesObj.dialogPositionChain)
			var addMessageButtnStr = "Add New Base Message";
		else if(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain))
			var addMessageButtnStr = "Add Supportive Response";
		else
			var addMessageButtnStr = "Add Skeptical Response";

		var retHtml = "<form id='form-new-message"+elementIdOfComponentInstanceWrapper+"'>" +
							"<textarea class='textarea-new-message' id='textarea-new-message"+elementIdOfComponentInstanceWrapper+"'></textarea>"+
							"<autoComplete elementIdOfInput='textarea-new-message"+elementIdOfComponentInstanceWrapper+"'></autoComplete>"+
							"<p>"+
								"<button type='submit'>"+addMessageButtnStr+"</button> "+
								"<button type='button' id='btn-cancel-new-message"+elementIdOfComponentInstanceWrapper+"'>Cancel</button>"+
							"</p>"+
						"</form>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		// Make sure that the first X characters of this message are unique at this level in the Dialog (relative to its siblings).
		// The only reason that this is necessary is to prevent the possibility of creating an ambiguous "linking array".
		retStateObj.allMessagePrefixesAtThisDialogLevel = [];

		// The dialog position chain sent through the component properties reflects the parent position (if a new message were to be added).
		var allDialogPositionsAtCurrentLevel = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, true, false);

		// Return an array of message strings, truncated at the max index size.
		retStateObj.allMessagePrefixesAtThisDialogLevel = allDialogPositionsAtCurrentLevel.map(function(loopDialogPositionChain){

			var loopMessage = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain);

			return loopMessage.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());
		});

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		document.getElementById("form-new-message"+elementIdOfComponentInstanceWrapper).addEventListener("submit", function(evt){

			evt.preventDefault();

			var textStr = document.getElementById('textarea-new-message'+elementIdOfComponentInstanceWrapper).value;

			textStr = HIPI.framework.Utilities.trimText(textStr);

			var newMessagePrefix = textStr.substr(0, HIPI.framework.Constants.getMaxCharacterExcerptForLinking());

			if(textStr.length < 3){

				alert("You must add at least 3 characters of text before submitting the form.");
			}
			else if(stateSlicesObj.allMessagePrefixesAtThisDialogLevel.indexOf(newMessagePrefix) > -1){

				alert("The first " + HIPI.framework.Constants.getMaxCharacterExcerptForLinking() + " characters of a message must be unique at each Dialog level (relative to it's siblings).");
			}
			else{

				HIPI.state.ActionMethods.submitNewMessage(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, textStr);

				HIPI.framework.AppState.saveStore()
				.then(function(){
					console.log("Store was saved successfully after adding a new message.");
				});
			}
		});

		document.getElementById("btn-cancel-new-message"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			var textStr = document.getElementById('textarea-new-message'+elementIdOfComponentInstanceWrapper).value;

			if(!textStr.match(/^\s*$/)){

				if(confirm("Discard the information that you've entered?"))
					HIPI.state.ActionMethods.hideNewMessageDialog(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
			}
			else{

				HIPI.state.ActionMethods.hideNewMessageDialog(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
			}
		});

		document.getElementById('textarea-new-message'+elementIdOfComponentInstanceWrapper).focus();
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.SUBMIT_NEW_MESSAGE :

				// Get a reference to the dialog array that's pointed to by the dialogPositionChain.
				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// Hide the "new message" dialog window now that a message will be added.
				subArrayRef.showNewMessageDialog = false;

				// Predict what the new Dialog Position Chain will be after the messagae is inserted.
				var newlyCreatedDialogPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(actionObj.dialogPositionChain, subArrayRef.dialogs.length);

				// Messages can't be directly added to Dialog entries which are linked so find out where the source of the link is and add it there.
				if(subArrayRef.link){

					var dialogPositionChainOfLinkSource = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(stateObj, actionObj.domain, subArrayRef.link);

					var linkSourceSubArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, dialogPositionChainOfLinkSource);

					linkSourceSubArrayRef.dialogs.push({"message":actionObj.message});

					// Adding a message will have to increment the depth properties of the parents wherever the message source is being added to.
					stateObj = HIPI.lib.Dialogs.recalculateDepthProperiesOnParentChain(stateObj, actionObj.domain, dialogPositionChainOfLinkSource);

					stateObj = HIPI.lib.Dialogs.recalculateAnsweredStatusOnParentChain(stateObj, actionObj.domain, dialogPositionChainOfLinkSource);

					// If a user adds a message while on a link, the Contributions database must have a record pointing to the "source message" or else the EDIT button will not show.
					var dialogPositionChainForContributionRecord = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(dialogPositionChainOfLinkSource, linkSourceSubArrayRef.dialogs.length -1);
				}
				else{

					// Add a new "Dialog entry object" onto the dialogs array of the parent position.
					// The method call to HIPI.lib.Dialogs.getDialogPositionReference above ensures that the "dialogs" array exists.
					subArrayRef.dialogs.push({"message":actionObj.message});

					var dialogPositionChainForContributionRecord = newlyCreatedDialogPositionChain;
				}

				// Just in case this message was added on a link, or there are other link pointing upstream, make sure to update all Shadow Links within the domain.
				stateObj = HIPI.lib.Dialogs.updateShadowLinksInDomainAndRecalculateDepths(stateObj, actionObj.domain);

				// Adding a message will have to increment the depth properties of the parents in the dialogPositionChain.
				// Make sure this happens after the Shadow Links are updated or else the position may not exist.
				stateObj = HIPI.lib.Dialogs.recalculateDepthProperiesOnParentChain(stateObj, actionObj.domain, newlyCreatedDialogPositionChain);
				
				stateObj = HIPI.lib.Dialogs.recalculateAnsweredStatusOnParentChain(stateObj, actionObj.domain, newlyCreatedDialogPositionChain);

				// Let the user see what they just added.
				stateObj = HIPI.lib.Dialogs.selectDialogPositionChain(stateObj, actionObj.domain, newlyCreatedDialogPositionChain);

				// Add a record to the private state so the current user can keep track of what messages have been added by them.
				stateObj = HIPI.lib.Contributions.addMessageRecord(stateObj, actionObj.domain, dialogPositionChainForContributionRecord);

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
