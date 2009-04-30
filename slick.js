/* Subtle Parser */

var SubtleSlickParse = (function(){
	
	var ssp = {
		parseregexp: function(combinators){
			return new RegExp(("(?x)\n\
			^(?:\n\
				    \\s+   (?=[ "+combinators+"]+ |$|(?=,) )       # Meaningless Whitespace \n\
				| ( \\s )+ (?=[^"+combinators+"]+        )         # spaceCombinator \n\
				| (           [ "+combinators+"]+          ) \\s*  # Combinator \n\
				| ( ,                                      ) \\s*  # Separator \n\
				\
				|      ( [a-z0-9_-]+ | \\* ) # Tag \n\
				| \\#  ( [a-z0-9_-]+       ) # ID \n\
				| \\.  ( [a-z0-9_-]+       ) # ClassName \n\
				| \\[  ( [a-z0-9_-]+       )(?: ([*^$!~|]?=) (?: \"((?:[^\"]|\\\")*)\" | '((?:[^']|\\')*)' | ([^\\]]*) )     )?  \\](?!\\]) # Attribute \n\
				|   :+ ( [a-z0-9_-]+       )(            \\( (?: \"((?:[^\"]|\\\")*)\" | '((?:[^']|\\')*)' | ([^\\)]*) ) \\) )?             # Pseudo    \n\
			)").replace(/\(\?x\)|\s+#.*$|\s+/gim, ''), 'i');
		},
		
		combinators:'> + ~'.split(' '),
		
		MAP: function(){
			var obj = {};
			for (var property in ssp.map) {
				var value = ssp.map[property];
				if (value<1) continue;
				obj[value] = property;
			}
			return ssp.MAP = obj;
		},
		
		parser: function(){
			function parser(){
				var a = arguments;
				var selectorBitMap;
				var selectorBitName;
				
				// MAP arguments
				for (var aN=1; aN < a.length; aN++) {
					if (a[aN]) {
						selectorBitMap = aN;
						selectorBitName = ssp.MAP[selectorBitMap];
						SubtleSlickParse.debug && console.log(a[0], selectorBitName);
						break;
					}
				}
				
				SubtleSlickParse.debug && console.log((function(){ var o = {}; o[selectorBitName] = a[selectorBitMap]; return o; })());
				
				if (!ssp.parsedSelectors.length || a[map_separator]) {
					ssp.parsedSelectors.push([]);
					ssp[these_simpleSelectors] = ssp.parsedSelectors[ssp.parsedSelectors.length-1];
					if (ssp.parsedSelectors.length-1) return '';
				}
				
				if (!ssp[these_simpleSelectors].length || a[map_spaceCombinator] || a[map_combinator]) {
					ssp[this_simpleSelector] && (ssp[this_simpleSelector].reverseCombinator = a[map_spaceCombinator] || a[map_combinator]);
					ssp[these_simpleSelectors].push({
						combinator: a[map_spaceCombinator] || a[map_combinator]
					});
					ssp[this_simpleSelector] = ssp[these_simpleSelectors][ssp[these_simpleSelectors].length-1];
					ssp.parsedSelectors.type.push(ssp[this_simpleSelector].combinator);
					if (ssp[these_simpleSelectors].length-1) return '';
				}
				
				switch(selectorBitMap){
					
				case map_tagName:
					ssp[this_simpleSelector].tag = a[map_tagName];
					break;
					
				case map_id:
					ssp[this_simpleSelector].id  = a[map_id];
					break;
					
				case map_className:
					if(!ssp[this_simpleSelector].classes)
						ssp[this_simpleSelector].classes = [];
					ssp[this_simpleSelector].classes.push(a[map_className]);
					break;
					
				case map_attributeKey:
					if(!ssp[this_simpleSelector].attributes)
						ssp[this_simpleSelector].attributes = [];
					ssp[this_simpleSelector].attributes.push({
						name     : a[map_attributeKey],
						operator : a[map_attributeOperator] || null,
						value    : a[map_attributeValue] || a[map_attributeValueDouble] || a[map_attributeValueSingle] || null,
						regexp   : SubtleSlickParse.attribValueToRegex(a[map_attributeOperator], a[map_attributeValue] || a[map_attributeValueDouble] || a[map_attributeValueSingle] || '')
					});
					break;
					
				case map_pseudoClass:
					if(!ssp[this_simpleSelector].pseudos)
						ssp[this_simpleSelector].pseudos = [];
					var pseudoClassValue = a[map_pseudoClassValue] || a[map_pseudoClassValueDouble] || a[map_pseudoClassValueSingle];
					if (pseudoClassValue == 'odd') pseudoClassValue = '2n+1';
					if (pseudoClassValue == 'even') pseudoClassValue = '2n';
					
					pseudoClassValue = pseudoClassValue || (a[map_pseudoClassArgs] ? "" : null);
					
					ssp[this_simpleSelector].pseudos.push({
						name     : a[map_pseudoClass],
						argument : pseudoClassValue
					});
					break;
				}
				
				ssp.parsedSelectors.type.push(selectorBitName + (a[map_attributeOperator]||''));
				return '';
			};
			return ssp.parser = parser;
		},
		
		attribValueToRegex: function(){
			function attribValueToRegex(operator, value){
				if (!operator) return null;
				var val = ssp.XRegExp_escape(value);
				switch(operator){
				case  '=': return new RegExp('^'      +val+ '$'     );
				case '!=': return new RegExp('^(?!'   +val+ '$)'    );
				case '*=': return new RegExp(          val          );
				case '^=': return new RegExp('^'      +val          );
				case '$=': return new RegExp(          val+ '$'     );
				case '~=': return new RegExp('(^|\\s)'+val+'(\\s|$)');
				case '|=': return new RegExp('(^|\\|)'+val+'(\\||$)');
				default  : return null;
				}
			};
			return ssp.attribValueToRegex = attribValueToRegex;
		},
		
		cache:{},
		
		// selector: null,
		// parsedSelectors: null,
		// this_simpleSelector: null,
		// these_simpleSelectors: null,
		
		/* XRegExp_escape taken from XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License */
		/*** XRegExp.escape accepts a string; returns the string with regex metacharacters escaped. the returned string can safely be used within a regex to match a literal string. escaped characters are [, ], {, }, (, ), -, *, +, ?, ., \, ^, $, |, #, [comma], and whitespace. */
		XRegExp_escape: function(str){ return String(str).replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&"); }
		
	};
	
	var map_rawMatch = 0
	,   map_offset   = -2
	,   map_string   = -1
	,   map_combinator = 1
	,   map_spaceCombinator = 2
	,   map_separator  = 3
	,   map_tagName   = 4
	,   map_id        = 5
	,   map_className = 6
	,   map_attributeKey         = 7
	,   map_attributeOperator    = 8
	,   map_attributeValueDouble = 9
	,   map_attributeValueSingle = 10
	,   map_attributeValue       = 11
	,   map_pseudoClass            = 12
	,   map_pseudoClassArgs        = 13
	,   map_pseudoClassValueDouble = 14
	,   map_pseudoClassValueSingle = 15
	,   map_pseudoClassValue       = 16
	
	,   this_simpleSelector   = 'this_simpleSelector'
	,   these_simpleSelectors = 'these_simpleSelectors'
	;
	
	
	function SubtleSlickParse(CSS3_Selectors){
		ssp.selector = ''+CSS3_Selectors;
		if(!SubtleSlickParse.debug && ssp.cache[ssp.selector]) return ssp.cache[ssp.selector];
		ssp.parsedSelectors = [];
		ssp.parsedSelectors.type=[];
		
		while (ssp.selector != (ssp.selector = ssp.selector.replace(ssp.parseregexp, ssp.parser)));
		
		// ssp.parsedSelectors.type = ssp.parsedSelectors.type.join('');
		return ssp.cache[''+CSS3_Selectors] = ssp.parsedSelectors;
	};
	
	// Public methods ad properties
	var parseregexpBuilder = ssp.parseregexp;
	SubtleSlickParse.setCombinators = function setCombinators(combinatorsArray){
		ssp.combinators = combinatorsArray.join('').split('').sort();
		ssp.parseregexp = parseregexpBuilder(ssp.XRegExp_escape(ssp.combinators.join('')));
	};
	SubtleSlickParse.getCombinators = function getCombinators(){
		return ssp.combinators;
	};
	
	SubtleSlickParse.cache = ssp.cache;
	SubtleSlickParse.attribValueToRegex = ssp.attribValueToRegex(ssp);
	
	ssp.MAP(ssp);
	ssp.parser(ssp);
	SubtleSlickParse.setCombinators(ssp.combinators);
	
	return SubtleSlickParse;
})();

/* Slick */

var slick = (function(){
	
	// slick function
	function slick(context, expression){
		var buff = buffer.reset(), parsed = slick.parse(expression), all = [];
		var buffPushArray = buff['push(array)'], buffPushObject = buff['push(object)'], buffParseBit = buff['util(parse-bit)'];
		
		buff.state.context = context;
		
		for (var i = 0; i < parsed.length; i++){
			
			var currentSelector = parsed[i], items = [context];
			
			for (var j = 0; j < currentSelector.length; j++){
				var currentBit = currentSelector[j], combinator = 'combinator(' + (currentBit.combinator || ' ') + ')';
				var selector = buffParseBit(currentBit);
				var tag = selector[0], id = selector[1], params = selector[2];
				
				buff.state.found = [];
				buff.state.uniques = {};
				buff.state.idx = 0;
				
				if (j == 0){
					buff.push = buffPushArray;
					buff[combinator](context, tag, id, params);
				} else {
					buff.push = buffPushObject;
					for (var m = 0, n = items.length; m < n; m++) buff[combinator](items[m], tag, id, params);
				}
				
				items = buffer.state.found;
			}
			
			all = (i === 0) ? items : all.concat(items);
		}
		
		if (parsed.length > 1){
			var nodes = [], uniques = {}, idx = 0;
			for (var k = 0; k < all.length; k++){
				var node = all[k];
				var uid = buff['util(uid)'](node);
				if (!uniques[uid]){
					nodes[idx++] = node;
					uniques[uid] = true;
				}
			}
			return nodes;
		}
		
		return all;
	};
	
	// public pseudos
	
	var pseudos = {};
	
	slick.addPseudoSelector = function(name, fn){
		pseudos[name] = fn;
		return slick;
	};
	
	slick.getPseudoSelector = function(name){
		return pseudos[name];
	};
	
	// default getAttribute
	
	slick.getAttribute = function(node, name){
		if (name == 'class') return node.className;
		return node.getAttribute(name);
	};
	
	// default parser
	
	slick.parse = function(object){
		return object;
	};
	
	// matcher
	
	slick.match = function(node, selector, buff){
		if (!selector || selector === node) return true;
		if (!buff) buff = buffer.reset();
		var parsed = buff['util(parse-bit)'](slick.parse(selector)[0][0]);
		return buff['match(selector)'](node, parsed[0], parsed[1], parsed[2]);
	};
	
	var buffer = {
		
		// cache
		
		cache: {nth: {}},
		
		// uid index
		
		uidx: 1,
		
		// resets buffer state
		
		reset: function(){
			this.state = {positions: {}};
			return this;
		},
		
		// combinators
		
		'combinator( )': function(node, tag, id, selector){			
			if (id && node.getElementById){
				var item = node.getElementById(id);
				if (item) this.push(item, tag, null, selector);
				return;
			}
			var children = node.getElementsByTagName(tag);
			for (var i = 0, l = children.length; i < l; i++) this.push(children[i], null, id, selector);
		},
		
		'combinator(>)': function(node, tag, id, selector){
			var children = node.getElementsByTagName(tag);
			for (var i = 0, l = children.length; i < l; i++){
				var child = children[i];
				if (child.parentNode === node) this.push(child, null, id, selector);
			}
		},
		
		'combinator(+)': function(node, tag, id, selector){
			while ((node = node.nextSibling)){
				if (node.nodeType === 1){
					this.push(node, tag, id, selector);
					break;
				}
			}
		},
		
		'combinator(~)': function(node, tag, id, selector){
			while ((node = node.nextSibling)){
				if (node.nodeType === 1){
					var uid = this['util(uid)'](node);
					if (this.state.uniques[uid]) break;
					if (this['match(selector)'](node, tag, id, selector)){
						this.state.uniques[uid] = true;
						this.state.found.push(node);
					}
				}
			}
		},
		
		// pseudo
		
		'pseudo(checked)': function(node){
			return node.checked;
		},

		'pseudo(empty)': function(node){
			return !(node.innerText || node.textContent || '').length;
		},

		'pseudo(not)': function(node, selector){
			return !slick.match(node, selector, this);
		},

		'pseudo(contains)': function(node, text){
			return ((node.innerText || node.textContent || '').indexOf(text) > -1);
		},

		'pseudo(first-child)': function(node){
			return this['pseudo(index)'](node, 0);
		},

		'pseudo(last-child)': function(node){
			while ((node = node.nextSibling)){
				if (node.nodeType === 1) return false;
			}
			return true;
		},

		'pseudo(only-child)': function(node){
			var prev = node;
			while ((prev = prev.previousSibling)){
				if (prev.nodeType === 1) return false;
			}
			var next = node;
			while ((next = next.nextSibling)){
				if (next.nodeType === 1) return false;
			}
			return true;
		},

		'pseudo(nth-child)': function(node, argument){
			argument = (!argument) ? 'n' : argument;
			var parsed = this.cache.nth[argument] || this['util(parse-nth-argument)'](argument);
			if (parsed.special != 'n') return this['pseudo(' + parsed.special + ')'](node, argument);
			if (parsed.a === 1 && parsed.b === 0) return true;
			var count = 0, uid = this['util(uid)'](node);
			if (!this.state.positions[uid]){
				while ((node = node.previousSibling)){
					if (node.nodeType !== 1) continue;
					count ++;
					var uis = this['util(uid)'](node);
					var position = this.state.positions[uis];
					if (position != null){
						count = position + count;
						break;
					}
				}
				this.state.positions[uid] = count;
			}
			return (this.state.positions[uid] % parsed.a === parsed.b);
		},

		// custom pseudo selectors

		'pseudo(index)': function(node, index){
			var count = 0;
			while ((node = node.previousSibling)){
				if (node.nodeType === 1 && ++count > index) return false;
			}
			return (count === index);
		},

		'pseudo(even)': function(node, argument){
			return this['pseudo(nth-child)'](node, '2n+1');
		},

		'pseudo(odd)': function(node, argument){
			return this['pseudo(nth-child)'](node, '2n');
		},
		
		// util
		
		'util(uid)': (window.ActiveXObject) ? function(node){
			return (node.sLickUID || (node.sLickUID = [this.uidx++]))[0];
		} : function(node){
			return node.sLickUID || (node.sLickUID = this.uidx++);
		},
		
		'util(parse-nth-argument)': function(argument){
			var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
			if (!parsed) return false;
			var inta = parseInt(parsed[1], 10);
			var a = (inta || inta === 0) ? inta : 1;
			var special = parsed[2] || false;
			var b = parseInt(parsed[3], 10) || 0;
			if (a != 0){
				b--;
				while (b < 1) b += a;
				while (b >= a) b -= a;
			} else {
				a = b;
				special = 'index';
			}
			switch (special){
				case 'n': parsed = {a: a, b: b, special: 'n'}; break;
				case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
				case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
				case 'first': parsed = {a: 0, special: 'index'}; break;
				case 'last': parsed = {special: 'last-child'}; break;
				case 'only': parsed = {special: 'only-child'}; break;
				default: parsed = {a: (a - 1), special: 'index'};
			}

			return this.cache.nth[argument] = parsed;
		},
		
		'util(parse-bit)': function(bit){
			var selector = {
				classes: bit.classes || [],
				attributes: bit.attributes || [],
				pseudos: bit.pseudos || []
			};
			
			for (var i = 0; i < selector.pseudos.length; i++){
				var pseudo = selector.pseudos[i];
				if (!pseudo.newName) pseudo.newName = 'pseudo(' + pseudo.name + ')';
			};
			
			return [bit.tag || '*', bit.id, selector];
		},
		
		'util(string-contains)': function(source, string, separator){
			separator = separator || '';
			return (separator + source + separator).indexOf(separator + string + separator) > -1;
		},
		
		// match
		
		'match(tag)': function(node, tag){
			return (tag === '*' || (node.tagName && node.tagName.toLowerCase() === tag));
		},
		
		'match(id)': function(node, id){
			return ((node.id && node.id === id));
		},
		
		'match(class)': function(node, className){
			return (this['util(string-contains)'](node.className, className, ' '));
		},
		
		'match(attribute)': function(node, name, operator, value, regexp){
			if (node.hasAttribute) {
				if(node.hasAttribute(name)){
					if(!operator){ return true;}
				}else{
					return false;
				}
			}
			var actual = slick.getAttribute(node, name);
			if (!operator) return (actual != null);
			if (operator === '=') return (actual === value);
			if (actual == null && (!value || operator === '!=')) return false;
			return regexp.test(actual);
		},
		
		'match(pseudo)': function(node, name, argument, newName){
			if (this[newName]){
				return this[newName](node, argument);
			} else if (pseudos[name]){
				return pseudos[name].call(node, argument);
			} else {
				return this['match(attribute)'](node, name, (argument == null) ? null : '=', argument);
			}
		},
		
		'match(selector)': function(node, tag, id, selector){
			if (tag && !this['match(tag)'](node, tag)) return false;
			if (id && !this['match(id)'](node, tag)) return false;

			var i;

			var classes = selector.classes;
			for (i = classes.length; i--; i){
				var className = classes[i];
				if (!node.className || !this['match(class)'](node, className)) return false;
			}

			var attributes = selector.attributes;
			for (i = attributes.length; i--; i){
				var attribute = attributes[i];
				if (!this['match(attribute)'](node, attribute.name, attribute.operator, attribute.value, attribute.regexp)) return false;
			}

			var pseudos = selector.pseudos;
			for (i = pseudos.length; i--; i){
				var pseudo = pseudos[i];
				if (!this['match(pseudo)'](node, pseudo.name, pseudo.argument, pseudo.newName)) return false;
			}

			return true;
		},
		
		// push
		
		'push(object)': function(node, tag, id, selector){
			var uid = this['util(uid)'](node);
			if (!this.state.uniques[uid] && this['match(selector)'](node, tag, id, selector)){
				this.state.uniques[uid] = true;
				this.state.found[this.state.idx++] = node;
			}
		},
		
		'push(array)': function(node, tag, id, selector){
			if (this['match(selector)'](node, tag, id, selector)) this.state.found[this.state.idx++] = node;
		}

	};
	
	return slick;

})();

slick.parse = SubtleSlickParse;

// implementation

document.search = function(expression){
	return slick(document, expression);
};

document.find = function(expression){
	return (slick(document, expression)[0] || null);
};
