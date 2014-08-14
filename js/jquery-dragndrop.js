/*
	jQuery - drag 'n' drop - 1.1
	https://github.com/Mr21/jquery-dragndrop
*/

$.fn.dragndrop = function(arg) {
	return new $.fn.dragndrop.obj(this, arg);
};

$.fn.dragndrop.obj = function($parent, arg) {
	var self = this;
	this.arg = arg;
	this.duration = arg.duration || 200;
	this.$parent = $parent;
	this.$drops = null;
	this.$drags = null;
	this.$dragHoles = null;
	this.elemsSelected = [];
	this.elemsDetached = [];
	this.dragW = 0;
	this.dragH = 0;
	this.keyCtrl = false;
	this.keyShift = false;
	this.mouseLeft = false;
	this.mouseDrag = false;
	this.mouseX = 0;
	this.mouseY = 0;
	this.mouseIncX = 0;
	this.mouseIncY = 0;
	this.dropOver = null;
	this.dragOverA = null;
	this.dragOverB = null;

	this.nodeEvents(true, true);
	$parent
		.on('DOMNodeInserted', function(e) {
			var $e = $(e.target),
				drop = $e.hasClass('jqdnd-drop') || $e.find('.jqdnd-drop').length,
				drag = !e.target._jqdnd_known && $e.hasClass('jqdnd-drag');
			if (!drag)
				drag = $e.find('.jqdnd-drag').length;
			if (drop || drag)
				self.nodeEvents(drop, drag);
		});

	$(window)
		.blur(function() {
			self.keyCtrl = false;
			self.keyShift = false;
			self.mouseLeft = false;
			self.dragStop();
		});

	$(document)
		.mouseup(function() {
			if (self.mouseDrag) {
				self.dragStop();
			} else if (!self.keyCtrl && !self.keyShift) {
				self.unselectAll();
			}
			self.mouseLeft = false;
		})
		.mousemove(function(e) {
			self.mouseIncX = e.pageX - self.mouseX;
			self.mouseIncY = e.pageY - self.mouseY;
			self.mouseX = e.pageX;
			self.mouseY = e.pageY;
			self.mousemove();
		})
		.keydown(function(e) {
			switch (e.keyCode) {
				case 224: case 91: case 93:
				case 17: self.keyCtrl = true; break;
				case 16: self.keyShift = true; break;
			}
		})
		.keyup(function(e) {
			switch (e.keyCode) {
				case 224: case 91: case 93:
				case 17: self.keyCtrl = false; break;
				case 16: self.keyShift = false; break;
			}
		});
};

