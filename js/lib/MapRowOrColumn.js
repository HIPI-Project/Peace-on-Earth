"use strict";

// This class and its child "MapMessage" mimic the Component architecture.
// It was necessary to deviate from the declarative approach because of performance, there can just be way too many Messages on a map with the multiplication of linking.
function MapRowOrColumn(globalStateObj, domain, parentDialogPositionChain, mapUniqueId, topCoord, leftCoord) {

	HIPI.framework.Utilities.ensureTypeObject(globalStateObj);
	HIPI.framework.Utilities.ensureTypeString(domain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(parentDialogPositionChain);
	HIPI.framework.Utilities.ensureTypeString(mapUniqueId);
	HIPI.framework.Utilities.ensureIntegerPositiveOrZero(topCoord);
	HIPI.framework.Utilities.ensureIntegerPositiveOrZero(leftCoord);

	this._globalStateObj = globalStateObj;
	this._domain = domain;
	this._parentDialogPositionChain = parentDialogPositionChain;
	this._mapUniqueId = mapUniqueId;
	this._topCoord = topCoord;
	this._leftCoord = leftCoord;
	this._showSymbolicLinks = true;

	this._uniqueMessageId = HIPI.framework.Utilities.getUniqueNumber();

	this._componentState = {};

	this._mapMessageInstancesArr = [];
}

MapRowOrColumn.prototype._runStateExtractor = function () {

	var scopeThis = this;

	this._componentState.isDownstreamOfContradictedMessage = false;

	// Don't attempt checking for upstream contradictions on the domain root.
	if(this._parentDialogPositionChain){

		this._componentState.isDownstreamOfContradictedMessage = HIPI.lib.Dialogs.isDialogPositionDownstreamOfContradictedMessage(this._globalStateObj, this._domain, this._parentDialogPositionChain);

		// Because this component is already a child it is necessary to also check the contradiction status of the given dialog position, not just upstream from it.
		if(!this._componentState.isDownstreamOfContradictedMessage)
			this._componentState.isDownstreamOfContradictedMessage = HIPI.lib.Contradictions.isTargetContradicted(this._globalStateObj, this._domain, this._parentDialogPositionChain, "");
	}

	// This routine should match up to what is found in the <dialogSorter> component.
	var messageDialogPositions = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(this._globalStateObj, this._domain, this._parentDialogPositionChain);

	messageDialogPositions = HIPI.lib.General.filterDialogPositionChainsByUserSettings(this._globalStateObj, this._domain, messageDialogPositions);
	
	messageDialogPositions = this._filterDialogPositionsBySymbolicLinks(messageDialogPositions);

	// Invert the result because this component's properties contains the parent dialog position.
	if(!this._parentDialogPositionChain)
		this._componentState.isHorizontal = true;
	else
		this._componentState.isHorizontal = HIPI.lib.Dialogs.isDialogLevelSkeptical(this._parentDialogPositionChain);

	this._componentState.dialogDataArr = [];

	messageDialogPositions.forEach(function(loopDialogPositionChain){

		var messageObj = {};

		var loopDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(scopeThis._globalStateObj, scopeThis._domain, loopDialogPositionChain);

		messageObj.dialogPositionChain = loopDialogPositionChain;

		messageObj.emptySpaceCounter = getEmptySpacesBeneathDialogPosition(loopDialogPositionChain);

		messageObj.isSiblingSelectedToRight = HIPI.lib.Dialogs.isSiblingMessageSelectedToTheRight(scopeThis._globalStateObj, scopeThis._domain, loopDialogPositionChain);

		messageObj.isSelected = loopDialogRef.selected ? true : false;

		scopeThis._componentState.dialogDataArr.push(messageObj);
	});

	return this._componentState;

	// This method is used by the mapping logic to determine how many empty spaces need to be reserved for sub-hierarchical expansion.
	function getEmptySpacesBeneathDialogPosition(dialogPositionChain){

		HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

		// Kick start the recursion with a FALSE flip flop flag, indicating that the first cycle is perpendicular to the origin.
		return getEmptySpacesRecursive(dialogPositionChain, false);

		function getEmptySpacesRecursive(recurseDialogPositionChain, flipFlopFlag){

			var maxValue = 0;

			var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(scopeThis._globalStateObj, scopeThis._domain, recurseDialogPositionChain);

			childDialogPositionsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(scopeThis._globalStateObj, scopeThis._domain, childDialogPositionsArr);

			childDialogPositionsArr = scopeThis._filterDialogPositionsBySymbolicLinks(childDialogPositionsArr);

			childDialogPositionsArr.forEach(function(loopDialogPositionChain){

				var loopMaxValue = getEmptySpacesRecursive(loopDialogPositionChain, !flipFlopFlag);

				if(loopMaxValue > maxValue)
					maxValue = loopMaxValue;
			});

			// If the recursion alternates parallel to the origin, then add the message-count at this level in hierarchy.
			if(flipFlopFlag)
				maxValue += childDialogPositionsArr.length;

			return maxValue;
		}
	};
};

// If the user has chosen not to render nodes with links then simply filter out any ID's which point to messages having a .link property.
MapRowOrColumn.prototype._filterDialogPositionsBySymbolicLinks = function (dialogPositionChainsArr) {

	// If they do want to see symbolic links then there is nothing to remove.
	if(this._showSymbolicLinks)
		return dialogPositionChainsArr;

	return dialogPositionChainsArr.filter(function(loopDialogPositionChain){

		var loopDialogRef = HIPI.lib.Dialogs.getDialogPositionReference(this._globalStateObj, this._domain, loopDialogPositionChain);

		return loopDialogRef.link ? false : true;
	}, this);

};

MapRowOrColumn.prototype.showSymbolicLinks = function (showFlag) {

	HIPI.framework.Utilities.ensureTypeBoolean(showFlag);

	this._showSymbolicLinks = showFlag;
};

MapRowOrColumn.prototype.runDomBindingRoutine = function () {

	// This Component doesn't have any DOM binding routine of its own.
	// When it is called just pass on the command to the child objects.
	this._mapMessageInstancesArr.forEach(function(loopMessageObj){
		loopMessageObj.runDomBindingRoutine();
	});

};

MapRowOrColumn.prototype.generateHtml = function () {

	this._runStateExtractor();

	var scopeThis = this;

	if(!this._componentState.dialogDataArr.length)
		return "";

	var retHtml = "";

	var leftSpacerOffset = 0;
	var topSpacerOffset = 0;

	var rowColumnHeightPx = HIPI.framework.Constants.getMapRowHeightOrColumnWidthInPixels();

	var selectedIndicatorLength = Math.round(rowColumnHeightPx/HIPI.framework.Constants.getMapRowPathwayIndicatorLengthDivisor());
	var selectedIndicatorHeight = Math.round(rowColumnHeightPx/HIPI.framework.Constants.getMapRowPathwayIndicatorThicknessDivisor());

	var downstreamOfContradictionClass = "";

	if(this._componentState.isDownstreamOfContradictedMessage)
		downstreamOfContradictionClass = " downstream-from-contradiction";

	this._componentState.dialogDataArr.forEach(function(loopDialogDataObj, messageCounter){

		if(scopeThis._componentState.isHorizontal){
			var messageLeftCoord = parseInt(scopeThis._leftCoord) + rowColumnHeightPx * messageCounter;
			var messageTopCoord = parseInt(scopeThis._topCoord);
		}
		else{
			var messageTopCoord = parseInt(scopeThis._topCoord) + rowColumnHeightPx * messageCounter;
			var messageLeftCoord = parseInt(scopeThis._leftCoord);
		}

		// Add a spacing container between each message.
		if(messageCounter > 0){

			var pixelSpacesFromPreviousCycle = scopeThis._componentState.dialogDataArr[messageCounter -1].emptySpaceCounter * rowColumnHeightPx;

			if(scopeThis._componentState.isHorizontal){

				retHtml += "<div class='map-row-spacer"+downstreamOfContradictionClass+"' style='height:"+rowColumnHeightPx+"px; width:"+pixelSpacesFromPreviousCycle+"px; top:"+messageTopCoord+"px; left:"+(messageLeftCoord+leftSpacerOffset)+"px;'></div>";

				// In case the user traveled NEXT over the gap, show the pathway that they traveled.
				if(loopDialogDataObj.isSiblingSelectedToRight || loopDialogDataObj.isSelected)
					retHtml += "<div class='map-row-pathway-indicator-spacer map-row-pathway-indicator"+downstreamOfContradictionClass+"' style='width:"+(selectedIndicatorLength+pixelSpacesFromPreviousCycle)+"px; height:"+selectedIndicatorHeight+"px; left:"+(messageLeftCoord - selectedIndicatorLength/2 + leftSpacerOffset) +"px; top:"+(messageTopCoord + rowColumnHeightPx/2 - selectedIndicatorHeight/2)+"px;'></div>";

				leftSpacerOffset += pixelSpacesFromPreviousCycle;
			}
			else{

				retHtml += "<div class='map-column-spacer"+downstreamOfContradictionClass+"' style='width:"+rowColumnHeightPx+"px; height:"+pixelSpacesFromPreviousCycle+"px; top:"+(messageTopCoord+topSpacerOffset)+"px; left:"+messageLeftCoord+"px;'></div>";

				if(loopDialogDataObj.isSiblingSelectedToRight || loopDialogDataObj.isSelected)
					retHtml += "<div class='map-row-pathway-indicator-spacer map-row-pathway-indicator"+downstreamOfContradictionClass+"' style='width:"+selectedIndicatorHeight+"px; height:"+(selectedIndicatorLength+pixelSpacesFromPreviousCycle)+"px; left:"+(messageLeftCoord + rowColumnHeightPx/2 - selectedIndicatorHeight/2) +"px; top:"+(messageTopCoord - selectedIndicatorLength/2 + topSpacerOffset)+"px;'></div>";

				topSpacerOffset += pixelSpacesFromPreviousCycle;
			}
		}

		messageLeftCoord += leftSpacerOffset;
		messageTopCoord += topSpacerOffset;

		// Instead of creating a new component declaratively within the markup, create JS object and ask it to built the HTML the old fashioned way.
		var mapMessageObj = new HIPI.lib.MapMessage(scopeThis._globalStateObj, scopeThis._domain, loopDialogDataObj.dialogPositionChain, scopeThis._mapUniqueId, messageTopCoord, messageLeftCoord);

		mapMessageObj.showSymbolicLinks(scopeThis._showSymbolicLinks);

		// Keep track of what Messages belong to the current Row or Column so that the DOM binding routines can be run later.
		scopeThis._mapMessageInstancesArr.push(mapMessageObj);

		retHtml += mapMessageObj.generateHtml();
	});

	return retHtml;
};
