# Physics module status

The `src/physics` package exports `PhysicsSystem`, `RigidBody`, and related helpers.

**Status (1.0.0):** experimental. APIs exist for exploration and demos under `examples/`, but are not validated as production-ready rigid-body simulation comparable to Cannon/Ammo/Rapier.

Until a verified demo ships in CI:

- Do not rely on physics for production games without your own tests
- Prefer integrating a dedicated physics engine if you need stability
- README lists physics as experimental for this reason
