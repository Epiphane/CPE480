var vvNumber;
var general;
var decimals;
var sliderValue = 1500; //starting value

// getElementByID: Cross-browser version of "document.getElementById()"
function getElementById(element)
{
	if (document.getElementById)
	{
		element = document.getElementById(element);
	}
	else if (document.all)
	{
		element = document.all[element];
	}
	else
	{
		element = null;
	}
	return (element);
}

// styleLeft: Cross-browser version of "element.style.left"
function styleLeft(elmnt, pos)
{
	if (!(elmnt = getElementById(elmnt)))
	{
		return (0);
	}
	if (elmnt.style && (typeof(elmnt.style.left) == 'string'))
	{
		if (typeof(pos) == 'number')
		{
			elmnt.style.left = pos + 'px';
		}
		else
		{
			pos = parseInt(elmnt.style.left);
			if (isNaN(pos))
			{
				pos = 0;
			}
		}
	}
	else if (elmnt.style && elmnt.style.pixelLeft)
	{
		if (typeof(pos) == 'number')
		{
			elmnt.style.pixelLeft = pos;
		}
		else
		{
			pos = elmnt.style.pixelLeft;
		}
	}
	return (pos);
}

function calculatePosition(data, value)
{
	var pxLen = data[2];
	var valCount = data[5] ? data[5] - 1 : data[2];
	var dec = data[6];
	var scale = (data[4] - data[3]) / data[2];

	var xMax;
	var yMax;
	var fromVal;

	if (data[1].toLowerCase() == 'horizontal')
	{				// Set limits for horizontal sliders.
		fromVal = data[3];
		xMax = data[2];
		yMax = 0;
	}
	if (data[1].toLowerCase() == 'vertical')
	{				// Set limits and scale for vertical sliders.
		fromVal = data[4];
		xMax = 0;
		yMax = data[2];
		scale = -scale;		// Invert scale for vertical sliders. "Higher is more."
	}

	var sliderPos = (value - fromVal) / scale;
	var sliderVal = Math.round(sliderPos / (pxLen / valCount) * pxLen / valCount);
	return(sliderVal);
}

// Set the Slider to the default position
function setSliderDefaultPos(value, index)
{
	var nodeName = "slider" + general.zeroPad(index, 4);

	var node = document.getElementById(nodeName);
	var sliderAttributes = general.getMethodValues(node.getAttribute("onmousedown"));

	var pos = calculatePosition(sliderAttributes, value);

	if(sliderAttributes[1].toLowerCase() == "horizontal")
	{
		styleLeft(nodeName, pos);	// move slider to new horizontal position
	}
	else if(sliderAttributes[1].toLowerCase() == "vertical")
	{
		styleTop(nodeName, pos);	// move slider to new vertical position
	}
}
// styleTop: Cross-browser version of "element.style.top"
function styleTop(elmnt, pos)
{
	if (!(elmnt = getElementById(elmnt)))
	{
		return (0);
	}
	if (elmnt.style && (typeof(elmnt.style.top) == 'string'))
	{
		if (typeof(pos) == 'number')
		{
			elmnt.style.top = pos + 'px';
		}
		else
		{
			pos = parseInt(elmnt.style.top);
			if (isNaN(pos))
			{
				pos = 0;
			}
		}
	}
	else if (elmnt.style && elmnt.style.pixelTop)
	{
		if (typeof(pos) == 'number')
		{
			elmnt.style.pixelTop = pos;
		}
		else
		{
			pos = elmnt.style.pixelTop;
		}
	}
	return (pos);
}
// moveSlider: Handles slider and display while dragging
function moveSlider(evnt)
{
	var evnt = (!evnt) ? window.event : evnt;			// The mousemove event
	if (mouseover)
	{ // Only if slider is dragged
		x = pxLeft + evnt.screenX - xCoord;			// Horizontal mouse position relative to allowed slider positions
		y = pxTop + evnt.screenY - yCoord;			// Horizontal mouse position relative to allowed slider positions

		if (x > xMax)
		{
			x = xMax;					// Limit horizontal movement
		}
		if (x < 0)
		{
			x = 0;						// Limit horizontal movement
		}
		if (y > yMax)
		{
			y = yMax;					// Limit vertical movement
		}
		if (y < 0)
		{
			y = 0;						// Limit vertical movement
		}
		styleLeft(sliderObj.id, x); 				// move slider to new horizontal position
		styleTop(sliderObj.id, y);				// move slider to new vertical position
		sliderVal = x + y;					// pixel value of slider regardless of orientation
		sliderPos = (sliderObj.pxLen / sliderObj.valCount)
			* Math.round(sliderObj.valCount * sliderVal / sliderObj.pxLen);
		v = Math.round((sliderPos * sliderObj.scale + sliderObj.fromVal)
			* Math.pow(10, decimals)) / Math.pow(10, decimals);
									// calculate display value
		sliderValue = v;

		return (false);
	}
	return;
}

// slide: Handles the start of a slider move.
function slide(evnt, orientation, length, from, to, count, decs)
{
	if (!evnt)
	{
		evnt = window.event;
	}
	sliderObj = (evnt.target) ? evnt.target : evnt.srcElement;	// Get the activated slider element.
	sliderObj.pxLen = length;					// The allowed slider movement in pixels.
	sliderObj.valCount = count ? count - 1 : length;		// Allowed number of values in the interval.
	decimals = decs;				                    // Number of decimals to be displayed.
	sliderObj.scale = (to - from) / length;				// Slider-display scale [value-change per pixel of movement].
	if (orientation == 'horizontal')
	{								// Set limits for horizontal sliders.
		sliderObj.fromVal = from;
		xMax = length;
		yMax = 0;
	}
	if (orientation == 'vertical')
	{								// Set limits and scale for vertical sliders.
		sliderObj.fromVal = to;
		xMax = 0;
		yMax = length;
		sliderObj.scale = -sliderObj.scale;			// Invert scale for vertical sliders. "Higher is more."
	}
	pxLeft = styleLeft(sliderObj.id);				// Sliders horizontal position at start of slide.
	pxTop  = styleTop(sliderObj.id);				// Sliders vertical position at start of slide.
	xCoord = evnt.screenX;						// Horizontal mouse position at start of slide.
	yCoord = evnt.screenY;						// Vertical mouse position at start of slide.
	mouseover = true;
	document.onmousemove = moveSlider;				// Start the action if the mouse is dragged.
	document.onmouseup = sliderMouseUp;				// Stop sliding.
}

// sliderMouseup: Handles the mouseup event after moving a slider.
// Snaps the slider position to allowed/displayed value. 
function sliderMouseUp()
{
	mouseover = false;						// Stop the sliding.
	v = sliderValue;
	pos = (v - sliderObj.fromVal)/(sliderObj.scale);		// Calculate slider position (regardless of orientation).
	if (yMax == 0)
	{
		styleLeft(sliderObj.id, pos);			// Snap horizontal slider to corresponding display position.
	}
	if (xMax == 0)
	{
		styleTop(sliderObj.id, pos);			// Snap vertical slider to corresponding display position.
	}
	if (document.removeEventListener)
	{								// Remove event listeners from 'document' (Moz&co).
		document.removeEventListener('mousemove', moveSlider);
		document.removeEventListener('mouseup', sliderMouseUp);
	}
	else if (document.detachEvent)
	{								// Remove event listeners from 'document' (IE&co).
		document.detachEvent('onmousemove', moveSlider);
		document.detachEvent('onmouseup', sliderMouseUp);
	}
}
