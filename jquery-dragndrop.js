/*
	jQuery - drag 'n' drop - 2.0
	https://github.com/Mr21/jquery-dragndrop
*/

$.plugin_dragndrop = function(parent, options) {
	return new $.plugin_dragndrop.obj(
		parent.jquery
			? parent.eq(0)
			: $(parent),
		options || {}
	);
};

$.plugin_dragndrop.obj = function(jq_parent, options) {
	this.dropClass     = options.dropClass     || 'jqdragndrop-drop';
	this.dragClass     = options.dragClass     || 'jqselection-selectable';
	this.dragHoleClass = options.dragHoleClass || 'jqdragndrop-hole';
	this.jq_parent = jq_parent;
	this.jq_drops = null;
	this.jq_drags = null;
	this.el_dragsParents = [];
	this.jq_dragHoles = null;
	this.el_detached = [];
	this.el_dropOver = null;
	this.el_dragOverA = null;
	this.el_dragOverB = null;
	this.dragW = 0;
	this.dragH = 0;
	this.mouseLeft = false;
	this.mouseDrag = false;
	this.mouseX = 0;
	this.mouseY = 0;
	this.mouseIncX = 0;
	this.mouseIncY = 0;
	this.ms = 200;

	if (!$.plugin_selection) {
		this.el_selected = [];
	} else {
		this.plugin_selection = $.plugin_selection(jq_parent, {
			selectableClass : this.dragClass,
			selectedClass : options.dragSelectedClass,
			numberClass : options.dragSelectedClass
		});
		this.el_selected = this.plugin_selection.getArraySelection();
	}

	var self = this;

	this.nodeEvents(true, true);
	jq_parent
		.on('DOMNodeInserted', function(e) {
			var $e = $(e.target),
				drop = $e.hasClass(self.dropClass) || $e.find('.' + self.dropClass).length,
				drag = !e.target._jqdragndrop_ready && $e.hasClass(self.dragClass);
			if (!drag)
				drag = $e.find('.' + self.dragClass).length;
			if (drop || drag)
				self.nodeEvents(drop, drag);
		});

	$(window)
		.blur(function() {
			self.mouseLeft = false;
			self.dragStop();
		});

	$(document)
		.mouseup(function() {
			if (self.mouseDrag) {
				self.dragStop();
			}
			self.mouseLeft = false;
		})
		.mousemove(function(e) {
			self.mouseIncX = e.pageX - self.mouseX;
			self.mouseIncY = e.pageY - self.mouseY;
			self.mouseX = e.pageX;
			self.mouseY = e.pageY;
			self.mousemove();
		});
};

