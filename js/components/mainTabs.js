"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("mainTabs");
	componentObj.defineComponentPropName("domain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "<nav class='tabs-root'>" +
			"<ul>" +
					"<li><a class='"+(stateSlicesObj.mainSelectedTab === "dialogs" ? "active-nav" : "inactive-nav")+"' class='inactive-nav' id='nav-dialogs"+elementIdOfComponentInstanceWrapper+"' href='#'>Dialogs</a></li>" +
					"<li><a class='"+(stateSlicesObj.mainSelectedTab === "map" ? "active-nav" : "inactive-nav")+"' class='inactive-nav' id='nav-map"+elementIdOfComponentInstanceWrapper+"' href='#'>Map</a></li>" +
					"<li><a class='"+(stateSlicesObj.mainSelectedTab === "contributions" ? "active-nav" : "inactive-nav")+"' class='inactive-nav' id='nav-contributions"+elementIdOfComponentInstanceWrapper+"' href='#'>My Contributions</a></li>" +
			"</ul>" +
		"</nav>" +
		"<div class='nav-bottom-border'></div>"+
		"<section class='section-app-main' id='main-section"+elementIdOfComponentInstanceWrapper+"'>";

		if(stateSlicesObj.mainSelectedTab === "dialogs")
			retHtml += "<dialogs domain='"+componentPropertiesObj.domain+"'></dialogs>";
		else if(stateSlicesObj.mainSelectedTab === "map")
			retHtml += "<map domain='"+componentPropertiesObj.domain+"'></map>";
		else if(stateSlicesObj.mainSelectedTab === "contributions")
			retHtml += "<myContributions domain='"+componentPropertiesObj.domain+"'></myContributions>";
		else
			throw new Error("Error in <mainTabs>, cannot find a matching tab name: " + stateSlicesObj.mainSelectedTab);

		retHtml += "<section>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		var domainRoot = HIPI.lib.General.getReferenceToDomainRoot(globalStateObj, componentPropertiesObj.domain);

		if(!domainRoot.mainSelectedTab)
			retStateObj.mainSelectedTab = "dialogs";
		else
			retStateObj.mainSelectedTab = domainRoot.mainSelectedTab;

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		document.getElementById("nav-dialogs"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(e){

			HIPI.state.ActionMethods.mainSelectTab(componentPropertiesObj.domain, "dialogs");

			e.preventDefault();

			return false;
		});

		document.getElementById("nav-map"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(e){

			HIPI.state.ActionMethods.mainSelectTab(componentPropertiesObj.domain, "map");

			e.preventDefault();

			return false;
		});

		document.getElementById("nav-contributions"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(e){

			HIPI.state.ActionMethods.mainSelectTab(componentPropertiesObj.domain, "contributions");

			e.preventDefault();

			return false;
		});
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.MAIN_SELECT_TAB :

				HIPI.lib.General.ensureValidMainTabName(actionObj.tabName);

				var domainRoot = HIPI.lib.General.getReferenceToDomainRoot(stateObj, actionObj.domain);

				domainRoot.mainSelectedTab = actionObj.tabName;

				// Make sure to cache the properties in case users swith to the Map before changing domains or other actions. 
				stateObj = HIPI.lib.Dialogs.cacheDialogDepths(stateObj, stateObj.selectedDomain, "", false);
				stateObj = HIPI.lib.Dialogs.cacheAnsweredStatus(stateObj, stateObj.selectedDomain, "", false);

				break;
		}

		return stateObj;
	});

	componentObj.addStateCleaner(function(stateObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);

		for(var i=0; i<stateObj.domains.length; i++)
			delete stateObj.domains[i].mainSelectedTab;

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
