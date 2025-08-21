import { useEffect, useReducer, useCallback, useState } from 'react';
import './BugGame.css';

const TIMESTEP = 20; // ms
const SIZE = 30; // px - Made smaller for realistic bug size
const AWARENESS_RADIUS = 40; // px

// Different bug types for variety
const BUG_TYPES = {
  beetle: {
    className: 'bug-beetle',
    color: '#2c1810'
  },
  ant: {
    className: 'bug-ant', 
    color: '#1a0f08'
  },
  spider: {
    className: 'bug-spider',
    color: '#3d2817'
  }
};

function getRandomBugType() {
  const types = Object.keys(BUG_TYPES);
  return types[Math.floor(Math.random() * types.length)];
}
const BEHAVIOR = {
  normal: {
    speed: 1, // px per TIMESTEP
    rotation: 0.5,
  },
  excited: {
    speed: 2, // range of possible rotations in radians per TIMESTEP
    rotation: 2,
  },
};
const ESCAPE_TIME = 90; // seconds
const EXCITE_TIME = 5; // seconds

function generateInitialState(windowSize) {
  return {
    active: true,
    excited: false,
    isPaused: false,
    isDying: false, // For death animation
    isDead: false, // To remove from DOM
    x: Math.random() * windowSize.width,
    y: Math.random() * windowSize.height,
    direction: Math.random() * 2 * Math.PI,
    prevX: 0,
    prevY: 0,
    trail: [], // For fading trail
    downtime: 1,
    bugType: getRandomBugType(),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "timeStep": {
      if (!state.active || state.isPaused) { // Check if paused
        return state;
      }

      const behavior = state.excited ? BEHAVIOR.excited : BEHAVIOR.normal;

      let newX = state.x + behavior.speed * Math.cos(state.direction);
      let newY = state.y + behavior.speed * Math.sin(state.direction);
      let newDirection = state.direction + behavior.rotation * (Math.random() - 0.5);
      newDirection %= 2 * Math.PI;
      const maxX = action.windowSize.width - SIZE;
      const maxY = action.windowSize.height - SIZE;

      if (newX < 0) {
        newX = 0;
        if (newY < 0) {
          // top left corner
          newY = 0;
          newDirection = newDirection > 5 * Math.PI / 4 ? 0 : Math.PI / 2;
        } else if (newY > maxY) {
          // bottom left corner
          newY = maxY;
          newDirection = newDirection > 3 * Math.PI / 4 ? 3 * Math.PI / 2 : 0;
        } else {
          // left edge
          newDirection = newDirection > Math.PI ? 3 * Math.PI / 2 : Math.PI / 2;
        }
      } else if (newX > maxX) {
        newX = maxX;
        if (newY < 0) {
          // top right corner
          newY = 0;
          newDirection = newDirection > 7 * Math.PI / 4 ? Math.PI / 2 : Math.PI;
        } else if (newY > maxY) {
          // bottom right corner
          newY = maxY;
          newDirection = newDirection > Math.PI / 4 ? Math.PI : 3 * Math.PI / 2;
        } else {
          // right edge
          newDirection = newDirection > Math.PI ? 3 * Math.PI / 2 : Math.PI / 2;
        }
      } else {
        if (newY < 0) {
          // top edge
          newY = 0;
          newDirection = newDirection > 3 * Math.PI / 2 ? 0 : Math.PI;
        } else if (newY > maxY) {
          // bottom edge
          newY = maxY;
          newDirection = newDirection > Math.PI / 2 ? Math.PI : 0;
        }
      }

      const newTrail = [...state.trail, { x: state.x, y: state.y }];
      if (newTrail.length > 20) {
        newTrail.shift();
      }

      return { ...state, x: newX, y: newY, direction: newDirection, prevX: state.x, prevY: state.y, trail: newTrail };
    }
    case "scare": {
      if (!state.active || state.excited) {
        return state;
      }

      setTimeout(
        () => action.dispatch({ type: "calm" }),
        EXCITE_TIME * 1000
      );

      return { ...state, excited: true };
    }
    case "calm":
      return { ...state, excited: false };
    case "squash": {
      if (!state.active) {
        return state;
      }
      return { ...state, active: false, isDying: true };
    }
    case "dead":
      return { ...state, isDead: true };
    case "pause":
      return { ...state, isPaused: true };
    case "resume":
      return { ...state, isPaused: false };
    default:
      return state;
  }
}

