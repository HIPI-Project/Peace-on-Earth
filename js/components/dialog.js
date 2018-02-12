"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("dialog");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!stateSlicesObj.message)
			throw new Error("Error in <dialog> addHtmlGenerator. A 'message' property does not exist on the stateSlicesObj.");

		var perpendicularOrientationClassName = HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain) ? "skeptical-dialog" : "trusting-dialog";

		var dialogWrapperClassNames = perpendicularOrientationClassName;
		dialogWrapperClassNames += stateSlicesObj.isAnswered ? " dialog-level-answered" : " dialog-level-unanswered";
		dialogWrapperClassNames += stateSlicesObj.isContradicted ? " dialog-level-contradicted" : " dialog-level-uncontradicted";
		dialogWrapperClassNames += stateSlicesObj.isShadowContradiction ? " dialog-level-shadow-contradiction" : "";

		var retHtml = "<div class='dialog-message "+dialogWrapperClassNames+"'>" + HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.message) + "</div>" +
						"<div class='dialog-commands-wrapper "+perpendicularOrientationClassName+"'>" +
							"<table cellpadding='0' cellspacing='0' width='100%'>" +
								"<tr>" +
									"<td width='33%'>" +
										"<button id='btn-contradict-dialog"+elementIdOfComponentInstanceWrapper+"'>" + (stateSlicesObj.isContradicted ? "Restore / Un-Contradict" : "Remove / Contradict" ) + "</button>" +
									"</td>" +
									"<td width='33%'>";

									if(stateSlicesObj.userOwnsMessage)
											retHtml += "<button class='"+(stateSlicesObj.userCanEditMessage ? "" : 'edit-message-disabled')+"' id='btn-edit-dialog"+elementIdOfComponentInstanceWrapper+"'>Edit</button>";

						retHtml += "</td>" +
									"<td width='33%' align='right'>" +
										// When a new Dialog is added it should be attached to the parent dialogPositionChain, not the address given in the component properties.
										"<button id='btn-start-new-parent-dialog"+elementIdOfComponentInstanceWrapper+"'>Add Something Better</button>" +
									"</td>" +
								"</tr>" +
							"</table>" +
						"</div>";

		retHtml += "<dialogProperties domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></dialogProperties>";

		if(stateSlicesObj.showContradictWindow)
			retHtml += "<contradictionWindow domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"' contradictionPositionChain=''></contradictionWindow>";

		if(stateSlicesObj.showEditMessageDialog)
			retHtml += "<editMessageWindow domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></editMessageWindow>";

		// The <dialog> component is responsible for rendering the <dialog> for one of its descendants via the <dialogSorter> component.
		if(stateSlicesObj.showPerpendicularLevel){

			// Invert the responses of "isSkeptical" method calls because going perpendicular adds a half-step. 
			if(!HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain)){
				var closeButtonText = ")-:";
				var closeButtonTitle = "Concede and close this offensive dialog window. \nIt is at an even level which questions or is skeptical of the base dialog message.";
				var dialogWindowClassName = "skeptical-dialog";
				var newMessageStr = "Offer the first skeptical response to the message below in an effort to gain answers and/or to discredit the base dialog message.";
			}
			else{
				var closeButtonText = ":-)";
				var closeButtonTitle = "Concede and close this defensive dialog window. \nIt is at an odd level which is supportive of the base dialog message.";
				var dialogWindowClassName = "trusting-dialog";
				var newMessageStr = "Offer the first response to the message below in an effort to support the base dialog message.";
			}

			retHtml += "<div dialog-height='"+stateSlicesObj.height+"' id='dialog-window"+elementIdOfComponentInstanceWrapper+"' class='dialog-window "+dialogWindowClassName+"'>" +
							"<div class='dialog-window-title-bar'>" +
								"<span class='dialog-window-status-bar' id='status-bar-parent-address"+componentPropertiesObj.dialogPositionChain+"'></span>" +
								"<button class='btn-leave-perpendicular' title='"+closeButtonTitle+"' id='btn-leave-perpendicular"+elementIdOfComponentInstanceWrapper+"'>"+closeButtonText+"</button>" +
							"</div>";

			// If the user chooses to show a descendant the parent needs to determine if there are any to display.	
			// If there is at least one child <dialog> available then let the <dialogSorter> component render it.
			// Otherwise let the user know that a descendant isn't available yet and they can be the first to add a child <dialog>.
			if(stateSlicesObj.perpendicularDialogsExist){
				retHtml += "<dialogSorter domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></dialogSorter>";
			}
			else{
				retHtml += "<div class='dialog-empty-message'>"+newMessageStr+"</div>";
				retHtml += "<button id='btn-start-new-dialog"+elementIdOfComponentInstanceWrapper+"'>Continue the Dialog</button>";
			}

			if(stateSlicesObj.showNewMessageDialog)
				retHtml += "<newMessageWindow domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></newMessageWindow>";

			retHtml += "</div>";
		}

		return retHtml;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var parentDialogPositionChain = HIPI.framework.Utilities.removeIntegerFromEndOfCommaSeparatedChain(componentPropertiesObj.dialogPositionChain);

		var startNewDialogElem = document.getElementById("btn-start-new-dialog"+elementIdOfComponentInstanceWrapper);
		if(startNewDialogElem){

			startNewDialogElem.addEventListener("click", function(){

				HIPI.state.ActionMethods.showNewMessageDialog(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

				return false;
			});
		}

		var startNewParentDialogElem = document.getElementById("btn-start-new-parent-dialog"+elementIdOfComponentInstanceWrapper);
		if(startNewParentDialogElem){

			startNewParentDialogElem.addEventListener("click", function(){

				HIPI.state.ActionMethods.showNewMessageDialog(componentPropertiesObj.domain, parentDialogPositionChain);

				return false;
			});
		}

		var contradictDialogElem = document.getElementById("btn-contradict-dialog"+elementIdOfComponentInstanceWrapper);
		if(contradictDialogElem){

			contradictDialogElem.addEventListener("click", function(){

				HIPI.state.ActionMethods.showContradictWindow(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, "", null);

				return false;
			});
		}

		var leavePerpendicularElem = document.getElementById("btn-leave-perpendicular"+elementIdOfComponentInstanceWrapper);
		if(leavePerpendicularElem){

			leavePerpendicularElem.addEventListener("click", function(){

				HIPI.lib.General.animateRemovalOfDialogStackFromDom(elementIdOfComponentInstanceWrapper)
				.then(function(){
					HIPI.state.ActionMethods.leavePerpendicular(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
				});

				return false;
			});
		}

		var editMessageButton = document.getElementById("btn-edit-dialog"+elementIdOfComponentInstanceWrapper);
		if(editMessageButton){

			editMessageButton.addEventListener("click", function(){

				if(!stateSlicesObj.userCanEditMessage)
					alert("You can't edit this message, either because there are one or more Contradictions attached or someone else has added a message downstream.");
				else
					HIPI.state.ActionMethods.editMessage(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

				return false;
			});
		}

		// Unfortunately it is not possible to set data in the title bar of the Dialog Window with an HTML Generator because the pop-ups are launched from the parents (the dialogPositionChain of the child is unknown).
		// Therefore, when a Dialog loads try setting the value with a call to the DOM, located by an element ID derived from its parent's address.
		// The HTML5 spec says that Element ID's must contain a character and may not contain any spaces... so the commas in a Dialog Position Chain do not require substitution.
		var statsBarParentAddressElem = document.getElementById("status-bar-parent-address"+parentDialogPositionChain);
		if(statsBarParentAddressElem){

			// Put something in the Status area to prevent the U.I. from collapsing.
			// Use the "visibility" CSS property instead of the "display:none" to keep buttons in the same position as users cycle NEXT/PREVIOUS.
			var dialogAnsweredStatus = "EMPTY";

			if(stateSlicesObj.isAnswered){

				if(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain))
					dialogAnsweredStatus = "Answered";
				else
					dialogAnsweredStatus = "In Question";

				dialogAnsweredStatus += " (" + (stateSlicesObj.childCountAll - stateSlicesObj.childCountAnswered) + "/" + stateSlicesObj.childCountAll + ")";
			}

			statsBarParentAddressElem.innerText = dialogAnsweredStatus;

			if(dialogAnsweredStatus === "EMPTY")
				statsBarParentAddressElem.style.visibility = "hidden";
			else
				statsBarParentAddressElem.style.visibility = "visible";
		}

		// If the pop-up is launched but no perpendicular dialogs exist then the Status Bar message will need to be hidden immediately because a Dialog won't be able to set it on the Parent Window.
		if(stateSlicesObj.showPerpendicularLevel && !stateSlicesObj.perpendicularDialogsExist){

			var statsBarCurrentAddressElem = document.getElementById("status-bar-parent-address"+componentPropertiesObj.dialogPositionChain);

			statsBarCurrentAddressElem.style.visibility = "hidden";
		}
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		var retObj = {};

		retObj.message = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
		retObj.showPerpendicularLevel = dialogSubRef.showPerpendicularLevel ? true : false;
		retObj.showNewMessageDialog = dialogSubRef.showNewMessageDialog ? true : false;
		retObj.showEditMessageDialog = dialogSubRef.showEditMessageDialog ? true : false;
		retObj.showContradictWindow = dialogSubRef.showContradictWindow ? true : false;

		retObj.height = HIPI.framework.Utilities.getArrayOfIntegersFromCommaSeparatedChain(componentPropertiesObj.dialogPositionChain).length;

		// To find out if a Perpendicular Dialog exists it is first necessary to find out if the user wants to see Contradicted entries.
		var childDialogPositionsFilteredByUserSettingsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
		
		childDialogPositionsFilteredByUserSettingsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(globalStateObj, componentPropertiesObj.domain, childDialogPositionsFilteredByUserSettingsArr);

		if(childDialogPositionsFilteredByUserSettingsArr.length)
			retObj.perpendicularDialogsExist = true;
		else
			retObj.perpendicularDialogsExist = false;

		if(HIPI.lib.Dialogs.isDialogLevelAnswered(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, false))
			retObj.isAnswered = true;
		else
			retObj.isAnswered = false;

		if(HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, ""))
			retObj.isContradicted = true;
		else
			retObj.isContradicted = false;

		retObj.childCountAll = 0;
		retObj.childCountAnswered = 0;

		if(retObj.isAnswered){

			var childPositionChainsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, false, false);

			childPositionChainsArr.forEach(function(loopChildPositionChain){

				if(HIPI.lib.Dialogs.isDialogLevelAnswered(globalStateObj, componentPropertiesObj.domain, loopChildPositionChain, false))
					retObj.childCountAnswered++;
			});

			retObj.childCountAll = childPositionChainsArr.length;
		}

		// The call to "canUserEditDialogMesssage()" is very expensive.
		// The application will needlessly slow down if user is viewing a large stack of Dialog windows.
		// Assume that the EDIT button will be covered up if a child is selected.
		var isChildMessageSelected = false;
		dialogSubRef.dialogs.forEach(function(loopChildDialogRef){

			if(loopChildDialogRef.selected)
				isChildMessageSelected = true;
		});

		// The check for showing an Edit button is expensive so users can disable this feature in their settings.
		if(isChildMessageSelected || !HIPI.lib.General.userSettingsShowEditButtons(globalStateObj)){

			retObj.userOwnsMessage = false;
			retObj.userCanEditMessage = false;
		}
		else{

			retObj.userOwnsMessage = HIPI.lib.Contributions.didCurrentUserCreateDialogMesssage(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
			retObj.userCanEditMessage = HIPI.lib.Contributions.canUserEditDialogMesssage(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);
		}

		// If a Dialog has been contradicted then don't consider it a Shadow Contradiction.
		retObj.isShadowContradiction = false;

		if(!retObj.isContradicted)
			retObj.isShadowContradiction = HIPI.lib.Dialogs.isDialogPositionDownstreamOfContradictedMessage(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		return retObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
