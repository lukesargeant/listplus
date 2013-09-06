/* jQuery Listplus widget by Luke Sargeant (Abraxsi) lukesarge@gmail.com */
(function($) {
	$.widget("widgetplus.listplus", {
		version: "1.0.0",
		options: {
			filterBy: null,
			filterMode: "loose", //possible args: loose, strict, best
			filterTransform: "[^\\w ]",
			groupBy: null,
			hideList: null,
			persistentGroups: null,
			sortBy: null,
			ungroupableItemGroup: "Misc."
		},
		
		_create: function() {
			this.element.addClass("listplus");
		},
		
		_init: function() {
			this.refresh();
		},
		
		refresh: function() {
			var widget = this;
			//Show html previously hidden
			widget.element.find('.ui-hidden').removeClass('ui-hidden');
			//Ungroup
			widget._ungroup();
			//Filter
			if (widget.options.filterBy) widget.filterBy(widget.options.filterBy);
			//Sort
			if (widget.options.sortBy) widget.sortBy(widget.options.sortBy);
			//Group
			if (widget.options.groupBy) widget.groupBy(widget.options.groupBy);
			//Hide html that matches hideList
			if (widget.options.hideList) widget.hideList(widget.options.hideList);
		},

		filterBy: function(filterArr) {
			var widget = this;
			var $listitems = widget.element.children();
			var transform = new RegExp(this.options.filterTransform,"g");
			//Reset any previously assigned filter scores
			$listitems.data('listplus-filterscore',0);
			
			if ($.type(filterArr)==="string")  filterArr = [filterArr];
			if ($.type(filterArr)==="array") {
				var bestScore = 0;
				//iterate through filters and score items
				for (var i=0;i<filterArr.length;i++) {
					$listitems.each(function() {
						var $this = $(this);
						var filterTerm = filterArr[i].toLowerCase().replace(transform,"");
						var filterRow = $this.text().toLowerCase().replace(transform,"");
						if (filterRow.indexOf(filterTerm)>=0) {
							var newScore = $this.data('listplus-filterscore') + 1;
							$this.data('listplus-filterscore',newScore);
							if (newScore > bestScore) bestScore = newScore;
						}
					});
				}
				//hide filtered list items
				var numberOfFilterWords = filterArr.length;
				if (numberOfFilterWords>0) {
					
					var requiredScore = 1;
					if (widget.options.filterMode==="strict") requiredScore = numberOfFilterWords;
					else if (widget.options.filterMode==="best") requiredScore = bestScore;
					
					$listitems.each(function() {
						var $this = $(this);
						if ($this.data('listplus-filterscore')<requiredScore) {
							$this.addClass('ui-hidden');
						} 
					});
				}
				widget._trigger("filter", null, {});
			}
			//TODO: hide empty groups unless in persistent groups.
		},

		sortBy: function(sortArr) {
			var widget = this;
			if ($.type(sortArr)==="string" || $.type(sortArr)==="object" || $.type(sortArr)==="function")  sortArr = [sortArr];
			if ($.type(sortArr)==="array") {
				for (var i=0;i<sortArr.length;i++) {
					widget._sort(sortArr[i],widget.element);
				}
				widget._trigger("sort", null, {});
			}
		},

		_sort: function(sortOb,$context) {
			var widget = this;
			
			var sortingArray = [];
			var reverse = false;
			$context.children().each(function() {
		    	//calc sort value
		    	var thisSortValue = "";
		    	if ($.type(sortOb)==="object") {
		    		reverse = sortOb.reverse;
		    		sortOb = sortOb.sortValue;
				}
				if ($.type(sortOb)==="function") thisSortValue = sortOb(this);
				else thisSortValue = $(this).find(sortOb).text();
				//create DOM object/sort value pairs.
		        sortingArray.push([this,thisSortValue]);
		    })

		    //decide sort function
			var sortFunction = widget._sortAlphabetic;
			if (sortingArray.length>0 && $.type(sortingArray[0][1])==="number") {
				//first value is numeric
				sortFunction = reverse ? widget._sortReverseNumeric : widget._sortNumeric;
			}
			else {
				sortFunction = reverse ? widget._sortReverseAlphabetic : widget._sortAlphabetic;
			}

			//do sort
		    var sortingArray = this._mergeSort(sortingArray,sortFunction);
		    //reorder in dom
		    for (var i=0;i<sortingArray.length;i++) {
		    	$context.append(sortingArray[i][0]);
		    }
		},

		_mergeSort: function(array,comparison) {
			if (array.length < 2) return array;
			var middle = Math.ceil(array.length/2);
			return this._merge(this._mergeSort(array.slice(0,middle),comparison),this._mergeSort(array.slice(middle),comparison),comparison);
		},

		_merge: function(left,right,comparison) {
			var result = new Array();
			while ((left.length > 0) && (right.length > 0)) {
				if (comparison(left[0],right[0]) <= 0) result.push(left.shift());
				else result.push(right.shift());
			}
			while (left.length > 0) result.push(left.shift());
			while (right.length > 0) result.push(right.shift());
			return result;
		},
		
		_sortAlphabetic: function(a,b){
			if (!b[1]) return -1;
			if (!a[1]) return 1;
			if (a[1] < b[1]) return -1;
		    if (a[1] > b[1]) return 1;
		    return 0;
		},

		_sortReverseAlphabetic: function(a,b){
			if (!b[1]) return -1;
			if (!a[1]) return 1;
			if (a[1] < b[1]) return 1;
		    if (a[1] > b[1]) return -1;
		    return 0;
		},

		_sortNumeric: function(a,b){
		    return a[1] - b[1];
		},

		_sortReverseNumeric: function(a,b){
		    return b[1] - a[1];
		},

		groupBy: function() {
			var widget = this;
			widget._group();
		},

		_group: function() {
			var widget = this;
			//create persistent groups
			if ($.type(widget.options.persistentGroups)==="array") {
				$.each(widget.options.persistentGroups,function(i,v) {
					$('<li/>').text(v).addClass('listplus-heading').appendTo(widget.element);
				});
			}
			//for all list items create group headings
			widget.element.children('li').not('.listplus-heading').each(function() {
				widget._placeInGroup(this);
			});
			widget._trigger("group", null, {});
		},
		
		_placeInGroup: function(listitem) {
			var widget = this;
			//establish group heading for list item
			var groupheading = $.trim($(listitem).find(widget.options.groupBy).text());
			groupheading = groupheading || widget.options.ungroupableItemGroup;
			//test if group already exists
			var $groupheading = widget.element.find('.listplus-heading:contains("'+groupheading+'")');
			if ($groupheading.length==0) {
				//create group
				$groupheading = $('<li/>').text(groupheading).addClass('listplus-heading').appendTo(widget.element);
			}
			//place list item
			widget.element.append(listitem);
		},

		_ungroup: function() {
			var widget = this;
			//clear previously rendered groups
			widget.element.children('.listplus-heading').remove();
		},

		hideList: function(hideArr) {
			var widget = this;
			if ($.type(hideArr)==="string")  hideArr = [hideArr];
			if ($.type(hideArr)==="array") {
				for (var i=0;i<hideArr.length;i++) {
					widget.element.find(hideArr[i]).addClass('ui-hidden');
				}
			}
		},
		
		pushItems: function(listitems) {
			var widget = this;
			var $li = $(listitems).hide().addClass('listplus-adding');
			widget.element.append($li);
			widget.refresh();
			widget.element.find('.listplus-adding').slideDown(200).promise().done(function() {
				widget.element.find('.listplus-adding').removeClass('listplus-adding');
			});
		},
		
		removeItem: function(selector) {
			var widget = this;
			var $listitem = widget.element.find(selector).closest('li');
			$listitem.addClass('listplus-removing').slideUp(200).promise().done(function() {
				$listitem.remove();
				widget._checkForEmptyGroups();
			});
		},
		
		_destroy: function() {
			var widget = this;
			//remove groups
			widget.element.children('.listplus-heading').remove();
			widget.element.removeClass("listplus");
			//show group heading data in li
			widget.element.find(widget.options.groupBy).show();
		},
		
		_setOptions: function() {
			this._superApply(arguments);
			this.refresh();
		},
		
		_setOption: function(key, value) {
			this._super(key,value);
		}
	});
})(jQuery);