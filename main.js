function lg(s) { console.log(s); }

$(function() {
	var
		DURATION = 150,
		CSS_CLOSE = {backgroundPosition:'0px'},
		dragndrop = $.plugin_dragndrop($('#dragndrop')),
		selection = dragndrop.selection();

	function printElems(d) {
		var s = '';
		if (!d || !d.push)
			d = [d];
		if (d[0]) {
			var fn = d[0].className.indexOf('jqselection-selectable') > -1
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

	dragndrop
		.duration(DURATION)
		.onDrag(function(drops, drags) {
			lg('>>> ondrag');
			lg(printElems(drops));
			lg(printElems(drags));
		})
		.onDrop(function(drops, drags) {
			lg('<<< ondrop');
			lg(printElems(drops));
			lg(printElems(drags));
		})
		.onDragOver(function(l, r) {
			lg('>>> ondragover');
			lg(printElems(l));
			lg(printElems(r));
			var $l = $(l),
				$r = $(r);
			$l.stop().animate({backgroundPosition: $l.width() * -0.1 + 'px'}, DURATION, 'swing');
			$r.stop().animate({backgroundPosition: $r.width() *  0.5 + 'px'}, DURATION, 'swing');
		})
		.onDragOut(function(l, r) {
			lg('<<< ondragout');
			lg(printElems(l));
			lg(printElems(r));
			$(l).stop().animate(CSS_CLOSE, DURATION, 'swing');
			$(r).stop().animate(CSS_CLOSE, DURATION, 'swing');
		})
		.onDropOver(function(drop) {
			lg('>>> ondropover');
			lg(printElems(drop));
			$(drop).addClass('hover');
		})
		.onDropOut(function(drop) {
			lg('<<< ondropout');
			lg(printElems(drop));
			$(drop).removeClass('hover');
		});

});
