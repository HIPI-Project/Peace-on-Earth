"use strict";

postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("myContributions");
	componentObj.defineComponentPropName("domain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!stateSlicesObj.allContributionsArr.length)
			return "<p>You haven't added any messages or contradictions using this computer on the selected domain.</p> <p>(Tip): You can transfer your contributions between machines by copying the file named &quot;"+HIPI.framework.AppState.urlToPrivateJsonStore+"&quot;.</p>";

		var retHtml = "<div class='trust-ratio-container'><label class='trust-ratio-label'>My Trust Ratio:</label> " + Math.round(stateSlicesObj.trustRatio * 100) + "%</div>";

		retHtml += "<ul>" + 
						"<li>Message Count :-) " + stateSlicesObj.messageCountTrusting + "</li>" +
						"<li>Message Count )-: " + stateSlicesObj.messageCountSkeptical + "</li>" +
						"<li>Contradicted Messages: " + stateSlicesObj.contradictedMessages + "</li>" +
						"<li>Missing Messages: " + stateSlicesObj.missingMessages + "</li>" +
					"</ul>"+
					"<ul>"+
						"<li>Contradiction Count :-) " + stateSlicesObj.contradictionCountTrusting + "</li>" +
						"<li>Contradiction Count )-: " + stateSlicesObj.contradictionCountSkeptical + "</li>" +
						"<li>Contradicted Contradictions: " + stateSlicesObj.contradictedContradictions + "</li>" +
						"<li>Missing Contradictions: " + stateSlicesObj.missingContradictions + "</li>" +
					"</ul>";

		retHtml += "<table cellpadding='2' cellspacing='0' border='1' width='100%' class='my-contributions-table'>" + 
						"<tr>" +
							"<th>Reference</th>" +
							"<th>Type</th>" +
							"<th>Status</th>" +
							"<th>Date Created</th>" +
							"<th>Connections</th>" +
						"</tr>";

		stateSlicesObj.allContributionsArr.forEach(function(loopContributionObj){

			var dateObj = new Date(loopContributionObj.date);

			var amPmStr = (dateObj.getHours() >= 12) ? "pm" : "am";
			var hours12 = (dateObj.getHours() > 12) ? (dateObj.getHours() - 12) : dateObj.getHours();
			var minutesStr = ((dateObj.getMinutes() + "").length === 1) ? ("0" + dateObj.getMinutes()) : dateObj.getMinutes(); 
			var dateStr = (dateObj.getMonth() +1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear() + ' ' + hours12 + ':' + minutesStr + ' ' + amPmStr;

			if(loopContributionObj.isContradiction)
				var dataType = "Contradiction";
			else if(loopContributionObj.isDialogLink && loopContributionObj.isDialogMessage)
				var dataType = "Link";
			else if(loopContributionObj.isDialogMessage)
				var dataType = "Message";
			else
				throw new Error("Error in addHtmlGenerator for <myContributions> unknown data type.");

			var statusStr = "No longer exists within " + HIPI.framework.AppState.urlToPublicJsonStore;
			var contradictedIndicatorClass = "";

			var connectionsHTML = "";

			if(loopContributionObj.existsInPublicDatabase){

				if(loopContributionObj.isSkeptical)
					dataType = ")-: " + dataType;
				else
					dataType = ":-) " + dataType;

				if(loopContributionObj.isContradiction)
					statusStr = loopContributionObj.isContradicted ? "Contradicted" : "Valid";
				else
					statusStr = loopContributionObj.isContradicted ? "Contradicted" : loopContributionObj.answeredStatus;

				contradictedIndicatorClass = loopContributionObj.isContradicted ? "contradicted-contribution-row" : "";

				var existsInDatabaseClassName = "";

				var linkStart = "<a href='#' class='link-select-message' link-dialog-position='"+loopContributionObj.dialogPositionChain+"'>";
				var linkEnd = "</a>";

				if(loopContributionObj.connections.incomingLinkCount)
					connectionsHTML += "<div>Incoming Links: " + loopContributionObj.connections.incomingLinkCount + "</div>";
				if(loopContributionObj.connections.childMessageCount)
					connectionsHTML += "<div>Child Messages: " + loopContributionObj.connections.childMessageCount + "</div>";
				if(loopContributionObj.connections.childContradictionCount)
					connectionsHTML += "<div>Child Contradictions: " + loopContributionObj.connections.childContradictionCount + "</div>";

				if(!connectionsHTML && loopContributionObj.isDialogLink)
					connectionsHTML = "Link Deletion Unsupported";

				if(!connectionsHTML)
					connectionsHTML = "<button class='delete-leaf-contribution' link-json='"+HIPI.framework.Utilities.escapeHtml(JSON.stringify(loopContributionObj.link))+"'>Delete</button>";
			}
			else{
				var existsInDatabaseClassName = "not-exists-contribution-row";

				var linkStart = "";
				var linkEnd = "";

				connectionsHTML = "<button class='remove-ownership-contribution' link-json='"+HIPI.framework.Utilities.escapeHtml(JSON.stringify(loopContributionObj.link))+"'>Remove Ownership</button>"
			}

			retHtml += "<tr class='"+existsInDatabaseClassName+"'>" + 
							"<td class='"+contradictedIndicatorClass+"'>" + linkStart + HIPI.framework.Utilities.htmlizeStringWithLineBreaks(loopContributionObj.humanReadableLinkDesc) + linkEnd + "</td>" +
							"<td>" + dataType + "</td>" +
							"<td class='"+contradictedIndicatorClass+"'>" + statusStr + "</td>" +
							"<td>" + dateStr + "</td>" +
							"<td>" + connectionsHTML + "</td>" +
						"</tr>";
		});

		retHtml += "</table>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var stateSlices = {};

		// Merge Dialog Messages and Contradictions into a single array of Contributions from the user so that the list can be sorted by date.
		stateSlices.allContributionsArr = [];

		stateSlices.messageCountTrusting = 0;
		stateSlices.messageCountSkeptical = 0;
		stateSlices.contradictionCountTrusting = 0;
		stateSlices.contradictionCountSkeptical = 0;
		stateSlices.missingContradictions = 0;
		stateSlices.missingMessages = 0;
		stateSlices.contradictedMessages = 0;
		stateSlices.contradictedContradictions = 0;

		globalStateObj = HIPI.lib.Contributions.ensureDomainIsInitializedOnPrivateState(globalStateObj, componentPropertiesObj.domain);

		globalStateObj.privateState.domains.forEach(function(loopDomainObj){

			if(loopDomainObj.domainName !== componentPropertiesObj.domain)
				return;

			loopDomainObj.myMessages.forEach(function(loopDialogMessageObj){

				var contributionObj = {};

				var dialogPositionExists = true;

				try{
					var loopDialogPositionChain = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(globalStateObj, componentPropertiesObj.domain, loopDialogMessageObj.link);
				}
				catch(e){
					dialogPositionExists = false;
				}

				// Figure out if the current contribution is a link by checking to see if its linking array has a 2nd dimension. 
				contributionObj.isDialogLink = false;

				loopDialogMessageObj.link.forEach(function(loopLinkElem){

					if(Array.isArray(loopLinkElem))
						contributionObj.isDialogLink = true;
				});

				contributionObj.isDialogMessage = true;
				contributionObj.isContradiction = false;
				contributionObj.date = loopDialogMessageObj.date;
				contributionObj.link = loopDialogMessageObj.link;
				contributionObj.existsInPublicDatabase = dialogPositionExists;
				contributionObj.humanReadableLinkDesc = HIPI.lib.General.getHumanReadableLinkingArrayDescription(loopDialogMessageObj.link);

				contributionObj.connections = {};
				contributionObj.connections.incomingLinkCount = 0;
				contributionObj.connections.childMessageCount = 0;
				contributionObj.connections.childContradictionCount = 0;

				if(dialogPositionExists){

					var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain);

					var isDialogAnswered = HIPI.lib.Dialogs.isDialogLevelAnswered(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain, false);

					if(HIPI.lib.Dialogs.isDialogLevelSkeptical(loopDialogPositionChain)){

						contributionObj.answeredStatus = isDialogAnswered ? "Answered" : "Unanswered";

						stateSlices.messageCountSkeptical++;
					}
					else{
						contributionObj.answeredStatus = isDialogAnswered ? "In Question" : "Unquestioned";

						stateSlices.messageCountTrusting++;
					}

					contributionObj.isSkeptical = HIPI.lib.Dialogs.isDialogLevelSkeptical(loopDialogPositionChain);
					contributionObj.dialogPositionChain = loopDialogPositionChain;

					if(HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain, "")){

						contributionObj.isContradicted = true;

						stateSlices.contradictedMessages++;
					}
					else{

						contributionObj.isContradicted = false;						
					}

					// Only show the "incoming link count" if the current Dialog Entry has been explicitly linked to.
					// Shadow links pointing at an entry beneath the Link Source does not count.
					// The "reverseLinks" property is only created at the time a Symbolic Link is created, it is not affected by the Shadow Links filler routine.
					if(dialogSubRef.reverseLinks)
						contributionObj.connections.incomingLinkCount = HIPI.lib.Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain).length;

					// Don't consider children when dealing with a Link because it should be possible to detach/delete a Link Head.
					if(dialogSubRef.link)
						contributionObj.connections.childMessageCount = 0;
					else
						contributionObj.connections.childMessageCount = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain, true, false).length;
					
					contributionObj.connections.childContradictionCount = dialogSubRef.contradictions ? dialogSubRef.contradictions.length : 0;
				}
				else{

					contributionObj.answeredStatus = null;
					contributionObj.isContradicted = null;
					contributionObj.isSkeptical = null;
					contributionObj.dialogPositionChain = null;

					stateSlices.missingMessages++;
				}

				stateSlices.allContributionsArr.push(contributionObj);
			});

			loopDomainObj.myContradictions.forEach(function(loopContradictionMessageObj){

				var contributionObj = {};

				var contradictionPositionExists = true;

				try{
					var contradictionLinkObj = HIPI.lib.Contradictions.getDialogAndContradictionPositionChainsFromLinkingArray(globalStateObj, componentPropertiesObj.domain, loopContradictionMessageObj.link);
				}
				catch(e){
					contradictionPositionExists = false;
				}

				contributionObj.isDialogMessage = false;
				contributionObj.isDialogLink = false;
				contributionObj.isContradiction = true;
				contributionObj.answeredStatus = null;   // Contradictions don't have a notion of "answered". 
				contributionObj.date = loopContradictionMessageObj.date;
				contributionObj.link = loopContradictionMessageObj.link;
				contributionObj.existsInPublicDatabase = contradictionPositionExists;
				contributionObj.humanReadableLinkDesc = HIPI.lib.General.getHumanReadableLinkingArrayDescription(loopContradictionMessageObj.link);

				contributionObj.connections = {};
				contributionObj.connections.incomingLinkCount = null;
				contributionObj.connections.childMessageCount = null;
				contributionObj.connections.childContradictionCount = 0;

				if(contradictionPositionExists){

					var contradictionSubRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, componentPropertiesObj.domain, contradictionLinkObj.dialogPositionChain, contradictionLinkObj.contradictionPositionChain);

					contributionObj.dialogPositionChain = contradictionLinkObj.dialogPositionChain;

					if(HIPI.lib.Contradictions.isContradictionLevelSkeptical(contradictionLinkObj.contradictionPositionChain)){

						stateSlices.contradictionCountSkeptical++;

						contributionObj.isSkeptical = true;
					}
					else{

						stateSlices.contradictionCountTrusting++;

						contributionObj.isSkeptical = false;
					}

					if(HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, contradictionLinkObj.dialogPositionChain, contradictionLinkObj.contradictionPositionChain)){

						contributionObj.isContradicted = true;

						stateSlices.contradictedContradictions++;
					}
					else{

						contributionObj.isContradicted = false;
					}

					contributionObj.connections.childContradictionCount = contradictionSubRef.contradictions ? contradictionSubRef.contradictions.length : 0;
				}
				else{

					contributionObj.isContradicted = null;
					contributionObj.isSkeptical = null;
					contributionObj.dialogPositionChain = null;

					stateSlices.missingContradictions++;
				}

				stateSlices.allContributionsArr.push(contributionObj);
			});
		});

		stateSlices.allContributionsArr.sort(function(a, b){
			return b.date - a.date;
		});

		// Prevent division-by-zero while calculating ratio of submissions which are NOT in a contradicted status.
		if(stateSlices.allContributionsArr.length){

			var unContradictedContributionsArr = stateSlices.allContributionsArr.filter(function(loopContributionObj){ return !loopContributionObj.isContradicted && loopContributionObj.existsInPublicDatabase });
			var allContributionsExistingInDatabaseArr = stateSlices.allContributionsArr.filter(function(loopContributionObj){ return loopContributionObj.existsInPublicDatabase });

			stateSlices.trustRatio = unContradictedContributionsArr.length / allContributionsExistingInDatabaseArr.length;
		}
		else{
			stateSlices.trustRatio = 0;
		}

		return stateSlices;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var linkToDialogLinkSourceElements = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('link-select-message');

		for(var i=0; i<linkToDialogLinkSourceElements.length; i++){

			linkToDialogLinkSourceElements[i].addEventListener("click", function(e){

				var dialogPositionChainOnLink = this.getAttribute("link-dialog-position");

				HIPI.state.ActionMethods.selectMessage(componentPropertiesObj.domain, dialogPositionChainOnLink, "dialogs");

				e.preventDefault();

				return false;
			});
		}

		var deleteLeafButtonElements = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('delete-leaf-contribution');

		for(var i=0; i<deleteLeafButtonElements.length; i++){

			deleteLeafButtonElements[i].addEventListener("click", function(e){

				var linkInJSON = this.getAttribute("link-json");

				try{
					var linkingArrayFromButton = JSON.parse(linkInJSON);
				}
				catch(e){
					throw new Error("Cannot parse a JSON link for deleting contributions.");
				}

				if(confirm("Are you sure that you want to permanently delete this entry from the public database and your list of contributions?")){

					HIPI.state.ActionMethods.contributionDeleteLeaf(componentPropertiesObj.domain, linkingArrayFromButton);

					HIPI.framework.AppState.saveStore()
					.then(function(){
						console.log("Store was saved successfully after deleting a Contribution.");
					});
				}

				e.preventDefault();

				return false;
			});
		}

		var removeOwnershipButtonElements = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('remove-ownership-contribution');

		for(var i=0; i<removeOwnershipButtonElements.length; i++){

			removeOwnershipButtonElements[i].addEventListener("click", function(e){

				var linkInJSON = this.getAttribute("link-json");

				try{
					var linkingArrayFromButton = JSON.parse(linkInJSON);
				}
				catch(e){
					throw new Error("Cannot parse a JSON link for removing ownership.");
				}

				if(confirm("Are you sure that you want to remove this entry from your list of contributions?")){

					HIPI.state.ActionMethods.contributionRemoveOwnership(componentPropertiesObj.domain, linkingArrayFromButton);

					HIPI.framework.AppState.saveStore()
					.then(function(){
						console.log("Store was saved successfully after removing ownership from a Contribution.");
					});
				}

				e.preventDefault();

				return false;
			});
		}
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.CONTRIBUTION_DELETE_LEAF :

				if(actionObj.linkingArr.indexOf(HIPI.framework.Constants.getDialogAndContradictionPositionChainArraySeparator()) === -1)
					var linkIsToDialogInsteadOfContradiction = true;
				else
					var linkIsToDialogInsteadOfContradiction = false;

				if(linkIsToDialogInsteadOfContradiction){

					var dialogPositionChainFromLink = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(stateObj, actionObj.domain, actionObj.linkingArr);

					var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, dialogPositionChainFromLink);

					if(dialogSubRef.link){

						// Some complications arise when it comes to the removal of links.
						// Here are some steps which get pretty close to the goal.
						//   1. Ensure that the current Dialog Position belongs to a Link Head.
						//   2. Get a reference to the source of the link.
						//       a. Make sure that the source has a .reverseLinks property.
						//       b. Loop over all of the .reverseLinks and find the DialogPositionChain which points back to the original target.
						//       c. Make sure that exactly one match was found out of the .reverseLinks and then .splice() out its index.
						//   3. Call deleteDialogPosition() on the Link Head.
						//
						// Here are the remaining problems.
						//   1. Removing the Link Head and ".reverseLinks entry" doesn't clean up any related Shadow Links.
						//   2. If there are Contradictions attached to a Shadow Link then it shouldn't be possible to detach the Link Head
						//       a. The DELETE button would need to be conditionally omitted if Contradictions are found.
						//   3. If there are any Contradictions attached downstream on a Link Head or a Shadow Link then it shouldn't be possible to delete.
						//   4. There can be multiple links off the same message and it can be difficult to determine which Shadow Links belong to which Link Heads.
						//       a. Clearing out the old Shadow Links and re-inserting as part of the fillShadowLinks() routine isn't easily viable because there could be Contradictions attached downstream.
						//
						// It seems like the best option would be to build a new method named something like findAllShadowLinksConnectedToLinkHead() 
						// Under the current database architecture this could be tricky but it should still be possible.
						throw new Error("Error in Reducer for CONTRIBUTION_DELETE_LEAF. Link deletion is currently unsupported.");
					}
					else{

						// Get a list of every Dialog Position which has linked to the Message source (whether it is a Shadow Link or a Link Head).
						// These entries will also need to be deleted... which is fine because they too will not have any descendants.
						var allDialogPositionChainsWhichLinkToMessageArr = HIPI.lib.Dialogs.getArrayOfDialogPositionChainsWhichLinkToTheDialogPosition(stateObj, actionObj.domain, dialogPositionChainFromLink);

						// It is OK to remove the message now that an array of possible links is stored in memory.
						stateObj = deleteDialogPosition(stateObj, actionObj.domain, dialogPositionChainFromLink);

						allDialogPositionChainsWhichLinkToMessageArr.forEach(function(loopDialogPositionWhichLinksHere){
							stateObj = deleteDialogPosition(stateObj, actionObj.domain, loopDialogPositionWhichLinksHere);
						});
					}
				}
				else{	

					var contradictionLinkObj = HIPI.lib.Contradictions.getDialogAndContradictionPositionChainsFromLinkingArray(stateObj, actionObj.domain, actionObj.linkingArr);

					// Get a reference to the contradiction's parent which may be either a Dialog or another Contradiction.
					var parentContradictionPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(contradictionLinkObj.contradictionPositionChain);

					var parentContradictionSubRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, contradictionLinkObj.dialogPositionChain, parentContradictionPositionChain);

					var indexOfFinalContradictionLeaf = contradictionLinkObj.contradictionPositionChain.split(',').pop();

					// Both dialogs and contradictions may contain a "contradictions" array as their property.
					// While the .contradictions property is optional, it is known to exist in this case because the linking array said so.
					parentContradictionSubRef.contradictions.splice(indexOfFinalContradictionLeaf, 1);
				}

				stateObj = removeOwnership(stateObj, actionObj.domain, actionObj.linkingArr);

				break;

			case HIPI.state.ActionNames.CONTRIBUTION_REMOVE_OWNERSHIP :

				stateObj = removeOwnership(stateObj, actionObj.domain, actionObj.linkingArr);

				break;
		}

		return stateObj;

		function deleteDialogPosition(globalStateObj, domainName, dialogPositionChain){

			globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

			var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, dialogPositionChain);

			if(dialogSubRef.dialogs && dialogSubRef.dialogs.length){
				if(!HIPI.lib.Dialogs.isDialogPositionTheLinkHead(globalStateObj, domainName, dialogPositionChain))
					throw new Error("Error in Reducer for CONTRIBUTION_DELETE_LEAF.  This method should never be called on a Dialog Position which has children unless it is a Link Head.");
			}

			if(dialogSubRef.contradictions && dialogSubRef.contradictions.length)
				throw new Error("Error in Reducer for CONTRIBUTION_DELETE_LEAF.  This method should never be called on a Dialog Position which has contradictions.");

			// Get a reference to the message's parent so that the entry to be removed can be "sliced out".
			// The index to be deleted can found on last Dialog position in the chain
			var parentDialogPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(dialogPositionChain);

			var parentDialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, domainName, parentDialogPositionChain);

			var indexOfFinalLeaf = dialogPositionChain.split(',').pop();

			parentDialogSubRef.dialogs.splice(indexOfFinalLeaf, 1);

			globalStateObj = HIPI.lib.Dialogs.recalculateDepthProperiesOnParentChain(globalStateObj, domainName, parentDialogPositionChain);
			
			globalStateObj = HIPI.lib.Dialogs.recalculateAnsweredStatusOnParentChain(globalStateObj, domainName, parentDialogPositionChain);

			return globalStateObj;
		}

		function removeOwnership(globalStateObj, domainName, linkingArr){

			globalStateObj = HIPI.framework.Utilities.copyObject(globalStateObj);

			var linkWasFound = false;

			globalStateObj.privateState.domains.forEach(function(loopDomainObj, domainIndex){

				if(loopDomainObj.domainName !== domainName)
					return;

				loopDomainObj.myMessages.forEach(function(loopDialogMessageObj, myMessageIndex){

					if(linkWasFound)
						return;

					if(HIPI.lib.General.areLinkingArraysEqual(loopDialogMessageObj.link, linkingArr)){

						linkWasFound = true;

						globalStateObj.privateState.domains[domainIndex].myMessages.splice(myMessageIndex, 1);
					}
				});

				loopDomainObj.myContradictions.forEach(function(loopContradictionObj, myContradictionIndex){

					if(linkWasFound)
						return;

					if(HIPI.lib.General.areLinkingArraysEqual(loopContradictionObj.link, linkingArr)){

						linkWasFound = true;

						globalStateObj.privateState.domains[domainIndex].myContradictions.splice(myContradictionIndex, 1);
					}
				});
			});

			if(!linkWasFound)
				throw new Error("Error in removeOwnership function. Cannot find a match for the linkingArr: ", linkingArr);

			return globalStateObj;
		}
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
