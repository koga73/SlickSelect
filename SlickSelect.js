/*
* SlickSelect v1.0.0 Copyright (c) 2014 AJ Savino
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
var SlickSelect = {
	EVENT_CHANGE:"change",
	EVENT_OPEN:"open",
	EVENT_CLOSE:"close",
	
	TEMPLATE_SELECT:"<div class='slickselect' tabindex='0'><span class='slickselect-selected'></span><ul class='slickselect-options'></ul></div>",
	TEMPLATE_OPTION:"<li class='slickselect-option'></li>",
	
	CLASS_SLICKSELECT:"slickselect",
	CLASS_SELECTED:"slickselect-selected",
	CLASS_OPTIONS:"slickselect-options",
	CLASS_OPTION:"slickselect-option",
	CLASS_OPEN:"slickselect-open",
	CLASS_KEY_HIGHLIGHT:"slickselect-key-highlight",
	
	defaults:{
		placeholder:null
	}
};
(function($){ //Dependencies: jQuery
	$.fn.SlickSelect = function(options){
		var _options = $.extend({}, $.fn.SlickSelect.defaults, options);
		var _instance = this;
		
		var _vars = {
			_slickSelect:null,
			_keyIndex:-1,
			
			isOpen:false,
			selectedIndex:-1,
			value:null
		};
		
		var _methods = {
			init:function(){
				var slickSelect = $(SlickSelect.TEMPLATE_SELECT);
				slickSelect.attr("class", slickSelect.attr("class") + " " + _instance.attr("class")); //Copy classes
				
				var options = $("option", _instance);
				options.each(function(index){
					var option = $(SlickSelect.TEMPLATE_OPTION).append($(this).html());
					option.attr("data-value", $(this).attr("value"));
					$("." + SlickSelect.CLASS_OPTIONS, slickSelect).append(option);
				});
				slickSelect.insertBefore(_instance);
				_instance.hide();
				
				slickSelect.on("focusin", _methods._handler_focusin);
				slickSelect.on("click", _methods._handler_click);
				$(document).on("keydown", _methods._handler_keydown);
				slickSelect.on("focusout", _methods._handler_focusout);
				_vars._slickSelect = slickSelect;
				
				var selected = options.filter("[selected]").val();
				if (selected){
					_methods.selectOption(selected);
				} else {
					_methods.selectOption(-1);
				}
			},
			
			open:function(){
				if (_vars.isOpen){
					return;
				}
				_vars.isOpen = true;
				_vars._slickSelect.addClass(SlickSelect.CLASS_OPEN);
				_instance.trigger(SlickSelect.EVENT_OPEN);
			},
			
			close:function(){
				if (!_vars.isOpen){
					return;
				}
				_vars.isOpen = false;
				
				var options = $("." + SlickSelect.CLASS_OPTION, _vars._slickSelect);
				options.removeClass(SlickSelect.CLASS_KEY_HIGHLIGHT);
				_vars._keyIndex = -1; //Reset
								
				_vars._slickSelect.removeClass(SlickSelect.CLASS_OPEN);
				_instance.trigger(SlickSelect.EVENT_CLOSE);
			},
			
			selectOption:function(option){
				var options = $("." + SlickSelect.CLASS_OPTION, _vars._slickSelect);
				if (!isNaN(option)){ //Number: Index
					if (option == -1){ //Placeholder
						var placeholder = _instance.attr("data-placeholder") || _options.placeholder;
						if (placeholder){
							$("." + SlickSelect.CLASS_SELECTED, _vars._slickSelect).html(placeholder);
							_vars.selectedIndex = -1;
							_vars.value = null;
							_instance[0].selectedIndex = _vars.selectedIndex;
							return;
						} else {
							option = 0;
						}
					}
					if (option != -1){
						option = options.eq(option);
					}
				} else if (!option.jquery){ //String: value
					option = options.filter("[data-value='" + option + "']");
				}
				_vars.selectedIndex = option.index();
				_vars.value = option.attr("data-value");
				
				$("." + SlickSelect.CLASS_SELECTED, _vars._slickSelect).html(option.html());
				_instance[0].selectedIndex = _vars.selectedIndex;
				_instance.trigger(SlickSelect.EVENT_CHANGE);
				
				_methods.close();
			},
			
			_handler_focusin:function(evt){
				evt.preventDefault();
				if (!_vars.isOpen){
					_methods.open();
				}
				return false;
			},
			
			_handler_click:function(evt){
				evt.preventDefault();
				if (!_vars.isOpen){
					_methods.open();
				}
				var target = $(evt.target);
				if (target.hasClass("slickselect-option")){
					_methods.selectOption(target);
				}
				return false;
			},
			
			_handler_keydown:function(evt){
				if (!_vars.isOpen){
					return;
				}
				var options = $("." + SlickSelect.CLASS_OPTION, _vars._slickSelect);
				var updateClass = false;
				switch (evt.keyCode){
					case 38: //Up
						_vars._keyIndex--;
						if (_vars._keyIndex < 0){
							_vars._keyIndex = options.length - 1;
						}
						updateClass = true;
						break;
					case 40: //Down
						_vars._keyIndex++;
						if (_vars._keyIndex > options.length - 1){
							_vars._keyIndex = 0;
						}
						updateClass = true;
						break;
					case 13: //Enter
					case 32: //Space
						if (_vars._keyIndex != -1){
							_methods.selectOption(_vars._keyIndex);
						} else {
							_methods.close();
						}
						break;
					default:
						return;
				}
				evt.preventDefault();
				if (updateClass){
					options.removeClass(SlickSelect.CLASS_KEY_HIGHLIGHT);
					options.eq(_vars._keyIndex).addClass(SlickSelect.CLASS_KEY_HIGHLIGHT);
				}
				return false;
			},
			
			_handler_focusout:function(evt){
				evt.preventDefault();
				if (_vars.isOpen){
					_methods.close();
				}
				return false;
			}
		};
		
		_instance.SlickSelect = { //Expose public methods
			isOpen:function(){return _vars.isOpen;}, //Getter
			selectedIndex:function(){return _vars.selectedIndex;}, //Getter
			value:function(){return _vars.value;}, //Getter
			
			init:_methods.init,
			open:_methods.open,
			close:_methods.close,
			selectOption:_methods.selectOption
		};
		_instance.SlickSelect.init();
		return _instance; //jQuery chaining
	}
	
	$.fn.SlickSelect.defaults = SlickSelect.defaults;
}(jQuery));