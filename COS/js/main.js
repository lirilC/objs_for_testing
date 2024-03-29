/**
 * "jQuery UI Resizable Snap" - Extension to the jQuery UI Resizable plugin for snapping while resizing.
 *
 * @copyright       Copyright 2011, Alexander Polomoshnov
 * @license         MIT license (https://raw.github.com/polomoshnov/jQuery-UI-Resizable-Snap-extension/master/LICENSE.txt)
 * @link            https://github.com/polomoshnov/jQuery-UI-Resizable-Snap-extension
 * @version         1.9.1
 */
(function ($) {
    $.extend($.ui.resizable.prototype.options, { snapTolerance: 20, snapMode: 'both' });
    
    $.ui.plugin.add('resizable', 'snap', {
        start: function () {
            var $this = $(this), inst = $this.data('ui-resizable'), snap = inst.options.snap;
            inst.ow = inst.helper.outerWidth() - inst.size.width;
            inst.oh = inst.helper.outerHeight() - inst.size.height;
            inst.lm = getLm($this);
            inst.tm = getTm($this);
            inst.coords = [];
            
            $(typeof snap == 'string' ? snap : ':data(ui-resizable)').each(function () {
                if (this == inst.element[0] || this == inst.helper[0]) return;
            
                var $el = $(this), p = $el.position(), 
                    l = p.left + getLm($el), t = p.top + getTm($el);
                    
                inst.coords.push({ 
                    l: l, t: t, 
                    r: l + $el.outerWidth(), b: t + $el.outerHeight() });
            });
        },
        resize: function () {
            var ls = [], ts = [], ws = [], hs = [],
                inst = $(this).data('ui-resizable'),
                axes = inst.axis.split(''),
                st = inst.options.snapTolerance,
                md = inst.options.snapMode,
                l = inst.position.left + inst.lm, _l = l - st,
                t = inst.position.top + inst.tm, _t = t - st,
                r = l + inst.size.width + inst.ow, _r = r + st,
                b = t + inst.size.height + inst.oh, _b = b + st;
                
            $.each(inst.coords, function () {
                var coords = this,
                    w = Math.min(_r, coords.r) - Math.max(_l, coords.l),
                    h = Math.min(_b, coords.b) - Math.max(_t, coords.t);
                    
                if (w < 0 || h < 0) return;
                
                $.each(axes, function (k, axis) {
                    if (md == 'outer') {
                        switch (axis) {
                            case 'w': case 'e': if (w > st * 2) return; break;
                            case 'n': case 's': if (h > st * 2) return;
                        }
                    } else if (md == 'inner') {
                        switch (axis) {
                            case 'w': case 'e': if (w < st * 2) return; break;
                            case 'n': case 's': if (h < st * 2) return;
                        }
                    }
                    
                    switch (axis) {
                        case 'w': ls.push(getC(l - coords.l, l - coords.r, st)); break;
                        case 'n': ts.push(getC(t - coords.t, t - coords.b, st)); break;
                        case 'e': ws.push(getC(r - coords.l, r - coords.r, st)); break;
                        case 's': hs.push(getC(b - coords.t, b - coords.b, st));
                    }
                });
            });
            
            if (hs.length) inst.size.height += getN(hs);
            if (ws.length) inst.size.width += getN(ws);
            if (ls.length) {
                var n = getN(ls);
                inst.position.left += n;
                inst.size.width -= n;
            } 
            if (ts.length) {
                var n = getN(ts);
                inst.position.top += n;
                inst.size.height -= n;
            }
        }
    });
    
    function getC(lt, rb, st) {
        return Math.abs(lt) < st ? -lt : Math.abs(rb) < st ? -rb : 0;
    }
        
    function getN(ar) {
        return ar.sort(function (a, b) { return !a ? 1 : !b ? -1 : Math.abs(a) - Math.abs(b) })[0];
    }
    
    function getLm($el) {
        return parseInt($el.css('margin-left'), 10) || 0;
    }
    
    function getTm($el) {
        return parseInt($el.css('margin-top'), 10) || 0;
    }
    
    // These are patches to the jQuery resizable plugin.
    // They are needed in order for the snapping to work properly when the ghost or helper option is used.
    function patch(func, afterFunc, beforeFunc) {
        var fn = $.ui.resizable.prototype[func];
        $.ui.resizable.prototype[func] = function () {
            if (beforeFunc) beforeFunc.apply(this, arguments);
            fn.apply(this, arguments);
            if (afterFunc) afterFunc.apply(this, arguments);
        }
    }
    
    patch('_mouseStop', null, function () {
        if (this._helper) {
            // 0.1 is a dirty hack to not end up with null if 0 is provided (when snapped to the left or top side of the browser window).
            this.position = { left: parseInt(this.helper.css('left'), 10) || 0.1, top: parseInt(this.helper.css('top'), 10) || 0.1 };
            this.size = { width: this.helper.outerWidth(), height: this.helper.outerHeight() };
        }
    });
    
    patch('_mouseStart', function () {
        if (this._helper) {
            this.size = { 
                width: this.size.width - (this.helper.outerWidth() - this.helper.width()), 
                height: this.size.height - (this.helper.outerHeight() - this.helper.height()) 
            };
            this.originalSize = { width: this.size.width, height: this.size.height };
        }
    });
    
    patch('_renderProxy', function () {
        if (this._helper) {
            this.helper.css({
                left: this.elementOffset.left,
                top: this.elementOffset.top,
                width: this.element.outerWidth(),
                height: this.element.outerHeight()
            });
        }   
    });
    
    var p = $.ui.resizable.prototype.plugins.resize;
    $.each(p, function (k, v) {
        if (v[0] == 'ghost') {
            p.splice(k, 1);
            return false;
        }
    });
    
    $.each($.ui.resizable.prototype.plugins.start, function (k, v) {
        if (v[0] == 'ghost') {
            var fn = v[1];
            v[1] = function () {
                fn.apply(this, arguments);
                $(this).data('ui-resizable').ghost.css({ width: '100%', height: '100%' });
            }
            return false;
        }
    });
})(jQuery);

