/* 手写板：鼠标 / 触屏书写，支持撤销、清空、保存图片。 */
(function (global) {
  'use strict';
  var StudyHub = global.StudyHub = global.StudyHub || {};

  function create(host, opts) {
    opts = opts || {};
    var height = opts.height || 220;
    var penColor = opts.penColor || '#1F2733';
    var penWidth = opts.penWidth || 2.2;
    var eraserWidth = opts.eraserWidth || 18;
    var strokes = [];
    var current = null;
    var drawing = false;

    host.innerHTML =
      '<div class="hw">' +
        '<div class="hw-bar">' +
          '<button type="button" class="hw-btn active" data-hw="pen">笔</button>' +
          '<button type="button" class="hw-btn" data-hw="eraser">橡皮</button>' +
          '<button type="button" class="hw-btn" data-hw="undo">撤销</button>' +
          '<button type="button" class="hw-btn" data-hw="clear">清空</button>' +
          '<button type="button" class="hw-btn" data-hw="save">保存图片</button>' +
          '<span class="hw-hint">按住鼠标 / 手指书写</span>' +
        '</div>' +
        '<canvas class="hw-canvas" style="height:' + height + 'px"></canvas>' +
      '</div>';

    var canvas = host.querySelector('.hw-canvas');
    var ctx = canvas.getContext('2d');
    var mode = 'pen';

    function fit() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(2, global.devicePixelRatio || 1);
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        redraw();
      }
    }

    function drawStroke(s) {
      if (!s.points.length) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (s.erase) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = eraserWidth;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
      }
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (var i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1);
      ctx.stroke();
      ctx.restore();
    }

    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < strokes.length; i++) drawStroke(strokes[i]);
    }

    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var dpr = canvas.width / Math.max(1, r.width);
      return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    }

    function down(e) {
      e.preventDefault();
      if (e.pointerId !== undefined && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      }
      drawing = true;
      current = {
        erase: mode === 'eraser',
        color: penColor,
        width: penWidth,
        points: [pos(e)]
      };
      strokes.push(current);
      redraw();
      if (opts.onChange) opts.onChange();
    }

    function move(e) {
      if (!drawing || !current) return;
      e.preventDefault();
      var last = current.points[current.points.length - 1];
      var p = pos(e);
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 0.8) return;
      current.points.push(p);
      drawStroke(current);
      if (opts.onChange) opts.onChange();
    }

    function up(e) {
      if (!drawing) return;
      drawing = false;
      current = null;
      if (e && e.pointerId !== undefined && canvas.releasePointerCapture) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      if (opts.onChange) opts.onChange();
    }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function (e) { if (drawing) up(e); });

    host.querySelectorAll('[data-hw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-hw');
        if (act === 'pen' || act === 'eraser') {
          mode = act;
          host.querySelectorAll('[data-hw="pen"],[data-hw="eraser"]').forEach(function (b) {
            b.classList.toggle('active', b === btn);
          });
        } else if (act === 'undo') {
          if (drawing) return;
          strokes.pop();
          redraw();
          if (opts.onChange) opts.onChange();
        } else if (act === 'clear') {
          strokes = [];
          redraw();
          if (opts.onChange) opts.onChange();
        } else if (act === 'save') {
          save();
        }
      });
    });

    function save() {
      if (!strokes.length) return;
      var out = document.createElement('canvas');
      out.width = canvas.width;
      out.height = canvas.height;
      var octx = out.getContext('2d');
      octx.fillStyle = '#fff';
      octx.fillRect(0, 0, out.width, out.height);
      octx.drawImage(canvas, 0, 0);
      var a = document.createElement('a');
      var d = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      a.download = 'handwriting-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
        '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.png';
      a.href = out.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    fit();
    var onResize = function () { fit(); };
    global.addEventListener('resize', onResize);

    return {
      clear: function () { strokes = []; redraw(); },
      undo: function () { strokes.pop(); redraw(); },
      isEmpty: function () { return strokes.length === 0; },
      save: save,
      destroy: function () { global.removeEventListener('resize', onResize); }
    };
  }

  StudyHub.handwriting = { create: create };
})(window);