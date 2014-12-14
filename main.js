function lg(s) { console.log(s); }

function printElems(d) {
	var s = '';
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

$(function() {
	$('#moreAt')[top.location === self.location ? 'show' : 'remove']();

	$.plugin_dragndrop('#dragndrop')
		.duration(150)
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
		})
		.onDragOut(function(l, r) {
			lg('<<< ondragout');
			lg(printElems(l));
			lg(printElems(r));
		})
		.onDropOver(function(drop) {
			lg('>>> ondropover');
			lg(printElems(drop));
		})
		.onDropOut(function(drop) {
			lg('<<< ondropout');
			lg(printElems(drop));
		});
});
