/**
 * COVID Widget for Übersicht
 * 
 * Version: 1.0
 * Last Updated: 10/09/2021
 * 
 * Created by Victor
 */

import { React, styled, css } from 'uebersicht';
const { useEffect, useRef } = React;

const JHUCSSE_COUNTRY = 'fr';
const JHUCSSE_PROVINCE = 'mainland';
const JHUCSSE_LASTDAYS = 15;

// Get's COVID stats from https://disease.sh
export const command = async (dispatch) => {
  try {
    const response = await fetch(`https://disease.sh/v3/covid-19/historical/${JHUCSSE_COUNTRY}/${JHUCSSE_PROVINCE}?lastdays=${JHUCSSE_LASTDAYS}`);
    dispatch({ type: 'FETCH_SUCCEDED', data: await response.json() });
  }
  catch (error) {
    dispatch({ type: 'FETCH_FAILED', error });
  }
}

export const updateState = (event, previousState) => {
  switch (event.type) {
    case 'FETCH_SUCCEDED': {
      return { output: event.data };
    }
    case 'FETCH_FAILED': {
      return { error: event.error };
    }
    default: {
      return previousState;
    }
  }
}

// Refresh every X miliseconds
export const refreshFrequency = 600000;

// Base layout
export const className = `
  left: 10px;
  bottom: 100px;
  max-width: 250px;
  background-color: #FFFFFF30;
  border-radius: 5px;
  padding 4px 12px;
  color: #fff;
  font-family: Helvetica Neue;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  // height: 120px;
`

const Header = styled.h1`
  color: ${props => !props.error ? '#6699ff' : 'red'};
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid #6699ff;
`

const CanvasContainer = styled.div`
  flex: 1 0 auto;
`

const Canvas = styled.canvas`
  width: 100%;
`

// Render the widget
export const render = ({ output, error }) => {
  if (error) { return <ErrorResult error={error} /> }

  const { country, timeline } = output;

  const cases = [];
  Object.keys(timeline.cases).map(key => ({ date: key, value: timeline.cases[key] }))
    .reduce((previous, current) => {
      cases.push({ date: new Date(current.date), total: current.value, value: current.value - previous.value });
      return current;
    });

  return (
    <Container>
      <Header>COVID-19: {country}</Header>
      { cases.length > 2 &&  <BarArea cases={cases} /> }
    </Container>
  )
}

const BarArea = ({ cases }) => {
  const ref = useRef();
  useEffect(() => { draw(cases, ref.current) }, []);
  return <CanvasContainer><Canvas ref={ref} /></CanvasContainer> 
}

const ErrorResult = ({ error }) => <Header error>COVID-19: {error.message}</Header>

function draw(cases, canvas) {
  const ctx = canvas.getContext('2d');
  const max = cases.reduce((max, val) => Math.max(max, val.value), 0);

  function line(x1, y1, x2, y2, color, pattern = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.setLineDash(pattern);
    ctx.stroke();
    ctx.restore();
  }

  function text(text, x, y, color, textAlign = 'center') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.fillText(text, x, y);
    ctx.restore();

  }

  function bar(x, y, cx, cy, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cx, cy);
    ctx.restore();
  }

  const rect = { x: 0, y: 0, cx: canvas.width, cy: canvas.height - 20 };
  const scaleY = rect.cy / max;

  const gap = 5;
  const barWidth = (rect.cx - (cases.length - 1) * gap) / cases.length;

  // Draw line for the last day
  const { value: lastValue } = cases[cases.length - 1];
  line(rect.x, rect.y + rect.cy - lastValue * scaleY, rect.x + rect.cx, rect.y + rect.cy - lastValue * scaleY, '#b3ccff', [1, 1]);

  // Draw x-axis
  line(rect.x, rect.y + rect.cy + 5, rect.x + rect.cx, rect.y + rect.cy + 5, '#b3ccff');

  for (const i in cases) {
    const { date, value } = cases[i];
    const current = Math.max(value * scaleY, 1);

    bar(rect.x + i * (barWidth + gap), rect.y + rect.cy - current, barWidth, current, '#4d88ff7f');
    text(date.getDate(), rect.x + i * (barWidth + gap) + barWidth / 2, rect.y + rect.cy + 18, '#b3ccff');
  }
   
  text(lastValue, rect.x + rect.cx, rect.y + rect.cy - lastValue * scaleY - 4, 'white', 'right');
}