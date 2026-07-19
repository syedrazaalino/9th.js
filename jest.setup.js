// Minimal Jest setup for Node unit tests
global.WebGLRenderingContext = {
  FLOAT: 5126,
  STATIC_DRAW: 35044,
  DYNAMIC_DRAW: 35048,
  STREAM_DRAW: 35040,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963
};

if (!global.performance) {
  global.performance = { now: () => Date.now() };
}
