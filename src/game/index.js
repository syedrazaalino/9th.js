/**
 * @module game
 * @description Game-facing subsystems for 9th.js:
 *
 *   - Input         — unified keyboard / mouse / touch / gamepad / pointer-lock
 *   - SceneManager  — scene stack with transitions and loading screens
 *   - GameState     — finite-state machine for game logic
 *   - GameLoop      — fixed-timestep accumulator loop (stable physics)
 *
 * @example
 *   import { Input, SceneManager, GameState, GameLoop } from '9th.js';
 *
 *   const input = new Input({ target: canvas, pointerLock: true });
 *   input.onKeyDown('Space', () => jump());
 *
 *   const loop = new GameLoop({
 *     fixedUpdate: (dt) => physics.step(dt),
 *     update: (dt) => animationUpdate(dt),
 *     render: (alpha) => renderer.render(scene, camera)
 *   });
 *   loop.start();
 *
 *   const scenes = new SceneManager();
 *   scenes.add('menu', menuScene);
 *   scenes.switchTo('menu');
 *   scenes.transition('level1', { fadeOut: 500, fadeIn: 500 });
 *
 *   const fsm = new GameState('idle');
 *   fsm.addTransition('idle', 'running', 'start');
 *   fsm.handle('start');
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

import { Input, MOUSE_BUTTONS, MOUSE_LEFT, MOUSE_MIDDLE, MOUSE_RIGHT, GAMEPAD_BUTTONS } from './Input.js';
import { SceneManager } from './SceneManager.js';
import { GameState } from './GameState.js';
import { GameLoop } from './GameLoop.js';

export { Input, SceneManager, GameState, GameLoop };
export { MOUSE_BUTTONS, MOUSE_LEFT, MOUSE_MIDDLE, MOUSE_RIGHT, GAMEPAD_BUTTONS };

export default {
  Input,
  SceneManager,
  GameState,
  GameLoop,
  MOUSE_BUTTONS,
  MOUSE_LEFT,
  MOUSE_MIDDLE,
  MOUSE_RIGHT,
  GAMEPAD_BUTTONS
};
