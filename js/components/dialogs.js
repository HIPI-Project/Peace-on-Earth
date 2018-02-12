"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	// The "dialogs" component acts as a main wrapper for dispalying all dialogs within the Domain Root (it is what the Main Tab will render).
	componentObj.defineHtmlElementSelector("dialogs");
	componentObj.defineComponentPropName("domain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "<div class='dialogs-container'>" +
						"<h2>" + HIPI.framework.Utilities.escapeHtml(componentPropertiesObj.domain) + ": Base Messages</h2>\n";

		if(stateSlicesObj.baseDialogExist){
			retHtml += "<span class='dialog-base-status-bar' id='status-bar-parent-address'></span>";;
			retHtml += "<dialogSorter domain='"+componentPropertiesObj.domain+"' dialogPositionChain=''></dialogSorter>";
		}
		else{
			retHtml +=  "<button id='btn-add-root-dialog"+elementIdOfComponentInstanceWrapper+"'>Start New Dialog</button>";
		}

		// Components for rendering new Dialog windows need to be placed at the domain root (for creating Base Messages) as well as within <dialog> pop-ups.
		// Base Messages can be created from here but not edited (that is handeled within the individual <dialog> compoent).
		if(stateSlicesObj.showNewMessageDialog)
			retHtml += "<newMessageWindow domain='"+componentPropertiesObj.domain+"' dialogPositionChain=''></newMessageWindow>";

		retHtml += "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		var domainRootRef = HIPI.lib.General.getReferenceToDomainRoot(globalStateObj, componentPropertiesObj.domain);

		retStateObj.showNewMessageDialog = domainRootRef.showNewMessageDialog ? true : false;

		var userSettingsIncludesContradictedEntries = HIPI.lib.General.userSettingsShowContradictedEntries(globalStateObj);

		var baseDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, "", userSettingsIncludesContradictedEntries, false);

		retStateObj.baseDialogExist = baseDialogPositionsArr.length ? true : false;

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var firstDialogButton = document.getElementById("btn-add-root-dialog"+elementIdOfComponentInstanceWrapper);
		if(firstDialogButton){

			firstDialogButton.addEventListener("click", function(){

				HIPI.state.ActionMethods.showNewMessageDialog(componentPropertiesObj.domain, "");

				return false;
			});
		}
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.SHOW_NEW_MESSAGE_DIALOG :

				// When a new message window is launched the child windows should be closed.
				stateObj = HIPI.lib.Dialogs.closePerpendicularDescendantsDialogsAboveCurrent(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// Get a reference to the dialog array that's pointed to by the dialogPositionChain.
				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				subArrayRef.showNewMessageDialog = true;

				// Set the default tab whenever a new window is opened.
				subArrayRef.newMessageSelectedTab = "custom-text";

				subArrayRef.showContradictWindow = false;
				subArrayRef.showEditMessageDialog = false;

				break;

			case HIPI.state.ActionNames.HIDE_NEW_MESSAGE_DIALOG :

				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				subArrayRef.showNewMessageDialog = false;

				break;

			case HIPI.state.ActionNames.EDIT_MESSAGE :

				stateObj = HIPI.lib.Dialogs.closePerpendicularDescendantsDialogsAboveCurrent(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				subArrayRef.showEditMessageDialog = true;

				subArrayRef.showContradictWindow = false;
				subArrayRef.showNewMessageDialog = false;

				break;

			case HIPI.state.ActionNames.HIDE_EDIT_MESSAGE :

				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				subArrayRef.showEditMessageDialog = false;

				break;

			case HIPI.state.ActionNames.SHOW_CONTRADICT_WINDOW :

				if(!actionObj.dialogPositionChain)
					throw new Error("Error in <dialogs> reducer. The dialogPositionChain should never be empty when SHOW_CONTRADICT_WINDOW action is given.");

				stateObj = HIPI.lib.Dialogs.closePerpendicularDescendantsDialogsAboveCurrent(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// If the contradictionPositionChain is empty then show the Contradiction window on the Dialog target.
				if(actionObj.contradictionPositionChain){

					stateObj = HIPI.lib.Contradictions.hideSiblingContradictionWindows(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

					var subArrayRef = HIPI.lib.Contradictions.getContradictionPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);
				}
				else{

					// Close the parent dialogs windows that appear within the same pop-over window.
					var parentDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(actionObj.dialogPositionChain));

					parentDialogRef.showNewMessageDialog = false;
					parentDialogRef.showEditMessageDialog = false;

					var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

					subArrayRef.showPerpendicularLevel = false;
				}

				subArrayRef.showContradictWindow = true;
				subArrayRef.newContradictionSelectedTab = "suggested-contradictions";

				// If a new Contradiction Window is opened the calling code may pass in an array of Suggested Contradictions (which may have taken a lot of work to produce).
				// This way the State Extractor can save many cycles in case there are many Contradiction Windows stacked above each other.
				// When a Contradiction Window is opened a Reducer can remove the cached array, this data should only remain on the global state when the target is buried under other windows.
				if(actionObj.cachedSuggestedContradictions){

					if(!actionObj.contradictionPositionChain)
						throw new Error("Error in SHOW_CONTRADICT_WINDOW reducer. The cachedSuggestedContradictions array should never be provided without a Contradiction Position.");

					// The Cached Copy should be stored on the parent because it is assumed that the parent contains the results and the user just selected one of them when this action fired.
					var parentRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain, HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(actionObj.contradictionPositionChain));

					parentRef.cachedSuggestedContradictions = actionObj.cachedSuggestedContradictions;

					// The "showContradictWindow" property on the cached copy, is how the HTML Generator knows to launch a pop-over.
					var foundShowContradictionWindowEntry = false;

					parentRef.cachedSuggestedContradictions = parentRef.cachedSuggestedContradictions.map(function(loopSuggestionObj){

						if(loopSuggestionObj.domain === actionObj.domain 
							&& loopSuggestionObj.dialogPositionChain === actionObj.dialogPositionChain 
							&& loopSuggestionObj.contradictionPositionChain === actionObj.contradictionPositionChain)
						{
							loopSuggestionObj.showContradictWindow = true;

							foundShowContradictionWindowEntry = true;
						}
						else{
							loopSuggestionObj.showContradictWindow = false;
						}

						return loopSuggestionObj;
					});

					if(!foundShowContradictionWindowEntry)
						throw new Error("Error in SHOW_CONTRADICT_WINDOW reducer. Could not find a matching showContradictWindow entry within cachedSuggestedContradictions.");
				}

				// Whenever a pop-over is explicitly launched be sure to remove any cached suggestions so that they can be re-calculated.
				// Caching is only meant for Contradiction windows under the top of the stack.
				delete subArrayRef.cachedSuggestedContradictions;

				break;

			case HIPI.state.ActionNames.HIDE_CONTRADICT_WINDOW :

				stateObj = HIPI.lib.Dialogs.closePerpendicularDescendantsDialogsAboveCurrent(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				var subArrayRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

				subArrayRef.showContradictWindow = false;

				// Otherwise the Cached copy of Suggested Contradictions will just keep re-launching the pop-over.
				if(actionObj.contradictionPositionChain){

					var parentRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain, HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(actionObj.contradictionPositionChain));

					delete parentRef.cachedSuggestedContradictions;
				}

				// Recursively close any descendant windows (stacked above).
				while(true){

					var foundMatch = false;

					if(subArrayRef.contradictions){

						subArrayRef.contradictions.forEach(function(loopContradictionRef){

							if(loopContradictionRef.showContradictWindow){

								foundMatch = true;

								loopContradictionRef.showContradictWindow = false;

								subArrayRef = loopContradictionRef;
							}
						});
					}

					if(!foundMatch)
						break;
				}

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
