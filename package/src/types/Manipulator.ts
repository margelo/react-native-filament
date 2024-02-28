/**
 * Helper that enables camera interaction similar to sketchfab or Google Maps.
 *
 * Clients notify the camera manipulator of various mouse or touch events, then periodically call
 * its getLookAt() method so that they can adjust their camera(s). Three modes are supported: ORBIT,
 * MAP, and FREE_FLIGHT. To construct a manipulator instance, the desired mode is passed into the
 * create method.
 */
export interface Manipulator {}