// Methodes
$.plugin_dragndrop.obj.prototype = {
	// public ********************
	selection: function() { return this.plugin_selection; },
	duration: function(ms) {
		if (ms !== undefined)
			return this.ms = ms, this;
		return this.ms;
	},
	// events
	onDrag:     function(cb) { this.cbDrag     = cb; return this; },
	onDrop:     function(cb) { this.cbDrop     = cb; return this; },
	onDragOver: function(cb) { this.cbDragOver = cb; return this; },
	onDragOut:  function(cb) { this.cbDragOut  = cb; return this; },
	onDropOver: function(cb) { this.cbDropOver = cb; return this; },
	onDropOut:  function(cb) { this.cbDropOut  = cb; return this; },

	// private ********************
	dragDimension: function() {
		this.dragW = this.jq_drags.width();
		this.dragH = this.jq_drags.height();
	},

	nodeEvents: function(drop, drag) {
		if (drop)
			this.jq_drops = this.jq_parent.find('.' + this.dropClass);
		if (drag) {
			var self = this;
			this.jq_drags = this.jq_parent
				.find('.' + this.dragClass)
				.each(function() {
					if (!this._jqdragndrop_ready) {
						this._jqdragndrop_ready = true;
						$(this)
							.mouseup(function(e) {
								if (!self.mouseDrag)
									e.stopPropagation();
								self.mouseLeft = false;
							})
							.mouseleave(function(e) {
								if (self.mouseLeft && !self.mouseDrag) {
									if (!self.plugin_selection)
										self.el_selected.push(this);
									self.dragDimension();
									self.regroup(e);
									self.mouseDrag = true;
								}
							})
							.mousedown(function(e) {
								e.preventDefault();
								if (e.button === 0 && $(this).css('position') !== 'absolute') {
									self.mouseLeft = true;
									self.stopAnimations();
								}
							});
					}
				});
		}
	},

	detach: function() {
		var self = this;
		this.el_dragsParents.length = 0;
		this.jq_dragHoles = $('<i>').addClass(this.dragHoleClass).insertBefore(this.el_selected);
		$.each(this.el_selected, function() {
			var $this = $(this);
			self.el_dragsParents.push(this._pl = this.parentNode);
			this._$prev = $this.prev();
			this._pos = $this.offset();
		});
		$.each(this.el_selected, function(i) {
			self.el_detached.push(this);
			$(this)
				.prependTo(document.body) // we have to make 2 foreach because this detach...
				.css('top',  this._pos.top  + 'px')
				.css('left', this._pos.left + 'px');
		});
		this.jq_dragHoles
			.css('width', this.dragW + 'px')
			.animate({width: '0px'}, this.ms, 'swing');
		$.unique(this.el_dragsParents);
		// Events:ondrag
		if (this.cbDrag)
			this.cbDrag(
				this.el_dragsParents,
				this.el_detached.slice()
			);
	},

	attach: function(dropWell) {
		var self = this,
			parents = dropWell
				? [this.el_selected[0]._$prev.parent()[0]]
				: this.el_dragsParents,
			nbElems = this.el_selected.length,
			i = 0;
		this.jq_dragHoles.stop().animate({width: this.dragW + 'px'}, this.ms, 'swing');
		$.each(this.el_selected, function() {
			$(this).stop(true).animate({
				left : this._pos.left + 'px',
				top  : this._pos.top  + 'px',
				marginLeft : '0px',
				marginTop  : '0px'
			}, self.ms, 'swing', function() {
				$(this)
					.css({left:'0px', top:'0px'})
					.insertAfter(this._$prev);
				this._$prev.remove();
				if (++i === nbElems) {
					// Events:ondrop
					if (self.cbDrop)
						self.cbDrop(parents, self.el_selected.slice());
					self.el_detached.length = 0;
					self.el_dropOver =
					self.el_dragOverA =
					self.el_dragOverB = null;
				}
			})
		});
	},

	regroup: function(e) {
		var self = this,
			x = e.pageX - this.dragW / 2,
			y = e.pageY - this.dragH / 2,
			decay = 5 + 30 / this.el_selected.length,
			opt = {duration: this.ms, easing: 'swing'};
		this.detach();
		$.each(this.el_selected, function(i) {
			if (i === self.el_selected.length - 1)
				opt.complete = function() { self.mouseHover(); };
			$(this).animate({
				left : (x + i * decay) + 'px',
				top  :  y + 'px'
			}, opt);
		});
	},

	mousemove: function() {
		if (this.mouseDrag) {
			$(this.el_selected)
				.css('marginLeft', '+=' + this.mouseIncX + 'px')
				.css('marginTop',  '+=' + this.mouseIncY + 'px');
			this.mouseHover();
		}
	},

	mouseHover: function() {
		if (this.mouseDrag === false)
			return; // lie au callback mouseHover() dans regroup()
		var self = this, $this,
			dragA, dragB, drop, side,
			fn = this.mouseHover;
		function mouseIn(p, w, h) {
			return p.left <= self.mouseX && self.mouseX < p.left + w &&
			       p.top  <= self.mouseY && self.mouseY < p.top  + h;
		}
		this.jq_drops.each(function() {
			var $this = $(this);
			if (mouseIn($this.offset(), $this.width(), $this.height())) {
				drop = this;
				dragA = $this.find('.' + self.dragClass + ':last')[0];
				return false;
			}
		});
		if (drop) {
			this.jq_drags.each(function() {
				if (this.parentNode === drop) {
					$this = $(this);
					var pos = $this.offset();
					if (mouseIn(pos, self.dragW, self.dragH) &&
						!$this.hasClass('selected') &&
						$this.css('position') !== 'absolute')
					{
						side = self.mouseX < pos.left + self.dragW / 2;
						dragA = ( side ? $this.prevAll('.' + self.dragClass).first() : $this)[0];
						dragB = (!side ? $this.nextAll('.' + self.dragClass).first() : $this)[0];
						return false;
					}
				}
			});
			if (side === undefined)
				this.jq_parent.find('.' + this.dragHoleClass).each(function() {
					if (this.parentNode === drop) {
						$this = $(this);
						if (mouseIn($this.offset(), $this.width(), self.dragH)) {
							dragA = $this.prevAll('.' + self.dragClass).first()[0];
							dragB = $this.nextAll('.' + self.dragClass).first()[0];
							return side = false;
						}
					}
				});
			if (side !== undefined)
				drop = (dragA && dragA.parentNode) || (dragB && dragB.parentNode);
		}
		// Events:ondragover/out, ondropover/out
		if (this.cbDropOut  && this.el_dropOver && drop !== this.el_dropOver)
			this.cbDropOut(this.el_dropOver);
		if (this.cbDropOver && drop && drop !== this.el_dropOver)
			this.cbDropOver(drop);
		if (this.cbDragOut && (
			(this.el_dragOverA && dragA !== this.el_dragOverA) ||
			(this.el_dragOverB && dragB !== this.el_dragOverB)))
				this.cbDragOut(this.el_dragOverA, this.el_dragOverB);
		if (this.cbDragOver && (
			(dragA && dragA !== this.el_dragOverA) ||
			(dragB && dragB !== this.el_dragOverB)))
				this.cbDragOver(dragA, dragB);
		// save the values
		this.el_dropOver = drop;
		this.el_dragOverA = dragA;
		this.el_dragOverB = dragB;
	},

	stopAnimations: function() {
		if (this.el_detached.length > 0) {
			$(this.el_detached).finish();
			this.jq_dragHoles.finish();
		}
	},

	dragStop: function() {
		if (!this.mouseDrag)
			return;
		this.mouseDrag = false;
		var dropWell = this.el_dropOver || this.el_dragOverA || this.el_dragOverB;
		if (dropWell) {
			var self = this,
				insertFn,
				elem, parent,
				rankVid = 0;
			function calcRank($e) {
				for (; $e[0]; $e = $e.prev())
					if ($e.hasClass(self.dragClass))
						++rankVid;
			}
			if (this.el_dragOverB) {
				insertFn = 'insertBefore';
				elem = this.el_dragOverB;
				calcRank($(elem).prev());
				parent = elem.parentNode;
			} else {
				insertFn = 'appendTo';
				elem = this.el_dragOverA;
				calcRank($(elem));
				if (this.el_dropOver)
					elem = this.el_dropOver;
				parent = elem;
			}
			var nbVidsW = parseInt(parent.offsetWidth / this.dragW),
				pos = this.jq_dragHoles
					.stop(true)
					.css('width', '0px')
					.detach()
					[insertFn](elem)
					.offset();
			if (rankVid !== 0 && rankVid % nbVidsW === 0) {
				pos.left -= nbVidsW * this.dragW;
				pos.top += this.dragH;
			}
			this.jq_dragHoles.each(function(i) {
				var	v = self.el_selected[i],
					$this = $(this);
				v._pl = null;
				v._$prev = $this;
				v._pos.left = pos.left;
				v._pos.top  = pos.top;
				if (++rankVid % nbVidsW) {
					pos.left += self.dragW;
				} else {
					pos.left -= (nbVidsW - 1) * self.dragW;
					pos.top += self.dragH;
				}
			});
		}
		this.attach(dropWell);
		if (!this.plugin_selection)
			this.el_selected.length = 0;
		// Events:ondropout, ondragout
		if (this.cbDropOut && this.el_dropOver)
			this.cbDropOut(this.el_dropOver);
		if (this.cbDragOut && (this.el_dragOverA || this.el_dragOverB))
			this.cbDragOut(this.el_dragOverA, this.el_dragOverB);
	}
};
