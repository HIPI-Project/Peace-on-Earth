"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("dialogProperties");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "<div class='dialog-properties-wrapper'>" +
						"<a href='#' class='link-dialog-properties' id='dialog-properties-link"+elementIdOfComponentInstanceWrapper+"'>"+(stateSlicesObj.viewDialogProperties ? 'Hide' : 'Show')+" Properties</a>";

			if(stateSlicesObj.viewDialogProperties){

				if(stateSlicesObj.arrayOfLinkingArraysToLinkSources.length){

					var outgoingLinksHtml = "";
					var incomingLinksHtml = "There cannot be incoming links to a Dialog Message which is linked itself.";

					stateSlicesObj.arrayOfLinkingArraysToLinkSources.forEach(function(loopOutgoingLinkObj){

						if(outgoingLinksHtml)
							outgoingLinksHtml += ", ";

						var classNameForOutgoingLink = loopOutgoingLinkObj.isContradicted ? " link-is-contradicted" : "";

						outgoingLinksHtml += "<a href='#' link-dialog-position='"+loopOutgoingLinkObj.dialogPositionChain+"' class='link-select-message"+classNameForOutgoingLink+"'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopOutgoingLinkObj.anchorText)+"</a>";
					});
				}
				else{

					var outgoingLinksHtml = componentPropertiesObj.dialogPositionChain.split(",").length === 1 ? "The Base may not contain messages derived from links." : "None";

					var incomingLinksHtml = "";

					stateSlicesObj.arrayOfLinkingArraysPointingHere.forEach(function(loopIncomingLinkObj){

						if(incomingLinksHtml)
							incomingLinksHtml += "<br/>,<br/>";

						var classNameForIncomingLink = loopIncomingLinkObj.isContradicted ? " link-is-contradicted" : "";
						var classNameForLinkHead = loopIncomingLinkObj.isFromLinkHead ? " link-is-from-head" : " link-is-not-from-head";
						var incomingLinkTitle = loopIncomingLinkObj.isFromLinkHead ? "This Dialog Position represents a Link Head where a user has explicitly linked a symbolic copy of this message (along with any current or future descendants)." : "This is a Shadow Link, meaning that a user did not explicitly create this copy.  It is downstream from a Link Head which automatically carries a hierarchal copy of Dialog Messages.";

						incomingLinksHtml += "<a href='#' title='"+HIPI.framework.Utilities.escapeHtml(incomingLinkTitle)+"' link-dialog-position='"+loopIncomingLinkObj.dialogPositionChain+"' class='link-select-message"+classNameForIncomingLink+classNameForLinkHead+"'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopIncomingLinkObj.anchorText)+"</a>";
					});

					if(!incomingLinksHtml)
						incomingLinksHtml = "None";
				}

				var contradictedStatusStr = "No";

				if(stateSlicesObj.isContradicted)
					contradictedStatusStr = "Yes";

				else if(stateSlicesObj.isShadowContradiction)
					contradictedStatusStr = "No, but shadowed by a contradicted ancestor.";


				retHtml += "<div class='dialog-properties-details'>" +
						"<ul>" +
							"<li><label>Depth:</label> " + stateSlicesObj.depth + "</li>" +
							"<li><label>Height:</label> " + HIPI.framework.Utilities.getArrayOfIntegersFromCommaSeparatedChain(componentPropertiesObj.dialogPositionChain).length + "</li>" +
							"<li><label>"+(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain) ? "Answered" : "Questioned")+":</label> " + (stateSlicesObj.isAnswered ? "Yes" : "No") + "</li>" +
							"<li><label>Contradicted:</label> " + contradictedStatusStr + "</li>" +
							"<li><label>Responses:</label> " + stateSlicesObj.responeCount + "</li>" +
							"<li><label>Link Source:</label> " + outgoingLinksHtml + "</li>" +
							"<li><label>Incoming Links:</label> " + incomingLinksHtml + "</li>" +
						"</ul>" +
					"</div>";
			}

			retHtml += "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		retStateObj.viewDialogProperties = globalStateObj.viewDialogProperties ? true : false;

		// There is no reason to run these cycles if the user isn't going to view the output.
		if(retStateObj.viewDialogProperties){

			var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

			retStateObj.depth = HIPI.lib.Dialogs.getDialogDepthAtPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, false, false);
			retStateObj.isAnswered = HIPI.lib.Dialogs.isDialogLevelAnswered(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, false);
			retStateObj.isContradicted = HIPI.lib.Contradictions.isTargetContradicted (globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, "");
			retStateObj.responeCount = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, false, false).length;
			retStateObj.isShadowContradiction = HIPI.lib.Dialogs.isDialogPositionDownstreamOfContradictedMessage(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

			if(dialogSubRef.link){

				// There can't be incoming links to this Dialog Position if it is itself a link.
				retStateObj.arrayOfLinkingArraysPointingHere = [];

				// If the Linking Array looks like ...  ["Howdy", "there", "partner"] ... then the following routine will create a 2-D array which looks like...
				// [["Howdy"], ["Howdy", "there"], ["Howdy", "there", "partner"]]
				var linkingArrayHeirarchy = [];

				for(var i=0; i<dialogSubRef.link.length; i++){

					var loopArr = [];

					for(var j=0; j<=i; j++)
						loopArr.push(dialogSubRef.link[j]);

					linkingArrayHeirarchy.push(loopArr);
				}

				// Let the user have the ability to visit any of the Dialog Positions within the hierarchy of a Link.
				retStateObj.arrayOfLinkingArraysToLinkSources = linkingArrayHeirarchy.map(function(loopLinkingArr){

					var mapToObj = {};

					mapToObj.dialogPositionChain =  HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, componentPropertiesObj.domain, loopLinkingArr);

					mapToObj.isContradicted = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, mapToObj.dialogPositionChain, "");

					mapToObj.anchorText = getAnchorTextFromLinkingArrayEntry(loopLinkingArr.pop());

					return mapToObj;
				});
			}
			else{

				// If the current Dialog does not come from a link then there isn't a way to show the link structure.
				retStateObj.arrayOfLinkingArraysToLinkSources = [];

				var dialogPositionChainsWhichLinkHeresArr = HIPI.lib.Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

				retStateObj.arrayOfLinkingArraysPointingHere = dialogPositionChainsWhichLinkHeresArr.map(function(loopDialogPositionChain){

					var mapToObj = {};

					mapToObj.dialogPositionChain = loopDialogPositionChain;

					mapToObj.isContradicted = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain, "");

					var linkingArrayFromLoopDialogPositionChain = HIPI.lib.Dialogs.getLinkingArrayFromDialogPositionChain(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain);

					mapToObj.anchorText = HIPI.lib.General.getHumanReadableLinkingArrayDescription(linkingArrayFromLoopDialogPositionChain);

					// Differentiate between an incoming Shadow Link and ones that were explicitly linked to from "link heads".
					mapToObj.isFromLinkHead = false;

					if(dialogSubRef.reverseLinks){

						dialogSubRef.reverseLinks.forEach(function(loopReverseLink){

							// Save cycles
							if(mapToObj.isFromLinkHead)
								return;

							var loopReverseLinkDialogPositionChain = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, componentPropertiesObj.domain, loopReverseLink);
							
							if(loopReverseLinkDialogPositionChain === loopDialogPositionChain)
								mapToObj.isFromLinkHead = true;
						});
					}

					return mapToObj;
				});
			}
		}

		return retStateObj;

		// Add "..." after truncating the link text, but only if the dialog message has reached the max size for a linking excerpt.
		function getAnchorTextFromLinkingArrayEntry(linkingArrayEntry){

			HIPI.framework.Utilities.ensureTypeString(linkingArrayEntry);

			if(linkingArrayEntry.length === HIPI.framework.Constants.getMaxCharacterExcerptForLinking())
				return HIPI.framework.Utilities.truncateBackToFirstSpace(linkingArrayEntry, HIPI.framework.Constants.getMaxCharacterExcerptForLinking(), 12) + "...";
			else
				return linkingArrayEntry;
		}
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var dialogPropertiesLink = document.getElementById("dialog-properties-link"+elementIdOfComponentInstanceWrapper);

		dialogPropertiesLink.addEventListener("click", function(e){

			HIPI.state.ActionMethods.viewDialogProperties(!stateSlicesObj.viewDialogProperties);

			e.preventDefault();

			return false;
		});

		// The link source could be comprised of multiple hyper links.
		var linkToDialogLinkSourceElements = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('link-select-message');

		for(var i=0; i<linkToDialogLinkSourceElements.length; i++){

			linkToDialogLinkSourceElements[i].addEventListener("click", function(e){

				var dialogPositionChainOnLink = this.getAttribute("link-dialog-position");

				HIPI.state.ActionMethods.selectMessage(componentPropertiesObj.domain, dialogPositionChainOnLink);

				e.preventDefault();

				return false;
			});
		}
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.VIEW_DIALOG_PROPERTIES :

				stateObj.viewDialogProperties = actionObj.viewFlag;

				break;
		}

		return stateObj;
	});

	componentObj.addStateCleaner(function(globalStateObj){

		HIPI.framework.Utilities.ensureTypeObject(globalStateObj);

		delete globalStateObj.viewDialogProperties;

		return globalStateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
