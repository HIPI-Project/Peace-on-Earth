"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("newContradiction");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");
	componentObj.defineComponentPropName("contradictionPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "<h2>Create a New Contradiction</h2>"+
						"<div class='new-contradiction-wrapper'>" +
						"<form id='form-new-contradiction"+elementIdOfComponentInstanceWrapper+"'>" +
							"<h3>Cant say ...</h3>" +
							"<p>Highlight a text-range with your pointer representing the smallest enclosing region of data which cannot be said in light of the reason being provided.</p>" +
							"<div class='new-contradiction-cant' id='new-contradiction-cant"+elementIdOfComponentInstanceWrapper+"'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.textToContradict)+"</div>"+
							"<input type='hidden' id='new-contradiction-cant-hidden"+elementIdOfComponentInstanceWrapper+"' value='' />" +
							"<h3>Because ...</h3>" +
							"<p>When you give your reason why, speak in Can't/Because format to achieve maximum effectiveness.  This creates a 2-for-1 inversion which let's you be right about why something else is wrong.</p>" +
							"<p> EX: <em>You can't say that it's ready for launch because there's still a disagreement about the fuel range.</em></p>" +
							"<textarea class='textarea-new-contradiction-cuz' id='textarea-new-contradiction-cuz"+elementIdOfComponentInstanceWrapper+"'></textarea>"+
							"<autoComplete elementIdOfInput='textarea-new-contradiction-cuz"+elementIdOfComponentInstanceWrapper+"'></autoComplete>"+
							"<p>"+
								"<button type='submit'>Add</button> "+
								"<button type='button' id='btn-cancel-new-contradiction"+elementIdOfComponentInstanceWrapper+"'>Cancel</button>"+
							"</p>"+
						"</form>" +
					"</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		if(componentPropertiesObj.contradictionPositionChain){

			var contradictionSubArrRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);

			retStateObj.textToContradict = contradictionSubArrRef.because;
		}
		else{
			retStateObj.textToContradict = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain)
		}

		// Replace multiple spaces with just one because HTML conflates spaces which means that the text-range will have the same.
		retStateObj.textToContradict = HIPI.framework.Utilities.conflateHtmlWhitespace(retStateObj.textToContradict);

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		// Should selecting " hi " match "high"?
		// From the other side, the problem is that auto-complete hints a bunch of nonsensical matches after the user enters a space (granted, that could be fixed from the <autoComplete> component).
		// Will users carefully select the endpoints of text-ranges?  
		// Some will and others won't, so let's go with consistency for now.
		var trimCantSelection = true;

		['mouseup', 'keyup'].forEach(function(eventName){
			document.getElementById("new-contradiction-cant"+elementIdOfComponentInstanceWrapper).addEventListener(eventName, cantTextRangeHandler, false);
		});

		function cantTextRangeHandler(){

			var cantText = HIPI.framework.Utilities.getSelectedText();

			if(trimCantSelection)
				cantText = HIPI.framework.Utilities.trimText(cantText);	

			if(!cantText)
				return;

			if(stateSlicesObj.textToContradict.indexOf(cantText) === -1)
				return;

			var selectedTextHtmlEncoded = HIPI.framework.Utilities.htmlizeStringWithLineBreaks(cantText);
			var fullCantTextHtmlEncoded = HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.textToContradict);

			if(fullCantTextHtmlEncoded.indexOf(selectedTextHtmlEncoded) === -1){
				throw new Error("Error in text range handler. The selected text was found within the target text, but not after HTML encoding.");
				return;
			}

			// Re-inject HTML into the CANT area with SPAN tags wrapping the highlighted text.
			var regexForHighlightedTextStr = new RegExp(HIPI.framework.Utilities.escapeStringForRegularExpression(selectedTextHtmlEncoded), 'g');
			fullCantTextHtmlEncoded = fullCantTextHtmlEncoded.replace(regexForHighlightedTextStr, function(){ return ("<span class='cant-text-highlight'>" + selectedTextHtmlEncoded + "</span>")});

			document.getElementById('new-contradiction-cant' + elementIdOfComponentInstanceWrapper).innerHTML = fullCantTextHtmlEncoded;
			document.getElementById('new-contradiction-cant-hidden' + elementIdOfComponentInstanceWrapper).value = cantText;
		}

		document.getElementById("form-new-contradiction"+elementIdOfComponentInstanceWrapper).addEventListener("submit", function(evt){

			evt.preventDefault();

			var cantStr = document.getElementById('new-contradiction-cant-hidden'+elementIdOfComponentInstanceWrapper).value;
			var becauseStr = document.getElementById('textarea-new-contradiction-cuz'+elementIdOfComponentInstanceWrapper).value;

			if(trimCantSelection)
				cantStr = HIPI.framework.Utilities.trimText(cantStr);

			becauseStr = HIPI.framework.Utilities.trimText(becauseStr);

			if(!cantStr){
				alert("You must create an index for the contradiction (i.e. CAN'T) before submitting the form.");
			}
			else if(cantStr.length < 3){
				alert("The contradiction index (i.e. CANT'T) must span at least 3 characters before submitting the form.");
			}
			else if(!becauseStr){
				alert("You must add a reason (i.e. BECAUSE) before submitting the form.");
			}
			else if(becauseStr.length < 3){
				alert("The contradiction reason (i.e. BECAUSE) must contain at least 3 characters before submitting the form.");
			}
			else{

				HIPI.state.ActionMethods.submitNewContradiction(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain, cantStr, becauseStr);

				HIPI.framework.AppState.saveStore()
				.then(function(){
					console.log("Store was saved successfully after adding a new contradiction.");
				});
			}
		});

		document.getElementById("btn-cancel-new-contradiction"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			var becauseStr = document.getElementById('textarea-new-contradiction-cuz'+elementIdOfComponentInstanceWrapper).value;

			if(!becauseStr.match(/^\s*$/)){

				if(confirm("Discard the information that you've entered?"))
					leaveContradictionWindow();
			}
			else{
				leaveContradictionWindow();
			}

			function leaveContradictionWindow(){

				HIPI.state.ActionMethods.hideContradictWindow(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);
			}

		});
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.SUBMIT_NEW_CONTRADICTION :

				var targetSubRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

				if(targetSubRef.contradictions){

					if(!Array.isArray(targetSubRef.contradictions))
						throw new Error("Error in <newContradiction> Reducer. The target has a contradiction property but it is not of type array.");
				}
				else{
					targetSubRef.contradictions = [];
				}

				var contradictionAlreadyExists = false;

				targetSubRef.contradictions.forEach(function(loopContradictionObj){

					if(loopContradictionObj.cant === actionObj.cantText && loopContradictionObj.because === actionObj.cuzText)
						contradictionAlreadyExists = true;
				});

				if(contradictionAlreadyExists){
					console.log("A new contradiction will not be added because it appears to be a duplicate.");

					// Just close the top Contradiction window so the user sees a reaction (and hopefully the duplicate Contradiction).
					// The routine below closes whatever ancestors have flipped their states as a result of adding a new Contradiction, but that won't happen in this case.
					targetSubRef.showContradictWindow = false;
				}
				else{

					// Before adding the Contradiction, find out the Contradicted statuses of the ancestors.
					// This way it will be possible to know which ones have flipped so that the parent windows can be closed, up to the point of the deepest reaction.
					var contradictionStatusesOfAncestorsArr_Before = HIPI.lib.Contradictions.getContradictionStatusesOfAncestors(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

					targetSubRef.contradictions.push({"cant":actionObj.cantText, "because":actionObj.cuzText});

					// Now that a message has been added, make sure to hide the pop-over at the same level.
					targetSubRef.showContradictWindow = false;

					// Contradicting a dialog message or one of its underlying contradictions could affect the depth properties of the dialog message.
					stateObj = HIPI.lib.Contradictions.reCacheContradictionStatusesOfAncestorChain(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

					// Contradicting a dialog message or one of its underlying contradictions could affect the depth properties of the dialog message.
					stateObj = HIPI.lib.Dialogs.recalculateDepthProperiesOnParentChain(stateObj, actionObj.domain, actionObj.dialogPositionChain);
					
					stateObj = HIPI.lib.Dialogs.recalculateAnsweredStatusOnParentChain(stateObj, actionObj.domain, actionObj.dialogPositionChain);

					var contradictionStatusesOfAncestorsArr_After = HIPI.lib.Contradictions.getContradictionStatusesOfAncestors(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

					if(contradictionStatusesOfAncestorsArr_Before.length !== contradictionStatusesOfAncestorsArr_After.length)
						throw new Error("Error in <newContradiction> Reducer. The Ancestor chains are not the same length after adding a Contradiction.");

					var ancestorsWhichHaveFlippedArr = [];

					for(var i=0; i<contradictionStatusesOfAncestorsArr_Before.length; i++){

						if(contradictionStatusesOfAncestorsArr_Before[i].isContradicted !== contradictionStatusesOfAncestorsArr_After[i].isContradicted)
							ancestorsWhichHaveFlippedArr.push(contradictionStatusesOfAncestorsArr_Before[i]);
					}

					// Close the windows for all Contradictions which have flipped contradiction status.
					ancestorsWhichHaveFlippedArr.forEach(function(loopAncestorChangedObj){

						var loopTargetRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, loopAncestorChangedObj.dialogPositionChain, loopAncestorChangedObj.contradictionPositionChain);

						loopTargetRef.showContradictWindow = false;
					});

					var newlyCreatedContradictionPositionChain = HIPI.framework.Utilities.addIntegerToEndOfCommaSeparatedChain(actionObj.contradictionPositionChain, (targetSubRef.contradictions.length -1));

					// Add a record to the private state so the current user can keep track of what contradictions have been added by them.
					stateObj = HIPI.lib.Contributions.addContradictionRecord(stateObj, actionObj.domain, actionObj.dialogPositionChain, newlyCreatedContradictionPositionChain);
				}

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
