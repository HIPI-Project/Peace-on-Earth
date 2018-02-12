"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("newContradictionTabs");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");
	componentObj.defineComponentPropName("contradictionPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(HIPI.lib.Contradictions.isContradictionLevelSkeptical(componentPropertiesObj.contradictionPositionChain)){
			var classExtension = "skeptical";
			var dialogMessageTitle = "A New Contradiction Here Will Invalidate the Underlying Dialog";
		}
		else{
			var classExtension = "trusting";
			var dialogMessageTitle = "A New Contradiction Here Will Restore the Underlying Dialog to a State of TRUE";
		}

		var retHtml = "<nav class='tabs-nav'>" +
						"<ul>" +
							"<li><a class='"+(stateSlicesObj.newContradictionSelectedTab === "suggested-contradictions" ? "active-nav" : "inactive-nav")+"' id='nav-new-contradiction-suggestions"+elementIdOfComponentInstanceWrapper+"' href='#'>Suggested Contradictions</a></li>" +
							"<li><a class='"+(stateSlicesObj.newContradictionSelectedTab === "new-contradiction" ? "active-nav" : "inactive-nav")+"' id='nav-new-contradiction-custom"+elementIdOfComponentInstanceWrapper+"' href='#'>Create a New Contradiction</a></li>" +
						"</ul>" +
						"</nav>" +
						"<div class='nav-new-contradiction-bottom-border-"+classExtension+"'></div>" +
						"<div class='tabs-nav-container'>";

					if(stateSlicesObj.newContradictionSelectedTab === "suggested-contradictions")
						retHtml += "<suggestedContradictions domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"' contradictionPositionChain='"+componentPropertiesObj.contradictionPositionChain+"'></suggestedContradictions>";
					else if(stateSlicesObj.newContradictionSelectedTab === "new-contradiction")
						retHtml += "<newContradiction domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"' contradictionPositionChain='"+componentPropertiesObj.contradictionPositionChain+"'></newContradiction>";
					else
						throw new Error("Error in addHtmlGenerator for the <newContradictionTabs> component. Cannot determine the selected tab.");

		retHtml += "</div>";

		retHtml += "<h2 class='respond-to-title'>"+dialogMessageTitle+"</h2><div class='new-message-responding-to-message'>" + HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.respondToMessage) + "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		var subArrayRef = HIPI.lib.General.getDialogOrContradictionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);

		if(!subArrayRef.newContradictionSelectedTab)
			retStateObj.newContradictionSelectedTab = "suggested-contradictions";
		else
			retStateObj.newContradictionSelectedTab = subArrayRef.newContradictionSelectedTab;

		// So that users know what Dialog Message is being fought over.
		retStateObj.respondToMessage = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var tabOneElementId = "nav-new-contradiction-suggestions"+elementIdOfComponentInstanceWrapper;

		if(document.getElementById(tabOneElementId)){

			document.getElementById(tabOneElementId).addEventListener("click", function(e){

				e.preventDefault();

				HIPI.state.ActionMethods.newContradictionSelectTab(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain, "suggested-contradictions");

				return false;
			});
		}

		var tabTwoElementId = "nav-new-contradiction-custom"+elementIdOfComponentInstanceWrapper;

		if(document.getElementById(tabTwoElementId)){

			document.getElementById(tabTwoElementId).addEventListener("click", function(e){

				e.preventDefault();

				HIPI.state.ActionMethods.newContradictionSelectTab(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain, "new-contradiction");

				return false;
			});
		}
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.NEW_CONTRADICTION_SELECT_TAB :

				var subArrayRef = HIPI.lib.General.getDialogOrContradictionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain, actionObj.contradictionPositionChain);

				if(["suggested-contradictions", "new-contradiction"].indexOf(actionObj.tabName) === -1)
					throw new Error("Error in addReducer for <newContradictionTabs> component. The tabName is invalid: " + actionObj.tabName);

				subArrayRef.newContradictionSelectedTab = actionObj.tabName;

				console.log("Select New Contradiction Tab:", actionObj.tabName);

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
