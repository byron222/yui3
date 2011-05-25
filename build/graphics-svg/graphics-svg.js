YUI.add('graphics-svg', function(Y) {

function SVGDrawing(){}

SVGDrawing.prototype = {
    /**
     * Draws a bezier curve.
     *
     * @method curveTo
     * @param {Number} cp1x x-coordinate for the first control point.
     * @param {Number} cp1y y-coordinate for the first control point.
     * @param {Number} cp2x x-coordinate for the second control point.
     * @param {Number} cp2y y-coordinate for the second control point.
     * @param {Number} x x-coordinate for the end point.
     * @param {Number} y y-coordinate for the end point.
     */
    curveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
        var pathArrayLen,
            currentArray,
            hiX,
            loX,
            hiY,
            loY;
        if(this._pathType !== "C")
        {
            this._pathType = "C";
            currentArray = ["C"];
            this._pathArray.push(currentArray);
        }
        else
        {
            currentArray = this._pathArray[Math.max(0, this._pathArray.length - 1)];
            if(!currentArray)
            {
                currentArray = [];
                this._pathArray.push(currentArray);
            }
        }
        pathArrayLen = this._pathArray.length - 1;
        this._pathArray[pathArrayLen] = this._pathArray[pathArrayLen].concat([Math.round(cp1x), Math.round(cp1y), Math.round(cp2x) , Math.round(cp2y), x, y]);
        hiX = Math.max(x, Math.max(cp1x, cp2x));
        hiY = Math.max(y, Math.max(cp1y, cp2y));
        loX = Math.min(x, Math.min(cp1x, cp2x));
        loY = Math.min(y, Math.min(cp1y, cp2y));
        this._trackSize(hiX, hiY);
        this._trackSize(loX, loY);
    },

    /**
     * Draws a quadratic bezier curve.
     *
     * @method quadraticCurveTo
     * @param {Number} cpx x-coordinate for the control point.
     * @param {Number} cpy y-coordinate for the control point.
     * @param {Number} x x-coordinate for the end point.
     * @param {Number} y y-coordinate for the end point.
     */
    quadraticCurveTo: function(cpx, cpy, x, y) {
        var pathArrayLen,
            currentArray,
            hiX,
            loX,
            hiY,
            loY;
        if(this._pathType !== "Q")
        {
            this._pathType = "Q";
            currentArray = ["Q"];
            this._pathArray.push(currentArray);
        }
        else
        {
            currentArray = this._pathArray[Math.max(0, this._pathArray.length - 1)];
            if(!currentArray)
            {
                currentArray = [];
                this._pathArray.push(currentArray);
            }
        }
        pathArrayLen = this._pathArray.length - 1;
        this._pathArray[pathArrayLen] = this._pathArray[pathArrayLen].concat([Math.round(cpx), Math.round(cpy), Math.round(x), Math.round(y)]);
        hiX = Math.max(x, cpx);
        hiY = Math.max(y, cpy);
        loX = Math.min(x, cpx);
        loY = Math.min(y, cpy);
        this._trackSize(hiX, hiY);
        this._trackSize(loX, loY);
    },

    /**
     * Draws a rectangle.
     *
     * @method drawRect
     * @param {Number} x x-coordinate
     * @param {Number} y y-coordinate
     * @param {Number} w width
     * @param {Number} h height
     */
    drawRect: function(x, y, w, h) {
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.lineTo(x, y);
    },

    /**
     * Draws a rectangle with rounded corners.
     * 
     * @method drawRect
     * @param {Number} x x-coordinate
     * @param {Number} y y-coordinate
     * @param {Number} w width
     * @param {Number} h height
     * @param {Number} ew width of the ellipse used to draw the rounded corners
     * @param {Number} eh height of the ellipse used to draw the rounded corners
     */
    drawRoundRect: function(x, y, w, h, ew, eh) {
        this.moveTo(x, y + eh);
        this.lineTo(x, y + h - eh);
        this.quadraticCurveTo(x, y + h, x + ew, y + h);
        this.lineTo(x + w - ew, y + h);
        this.quadraticCurveTo(x + w, y + h, x + w, y + h - eh);
        this.lineTo(x + w, y + eh);
        this.quadraticCurveTo(x + w, y, x + w - ew, y);
        this.lineTo(x + ew, y);
        this.quadraticCurveTo(x, y, x, y + eh);
	},

    /**
     * Draws a wedge.
     * 
     * @param {Number} x			x-coordinate of the wedge's center point
     * @param {Number} y			y-coordinate of the wedge's center point
     * @param {Number} startAngle	starting angle in degrees
     * @param {Number} arc			sweep of the wedge. Negative values draw clockwise.
     * @param {Number} radius		radius of wedge. If [optional] yRadius is defined, then radius is the x radius.
     * @param {Number} yRadius		[optional] y radius for wedge.
     */
    drawWedge: function(x, y, startAngle, arc, radius, yRadius)
    {
        this._drawingComplete = false;
        this.path = this._getWedgePath({x:x, y:y, startAngle:startAngle, arc:arc, radius:radius, yRadius:yRadius});
    },

    /**
     * Generates a path string for a wedge shape
     *
     * @method _getWedgePath
     * @param {Object} config attributes used to create the path
     * @return String
     * @private
     */
    _getWedgePath: function(config)
    {
        var x = config.x,
            y = config.y,
            startAngle = config.startAngle,
            arc = config.arc,
            radius = config.radius,
            yRadius = config.yRadius || radius,
            segs,
            segAngle,
            theta,
            angle,
            angleMid,
            ax,
            ay,
            bx,
            by,
            cx,
            cy,
            i = 0,
            diameter = radius * 2,
            path = ' M' + x + ', ' + y;  
        
        // limit sweep to reasonable numbers
        if(Math.abs(arc) > 360)
        {
            arc = 360;
        }
        
        // First we calculate how many segments are needed
        // for a smooth arc.
        segs = Math.ceil(Math.abs(arc) / 45);
        
        // Now calculate the sweep of each segment.
        segAngle = arc / segs;
        
        // The math requires radians rather than degrees. To convert from degrees
        // use the formula (degrees/180)*Math.PI to get radians.
        theta = -(segAngle / 180) * Math.PI;
        
        // convert angle startAngle to radians
        angle = (startAngle / 180) * Math.PI;
        if(segs > 0)
        {
            // draw a line from the center to the start of the curve
            ax = x + Math.cos(startAngle / 180 * Math.PI) * radius;
            ay = y + Math.sin(startAngle / 180 * Math.PI) * yRadius;
            path += " L" + Math.round(ax) + ", " +  Math.round(ay);
            path += " Q";
            for(; i < segs; ++i)
            {
                angle += theta;
                angleMid = angle - (theta / 2);
                bx = x + Math.cos(angle) * radius;
                by = y + Math.sin(angle) * yRadius;
                cx = x + Math.cos(angleMid) * (radius / Math.cos(theta / 2));
                cy = y + Math.sin(angleMid) * (yRadius / Math.cos(theta / 2));
                path +=  Math.round(cx) + " " + Math.round(cy) + " " + Math.round(bx) + " " + Math.round(by) + " ";
            }
            path += ' L' + x + ", " + y;
        }
        this._trackSize(diameter, diameter); 
        return path;
    },
    
    /**
     * Draws a line segment using the current line style from the current drawing position to the specified x and y coordinates.
     * 
     * @method lineTo
     * @param {Number} point1 x-coordinate for the end point.
     * @param {Number} point2 y-coordinate for the end point.
     */
    lineTo: function(point1, point2, etc) {
        var args = arguments,
            i,
            len,
            pathArrayLen,
            currentArray;
        this._pathArray = this._pathArray || [];
        if (typeof point1 === 'string' || typeof point1 === 'number') {
            args = [[point1, point2]];
        }
        len = args.length;
        this._shapeType = "path";
        if(this._pathType !== "L")
        {
            this._pathType = "L";
            currentArray = ['L'];
            this._pathArray.push(currentArray);
        }
        else
        {
            currentArray = this._pathArray[Math.max(0, this._pathArray.length - 1)];
            if(!currentArray)
            {
                currentArray = [];
                this._pathArray.push(currentArray);
            }
        }
        pathArrayLen = this._pathArray.length - 1;
        for (i = 0; i < len; ++i) {
            this._pathArray[pathArrayLen] = this._pathArray[pathArrayLen].concat([args[i][0], args[i][1]]);
            this._trackSize.apply(this, args[i]);
        }
    },

    /**
     * Moves the current drawing position to specified x and y coordinates.
     *
     * @method moveTo
     * @param {Number} x x-coordinate for the end point.
     * @param {Number} y y-coordinate for the end point.
     */
    moveTo: function(x, y) {
        var pathArrayLen,
            currentArray;
        this._pathArray = this._pathArray || [];
        if(this._pathType != "M")
        {
            this._pathType = "M";
            currentArray = ["M"];
            this._pathArray.push(currentArray);
        }
        else
        {
            currentArray = this._pathArray[Math.max(0, this._pathArray.length - 1)];
            if(!currentArray)
            {
                currentArray = [];
                this._pathArray.push(currentArray);
            }
        }
        pathArrayLen = this._pathArray.length - 1;
        this._pathArray[pathArrayLen] = this._pathArray[pathArrayLen].concat([x, y]);
        this._trackSize(x, y);
    },

    /**
     * Completes a drawing operation. 
     *
     * @method end
     */
    end: function() {
        this._draw();
    },

    /**
     * Sets the size of the graphics object.
     * 
     * @method setSize
     * @param w {Number} width to set for the instance.
     * @param h {Number} height to set for the instance.
     */
    setSize: function(w, h) {
        var node;
        if(this.get("autoSize"))
        {
            node = this.get("node");
            if(w > node.getAttribute("width"))
            {
                node.setAttribute("width",  w);
            }
            if(h > node.getAttribute("height"))
            {
                node.setAttribute("height", h);
            }
        }
    },

    /**
     * Updates the size of the graphics object
     *
     * @method _trackSize
     * @param {Number} w width
     * @param {Number} h height
     * @private
     */
    _trackSize: function(w, h) {
        var node = this.get("node");
        if (w > this._right) {
            this._right = w;
        }
        if(w < this._left)
        {
            this._left = w;    
        }
        if (h < this._top)
        {
            this._top = h;
        }
        if (h > this._bottom) 
        {
            this._bottom = h;
        }
        this._width = this._right - this._left;
        this._height = this._bottom - this._top;
        node.style.left = this._left + "px";
        node.style.top = this._top + "px";
        this.setSize(this._width, this._height);
    }
};
Y.SVGDrawing = SVGDrawing;
/**
 * Base class for creating shapes.
 *
 * @class SVGShape
 */
var SHAPE = "svgShape",
	Y_LANG = Y.Lang,
	AttributeLite = Y.AttributeLite,
	PluginHost = Y.Plugin.Host,
	SVGRect,
	SVGPath,
	SVGEllipse,
	SVGShape = function(cfg)
	{
		var host = this,
			PluginHost = Y.Plugin && Y.Plugin.Host;  
		if (host._initPlugins && PluginHost) {
			PluginHost.call(host);
		}
		
		host.name = host.constructor.NAME;
		host._eventPrefix = host.constructor.EVENT_PREFIX || host.constructor.NAME;
		AttributeLite.call(host);
		host.addAttrs(cfg);
		host.init.apply(this, arguments);
		if (host._initPlugins) {
			// Need to initPlugins manually, to handle constructor parsing, static Plug parsing
			host._initPlugins(cfg);
		}
		host.initialized = true;
	};

	SVGShape.NAME = "svgShape";

	SVGShape.prototype = {
		init: function()
		{
			this.initializer.apply(this, arguments);
		},

		/**
		 * Initializes the shape
		 *
		 * @private
		 * @method _initialize
		 */
		initializer: function(cfg)
		{
			var host = this;
			host.createNode(); 
			host._graphic = cfg.graphic;
			host._updateHandler();
		},
	   
		/**
		 * Add a class name to each node.
		 *
		 * @method addClass
		 * @param {String} className the class name to add to the node's class attribute 
		 */
		addClass: function(className)
		{
			var node = this.node;
			node.className.baseVal = Y_LANG.trim([node.className.baseVal, className].join(' '));
		},

		/**
		 * Removes a class name from each node.
		 *
		 * @method removeClass
		 * @param {String} className the class name to remove from the node's class attribute
		 */
		removeClass: function(className)
		{
			var node = this.node,
				classString = node.className.baseVal;
			classString = classString.replace(new RegExp(className + ' '), className).replace(new RegExp(className), '');
			node.className.baseVal = classString;
		},

		/**
		 * Gets the current position of the node in page coordinates.
		 *
		 * @method getXY
		 * @return Array The XY position of the shape.
		 */
		getXY: function()
		{
			var graphic = this._graphic,
				parentXY = graphic.getXY(),
				x = this.get("x"),
				y = this.get("y");
			return [parentXY[0] + x, parentXY[1] + y];
		},

		/**
		 * Set the position of the shape in page coordinates, regardless of how the node is positioned.
		 *
		 * @method setXY
		 * @param {Array} Contains X & Y values for new position (coordinates are page-based)
		 */
		setXY: function(xy)
		{
			var graphic = this._graphic,
				parentXY = graphic.getXY();
			this.set("x", xy[0] - parentXY[0]);
			this.set("y", xy[1] - parentXY[1]);
		},

		/**
		 * Determines whether the node is an ancestor of another HTML element in the DOM hierarchy. 
		 *
		 * @method contains
		 * @param {SVGShape | HTMLElement} needle The possible node or descendent
		 * @return Boolean Whether or not this shape is the needle or its ancestor.
		 */
		contains: function(needle)
		{
			return needle === Y.one(this.node);
		},

		/**
		 * Compares nodes to determine if they match.
		 * Node instances can be compared to each other and/or HTMLElements.
		 * @method compareTo
		 * @param {HTMLElement | Node} refNode The reference node to compare to the node.
		 * @return {Boolean} True if the nodes match, false if they do not.
		 */
		compareTo: function(refNode) {
			var node = this.node;

			return node === refNode;
		},

		/**
		 * Test if the supplied node matches the supplied selector.
		 *
		 * @method test
		 * @param {String} selector The CSS selector to test against.
		 * @return Boolean Wheter or not the shape matches the selector.
		 */
		test: function(selector)
		{
			return Y.Selector.test(this.node, selector);
		},
		
		/**
		 * Value function for fill attribute
		 *
		 * @private
		 * @method _getDefaultFill
		 * @return Object
		 */
		_getDefaultFill: function() {
			return {
				type: "solid",
				opacity: 1,
				cx: 0.5,
				cy: 0.5,
				fx: 0.5,
				fy: 0.5,
				r: 0.5
			};
		},
		
		/**
		 * Value function for stroke attribute
		 *
		 * @private
		 * @method _getDefaultStroke
		 * @return Object
		 */
		_getDefaultStroke: function() 
		{
			return {
				weight: 1,
				dashstyle: "none",
				color: "#000",
				opacity: 1.0
			};
		},

		/**
		 * Creates the dom node for the shape.
		 *
		 * @private
		 * @return HTMLElement
		 */
		createNode: function()
		{
			var node = document.createElementNS("http://www.w3.org/2000/svg", "svg:" + this._type),
				id = this.get("id"),
				pointerEvents = this.get("pointerEvents");
			this.node = node;
			this.addClass("yui3-" + SHAPE);
			this.addClass("yui3-" + this.name);
			if(id)
			{
				node.setAttribute("id", id);
			}
			if(pointerEvents)
			{
				node.setAttribute("pointer-events", pointerEvents);
			}
		},

		/**
		 * @private
		 */
		isMouseEvent: function(type)
		{
			if(type.indexOf('mouse') > -1 || type.indexOf('click') > -1)
			{
				return true;
			}
			return false;
		},
		
		/**
		 * @private
		 */
		before: function(type, fn)
		{
			if(this.isMouseEvent(type))
			{
				return Y.before(type, fn, "#" +  this.get("id"));
			}
			return Y.on.apply(this, arguments);
		},
		
		/**
		 * @private
		 */
		on: function(type, fn)
		{
			if(this.isMouseEvent(type))
			{
				return Y.on(type, fn, "#" +  this.get("id"));
			}
			return Y.on.apply(this, arguments);
		},
		
		/**
		 * @private
		 */
		after: function(type, fn)
		{
			if(this.isMouseEvent(type))
			{
				return Y.after(type, fn, "#" +  this.get("id"));
			}
			return Y.on.apply(this, arguments);
		},
		
		/**
		 * Adds a stroke to the shape node.
		 *
		 * @method _strokeChangeHandler
		 * @private
		 */
		_strokeChangeHandler: function(e)
		{
			var node = this.node,
				stroke = this.get("stroke"),
				strokeOpacity,
				dashstyle,
				dash,
				linejoin;
			if(stroke && stroke.weight && stroke.weight > 0)
			{
				linejoin = stroke.linejoin || "round";
				strokeOpacity = stroke.opacity;
				dashstyle = stroke.dashstyle || "none";
				dash = Y_LANG.isArray(dashstyle) ? dashstyle.toString() : dashstyle;
				stroke.color = stroke.color || "#000000";
				stroke.weight = stroke.weight || 1;
				stroke.opacity = Y_LANG.isNumber(strokeOpacity) ? strokeOpacity : 1;
				stroke.linecap = stroke.linecap || "butt";
				node.setAttribute("stroke-dasharray", dash);
				node.setAttribute("stroke", stroke.color);
				node.setAttribute("stroke-linecap", stroke.linecap);
				node.setAttribute("stroke-width",  stroke.weight);
				node.setAttribute("stroke-opacity", stroke.opacity);
				if(linejoin == "round" || linejoin == "bevel")
				{
					node.setAttribute("stroke-linejoin", linejoin);
				}
				else
				{
					linejoin = parseInt(linejoin, 10);
					if(Y_LANG.isNumber(linejoin))
					{
						node.setAttribute("stroke-miterlimit",  Math.max(linejoin, 1));
						node.setAttribute("stroke-linejoin", "miter");
					}
				}
			}
			else
			{
				node.setAttribute("stroke", "none");
			}
		},
		
		/**
		 * Adds a fill to the shape node.
		 *
		 * @method _fillChangeHandler
		 * @private
		 */
		_fillChangeHandler: function(e)
		{
			var node = this.node,
				fill = this.get("fill"),
				fillOpacity,
				type;
			if(fill)
			{
				type = fill.type;
				if(type == "linear" || type == "radial")
				{
					this._setGradientFill(fill);
					node.setAttribute("fill", "url(#grad" + this.get("id") + ")");
				}
				else if(!fill.color)
				{
					node.setAttribute("fill", "none");
				}
				else
				{
					fillOpacity = fill.opacity = Y_LANG.isNumber(fillOpacity) ? fillOpacity : 1;
					node.setAttribute("fill", fill.color);
					node.setAttribute("fill-opacity", fillOpacity);
				}
			}
			else
			{
				node.setAttribute("fill", "none");
			}
		},

		/**
		 * Returns a linear gradient fill
		 *
		 * @method _getLinearGradient
		 * @param {String} type gradient type
		 * @private
		 */
		_setGradientFill: function(fill) {
			var offset,
				opacity,
				color,
				stopNode,
				isNumber = Y_LANG.isNumber,
				graphic = this._graphic,
				type = fill.type, 
				gradientNode = graphic.getGradientNode("grad" + this.get("id"), type),
				stops = fill.stops,
				w = this.get("width"),
				h = this.get("height"),
				rotation = fill.rotation,
				i,
				len,
				def,
				stop,
				x1 = "0%", 
				x2 = "100%", 
				y1 = "50%", 
				y2 = "50%",
				cx = fill.cx,
				cy = fill.cy,
				fx = fill.fx,
				fy = fill.fy,
				r = fill.r;
			if(type == "linear")
			{
				gradientNode.setAttribute("gradientTransform", "rotate(" + rotation + "," + (w/2) + ", " + (h/2) + ")");
				gradientNode.setAttribute("width", w);
				gradientNode.setAttribute("height", h);
				gradientNode.setAttribute("x1", x1);
				gradientNode.setAttribute("y1", y1);
				gradientNode.setAttribute("x2", x2);
				gradientNode.setAttribute("y2", y2);
				gradientNode.setAttribute("gradientUnits", "userSpaceOnUse");
			}
			else
			{
				gradientNode.setAttribute("cx", (cx * 100) + "%");
				gradientNode.setAttribute("cy", (cy * 100) + "%");
				gradientNode.setAttribute("fx", (fx * 100) + "%");
				gradientNode.setAttribute("fy", (fy * 100) + "%");
				gradientNode.setAttribute("r", (r * 100) + "%");
			}
			
			len = stops.length;
			def = 0;
			for(i = 0; i < len; ++i)
			{
				stop = stops[i];
				opacity = stop.opacity;
				color = stop.color;
				offset = stop.offset || i/(len - 1);
				offset = Math.round(offset * 100) + "%";
				opacity = isNumber(opacity) ? opacity : 1;
				opacity = Math.max(0, Math.min(1, opacity));
				def = (i + 1) / len;
				stopNode = graphic._createGraphicNode("stop");
				stopNode.setAttribute("offset", offset);
				stopNode.setAttribute("stop-color", color);
				stopNode.setAttribute("stop-opacity", opacity);
				gradientNode.appendChild(stopNode);
			}
		},

		set: function() 
		{
			var host = this;
			AttributeLite.prototype.set.apply(host, arguments);
			if(host.initialized)
			{
				host._updateHandler();
			}
		},

		/**
		 * Applies translate transformation.
		 *
		 * @method translate
		 * @param {Number} x The x-coordinate
		 * @param {Number} y The y-coordinate
		 */
		translate: function(x, y)
		{
			this._translateX = x;
			this._translateY = y;
			this._translate.apply(this, arguments);
		},

		/**
		 * Applies translate transformation.
		 *
		 * @method translate
		 * @param {Number} x The x-coordinate
		 * @param {Number} y The y-coordinate
		 * @protected
		 */
		_translate: function(x, y)
		{
			this._addTransform("translate", arguments);
		},

		/**
		 * Applies a skew to the x-coordinate
		 *
		 * @method skewX
		 * @param {Number} x x-coordinate
		 */
		 skewX: function(x)
		 {
			this._addTransform("skewX", arguments);
		 },

		/**
		 * Applies a skew to the x-coordinate
		 *
		 * @method skewX
		 * @param {Number} x x-coordinate
		 */
		 skewY: function(y)
		 {
			this._addTransform("skewY", arguments);
		 },

		/**
		 * @private
		 */
		 _rotation: 0,

		 /**
		  * Applies a rotation.
		  *
		  * @method rotate
		  * @param
		  */
		 rotate: function(deg)
		 {
			this._rotation = deg;
			this._addTransform("rotate", arguments);
		 },

		/**
		 * Applies a scale transform
		 *
		 * @method scale
		 * @param {Number} val
		 */
		scale: function(val)
		{
			this._addTransform("scale", arguments);
		},

		/**
		 * Applies a matrix transformation
		 *
		 * @method matrix
		 */
		matrix: function(a, b, c, d, e, f)
		{
			this._addTransform("matrix", arguments);
		},

		/**
		 * @private
		 */
		_addTransform: function(type, args)
		{
			if(!this._transformArgs)
			{
				this._transformArgs = {};
			}
			this._transformArgs[type] = Array.prototype.slice.call(args, 0);
			//this.fire("transformAdded");
		},

		/**
		 * @private
		 */
		_updateTransform: function()
		{
			var node = this.node,
				key,
				args,
				val,
				transform = node.getAttribute("transform"),
				test,
				transformOrigin;
			if(this._transformArgs)
			{
				if(this._transformArgs.hasOwnProperty("rotate"))
				{
					transformOrigin = this.get("transformOrigin");
					args = this._transformArgs.rotate;
					args[1] = this.get("x") + (this.get("width") * transformOrigin[0]);
					args[2] = this.get("y") + (this.get("height") * transformOrigin[1]);
				}
			}
			for(key in this._transformArgs)
			{
				if(key && this._transformArgs.hasOwnProperty(key))
				{
					val = key + "(" + this._transformArgs[key].toString() + ")";
					if(transform && transform.length > 0)
					{
						test = new RegExp(key + '(.*)');
						if(transform.indexOf(key) > -1)
						{
							transform = transform.replace(test, val);
						}
						else
						{
							transform += " " + val;
						}
					}
					else
					{
						transform = val;
					}
				}
			}
			if(transform)
			{
				node.setAttribute("transform", transform);
			}
		},

		/**
		 * Updates the shape.
		 *
		 * @method _draw
		 * @private
		 */
		_draw: function()
		{
			var node = this.node;
			node.setAttribute("width", this.get("width"));
			node.setAttribute("height", this.get("height"));
			node.setAttribute("x", this.get("x"));
			node.setAttribute("y", this.get("y"));
			node.style.left = this.get("x") + "px";
			node.style.top = this.get("y") + "px";
			this._fillChangeHandler();
			this._strokeChangeHandler();
			this._updateTransform();
		},

		/**
		 * Change event listener
		 *
		 * @private
		 * @method _updateHandler
		 */
		_updateHandler: function(e)
		{
			this._draw();
			this._graphic.addToRedrawQueue(this);    
		},
		
		/**
		 * Storage for translateX
		 *
		 * @private
		 */
		_translateX: 0,

		/**
		 * Storage for translateY
		 *
		 * @private
		 */
		_translateY: 0,

		/**
		 * Returns the bounds for a shape.
		 *
		 * @method getBounds
		 * @return Object
		 */
		getBounds: function()
		{
			var rotation = this.get("rotation"),
				absRot = Math.abs(rotation),
				radCon = Math.PI/180,
				sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
				cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
				w = this.get("width"),
				h = this.get("height"),
				stroke = this.get("stroke"),
				x = this.get("x"),
				y = this.get("y"),
				wt = 0,
				tx = this.get("translateX"),
				ty = this.get("translateY"),
				bounds = {},
				transformOrigin = this.get("transformOrigin"),
				originalWidth,
				originalHeight,
				tox = transformOrigin[0],
				toy = transformOrigin[1];
			if(rotation !== 0)
			{
				originalWidth = w;
				originalHeight = h;
				w = (cosRadians * h) + (sinRadians * w);
				h = (cosRadians * h) + (sinRadians * w);
				x = (x + originalWidth * tox) - (sinRadians * (originalHeight * (1 - toy))) - (cosRadians * (originalWidth * tox));
				y = (y + originalHeight * toy) - (sinRadians * (originalWidth * tox)) - (cosRadians * originalHeight * toy);
			}
			if(stroke && stroke.weight)
			{
				wt = stroke.weight;
			}
			bounds.left = x - wt + tx;
			bounds.top = y - wt + ty;
			bounds.right = x + w + wt + tx;
			bounds.bottom = y + h + wt + ty;
			return bounds;
		}
	 };
		
	SVGShape.ATTRS = {
		/**
		 * An array of x, y values which indicates the transformOrigin in which to rotate the shape. Valid values range between 0 and 1 representing a 
		 * fraction of the shape's corresponding bounding box dimension. The default value is [0.5, 0.5].
		 *
		 * @attribute transformOrigin
		 * @type Array
		 */
        transformOrigin: {
            valueFn: function()
            {
                return [0.5, 0.5];
            }
        },

        /**
         * The rotation (in degrees) of the shape.
         *
         * @attribute rotation
         * @type Number
         */
        rotation: {
            setter: function(val)
            {
                this.rotate(val);
            },

            getter: function()
            {
                return this._rotation;
            }
        },

        /**
         * Unique id for class instance.
         *
         * @attribute id
         * @type String
         */
        id: {
            valueFn: function()
            {
                return Y.guid();
            },

            setter: function(val)
            {
                var node = this.node;
                if(node)
                {
                    node.setAttribute("id", val);
                }
                return val;
            }
        },

        /**
         * Indicates the x position of shape.
         *
         * @attribute x
         * @type Number
         */
        x: {
            value: 0
        },

        /**
         * Indicates the y position of shape.
         *
         * @attribute y
         * @type Number
         */
        y: {
            value: 0
        },

        /**
         * Indicates the width of the shape
         *
         * @attribute width
         * @type Number
         */
        width: {},

        /**
         * Indicates the height of the shape
         * 
         * @attribute height
         * @type Number
         */
        height: {},

        /**
         * Indicates whether the shape is visible.
         *
         * @attribute visible
         * @type Boolean
         */
        visible: {
            value: true,

            setter: function(val){
                var visibility = val ? "visible" : "hidden";
                this.node.style.visibility = visibility;
                return val;
            }
        },

        /**
         * Contains information about the fill of the shape. 
         *  <dl>
         *      <dt>color</dt><dd>The color of the fill.</dd>
         *      <dt>opacity</dt><dd>Number between 0 and 1 that indicates the opacity of the fill. The default value is 1.</dd>
         *      <dt>type</dt><dd>Type of fill.
         *          <dl>
         *              <dt>solid</dt><dd>Solid single color fill. (default)</dd>
         *              <dt>linear</dt><dd>Linear gradient fill.</dd>
         *              <dt>radial</dt><dd>Radial gradient fill.</dd>
         *          </dl>
         *      </dd>
         *  </dl>
         *
         *  <p>If a gradient (linear or radial) is specified as the fill type. The following properties are used:
         *  <dl>
         *      <dt>stops</dt><dd>An array of objects containing the following properties:
         *          <dl>
         *              <dt>color</dt><dd></dd>
         *              <dt>opacity</dt><dd></dd>
         *              <dt>offset</dt><dd>Number between 0 and 1 indicating where the color stop is positioned.</dd> 
         *          </dl>
         *      </dd>
         *      <dt></dt><dd></dd>
         *      <dt></dt><dd></dd>
         *      <dt></dt><dd></dd>
         *  </dl>
         *  </p>
         *
         * @attribute fill
         * @type Object 
         */
        fill: {
            valueFn: "_getDefaultFill",
            
            setter: function(val)
            {
                var fill,
                    tmpl = this.get("fill") || this._getDefaultFill();
                fill = (val) ? Y.merge(tmpl, val) : null;
                if(fill && fill.color)
                {
                    if(fill.color === undefined || fill.color == "none")
                    {
                        fill.color = null;
                    }
                }
                return fill;
            }
        },

        /**
         * Contains information about the stroke of the shape.
         *  <dl>
         *      <dt>color</dt><dd>The color of the stroke.</dd>
         *      <dt>weight</dt><dd>Number that indicates the width of the stroke.</dd>
         *      <dt>opacity</dt><dd>Number between 0 and 1 that indicates the opacity of the stroke. The default value is 1.</dd>
         *      <dt>dashstyle</dt>Indicates whether to draw a dashed stroke. When set to "none", a solid stroke is drawn. When set to an array, the first index indicates the
         *      length of the dash. The second index indicates the length of gap.
         *  </dl>
         *
         * @attribute stroke
         * @type Object
         */
        stroke: {
            valueFn: "_getDefaultStroke",

            setter: function(val)
            {
                var tmpl = this.get("stroke") || this._getDefaultStroke();
                return (val) ? Y.merge(tmpl, val) : null;
            }
        },
        
        /**
         * Indicates whether or not the instance will size itself based on its contents.
         *
         * @attribute autoSize 
         * @type Boolean
         */
        autoSize: {
            value: false
        },

        /**
         * Determines whether the instance will receive mouse events.
         * 
         * @attribute pointerEvents
         * @type string
         */
        pointerEvents: {
            valueFn: function() 
            {
                var val = "visiblePainted",
                    node = this.node;
                if(node)
                {
                    node.setAttribute("pointer-events", val);
                }
                return val;
            },

            setter: function(val)
            {
                var node = this.node;
                if(node)
                {
                    node.setAttribute("pointer-events", val);
                }
                return val;
            }
        },

        /**
         * Performs a translate on the x-coordinate. When translating x and y coordinates,
         * use the <code>translate</code> method.
         *
         * @attribute translateX
         * @type Number
         */
        translateX: {
            getter: function()
            {
                return this._translateX;
            },

            setter: function(val)
            {
                this._translateX = val;
                this._transform(val, this._translateY);
                return val;
            }
        },
        
        /**
         * Performs a translate on the y-coordinate. When translating x and y coordinates,
         * use the <code>translate</code> method.
         *
         * @attribute translateX
         * @type Number
         */
        translateY: {
            getter: function()
            {
                return this._translateY;
            },

            setter: function(val)
            {
                this._translateY = val;
                this._transform(this._translateX, val);
                return val;
            }
        },

        /**
         * The node used for gradient fills.
         *
         * @attribute gradientNode
         * @type HTMLElement
         */
        gradientNode: {
            setter: function(val)
            {
                if(Y_LANG.isString(val))
                {
                    val = this._graphic.getGradientNode("linear", val);
                }
                return val;
            }
        },

        autoDraw: {
            getter: function()
            {
                return this._graphic.autoDraw;
            }
        },

        node: {
            readOnly: true,

            getter: function()
            {
                return this.node;
            }
        },

        graphic: {
            readOnly: true,

            getter: function()
            {
                return this._graphic;
            }
        }
	};
	//Straightup augment, no wrapper functions
	Y.mix(SVGShape, Y.AttributeLite, false, null, 1);
	Y.mix(SVGShape, Y.EventTarget, false, null, 1);
	Y.mix(SVGShape, PluginHost, false, null, 1);
	SVGShape.plug = PluginHost.plug;
	SVGShape.unplug = PluginHost.unplug;
	Y.SVGShape = SVGShape;

/**
 * The SVGPath class creates a shape through the use of drawing methods.
 *
 * @class SVGPath
 * @extends SVGShape
 */
SVGPath = function(cfg)
{
	SVGPath.superclass.constructor.apply(this, arguments);
};
SVGPath.NAME = "svgPath";
Y.extend(SVGPath, Y.SVGShape, {
    /**
     * Left edge of the path
     *
     * @private
     */
    _left: 0,

    /**
     * Right edge of the path
     *
     * @private
     */
    _right: 0,
    
    /**
     * Top edge of the path
     *
     * @private
     */
    _top: 0, 
    
    /**
     * Bottom edge of the path
     *
     * @private
     */
    _bottom: 0,

    /**
     * Indicates the type of shape
     *
     * @property _type
     * @readOnly
     * @type String
     */
    _type: "path",

    /**
     * Draws the path.
     *
     * @method _draw
     * @private
     */
    _draw: function()
    {
        var pathArray,
            segmentArray,
            pathType,
            len,
            val,
            val2,
            i,
            path = "",
            node = this.node,
            tx = this.get("translateX"),
            ty = this.get("translateY"),
            left = this._left,
            top = this._top,
            fill = this.get("fill");
        if(this._pathArray)
        {
            pathArray = this._pathArray.concat();
            while(pathArray && pathArray.length > 0)
            {
                segmentArray = pathArray.shift();
                len = segmentArray.length;
                pathType = segmentArray[0];
                path += " " + pathType + (segmentArray[1] - left);
                switch(pathType)
                {
                    case "L" :
                    case "M" :
                    case "Q" :
                        for(i = 2; i < len; ++i)
                        {
                            val = (i % 2 === 0) ? top : left;
                            val = segmentArray[i] - val;
                            path += ", " + val;
                        }
                    break;
                    case "C" :
                        for(i = 2; i < len; ++i)
                        {
                            val = (i % 2 === 0) ? top : left;
                            val2 = segmentArray[i];
                            val2 -= val;
                            path += " " + val2;
                        }
                    break;

                }
            }
            if(fill && fill.color)
            {
                path += 'z';
            }
            if(path)
            {
                node.setAttribute("d", path);
            }
            //Use transform to handle positioning.
            this._transformArgs = this._transformArgs || {};
            this._transformArgs.translate = [left + tx, top + ty];
            
            this._path = path;
            this._fillChangeHandler();
            this._strokeChangeHandler();
            this._updateTransform();
        }
    },
   
    /**
     * Applies translate transformation.
     *
     * @method translate
     * @param {Number} x The x-coordinate
     * @param {Number} y The y-coordinate
     */
    translate: function(x, y)
    {
        x = parseInt(x, 10);
        y = parseInt(y, 10);
        this._translateX = x;
        this._translateY = y;
        this._translate(this._left + x, this._top + y);
    },
  
	/**
	 * @private
	 */ 
	_updateHandler: function()
	{
		//do nothing
	},
 
    /**
     * Completes a drawing operation. 
     *
     * @method end
     */
    end: function()
    {
        this._draw();
        this._graphic.addToRedrawQueue(this);    
    },

    /**
     * Clears the path.
     *
     * @method clear
     */
    clear: function()
    {
        this._left = 0;
        this._right = 0;
        this._top = 0;
        this._bottom = 0;
        this._pathArray = [];
        this._path = "";
    },

    /**
     * Returns the bounds for a shape.
     *
     * @method getBounds
     * @return Object
     */
    getBounds: function()
    {
        var wt = 0,
            bounds = {},
            stroke = this.get("stroke"),
            tx = this.get("translateX"),
            ty = this.get("translateY");
        if(stroke && stroke.weight)
        {
            wt = stroke.weight;
        }
        bounds.left = this._left - wt + tx;
        bounds.top = this._top - wt + ty;
        bounds.right = (this._right - this._left) + wt + tx;
        bounds.bottom = (this._bottom - this._top) + wt + ty;
        return bounds;
    },

	_path: ""
});

SVGPath.ATTRS = Y.merge(Y.SVGShape.ATTRS, {
	/**
	 * Path string of the shape
	 *
	 * @attribute path
	 * @type String
	 */	
	path: {
		readOnly: true,

		getter: function()
		{
			return this._path;
		}
	},

	/**
	 * Indicates the height of the shape
	 * 
	 * @attribute height
	 * @type Number
	 */
	width: {
		getter: function()
		{
			var val = Math.max(this._right - this._left, 0);
			return val;
		}
	},

	/**
	 * Indicates the height of the shape
	 * 
	 * @attribute height
	 * @type Number
	 */
	height: {
		getter: function()
		{
			return Math.max(this._bottom - this._top, 0);
		}
	}
});
SVGPath.prototype = Y.merge(Y.merge(Y.SVGDrawing.prototype, Y.SVGShape.prototype), SVGPath.prototype);
Y.SVGPath = SVGPath;
/**
 * Draws rectangles
 */
SVGRect = function()
{
	SVGRect.superclass.constructor.apply(this, arguments);
};
SVGRect.NAME = "svgRect";
Y.extend(SVGRect, Y.SVGShape, {
    /**
     * Indicates the type of shape
     *
     * @property _type
     * @readOnly
     * @type String
     */
    _type: "rect"
 });
SVGRect.ATTRS = Y.SVGShape.ATTRS;
Y.SVGRect = SVGRect;
/**
 * Draws an ellipse
 */
    SVGEllipse = function(cfg)
    {
        SVGEllipse.superclass.constructor.apply(this, arguments);
    };

	SVGEllipse.NAME = "svgEllipse";

	Y.extend(SVGEllipse, SVGShape, {
		/**
		 * Indicates the type of shape
		 *
		 * @property _type
		 * @readOnly
		 * @type String
		 */
		_type: "ellipse",

		/**
		 * Updates the shape.
		 *
		 * @method _draw
		 * @private
		 */
		_draw: function()
		{
			var node = this.node,
				w = this.get("width"),
				h = this.get("height"),
				x = this.get("x"),
				y = this.get("y"),
				xRadius = w * 0.5,
				yRadius = h * 0.5,
				cx = x + xRadius,
				cy = y + yRadius;
			node.setAttribute("rx", xRadius);
			node.setAttribute("ry", yRadius);
			node.setAttribute("cx", cx);
			node.setAttribute("cy", cy);
			this._fillChangeHandler();
			this._strokeChangeHandler();
			this._updateTransform();
		}
	});

	SVGEllipse.ATTRS = Y.merge(SVGShape.ATTRS, {
		/**
		 * Horizontal radius for the ellipse.
		 *
		 * @attribute xRadius
		 * @type Number
		 * @readOnly
		 */
		xRadius: {
			setter: function(val)
			{
				this.set("width", val/2);
			},

			getter: function()
			{
				var val = this.get("width");
				if(val) 
				{
					val *= 0.5;
				}
				return val;
			}
		},

		/**
		 * Vertical radius for the ellipse.
		 *
		 * @attribute yRadius
		 * @type Number
		 * @readOnly
		 */
		yRadius: {
			setter: function(val)
			{
				this.set("height", val/2);
			},

			getter: function()
			{
				var val = this.get("height");
				if(val) 
				{
					val *= 0.5;
				}
				return val;
			}
		}
	});
	Y.SVGEllipse = SVGEllipse;
/**
 * Draws an circle
 */
 var Y_SVGCircle = function(cfg)
 {
    Y_SVGCircle.superclass.constructor.apply(this, arguments);
 };
    
 Y_SVGCircle.NAME = "svgCircle";

 Y.extend(Y_SVGCircle, Y.SVGShape, {    
    
    /**
     * Indicates the type of shape
     *
     * @property _type
     * @readOnly
     * @type String
     */
    _type: "circle",

    /**
     * Updates the shape.
     *
     * @method _draw
     * @private
     */
    _draw: function()
    {
        var node = this.node,
            x = this.get("x"),
            y = this.get("y"),
            radius = this.get("radius"),
            cx = x + radius,
            cy = y + radius;
        node.setAttribute("r", radius);
        node.setAttribute("cx", cx);
        node.setAttribute("cy", cy);
        this._fillChangeHandler();
        this._strokeChangeHandler();
        this._updateTransform();
    }
 });
    
Y_SVGCircle.ATTRS = Y.merge(Y.SVGShape.ATTRS, {
    /**
     * 
     * @attribute width
     * @readOnly
     */
    width: {
        readOnly:true,

        getter: function()
        {
            return this.get("radius") * 2;
        }
    },

    /**
     * 
     * @attribute height
     * @readOnly
     */
    height: {
        readOnly:true,

        getter: function()
        {
            return this.get("radius") * 2;
        }
    },

    /**
     * Radius of the circle
     *
     * @attribute radius
     */
    radius: {
        value: 0
    }
});
Y.SVGCircle = Y_SVGCircle;
/**
 * Graphic is a simple drawing api that allows for basic drawing operations.
 *
 * @class Graphic
 * @constructor
 */
function SVGGraphic(config) {
    
    this.initializer.apply(this, arguments);
}

SVGGraphic.prototype = {
    /**
     * Gets the current position of the node's parentNode in page coordinates.
     *
     * @method getXY
     * @return Array The XY position of the shape.
     */
    getXY: function()
    {
        var parentNode = Y.one(this.parentNode),
            parentXY;
        if(parentNode)
        {
            parentXY = parentNode.getXY();
        }
        return parentXY;
    },

    /**
     * Indicates whether or not the instance will size itself based on its contents.
     *
     * @property autoSize 
     * @type String
     */
    autoSize: true,

    /**
     * Indicates whether or not the instance will automatically redraw after a change is made to a shape.
     * This property will get set to false when batching operations.
     *
     * @property autoDraw
     * @type Boolean
     * @default true
     */
    autoDraw: true,

    /**
     * Initializes the class.
     *
     * @method initializer
     * @private
     */
    initializer: function(config) {
        this._shapeInstances = {
            ellipse: null,
            circle: null,
            path: null,
            rect: null
        };
        this._shapes = {};
        this._redrawQueue = {};
        config = config || {};
        var w = config.width || 0,
            h = config.height || 0;
        this._gradients = {};
        this.id = Y.guid();
        this.node = Y.config.doc.createElement('div');
        this.node.style.position = "absolute";
        this.group = this._createGraphics();
        this.group.setAttribute("id", this.id);
        this.node.appendChild(this.group);
        this.setSize(w, h);
        
        if(config.render)
        {
            this.render(config.render);
        }
    },

    /**
     * Removes all nodes.
     *
     * @method destroy
     */
    destroy: function()
    {
        this._removeChildren(this.node);
        if(this.node && this.node.parentNode)
        {
            this.node.parentNode.removeChild(this.node);
        }
    },
    
    /**
     * Removes all child nodes.
     *
     * @method _removeChildren
     * @param {HTMLElement} node
     * @private
     */
    _removeChildren: function(node)
    {
        if(node.hasChildNodes())
        {
            var child;
            while(node.firstChild)
            {
                child = node.firstChild;
                this._removeChildren(child);
                node.removeChild(child);
            }
        }
    },

    /**
     * Shows and and hides a the graphic instance.
     *
     * @method toggleVisible
     * @param val {Boolean} indicates whether the instance should be visible.
     */
    toggleVisible: function(val)
    {
        this._toggleVisible(this.node, val);
    },

    /**
     * Toggles visibility
     *
     * @method _toggleVisible
     * @param {HTMLElement} node element to toggle
     * @param {Boolean} val indicates visibilitye
     * @private
     */
    _toggleVisible: function(node, val)
    {
        var children = Y.Selector.query(">/*", node),
            visibility = val ? "visible" : "hidden",
            i = 0,
            len;
        if(children)
        {
            len = children.length;
            for(; i < len; ++i)
            {
                this._toggleVisible(children[i], val);
            }
        }
        node.style.visibility = visibility;
    },

    /**
     * Clears the graphics object.
     *
     * @method clear
     */
    clear: function() {
        if(this._graphicsList)
        {
            while(this._graphicsList.length > 0)
            {
                this.group.removeChild(this._graphicsList.shift());
            }
        }
    },

    /**
     * Sets the size of the graphics object.
     * 
     * @method setSize
     * @param w {Number} width to set for the instance.
     * @param h {Number} height to set for the instance.
     */
    setSize: function(w, h) {
        if(this.autoSize)
        {
            if(w > this.node.getAttribute("width"))
            {
                this.group.setAttribute("width",  w);
            }
            if(h > this.group.getAttribute("height"))
            {
                this.group.setAttribute("height", h);
            }
        }
    },

    /**
     * Updates the size of the graphics object
     *
     * @method _trackSize
     * @param {Number} w width
     * @param {Number} h height
     * @private
     */
    _trackSize: function(w, h) {
        if (w > this._right) {
            this._right = w;
        }
        if(w < this._left)
        {
            this._left = w;    
        }
        if (h < this._top)
        {
            this._top = h;
        }
        if (h > this._bottom) 
        {
            this._bottom = h;
        }
        this._width = this._right - this._left;
        this._height = this._bottom - this._top;
        this.node.style.left = this._left + "px";
        this.node.style.top = this._top + "px";
        this.setSize(this._width, this._height);
    },

    /**
     * Adds the graphics node to the dom.
     * 
     * @method render
     * @param {HTMLElement} parentNode node in which to render the graphics node into.
     */
    render: function(render) {
        var parentNode = Y.one(render),
            w = parseInt(parentNode.getComputedStyle("width"), 10),
            h = parseInt(parentNode.getComputedStyle("height"), 10);
        parentNode = parentNode || Y.config.doc.body;
        parentNode.appendChild(this.node);
        this.setSize(w, h);
        this.parentNode = parentNode;
        return this;
    },

    /**
     * Creates a group element
     *
     * @method _createGraphics
     * @private
     */
    _createGraphics: function() {
        var group = this._createGraphicNode("svg");
        this._styleGroup(group);
        return group;
    },

    /**
     * Styles a group element
     *
     * @method _styleGroup
     * @private
     */
    _styleGroup: function(group)
    {
        group.style.position = "absolute";
        group.style.top = "0px";
        group.style.left = "0px";
        group.style.overflow = "auto";
        group.setAttribute("overflow", "auto");
        group.setAttribute("pointer-events", "none");
    },

    /**
     * Creates a graphic node
     *
     * @method _createGraphicNode
     * @param {String} type node type to create
     * @param {String} pe specified pointer-events value
     * @return HTMLElement
     * @private
     */
    _createGraphicNode: function(type, pe)
    {
        var node = document.createElementNS("http://www.w3.org/2000/svg", "svg:" + type),
            v = pe || "none";
        if(type !== "defs" && type !== "stop" && type !== "linearGradient" && type != "radialGradient")
        {
            node.setAttribute("pointer-events", v);
        }
        return node;
    },

    /**
     * Adds a shape instance to the graphic instance.
     *
     * @method addShape
     * @param {Shape} shape The shape instance to be added to the graphic.
     */
    addShape: function(shape)
    {
        var node = shape.node,
            parentNode = this._frag || this.group;
        parentNode.appendChild(node);
        if(!this._graphicsList)
        {
            this._graphicsList = [];
        }
        this._graphicsList.push(node);
        if(this.autoDraw) 
        {
            this.updateCoordSpace();
        }
    },

    /**
     * Generates a shape instance by type.
     *
     * @method getShape
     * @param {String} type type of shape to generate.
     * @param {Object} cfg attributes for the shape
     * @return Shape
     */
    getShape: function(cfg)
    {
        cfg.graphic = this;
        var shape = new this._shapeClass[cfg.type](cfg);
        this._shapes[shape.get("id")] = shape;
        this.addShape(shape);
        return shape;
    },

    /**
     * When overflow is set to true, by default, the viewBox will resize to greater values but not values. (for performance)
     * When resizing the viewBox down is desirable, set the resizeDown value to true.
     *
     * @property resizeDown 
     * @type Boolean
     */
    resizeDown: false,

    /**
     * @private
     */
    _shapeClass: {
        circle: Y.SVGCircle,
        rect: Y.SVGRect,
        path: Y.SVGPath,
        ellipse: Y.SVGEllipse
    },

    /**
     * @private
     */
    _shapeIntances: null,
    
    /**
     * Returns a shape based on the id of its dom node.
     *
     * @method getShapeById
     * @param {String} id Dom id of the shape's node attribute.
     * @return Shape
     */
    getShapeById: function(id)
    {
        var shape = this._shapes[id];
        return shape;
    },

	/**
	 * Allows for creating multiple shapes in order to batch appending and redraw operations.
	 *
	 * @method batch
	 * @param {Function} method Method to execute.
	 */
    batch: function(method)
    {
        var node = this.group,
            frag = document.createDocumentFragment();
        this._frag = frag;
        this.autoDraw = false;
        method();
        this.updateCoordSpace();
        node.appendChild(frag);
        this._frag = null;
        this.autoDraw = true;
    },

    /**
     * Updates the size of the graphics container and the position of its children.
     *
     * @method updateCoordSpace
     */
    updateCoordSpace: function(e)
    {
        var bounds,
            i,
            shape,
            queue = this.resizeDown ? this._shapes : this._redrawQueue;
        for(i in queue)
        {
            if(queue.hasOwnProperty(i))
            {
                shape = queue[i];
                bounds = shape.getBounds();
                this._left = Math.min(this._left, bounds.left);
                this._top = Math.min(this._top, bounds.top);
                this._right = Math.max(this._right, bounds.right);
                this._bottom = Math.max(this._bottom, bounds.bottom);
            }
        }
        
        this._redrawQueue = {};
        this._width = this._right - this._left;
        this._height = this._bottom - this._top;
        this.node.style.width = this._width + "px";
        this.node.style.height = this._height + "px";
        this.node.style.left = this._left + "px";
        this.node.style.top = this._top + "px";
        this.group.setAttribute("width", this._width);
        this.group.setAttribute("height", this._height);
        this.group.style.width = this._width + "px";
        this.group.style.height = this._height + "px";
        this.group.setAttribute("viewBox", "" + this._left + " " + this._top + " " + this._width + " " + this._height + "");
    },

    /**
     * Adds a shape to the redraw queue. 
     *
     * @method addToRedrawQueue
     * @param shape {SVGShape}
     */
    addToRedrawQueue: function(shape)
    {
        var id = shape.get("id");
        this._redrawQueue[id] = shape;
        if(this.autoDraw) 
        {
            this.updateCoordSpace();
        }
    },

    /**
     * @private
     */
    _left: 0,

    /**
     * @private
     */
    _right: 0,

    /**
     * @private
     */
    _top: 0,

    /**
     * @private
     */
    _bottom: 0,

    /**
     * Returns a reference to a gradient definition based on an id and type.
     *
     * @method getGradientNode
     * @key {String} id that references the gradient definition
     * @type {String} description of the gradient type
     * @return HTMLElement
     */
    getGradientNode: function(key, type)
    {
        var gradients = this._gradients,
            gradient,
            nodeType = type + "Gradient";
        if(gradients.hasOwnProperty(key) && gradients[key].tagName.indexOf(type) > -1)
        {
            gradient = this._gradients[key];
        }
        else
        {
            gradient = this._createGraphicNode(nodeType);
            if(!this._defs)
            {
                this._defs = this._createGraphicNode("defs");
                this.group.appendChild(this._defs);
            }
            this._defs.appendChild(gradient);
            key = key || "gradient" + Math.round(100000 * Math.random());
            gradient.setAttribute("id", key);
            if(gradients.hasOwnProperty(key))
            {
                this._defs.removeChild(gradients[key]);
            }
            gradients[key] = gradient;
        }
        return gradient;
    }

};
Y.SVGGraphic = SVGGraphic;



}, '@VERSION@' ,{skinnable:false, requires:['graphics']});
