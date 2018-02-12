"use strict";

var Constants = {};

Constants.getMaxCharacterExcerptForLinking = function(){

	return 32;
};

Constants.getMilliSecondDelayForKeyUpDebounce = function(){

	return 300;
};

Constants.getDialogAndContradictionPositionChainArraySeparator = function(){

	return "«»";
};

Constants.getApplicationFileName = function(){

	return "index.html";
};

Constants.getMapRowHeightOrColumnWidthInPixels = function(){

	return 20;
};

// These divisors are relative to the Constants.getMapRowHeightOrColumnWidthInPixels().
// For example, returning 2 from this method means that the indicator length will be half the size of the box.
Constants.getMapRowPathwayIndicatorLengthDivisor = function(){

	return 2;
};

// This means that the thickness of the indicator will be a fraction of the size of the box.
Constants.getMapRowPathwayIndicatorThicknessDivisor = function(){

	return 8;
};

// This means that the thickness of the indicator will be a fraction of the size of the box.
Constants.redirectingToStartPagePromiseRejectionString = function(){

	return "Redirecting to the start page.";
};