// Methodes
$.fn.dragndrop.obj.prototype = {
	dragDimension: function() {
		var $drag = $('.jqdnd-drag:first', this.$parent);
		this.dragW = $drag.width();
		this.dragH = $drag.height();
	},

	nodeEvents: function(drop, drag) {
		if (drop)
			this.$drops = $('.jqdnd-drop', this.$parent);
		if (drag) {
			var self = this;
			if (this.$drags)
				this.$drags.off();
			this.$drags =
			$('.jqdnd-drag', this.$parent)
				.each(function() {
					this._jqdnd_known = true;
				})
				.mouseup(function(e) {
					if (!self.mouseDrag)
						e.stopPropagation();
					self.mouseLeft = false;
				})
				.mouseleave(function(e) {
					if (self.mouseLeft && !self.mouseDrag) {
						self.dragDimension();
						self.regroup(e);
						self.mouseDrag = true;
					}
				})
				.mousedown(function(e) {
					e.preventDefault();
					if (e.button === 0) {
						var $this = $(this),
							elems = [],
							selected = $this.hasClass('selected');
						if ($this.css('position') !== 'absolute') {
							self.mouseLeft = true;
							self.stopAnimations();
						}
						if (!selected && !self.keyCtrl) {
							if (self.keyShift && self.elemsSelected.length)
								elems.push(self.elemsSelected[self.elemsSelected.length - 1]);
							self.unselectAll();
						}
						if (!selected || self.keyShift) {
							if (self.keyShift) {
								var elemA = self.elemsSelected[self.elemsSelected.length - 1] || elems[0];
								if (elemA !== this) {
									var	$drags = $('.jqdnd-drag', self.$parent),
										AInd = $.inArray(elemA, $drags),
										BInd = $.inArray(this, $drags),
										incr = AInd < BInd ? 1 : -1,
										i = AInd + incr;
									for (; i !== BInd; i += incr)
										if (!$drags.eq(i).hasClass('selected'))
											elems.push($drags[i]);
								}
							}
							if (!selected)
								elems.push(this);
							self.select(elems);
						} else if (selected && self.keyCtrl) {
							self.elemsSelected.splice(self.elemsSelected.indexOf(this), 1);
							self.unselect($this);
							$(self.elemsSelected)
								.children('.jqdnd-dragNumber')
								.html(function(i) { return i + 1; });
						}
					}
				});
		}
	},

	select: function(elems) {
		var a = this.elemsSelected;
		$(elems)
			.addClass('selected')
			.append(function() {
				return '<span class="jqdnd-dragNumber">'+ a.push(this) +'</span>';
			});
	},

	unselect: function(elems) {
		$(elems)
			.removeClass('selected')
			.children('.jqdnd-dragNumber')
				.remove();
	},

	unselectAll: function() {
		this.unselect(this.elemsSelected);
		this.elemsSelected.length = 0;
	},

	detach: function() {
		var self = this,
			parents = [];
		this.$dragHoles = $('<i class="jqdnd-dragHole">').insertBefore(this.elemsSelected);
		$.each(this.elemsSelected, function() {
			parents.push(this._pl = this.parentNode);
			this._$prev = $(this).prev();
			this._pos = $(this).offset();
		});
		$.each(this.elemsSelected, function(i) {
			self.elemsDetached.push(this);
			var $this = $(this);
			$this
				.prependTo(document.body) // we have to make 2 foreach because this detach...
				.css('top',  this._pos.top  + 'px')
				.css('left', this._pos.left + 'px');
		});
		this.$dragHoles
			.css('width', this.dragW + 'px')
			.animate({width: '0px'}, this.duration, 'swing');
		// Events:ondrag
		if (this.arg.ondrag)
			this.arg.ondrag(
				$.unique(parents),
				this.elemsDetached.slice()
			);
	},

	attach: function() {
		var self = this,
			parent = this.elemsSelected[0]._$prev.parent()[0],
			nbElems = this.elemsSelected.length,
			i = 0;
		this.$dragHoles.stop().animate({width: this.dragW + 'px'}, this.duration, 'swing');
		$.each(this.elemsSelected, function() {
			$(this).stop(true).animate({
				left : this._pos.left + 'px',
				top  : this._pos.top  + 'px',
				marginLeft : '0px',
				marginTop  : '0px'
			}, self.duration, 'swing', function() {
				$(this)
					.css({left:'0px', top:'0px'})
					.insertAfter(this._$prev);
				this._$prev.remove();
				if (++i === nbElems) {
					// Events:ondrop
					if (self.arg.ondrop)
						self.arg.ondrop(
							parent,
							self.elemsSelected.slice()
						);
					self.elemsDetached.length = 0;
					self.dropOver =
					self.dragOverA =
					self.dragOverB = null;
				}
			})
		});
	},

	regroup: function(e) {
		var self = this,
			x = e.pageX - this.dragW / 2,
			y = e.pageY - this.dragH / 2,
			decay = 5 + 30 / this.elemsSelected.length,
			opt = {duration: this.duration, easing: 'swing'};
		this.detach();
		$.each(this.elemsSelected, function(i) {
			if (i === self.elemsSelected.length - 1)
				opt.complete = function() { self.mouseHover(); };
			$(this).animate({
				left : (x + i * decay) + 'px',
				top  :  y + 'px'
			}, opt);
		});
	},

	mousemove: function() {
		if (this.mouseDrag) {
			$(this.elemsSelected)
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
		this.$drags.each(function() {
			$this = $(this);
			var pos = $this.offset();
			if (mouseIn(pos, self.dragW, self.dragH) &&
				!$this.hasClass('selected') &&
				$this.css('position') !== 'absolute')
			{
				side = self.mouseX < pos.left + self.dragW / 2;
				dragA = ( side ? $this.prevAll('.jqdnd-drag').first() : $this)[0];
				dragB = (!side ? $this.nextAll('.jqdnd-drag').first() : $this)[0];
				return false;
			}
		});
		if (side === undefined)
			$('.jqdnd-dragHole').each(function() {
				$this = $(this);
				if (mouseIn($this.offset(), $this.width(), self.dragH)) {
					dragA = $this.prevAll('.jqdnd-drag').first()[0];
					dragB = $this.nextAll('.jqdnd-drag').first()[0];
					return side = false;
				}
			});
		if (side !== undefined)
			drop = (dragA && dragA.parentNode) || (dragB && dragB.parentNode);
		else
			this.$drops.each(function() {
				$this = $(this);
				if (mouseIn($this.offset(), $this.width(), $this.height())) {
					dragA = $('.jqdnd-drag:last', this)[0];
					drop = this;
					return false;
				}
			});
		// Events:ondragover/out, ondropover/out
		if (this.arg.ondropout  && this.dropOver && drop !== this.dropOver)
			this.arg.ondropout(this.dropOver);
		if (this.arg.ondropover && drop          && drop !== this.dropOver)
			this.arg.ondropover(drop);
		if (this.arg.ondragout && (
			(this.dragOverA && dragA !== this.dragOverA) ||
			(this.dragOverB && dragB !== this.dragOverB)))
				this.arg.ondragout(this.dragOverA, this.dragOverB);
		if (this.arg.ondragover && (
			(dragA && dragA !== this.dragOverA) ||
			(dragB && dragB !== this.dragOverB)))
				this.arg.ondragover(dragA, dragB);
		// save the values
		this.dropOver = drop;
		this.dragOverA = dragA;
		this.dragOverB = dragB;
	},

	stopAnimations: function() {
		if (this.elemsDetached.length > 0) {
			$(this.elemsDetached).finish();
			this.$dragHoles.finish();
		}
	},

	dragStop: function() {
		if (!this.mouseDrag)
			return;
		var self = this,
			$this, $e,
			objWidth,
			insertFn,
			elem, parent,
			rankVid = 0;
		this.mouseDrag = false;
		if (this.dropOver || this.dragOverA || this.dragOverB) {
			function calcRank($e) {
				for (; $e[0]; $e = $e.prev())
					if ($e.hasClass('jqdnd-drag'))
						++rankVid;
			}
			if (this.dragOverB) {
				insertFn = 'insertBefore';
				elem = this.dragOverB;
				calcRank($(elem).prev());
				parent = elem.parentNode;
			} else {
				insertFn = 'appendTo';
				elem = this.dragOverA;
				calcRank($(elem));
				if (this.dropOver)
					elem = this.dropOver;
				parent = elem;
			}
			var nbVidsW = parseInt(parent.offsetWidth / this.dragW),
				pos = this.$dragHoles
					.stop(true)
					.css('width', '0px')
					.detach()
					[insertFn](elem)
					.offset();
			if (rankVid !== 0 && rankVid % nbVidsW === 0) {
				pos.left -= nbVidsW * this.dragW;
				pos.top += this.dragH;
			}
			this.$dragHoles.each(function(i) {
				var v = self.elemsSelected[i];
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
		this.attach();
		// Events:ondropout, ondragout
		if (self.arg.ondropout && self.dropOver)
			self.arg.ondropout(self.dropOver);
		if (self.arg.ondragout && (self.dragOverA || self.dragOverB))
			self.arg.ondragout(self.dragOverA, self.dragOverB);
	}
};
