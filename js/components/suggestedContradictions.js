"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("suggestedContradictions");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");
	componentObj.defineComponentPropName("contradictionPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!stateSlicesObj.suggestedContradictions.length)
			return "<div class='suggested-contradictions-none'>No Suggestions Found</div>";

		var componentDeclarationForNewWindnowStr = "";

		var retHtml = "<h2>Suggested Contradictions</h2>"+
						"<div>Instead of adding something new at this level, accept an existing Contradiction (if relevant) and reach a broader audience.</div>"+
						"<div class='suggested-contradictions-wrapper'>"+
							"<div class='suggested-contradictions-list'>";

				stateSlicesObj.suggestedContradictions.forEach(function(loopSuggestionObj, suggestionIndex){

					if(loopSuggestionObj.showContradictWindow)
						componentDeclarationForNewWindnowStr = "<contradictionWindow domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"' contradictionPositionChain='"+loopSuggestionObj.contradictionPositionChain+"'></contradictionWindow>";

					if(loopSuggestionObj.isLocallyDefeated){
						retHtml += "<div class='defeated-contradiction-row'>"+
										"<button class='btn-restore-defeated-contradiction' contradictionPositionChain='"+loopSuggestionObj.contradictionPositionChain+"'>Restore / Un-Contradict</button>" +
										"<div><div class='contradiction-part-label-you-cant'>You can't say...</div> <div class='highlight-cant-text'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopSuggestionObj.cant)+"</div></div>"+
										"<div><div class='contradiction-part-label-because'>Because...</div> <div class='highlight-cuz-text'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopSuggestionObj.because)+"</div></div>"+
									"</div>";
					}
					else{
						retHtml += "<div class='suggested-contradiction-row' id='"+elementIdOfComponentInstanceWrapper + "-" + suggestionIndex +"' suggestionIndex='"+suggestionIndex+"'>"+
										"<div><div class='contradiction-part-label-you-cant'>You can't say...</div> <div class='highlight-cant-text'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopSuggestionObj.cant)+"</div></div>"+
										"<div><div class='contradiction-part-label-because'>Because...</div> <div class='highlight-cuz-text'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopSuggestionObj.because)+"</div></div>"+
									"</div>";
					}
				});

				retHtml += "</div>"+
						"</div>";

				retHtml += componentDeclarationForNewWindnowStr;

		return retHtml;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var restoreContradictionButtons = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('btn-restore-defeated-contradiction');

		for(var i=0; i<restoreContradictionButtons.length; i++){

			restoreContradictionButtons[i].addEventListener("click", function(){

				var contradictionPositionChainOfButton = this.getAttribute("contradictionPositionChain");

				HIPI.state.ActionMethods.showContradictWindow(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, contradictionPositionChainOfButton, stateSlicesObj.suggestedContradictions);

				return false;
			});
		}

		var suggestedContradictionRows = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('suggested-contradiction-row');

		for(var i=0; i<suggestedContradictionRows.length; i++){

			suggestedContradictionRows[i].addEventListener("click", function(){

				resetStylesOnSuggestedRows();

				// Get the custom HTML attribute off of the clicked-row as an index to the source data.
				var suggestionIndexOnRow = this.getAttribute("suggestionIndex");

				// Change the CSS style of the clicked row.
				document.getElementById(elementIdOfComponentInstanceWrapper + "-" + suggestionIndexOnRow).style.backgroundColor = "#CCC";

				// The Confirm operation is synchronous and the change to the CSS background color above won't get repainted by the browser unless the Confirm call is made on the browser's "next tick";
				setTimeout(function(){

					if(confirm("Are you sure that you want to apply the Suggested Contradiction?")){

						if(!stateSlicesObj.suggestedContradictions[suggestionIndexOnRow])
							throw new Error("Error in click event for <suggestedContradictions>. Cannot correlate the index with an entry in the suggestedContradictions array.");

						HIPI.state.ActionMethods.submitNewContradiction(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain, stateSlicesObj.suggestedContradictions[suggestionIndexOnRow].cant, stateSlicesObj.suggestedContradictions[suggestionIndexOnRow].because);

						HIPI.framework.AppState.saveStore()
						.then(function(){
							console.log("Store was saved successfully after applying a Suggested Contradiction.");
						});
					}
					else{
						resetStylesOnSuggestedRows();
					}
				}, 0);

				return false;
			});
		}

		function resetStylesOnSuggestedRows(){

			var suggestedContradictionRows = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('suggested-contradiction-row');

			for(var i=0; i<suggestedContradictionRows.length; i++)
				suggestedContradictionRows[i].style.backgroundColor = "";
		}
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		if(HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain))
			throw new Error("Error in the <suggestedContradictions> State Extractor. The target should never been a contradicted state when this component is instantiated.");

		var targetSubArrRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);

		// It is preferable to return a cached copy in case there are multiple contradiction windows stacked on top of this one.
		// Even if a re-paint isn't required, it takes a lot of cycles in the state extractor to recurse through all Contradictions in the database;
		if(targetSubArrRef.cachedSuggestedContradictions){

			if(!Array.isArray(targetSubArrRef.cachedSuggestedContradictions))
				throw new Error("Error in the <suggestedContradictions> State Extractor. There is a cachedSuggestedContradictions property attached but it is not of type Array.");

			retStateObj.suggestedContradictions = targetSubArrRef.cachedSuggestedContradictions;

			// Do something to break the cache for the HTML generator, otherwise there will not be a re-paint operation (from the original render) to launch a pop-over.
			retStateObj.breakCache = true;

			return retStateObj;
		}

		// Find out what text would be targeted from a Contradiction added at this location.
		// Always get the message from a Dialog using the method call because of Symbolic Linking.
		if(componentPropertiesObj.contradictionPositionChain)
			var messageToContradict = targetSubArrRef.because;
		else
			var messageToContradict = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		// Normalize white-space the way that it had existed at the time a text-range was created.
		messageToContradict = HIPI.framework.Utilities.conflateHtmlWhitespace(messageToContradict);

		var allContradictionsArr = HIPI.lib.Contradictions.getFlatArrayOfAllContradictions(globalStateObj);

		// Filter the global list of contradictions based on whether the CANT string can be found within the message body to contradict (case sensitive).
		var filteredContradictionArr = allContradictionsArr.filter(function(loopSuggestionObj){
			return (messageToContradict.indexOf(loopSuggestionObj.cant) !== -1);
		});

		// The "contradictions" property is optional on entries within the global state.
		if(!targetSubArrRef.contradictions)
			targetSubArrRef.contradictions = [];

		var alreadyFoundOpenWindowInSuggestions = false;

		var allCantCuzStringsInDbWhichAreDefeatedArr = [];

		// Add some additional properties to the list of contradictions.
		filteredContradictionArr = filteredContradictionArr.map(function(loopSuggestionObj){

			loopSuggestionObj.isLocallyDefeated = false;

			// Find out if one of the suggested contradictions already exists in this level's contradiction array (which must necessarily exist in a state of FALSE).
			// It's also possible that one of the defeated Contradictions should have one of its pop-over windows displayed.
			targetSubArrRef.contradictions.forEach(function(loopLocalContradiction){

				// It is possible that there is a matching CANT & CUZ from another domain or dialog position.
				// It can only be called a "locally defeated contradiction" if the Domains and Dialog positions match up.
				// Therefore, if a matching CANT and CUZ comes through but the Domain and Dialog position do not match, then just skip it to avoid duplicates.
				if(loopLocalContradiction.cant === loopSuggestionObj.cant && loopLocalContradiction.because === loopSuggestionObj.because){

					if(loopSuggestionObj.domain !== componentPropertiesObj.domain || loopSuggestionObj.dialogPositionChain !== componentPropertiesObj.dialogPositionChain)
						return; 

					loopSuggestionObj.isLocallyDefeated = true;

					allCantCuzStringsInDbWhichAreDefeatedArr.push(loopLocalContradiction.cant + "^" + loopLocalContradiction.because);

					// Check for a pop-over, and validate that there is only one, at most.
					loopSuggestionObj.showContradictWindow = loopLocalContradiction.showContradictWindow ? true : false;

					if(loopSuggestionObj.showContradictWindow){

						if(alreadyFoundOpenWindowInSuggestions)
							throw new Error("Error in <suggestedContradictions> state extractor. There cannot be multiple pop-overs displayed at a single level.");

						alreadyFoundOpenWindowInSuggestions = true;
					}

					return;
				}
			});

			return loopSuggestionObj;
		});

		// Filter out duplicates, but never on a "defeated contradiction", that list is already sure to be unique.
		var alreadyAddedCantCuzStrArr = [];

		filteredContradictionArr = filteredContradictionArr.filter(function(loopSuggestionObj){

			var duplicateStrCheck = loopSuggestionObj.cant + "^" + loopSuggestionObj.because;

			if(loopSuggestionObj.isLocallyDefeated)
				return true;

			// If the CANT/CUZ suggestion has already been added, or it is known to exist within the list of defeated contradictions then filter it out of the collection.
			if(alreadyAddedCantCuzStrArr.indexOf(duplicateStrCheck) !== -1 || allCantCuzStringsInDbWhichAreDefeatedArr.indexOf(duplicateStrCheck) !== -1)
				return false;

			alreadyAddedCantCuzStrArr.push(duplicateStrCheck);

			return true;
		});

		// The cached copy gets put into the same property as the newly calculated version.
		retStateObj.suggestedContradictions = filteredContradictionArr;

		return retStateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