function Bug(props) {
  const [state, dispatch] = useReducer(reducer, generateInitialState(props.windowSize));

  const handleTimeStep = useCallback(
    () => {
      dispatch({ type: "timeStep", windowSize: props.windowSize });
    },
    [props.windowSize]
  );

  useEffect(
    () => {
      const timeStepInterval = setInterval(handleTimeStep, TIMESTEP);
      return () => clearInterval(timeStepInterval);
    },
    [handleTimeStep]
  );

  const { id, appDispatch } = props;

  useEffect(
    () => {
      appDispatch({ type: state.active ? "awoke" : "squashed", key: id });

      if (state.active) {
        const escapeTimeout = setTimeout(
          () => {
            appDispatch({ type: "escaped", key: id });
          },
          ESCAPE_TIME * 1000
        );
        return () => clearTimeout(escapeTimeout);
      }
    },
    [state.active, id, appDispatch]
  );

  // Calculate movement direction for leg animation
  const movementDirection = () => {
    const deltaX = state.x - state.prevX;
    if (Math.abs(deltaX) < 0.1) return 'forward';
    return deltaX > 0 ? 'right' : 'left';
  };

  if (state.isDead) {
    return null;
  }

  return (
    <>
      {state.trail.map((p, i) => (
        <div
          key={i}
          className="trail-particle"
          style={{
            left: p.x,
            top: p.y,
            opacity: (i + 1) / state.trail.length,
            backgroundColor: BUG_TYPES[state.bugType].color,
          }}
        />
      ))}
      <div
        className={`Bug ${state.bugType} ${!state.active ? 'squashed' : ''} ${state.excited ? 'excited' : ''} ${state.isPaused ? 'paused' : ''} ${state.isDying ? 'dying' : ''}`}
        data-direction={movementDirection()}
        style={{
          left: state.x,
          top: state.y,
          height: SIZE,
          width: SIZE,
        }}
        onMouseEnter={() => dispatch({ type: "pause" })}
        onMouseLeave={() => dispatch({ type: "resume" })}
        onDoubleClick={() => dispatch({ type: "squash", dispatch: dispatch })}
        onAnimationEnd={() => {
          if (state.isDying) {
            dispatch({ type: 'dead' });
          }
        }}
      >
        <div className="bug-abdomen"></div>
        <div className="bug-wings"></div>
        <div className="bug-legs">
          <div className="leg-l1"></div>
          <div className="leg-l2"></div>
          <div className="leg-l3"></div>
          <div className="leg-r1"></div>
          <div className="leg-r2"></div>
          <div className="leg-r3"></div>
          {state.bugType === 'bug-spider' && (
            <>
              <div className="leg-l4"></div>
              <div className="leg-r4"></div>
            </>
          )}
        </div>
        <div className="bug-antennae"></div>
        <div className="bug-eyes"></div>
      </div>
      <div
        className="bugAwareZone"
        style={{
          left: state.x - AWARENESS_RADIUS,
          top: state.y - AWARENESS_RADIUS,
          height: AWARENESS_RADIUS * 2 + SIZE,
          width: AWARENESS_RADIUS * 2 + SIZE,
        }}
        onClick={() => dispatch({ type: "scare", dispatch: dispatch })}
      ></div>
    </>
    
  );
}

// Game state reducer for managing multiple bugs
function gameReducer(state, action) {
  switch (action.type) {
    case 'awoke':
    case 'squashed':
    case 'escaped':
      return { 
        ...state, 
        bugs: { 
          ...state.bugs, 
          [action.key]: action.type 
        },
        score: action.type === 'squashed' ? state.score + 1 : state.score
      };
    case 'addBug':
      return {
        ...state,
        bugCount: state.bugCount + 1
      };
    case 'reset':
      return {
        bugs: {},
        score: 0,
        bugCount: 1
      };
    default:
      return state;
  }
}

// Main BugGame component
function BugGame() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  const [gameState, gameDispatch] = useReducer(gameReducer, {
    bugs: {},
    score: 0,
    bugCount: 1
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add new bugs periodically
  useEffect(() => {
    const addBugInterval = setInterval(() => {
      if (gameState.bugCount < 5) { // Limit to 5 bugs max
        gameDispatch({ type: 'addBug' });
      }
    }, 10000); // Add new bug every 10 seconds

    return () => clearInterval(addBugInterval);
  }, [gameState.bugCount]);

  return (
    <div className="bugGameContainer">      
      <div className="gameArea">
        {Array.from({ length: gameState.bugCount }, (_, index) => (
          <Bug 
            key={`bug${index}`}
            id={`bug${index}`} 
            windowSize={windowSize} 
            appDispatch={gameDispatch} 
          />
        ))}
      </div>
    </div>
  );
}

export default BugGame;