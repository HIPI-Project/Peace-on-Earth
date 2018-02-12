"use strict";

function MapMessage(globalStateObj, domain, dialogPositionChain, mapUniqueId, topCoord, leftCoord) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeString(mapUniqueId);
	HIPI.framework.Utilities.ensureIntegerPositiveOrZero(topCoord);
	HIPI.framework.Utilities.ensureIntegerPositiveOrZero(leftCoord);

	this._globalStateObj = globalStateObj;
	this._domain = domain;
	this._dialogPositionChain = dialogPositionChain;
	this._mapUniqueId = mapUniqueId;
	this._topCoord = topCoord;
	this._leftCoord = leftCoord;
	this._showSymbolicLinks = true;

	this._uniqueMessageId = HIPI.framework.Utilities.getUniqueNumber();

	this._componentState = {};

	this._mapRowOrColumnObjArr = [];
}

MapMessage.prototype._runStateExtractor = function () {

	var dialogSubRef = HIPI.lib.Dialogs.getDialogPositionReference(this._globalStateObj, this._domain, this._dialogPositionChain);

	this._componentState.isHorizontal = !HIPI.lib.Dialogs.isDialogLevelSkeptical(this._dialogPositionChain);

	this._componentState.messageText = HIPI.lib.Dialogs.getMessageFromDialogPosition(this._globalStateObj, this._domain, this._dialogPositionChain);

	this._componentState.messageTextLowerCase = this._componentState.messageText.toLowerCase();

	this._componentState.isContradicted = HIPI.lib.Contradictions.isTargetContradicted(this._globalStateObj, this._domain, this._dialogPositionChain, "");

	this._componentState.link = dialogSubRef.link;

	this._componentState.isBaseMessage = HIPI.framework.Utilities.getArrayOfIntegersFromCommaSeparatedChain(this._dialogPositionChain).length === 1 ? true : false;

	this._componentState.selected = dialogSubRef.selected ? true : false;

	this._componentState.isAnswered = HIPI.lib.Dialogs.isDialogLevelAnswered(this._globalStateObj, this._domain, this._dialogPositionChain, false);

	this._componentState.isDownstreamOfContradictedMessage = HIPI.lib.Dialogs.isDialogPositionDownstreamOfContradictedMessage(this._globalStateObj, this._domain, this._dialogPositionChain);

	this._componentState.isSiblingSelectedToRight = HIPI.lib.Dialogs.isSiblingMessageSelectedToTheRight(this._globalStateObj, this._domain, this._dialogPositionChain);

	// Only Map Links if they are the head of the linking tree.
	this._componentState.linkDialogPositionChain = null;

	if(this._componentState.link && HIPI.lib.Dialogs.isDialogPositionTheLinkHead(this._globalStateObj, this._domain, this._dialogPositionChain))
		this._componentState.linkDialogPositionChain = HIPI.lib.Dialogs.getDialogPositionChainFromLinkingArr(this._globalStateObj, this._domain, this._componentState.link);
};

// The size of the preview container should be relative to the viewport size in case the user zooms in on the map or views it with a mobile device.
MapMessage.prototype._getMapPreviewWidth = function () {

	var maxPreviewWidth = 1000;
	var minPreviewWidth = 100;

	var mapPreviewContainerWidth = window.innerWidth / 2;

	if(mapPreviewContainerWidth > maxPreviewWidth)
		mapPreviewContainerWidth = maxPreviewWidth;

	if(mapPreviewContainerWidth < minPreviewWidth)
		mapPreviewContainerWidth = minPreviewWidth;

	return mapPreviewContainerWidth;
};

MapMessage.prototype._getMapPreviewHeight = function () {

	var maxPreviewHeight = 600;
	var minPreviewHeight = 100;

	var mapPreviewContainerHeight = window.innerHeight / 4;

	if(mapPreviewContainerHeight > maxPreviewHeight)
		mapPreviewContainerHeight = maxPreviewHeight;

	if(mapPreviewContainerHeight < minPreviewHeight)
		mapPreviewContainerHeight = minPreviewHeight;

	return mapPreviewContainerHeight;
};

