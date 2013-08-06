/* jQuery Listplus widget by Luke Sargeant (Abraxsi) lukesarge@gmail.com */
(function(jQuery) {
	$.widget("widgetplus.listplus", {
		version: "0.9.0",
		options: {
			filterBy: null,
			groupBy: null,
			hideList: null,
			persistentGroups: null,
			preventDuplicates: null,
			sortBy: null,
			sortFunction: "alphabetic",
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
			widget.element.find('.ui-helper-hidden-accessible').removeClass('ui-helper-hidden-accessible');
			//Ungroup
			widget._ungroup();
			//Sort
			var sortArr = widget.options.sortBy;
			if ($.type(sortArr)==="string")  sortArr = [sortArr];
			if ($.type(sortArr)==="array") {
				sortArr.reverse();
				for (var i=0;i<sortArr.length;i++) {
					widget._sort(sortArr[i],widget.element);
				}
			}
			//Group
			if (widget.options.groupBy) widget._group();
			//Hide html that matches hideList
			var hideArr = widget.options.hideList;
			if ($.type(hideArr)==="string")  hideArr = [hideArr];
			if ($.type(hideArr)==="array") {
				for (var i=0;i<hideArr.length;i++) {
					widget.element.find(hideArr[i]).addClass('ui-helper-hidden-accessible');
				}
			}
			//Filter
			var filterArr = widget.options.filterBy;
			if ($.type(filterArr)==="string")  filterArr = [filterArr];
			if ($.type(filterArr)==="array") {
				widget.element.children().not('.listplus-heading').addClass('ui-helper-hidden-accessible');
				for (var i=0;i<filterArr.length;i++) {
					widget.element.children(':contains("'+filterArr[i]+'")').removeClass('ui-helper-hidden-accessible');
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
		
		_sort: function(selector,$context) {
			var widget = this;
			var thisSortFunction;
			//pick sort function
			if ($.type(widget.options.sortFunction)==="function") thisSortFunction = widget.options.sortFunction;
			else if (widget.options.sortFunction==="numeric") thisSortFunction = widget._sortAlphabetic;
			else if (widget.options.sortFunction==="alphabetic") thisSortFunction = widget._sortAlphabetic;
			//do sort
			var sortingArray = [];
			var $nodes = $context.children();
		    $nodes.each(function() {	
		        sortingArray.push([this,$(this).find(selector)]);//create DOM object/sort value pairs.
		    });
		    sortingArray.sort(thisSortFunction);
		    for (var i=0;i<sortingArray.length;i++) {
		    	$context.append(sortingArray[i][0]);
		    }
		},
		
		_sortAlphabetic: function(a,b){
			if (b[1].text()=='') return -1;
			if (a[1].text()=='') return 1;
			if (a[1].text().toLowerCase() < b[1].text().toLowerCase()) return -1;
		    if (a[1].text().toLowerCase() > b[1].text().toLowerCase()) return 1;
		    return 0;
		},
		
		_sortNumeric: function(a,b){
			if (b[1].attr('numbersortvalue')==='') return -1;
			if (a[1].attr('numbersortvalue')==='') return 1;
		    return a[1].attr('numbersortvalue') - b[1].attr('numbersortvalue');
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
		
		_checkForEmptyGroups: function() {
			var widget = this;
			//TODO: remove empty groups unless in persistent groups.
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
})();