/**/
$(document).on("click", function(e){
    if(!($(e.target).is("#liril_aside") || $.contains(("#liril_aside"), $(e.target))) && $("#liril_aside").is(".visible") && !$(e.target).is("#liril")){
        $("#liril_aside").removeClass("visible")
    }
})
$("#liril").on("click", function(){
    $("#liril_aside").addClass("visible")
})
setInterval(function() {
    var currentTime = new Date ( );
    $("#easytasks .clock div:nth-child(3)").css({"rotate": `${currentTime.getHours ( ) * (360/12)}deg`})
    $("#easytasks .clock div:nth-child(2)").css({"rotate": `${currentTime.getMinutes ( ) * (360/60)}deg`})
    $("#easytasks .clock div:nth-child(1)").css({"rotate": `${currentTime.getSeconds ( ) * (360/60)}deg`})
}, 1000);
$(".task").draggable({
    distance: 0,
    stack:".task",
    cursor: "move", 
    snap: ".task",
    snapMode: "both",
    revertDuration: 100,
    handle: `.opTions`,
    snapTolerance: 8,
    /*grid: ($("#gridWidth").val() == "0" && $("#gridHeight").val() == "0") || !gridSnapping? false: [parseInt($("#gridWidth").val()), parseInt($("#gridHeight").val())],*/
    containment: "#desktop",
    revert: false,
    start: function(event, ui) {
        /*if(!$('.clock').last().hasClass("dropped")){ 
            ui.helper.data('dropped', false);
        }else{
            
        }*/
      
    },
    stop: function(event, ui)
    {
        /*if(!ui.helper.data('dropped')){
            /*if($("#customizationBars").hasClass("open")){
            $(this).remove()}
           */   /*
        }*/
    }
})


/**
 * <div class="ui-resizable-handle ui-resizable-nw" id="nwgrip"></div><div class="ui-resizable-handle ui-resizable-ne" id="negrip"></div><div class="ui-resizable-handle ui-resizable-sw" id="swgrip"></div><div class="ui-resizable-handle ui-resizable-se" id="segrip"></div><div class="ui-resizable-handle ui-resizable-n" id="ngrip"></div><div class="ui-resizable-handle ui-resizable-s" id="sgrip"></div><div class="ui-resizable-handle ui-resizable-e" id="egrip"></div><div class="ui-resizable-handle ui-resizable-w" id="wgrip"></div>
 */
 
widg= '<div class="ui-resizable-handle ui-resizable-nw" id="nwgrip"></div><div class="ui-resizable-handle ui-resizable-ne" id="negrip"></div><div class="ui-resizable-handle ui-resizable-sw" id="swgrip"></div><div class="ui-resizable-handle ui-resizable-se" id="segrip"></div><div class="ui-resizable-handle ui-resizable-n" id="ngrip"></div><div class="ui-resizable-handle ui-resizable-s" id="sgrip"></div><div class="ui-resizable-handle ui-resizable-e" id="egrip"></div><div class="ui-resizable-handle ui-resizable-w" id="wgrip"></div>'; 
$( ".task" ).each(function(){$(this)[0].insertAdjacentHTML("beforeend", widg); })

$(".task .opTions").on("click", function(){$(this).parent().hasClass("focused")?$(".task").removeClass("focused"):$(".task").addClass("focused")})

$( ".task" ).resizable({
    handles: {
        'nw': '#nwgrip',
        'ne': '#negrip',
        'sw': '#swgrip',
        'se': '#segrip',
        'n': '#ngrip',
        'e': '#egrip',
        's': '#sgrip',
        'w': '#wgrip'
    },
    containment: "#desktop",
    snap: ".task, #desktop",
    stack: ".task",
    snapTolerance: 8
})
$(".task .coverDiv").on("click", function(){$(".task").removeClass("focused")})

ShifT= false;

$(document).on("keydown", function(dfz){if(dfz.shiftKey)ShifT=true})
$(document).on("keyup", function(dfz){if(!dfz.shiftKey)ShifT=false})
$(window).on("blur", function(dfz){ShifT=false})
$("#desktop").on("mousedown", function(dfz){
if(!ShifT && !$(".icon").filter(function(){return $.contains($(this)[0], dfz.target)?true:false}).length){
    $(".active").removeClass("active")}
else if(ShifT && $(".icon").filter(function(){return $.contains($(this)[0], dfz.target)?true:false}).length){
    var aac= $(".icon").filter(function(){return $.contains($(this)[0], dfz.target)?true:false});
    aac.is(".active")?aac.removeClass("active"):aac.addClass("active");
}
else if(!ShifT){
    var aac= $(".icon").filter(function(){return $.contains($(this)[0], dfz.target)?true:false});
    $(".icon").removeClass("active");
    aac.addClass("active");
}})
$(".icon p").each(function(){ 
    var height= 0; 
    if(document.createRange){ 
        var range= document.createRange(); 
        range.selectNodeContents($(this)[0].childNodes[0]); 
        if(range.getBoundingClientRect){ 
            var rect= range.getBoundingClientRect(); 
            if(rect){ 
                height= rect.bottom - rect.top; 
            } 
        } 
    } 
      
    if(height > 22){ 
        $(this).attr("title", $(this)[0].innerText); 
    }else{ 
        $(this).attr("title", ""); 
    } 
}); 