MapMessage.prototype.runDomBindingRoutine = function () {

	var scopeThis = this;

	// It's not possible to have a parent element grow in height with absolute positioned children.
	// It gets annoying when mousing-over messages near the bottom because the pop-overs cause scrollbars to appear and a rapid on/off flicker occurs.
	var bottomMarginPixels = 250;
	var rightMarginPixels = 390;

	var mapContainerElem = document.getElementById("map-container" + this._mapUniqueId);
	var mapContainerStyleAttr = mapContainerElem.getAttribute('style').toString();

	var heightValueFromCssMatches = mapContainerStyleAttr.match(/height:\s*(\d+)/);
	var widthValueFromCssMatches = mapContainerStyleAttr.match(/width:\s*(\d+)/);

	if(!heightValueFromCssMatches || !widthValueFromCssMatches)
		throw new Error("Could not find a height value on the Map Container element.");

	var mapContainerHeight = parseInt(heightValueFromCssMatches[1]);
	var mapContainerWidth = parseInt(widthValueFromCssMatches[1]);

	if(mapContainerHeight < this._topCoord + bottomMarginPixels)
		mapContainerElem.style.height = (this._topCoord + bottomMarginPixels) + "px";

	if(mapContainerWidth < this._leftCoord + rightMarginPixels)
		mapContainerElem.style.width = (this._topCoord + rightMarginPixels) + "px";

	var mapNodeElem = document.getElementById("map-message"+this._uniqueMessageId);
	var mapPreviewElem = document.getElementById("map-preview-pop-over"+this._uniqueMessageId);
	var mapPreviewMessageContainerElem = document.getElementById("map-preview-message-container"+this._uniqueMessageId);

	mapNodeElem.addEventListener("click", function(e){
		HIPI.state.ActionMethods.selectMessage(scopeThis._domain, scopeThis._dialogPositionChain);
	});

	mapNodeElem.addEventListener("mouseover", function(e){

		mapPreviewElem.style.width = scopeThis._getMapPreviewWidth() + "px";

		// Adjust the maxHeight of the inner scrollable DIV and let the height of the parent DIV adjust accordingly (in case the text doesn't overflow into scrolling).
		mapPreviewMessageContainerElem.style.maxHeight = scopeThis._getMapPreviewHeight() + "px";

		mapPreviewElem.style.display = "block";
	});

	mapNodeElem.addEventListener("mouseout", function(e){

		// This could happen if the user mouses-out of the browser window itself.
		if(!e.relatedTarget){

			mapPreviewElem.style.display = "none";

			return;
		}

		// Don't hide the pop-over if the user moves their mouse off of the brick, onto the pop-over.
		var popOverElement = HIPI.framework.Utilities.getClosestHtmlElementWithClassName(e.relatedTarget, "map-preview-pop-over");

		if(!popOverElement)
			mapPreviewElem.style.display = "none";
	});

	mapPreviewElem.addEventListener("mouseout", function(e){

		if(!e.relatedTarget){

			mapPreviewElem.style.display = "none";

			return;
		}

		// It is possible that the user has moused-out onto a child of the Preview window.
		var popOverElement = HIPI.framework.Utilities.getClosestHtmlElementWithClassName(e.relatedTarget, "map-preview-pop-over");

		if(popOverElement)
			return;

		// Hide the pop-over if the user moves their mouse off of it... but not if they move back onto the original brick.
		var sourceBrickElement = HIPI.framework.Utilities.getClosestHtmlElementWithClassName(e.relatedTarget, "map-outer-box");

		if(sourceBrickElement){

			// Just because the use moused-out onto a Message Brick doesn't mean that it was the same one which launched the mouse-over.
			var mapIdOfMouseOutBrick = sourceBrickElement.getAttribute("map-message-component-id");

			if(mapIdOfMouseOutBrick === scopeThis._uniqueMessageId)
				return;
		}

		mapPreviewElem.style.display = "none";
	});

	var onLinkToMeEventQueue = HIPI.framework.Utilities.getEventsObjectFromGlobalScopeByUniqueId("linkToMeEventQueue-" + this._mapUniqueId);

	onLinkToMeEventQueue.addSubscription(onLinkToMeBroadcast, [this._mapUniqueId], scopeThis);

	function onLinkToMeBroadcast(mapUniqueId, thatDialogPositionChain, thisDialogPositionChain, leftCoordOfLink, topCoordOfLink){

		var mapSvgContainer = document.getElementById("map-svg-container" + mapUniqueId);

		// This could happen if a DOM Binding Update is triggered from the previous Map Instance (if a user changes their ShowContradicted settings).
		if(!mapSvgContainer){
			console.log("Cannot find the SVG container for the MAP ID: " + mapUniqueId);
			return;
		}

		// Only draw lines back to the source if it was calling for this exact position.
		if(thisDialogPositionChain !== scopeThis._dialogPositionChain)
			return;

		console.log("Received a broadcast from Map Dialog Position: " + thatDialogPositionChain + " on Map ID: " + mapUniqueId + " to draw a link back to coordinates: " + leftCoordOfLink + "x" + topCoordOfLink);

		var centerBrickOffsetPixels = HIPI.framework.Constants.getMapRowHeightOrColumnWidthInPixels() / 2;

		var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");

		var xCoord1 = parseInt(leftCoordOfLink) + centerBrickOffsetPixels;
		var xCoord2 = parseInt(scopeThis._leftCoord) + centerBrickOffsetPixels;
		var yCoord1 = parseInt(topCoordOfLink) + centerBrickOffsetPixels;
		var yCoord2 = parseInt(scopeThis._topCoord) + centerBrickOffsetPixels;

		// Make the size of the SVG canvas just as large as the most bottom-right coordinate.
		var maxXcoord = Math.max(xCoord1, xCoord2);
		var maxYcoord = Math.max(yCoord1, yCoord2);

		var canvasWidth = parseInt(mapSvgContainer.getAttribute("width"));
		var canvasHeight = parseInt(mapSvgContainer.getAttribute("height"));

		if(canvasWidth < maxXcoord)
			mapSvgContainer.setAttribute("width", maxXcoord + (HIPI.framework.Constants.getMapRowHeightOrColumnWidthInPixels() -1));  // Give a larger margin to the SVG canvas for things like arrow-heads, shadows, etc.

		if(canvasHeight < maxYcoord)
			mapSvgContainer.setAttribute("height", maxYcoord + (HIPI.framework.Constants.getMapRowHeightOrColumnWidthInPixels() -1));

		// First start off creating a control point exactly in between the Start and End coordinates.
		var controlPointX = Math.round((xCoord1 + xCoord2)/2);
		var controlPointY = Math.round((yCoord1 + yCoord2)/2);

		// Try and keep the curves away from the map's center point.
		// If the Control Point is above the canvas center-point, move it even further above... same with left/right/bottom.
		if(controlPointX < canvasWidth/2)
			controlPointX -= (controlPointX/2)
		else
			controlPointX += (canvasWidth - controlPointX)/2;

		if(controlPointY < canvasHeight/2)
			controlPointY -= (controlPointY/2);
		else
			controlPointY += (canvasHeight - controlPointY)/2;

		// This defines a "Q"uadratic curve.
		shape.setAttributeNS(null, "d", "M"+xCoord1+" "+yCoord1+" Q "+controlPointX+" "+controlPointY+" "+xCoord2+" "+yCoord2);
		shape.setAttributeNS(null, "fill", "transparent");
		shape.setAttributeNS(null, "stroke", "white");
		shape.setAttributeNS(null, "stroke-dasharray", "1,3");
		shape.setAttributeNS(null, "stroke-width", "1");
		shape.setAttributeNS(null, "marker-end", "url(#arrow)");
		shape.setAttributeNS(null, "filter", "url(#line-shadow)");

		mapSvgContainer.appendChild(shape);
	}

	// Only send out a broadcast for Messages which exist from the head of linking trees.
	// From this component it is possible to find out the link source.
	// All of the other messages in the domain will receive this event and check for a match to see if their dialogPositionChain is the link source.
	if(this._componentState.linkDialogPositionChain){

		// All of the Message components are instantiated at once, but still sequentially.
		// Wait until the "next tick" to be sure that all messages on the map are listening for the event.
		setTimeout(function(){
			onLinkToMeEventQueue.fire([scopeThis._dialogPositionChain, scopeThis._componentState.linkDialogPositionChain, scopeThis._leftCoord, scopeThis._topCoord]);
		}, 0);
	}

	// Subscribe to an event that has been registered on the parent Map component.
	// When the search value changes the string will be given to all subscribers.
	var mapSearchEventObj = HIPI.framework.Utilities.getEventsObjectFromGlobalScopeByUniqueId("map-search-event" + this._mapUniqueId);

	mapSearchEventObj.addSubscription(function(searchTerm){

		if(searchTerm && scopeThis._componentState.messageTextLowerCase.indexOf(searchTerm.toLowerCase()) > -1){
			
			if(mapNodeElem.className.indexOf("map-box-contains-search-term") === -1)
				mapNodeElem.className += " map-box-contains-search-term"
		}
		else{
			
			mapNodeElem.className = mapNodeElem.className.replace(/\s?map-box-contains-search-term/, "");
		}

	}, null, this);

	// Cascade the calls to update DOM bindings through the children of this Component after the current callback is invoked.
	this._mapRowOrColumnObjArr.forEach(function(loopMapRowOrColumnObj){
		loopMapRowOrColumnObj.runDomBindingRoutine();
	});
};

