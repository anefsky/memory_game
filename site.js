$(function() {
	var gameboard = new Gameboard(5, 4); // one dimension must be even
	gameboard.init();

	$(".tile.unselected").mousedown(function() {
		if(gameboard.twoSelected()) return;
		var selectorId = $(this).attr("id");
		if(gameboard.sameSelectedTwice(selectorId)) return;
		gameboard.handleTileSelection(selectorId);
	});	
});

// Tile - abstract base class
var Tile = function() {
	this.getClasses = function() {
		return this.arrClasses;
	}
};

// following *Tile classes extend Tile
var UnselectedTile = function() {
	this.arrClasses = [ 'tile', 'unselected' ];
};
UnselectedTile.prototype = new Tile();

var SelectedTile = function(displayValue) {
	this.arrClasses = [ 'tile', 'selected' ];
	this.displayValue = displayValue;
};
SelectedTile.prototype = new Tile();
SelectedTile.prototype.getDisplayValue = function() {
	return this.displayValue;
}

var EliminatedTile = function() {
	this.arrClasses = [ 'tile', 'eliminated' ];
};
EliminatedTile.prototype = new Tile();

var Gameboard = function(numrows, numcols) {
	this.numrows = numrows;
	this.numcols = numcols;
	this.eliminatedTileCount = 0;
	this.numTries = 0;
	this.selectorIdProps = {}; // maps selectorId to value and tile object
	this.arrSelectedIds = []; // div ids of selected tiles

	this.getDisplayValue = function(selectorId) {
		return this.selectorIdProps[selectorId].VALUE;
	}

	this.addTile = function(selectorId, tile) {
		this.selectorIdProps[selectorId].TILE = tile;
		var selector = "#" + selectorId;
		if (tile instanceof SelectedTile) {
			$(selector).html(tile.getDisplayValue());
		}
		var arrClasses = tile.getClasses();
		for ( var i = 0; i < arrClasses.length; i++) {
			$(selector).addClass(arrClasses[i]);
		}
		if (selectorId.indexOf('col_0') !== -1) { // tile in first column
			$(selector).addClass("newrow");
		}
	}

	this.removeTile = function(selectorId) {
		delete this.selectorIdProps[selectorId].TILE;
		// clean up html
		var selector = "#" + selectorId;
		$(selector).html("");
		$(selector).removeClass(); // removes all classes
	}

	this.replaceTile = function(selectorId, tile_new) {
		this.removeTile(selectorId);
		this.addTile(selectorId, tile_new);
	}

	this.init = function() {
		var theHtml = "";
		for ( var i = 0; i < this.numrows; i++) {
			for ( var j = 0; j < this.numcols; j++) {
				var selectorId = "tile_" + "row_" + i + "_" + "col_" + j;
				theHtml += "<div id='" + selectorId + "'></div>";
				this.selectorIdProps[selectorId] = {}; // create object for
				// each id
			}
		}
		$("#board").html(theHtml); // now contains empty divs with id's

		// get display values
		var numUniqueValuesRequired = this.numrows * this.numcols / 2;
		var displayValues = new DisplayValues("ABCDEFGHIJKLMNOPQRSTUVWXYZ",
				numUniqueValuesRequired);
		var arrValues = displayValues.getShuffledTwoOfEach();

		// add tiles, assign values
		for (selectorId in this.selectorIdProps) {
			this.addTile(selectorId, new UnselectedTile());
			this.selectorIdProps[selectorId].VALUE = arrValues.shift();
		}
	}

	this.handleTileSelection = function(selectorId) {
		var new_tile = new SelectedTile(this.getDisplayValue(selectorId));
		this.replaceTile(selectorId, new_tile);
		this.arrSelectedIds.push(selectorId);
		if (this.arrSelectedIds.length == 2) { // 2 tiles selected
			this.numTries += 1;
			var displayValue_first = this.getDisplayValue(this.arrSelectedIds[0]);
			var displayValue_second = this.getDisplayValue(this.arrSelectedIds[1]);
			var this_class_instance = this; //setTimeout doesn't see 'this'
			setTimeout(function() {
				if (displayValue_first == displayValue_second) {
					this_class_instance.handlePairMatch();
				} else {
					this_class_instance.handlePairMismatch();
				}
				this_class_instance.arrSelectedIds = []; // reset
			}, 500);
		}
	}

	this.handlePairMatch = function() {
		for ( var i = 0; i < this.arrSelectedIds.length; i++) {
			this.replaceTile(this.arrSelectedIds[i], new EliminatedTile())
		}
		this.eliminatedTileCount += 2;
		if (this.isGameOver())
			this.endGame();
	}

	this.handlePairMismatch = function() {
		for ( var i = 0; i < this.arrSelectedIds.length; i++) {
			this.replaceTile(this.arrSelectedIds[i], new UnselectedTile())
		}
	}

	this.isGameOver = function() {
		return this.eliminatedTileCount == this.numrows * this.numcols;
	}

	this.endGame = function() {
		var message = 
		"<div id='game_over_message'><p>Game over!</p>" +
		"<p>Number of tries: " + this.numTries + "</p></div>"; 

		$('#board').html(message);
	}
	
	this.twoSelected = function() { return this.arrSelectedIds.length == 2};
	
	this.sameSelectedTwice = function(secondSelectorId) {
		return this.arrSelectedIds.length == 1 && 
				this.arrSelectedIds == secondSelectorId;
	}
};

var DisplayValues = function(charArrayPossibleValues, numUniqueValues) {
	this.arrPossibleValues = charArrayPossibleValues.split("");
	this.numUniqueValues = numUniqueValues;

	this.shuffleArray = function(arr) { // source: Gabriele Romanato
		for ( var j, x, i = arr.length; i; j = parseInt(Math.random() * i),
				x = arr[--i], arr[i] = arr[j], arr[j] = x);
	}

	this.getShuffledTwoOfEach = function() {
		var allPossibleValues = this.arrPossibleValues.slice(0); // clone
		this.shuffleArray(allPossibleValues);
		var subsetPossibleValues = allPossibleValues.splice(0,
				this.numUniqueValues);
		var doublePossibleValues = [].concat(subsetPossibleValues,
				subsetPossibleValues);
		this.shuffleArray(doublePossibleValues);
		return doublePossibleValues;
	}
};
