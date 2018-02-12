"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("map");
	componentObj.defineComponentPropName("domain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "";

		if(stateSlicesObj.isEmpty){

			retHtml = "There aren't any dialogs to map on this domain.";
		}
		else{
			retHtml = 	"<form class='map-form' id='map-form"+stateSlicesObj.mapInstanceUniqueId+"'>" + 
							"<span class='map-links-checkbox-wrapper'><input type='checkbox' class='map-links-checkbox' id='map-links-checkbox"+stateSlicesObj.mapInstanceUniqueId+"' "+ (stateSlicesObj.showSymbolicLinksOnMap ? " checked='checked' " : "") +" /> Display Symbolic Links</span>" +
							"<input type='text' class='map-search-input' id='map-search"+stateSlicesObj.mapInstanceUniqueId+"' value='' placeholder='Keyword Search' />" +
						"</form>" +
						"<div class='map-container' id='map-container"+stateSlicesObj.mapInstanceUniqueId+"' style='height:100px; width:100px;'>" + 
							componentObj.mapRowOrColumnObj.generateHtml() +
							"<svg class='map-svg-container' width='1' height='1' id='map-svg-container"+stateSlicesObj.mapInstanceUniqueId+"' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
								'<defs>' +
									'<marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="2" orient="auto" markerUnits="strokeWidth">' +
										'<path d="M0,0 L0,4 L6,2 z" fill="#FFF" />' +
									'</marker>' +
									'<filter id="line-shadow" x="0" y="0">' +
										'<feOffset result="offOut" in="SourceAlpha" dx="1" dy="1" />' +
										'<feGaussianBlur result="blurOut" stdDeviation="1.2" />' +
										'<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />' +

										// This will add a "spread" to the shadow.
										'<feComponentTransfer>'+
											'<feFuncA type="gamma" exponent="0.8" amplitude="4"/>'+
										'</feComponentTransfer>'+
									'</filter>' +
								'</defs>'+
							"</svg>"+
						"</div>";
		}

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		if(!globalStateObj.privateState.userSettings)
			globalStateObj.privateState.userSettings = {};

		var retStateObj = {};

		var showContradictedMessagesFlag = HIPI.lib.General.userSettingsShowContradictedEntries(globalStateObj);

		var baseMessageDialogPositions = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChains(globalStateObj, componentPropertiesObj.domain, "", showContradictedMessagesFlag, false);

		retStateObj.isEmpty = baseMessageDialogPositions.length ? false : true;

		// The default setting for showing symbolic links on a map is TRUE.
		if(typeof globalStateObj.privateState.userSettings.showSymbolicLinksOnMap === "undefined")
			retStateObj.showSymbolicLinksOnMap = true;
		else
			retStateObj.showSymbolicLinksOnMap = globalStateObj.privateState.userSettings.showSymbolicLinksOnMap ? true : false;

		retStateObj.mapInstanceUniqueId = ("UniqueMapId" + HIPI.framework.Utilities.getUniqueNumber());

		// If anything changes on the state this component should re-render to avoid issues with the SVG paths not getting cleared.
		retStateObj.breakComponentInstanceCache = Date.now();

		// This is a substitute for the traditional Components used within this architecture.
		// There can be thousands of Dialog Messages on map, especially when links multiply the output.
		// For the sake of performance this object and its recursive children will generate an HTML string to be injected within this component's DIV. 
		// Notice that the object is just attached to the Component object because if it is attached to the state slices the Prototype properties will get lost when it passes through copyObject().
		componentObj.mapRowOrColumnObj = new HIPI.lib.MapRowOrColumn(globalStateObj, componentPropertiesObj.domain, "", retStateObj.mapInstanceUniqueId, 0, 0);

		// This will match up to the default state of the checkbox HTML.
		componentObj.mapRowOrColumnObj.showSymbolicLinks(retStateObj.showSymbolicLinksOnMap);

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		// Define a global event, scoped to the Map Instance.
		// The Map Nodes will subscribe to the same Event object and will update their U.I. in response to a search term changing.
		var mapSearchEventObj = HIPI.framework.Utilities.getEventsObjectFromGlobalScopeByUniqueId("map-search-event" + stateSlicesObj.mapInstanceUniqueId);

		var lastKeyUpTimestamp = 0;

		document.getElementById("map-search"+stateSlicesObj.mapInstanceUniqueId).addEventListener("keyup", HIPI.framework.Utilities.debounce(function(e){

			searchKeyUpHandler(this.value);

		}, HIPI.framework.Constants.getMilliSecondDelayForKeyUpDebounce()));

		document.getElementById("map-form"+stateSlicesObj.mapInstanceUniqueId).addEventListener("submit", function(e){
			e.preventDefault();
		});

		document.getElementById("map-links-checkbox"+stateSlicesObj.mapInstanceUniqueId).addEventListener("change", function(e){
			
			if(this.checked){
				if(confirm("Are you sure you want to display symbolic links on the map?\nThis could take a while."))
					HIPI.state.ActionMethods.changeUserSetting("showSymbolicLinksOnMap", true);
				else
					this.checked = false;
			}
			else{
				HIPI.state.ActionMethods.changeUserSetting("showSymbolicLinksOnMap", this.checked);
			}

			HIPI.framework.AppState.saveStore()
			.then(function(){
				console.log("Store was saved successfully after changing a User Setting: showSymbolicLinksOnMap");
			});
		});

		function searchKeyUpHandler(searchTerm){

			// Pass the search term as an argument to the event subscription callback(s).
			mapSearchEventObj.fire([HIPI.framework.Utilities.trimText(searchTerm)]);
		}

		// This will start a cascade of DOM binding routines in the hierarchy of this object, its children, and so on.
		componentObj.mapRowOrColumnObj.runDomBindingRoutine();
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
