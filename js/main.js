function lg(s) { console.log(s); }

$(function() {
	var
		DURATION = 150,
		CSS_CLOSE = {backgroundPosition:'0px'};

	function printElems(d) {
		var s = '';
		if (!d || !d.push)
			d = [d];
		if (d[0]) {
			var fn = d[0].className.indexOf('jqdnd-drag') > -1
					? function(e) { return /([^\/]*)\.jpg/.exec(e.getAttribute('style'))[1]; }
					: function(e) { return e.className.split(' ')[1]; };
			$.each(d, function() {
				if (s)
					s += ', ';
				s += fn(this);
			});
		}
		return '    ' + (s || '...');
	}

	$('#dragndrop').dragndrop({
		duration: DURATION,
		ondrag: function(drops, drags) {
			lg('>>> ondrag');
			lg(printElems(drops));
			lg(printElems(drags));
		},
		ondrop: function(drop, drags) {
			lg('<<< ondrop');
			lg(printElems(drop));
			lg(printElems(drags));
		},
		ondragover: function(l, r) {
			lg('>>> ondragover');
			lg(printElems(l));
			lg(printElems(r));
			var $l = $(l),
				$r = $(r);
			$l.stop().animate({backgroundPosition: $l.width() * -0.1 + 'px'}, DURATION, 'swing');
			$r.stop().animate({backgroundPosition: $r.width() *  0.5 + 'px'}, DURATION, 'swing');
		},
		ondragout: function(l, r) {
			lg('<<< ondragout');
			lg(printElems(l));
			lg(printElems(r));
			$(l).stop().animate(CSS_CLOSE, DURATION, 'swing');
			$(r).stop().animate(CSS_CLOSE, DURATION, 'swing');
		},
		ondropover: function(drop) {
			lg('>>> ondropover');
			lg(printElems(drop));
			$(drop).addClass('hover');
		},
		ondropout: function(drop) {
			lg('<<< ondropout');
			lg(printElems(drop));
			$(drop).removeClass('hover');
		}
	});
});

/*
	// La methode .delete qui se trouvait dans le plugin au debut:
	// case 46: self.delete(); break;
	delete: function() {
		var self = this,
			$drags = $(this.elemsSelected),
			i = 0;
		$drags
			.css('backgroundPosition', 'right')
			.animate({width: '0px'}, this.duration, 'swing', function() {
				if (++i === self.elemsSelected.length) {
					$drags.remove();
					self.elemsSelected.length = 0;
				}
			});
	},
*/