MapMessage.prototype.showSymbolicLinks = function (showFlag) {

	HIPI.framework.Utilities.ensureTypeBoolean(showFlag);

	this._showSymbolicLinks = showFlag;
};

MapMessage.prototype.generateHtml = function () {

	this._runStateExtractor();

	var retHtml = "";

	var textInCell = "";

	var rowColumnHeightPx = HIPI.framework.Constants.getMapRowHeightOrColumnWidthInPixels();

	var selectedIndicatorLength = Math.round(rowColumnHeightPx/HIPI.framework.Constants.getMapRowPathwayIndicatorLengthDivisor());
	var selectedIndicatorHeight = Math.round(rowColumnHeightPx/HIPI.framework.Constants.getMapRowPathwayIndicatorThicknessDivisor());

	var innerCellContradictedClass = "";
	if(this._componentState.isContradicted)
		innerCellContradictedClass = " contradicted";

	var isDownstreamOfContradictionClass = "";
	if(this._componentState.isDownstreamOfContradictedMessage)
		isDownstreamOfContradictionClass = " downstream-from-contradiction";

	var isSelectedClass = "";
	if(this._componentState.selected)
		isSelectedClass = " is-selected";

	var previewPixelOverlap = 3;
	
	var previewPopOverXcoord = this._leftCoord + rowColumnHeightPx - previewPixelOverlap;

	retHtml += "<div class='map-preview-pop-over' style='width: "+this._getMapPreviewWidth()+"px; left:"+previewPopOverXcoord +"px; top:"+this._topCoord+"px;' id='map-preview-pop-over"+this._uniqueMessageId+"'>"+
					"<label>"+(this._componentState.isHorizontal ? "Trusting" : " Skeptical" )+" Message</label>" +
					"<div class='map-preview-message-container' id='map-preview-message-container"+this._uniqueMessageId+"'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(this._componentState.messageText)+"</div>" +
					
					// This can be useful, but it may need to be added on a switch within the User Settings for performance reasons.
					// "<dialogProperties domain='"+this._domain+"' dialogPositionChain='"+this._dialogPositionChain+"'></dialogProperties>"+
				"</div>";

	if(this._componentState.isHorizontal){

		if(this._componentState.isAnswered)
			textInCell = "?";

		// This contains the actual message brick.
		retHtml += "<div id='map-message"+this._uniqueMessageId+"' map-message-component-id='"+this._uniqueMessageId+"' class='map-outer-box map-row-message"+isDownstreamOfContradictionClass+"' style='width:"+rowColumnHeightPx+"px; height:"+rowColumnHeightPx+"px; left:"+this._leftCoord+"px; top:"+this._topCoord+"px;'><div class='map-row-message-inner-box"+innerCellContradictedClass+isSelectedClass+"'>"+textInCell+"</div></div>";

		// Show a little line to indicate the selection pathway that the user has traveled.
		if(this._componentState.selected || this._componentState.isSiblingSelectedToRight)
			retHtml += "<div class='map-row-pathway-indicator"+isDownstreamOfContradictionClass+"' style='width:"+selectedIndicatorLength+"px; height:"+selectedIndicatorHeight+"px; left:"+(this._leftCoord - selectedIndicatorLength/2) +"px; top:"+(this._topCoord + rowColumnHeightPx/2 - selectedIndicatorHeight/2)+"px;'></div>";

		// Every message contains a perpendicular row/column... but it's possible that the container could prove to be empty if there are no children yet.
		var mapRowOrColumnObj = new HIPI.lib.MapRowOrColumn(this._globalStateObj, this._domain, this._dialogPositionChain, this._mapUniqueId, (this._topCoord + rowColumnHeightPx), this._leftCoord);
	}
	else{

		if(this._componentState.isAnswered)
			textInCell = "¿";

		retHtml += "<div id='map-message"+this._uniqueMessageId+"' map-message-component-id='"+this._mapUniqueId+"' class='map-outer-box map-column-message"+isDownstreamOfContradictionClass+"' style='width:"+rowColumnHeightPx+"px; height:"+rowColumnHeightPx+"px; left:"+this._leftCoord+"px; top:"+this._topCoord+"px;'><div class='map-column-message-inner-box"+innerCellContradictedClass+isSelectedClass+"'>"+textInCell+"</div></div>";

		if(this._componentState.selected || this._componentState.isSiblingSelectedToRight)
			retHtml += "<div class='map-row-pathway-indicator"+isDownstreamOfContradictionClass+"' style='width:"+selectedIndicatorHeight+"px; height:"+selectedIndicatorLength+"px; left:"+(this._leftCoord + rowColumnHeightPx/2 - selectedIndicatorHeight/2) +"px; top:"+(this._topCoord - selectedIndicatorLength/2)+"px;'></div>";

		var mapRowOrColumnObj = new HIPI.lib.MapRowOrColumn(this._globalStateObj, this._domain, this._dialogPositionChain, this._mapUniqueId, this._topCoord, (this._leftCoord+rowColumnHeightPx));
	}

	mapRowOrColumnObj.showSymbolicLinks(this._showSymbolicLinks);

	this._mapRowOrColumnObjArr.push(mapRowOrColumnObj);

	retHtml += mapRowOrColumnObj.generateHtml();

	return retHtml;
};
